#!/usr/bin/env node

// Dataset Cleaning Script
// This script identifies and removes datasets that were loaded by loadDataset.js
// Follows clean architecture principles with proper error handling and user confirmation

const inquirer = require('inquirer');
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const { datasets, ES_CONFIG } = require('./datasets');

// Initialize Elasticsearch client
const esClient = new Client({ node: ES_CONFIG.host });

/**
 * Check if Elasticsearch is running and accessible
 * @returns {Promise<boolean>} True if ES is running, false otherwise
 */
async function checkElasticsearchHealth() {
  try {
    console.log('🔍 Checking Elasticsearch connection...');
    const health = await esClient.cluster.health();
    console.log(`✅ Elasticsearch is running (Status: ${health.status})`);
    return true;
  } catch (error) {
    console.error('❌ Elasticsearch is not running or not accessible');
    console.error(`   Error: ${error.message}`);
    console.error(`   Please ensure Elasticsearch is running on ${ES_CONFIG.host}`);
    return false;
  }
}

/**
 * Get list of existing indices that match our dataset configurations
 * @returns {Promise<Array>} Array of existing dataset indices with metadata
 */
async function getExistingDatasetIndices() {
  try {
    console.log('📋 Scanning for existing dataset indices...');
    
    // Get all indices
    const indices = await esClient.cat.indices({ format: 'json' });
    const existingDatasets = [];
    
    // Match against our known datasets
    for (const dataset of datasets) {
      const indexInfo = indices.find(idx => idx.index === dataset.index);
      if (indexInfo) {
        existingDatasets.push({
          ...dataset,
          docCount: parseInt(indexInfo['docs.count']) || 0,
          storeSize: indexInfo['store.size'] || '0b',
          health: indexInfo.health,
          status: indexInfo.status
        });
      }
    }
    
    return existingDatasets;
  } catch (error) {
    console.error('❌ Error retrieving indices:', error.message);
    throw error;
  }
}

/**
 * Display existing datasets in a formatted table
 * @param {Array} existingDatasets Array of existing dataset information
 */
function displayExistingDatasets(existingDatasets) {
  if (existingDatasets.length === 0) {
    console.log('📭 No dataset indices found that match the configured datasets.');
    return;
  }

  console.log('\n📊 Found the following dataset indices:');
  console.log('─'.repeat(100));
  console.log('Index Name'.padEnd(20) + 'Dataset Name'.padEnd(35) + 'Documents'.padEnd(15) + 'Size'.padEnd(10) + 'Status');
  console.log('─'.repeat(100));
  
  existingDatasets.forEach(dataset => {
    const statusIcon = dataset.health === 'green' ? '🟢' : dataset.health === 'yellow' ? '🟡' : '🔴';
    console.log(
      dataset.index.padEnd(20) + 
      dataset.name.substring(0, 32).padEnd(35) + 
      dataset.docCount.toLocaleString().padEnd(15) + 
      dataset.storeSize.padEnd(10) + 
      `${statusIcon} ${dataset.status}`
    );
  });
  console.log('─'.repeat(100));
}

/**
 * Prompt user for confirmation before deleting indices
 * @param {Array} existingDatasets Array of datasets to be deleted
 * @returns {Promise<boolean>} True if user confirms deletion
 */
async function confirmDeletion(existingDatasets) {
  console.log('\n⚠️  WARNING: This action will permanently delete the selected indices and all their data!');
  console.log('   This action cannot be undone.');
  
  const choices = existingDatasets.map((dataset, idx) => ({
    name: `${dataset.index} (${dataset.docCount.toLocaleString()} documents)`,
    value: idx,
    checked: false
  }));

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedIndices',
      message: 'Select which dataset indices to delete:',
      choices: choices,
      validate: (input) => {
        if (input.length === 0) {
          return 'Please select at least one index to delete, or press Ctrl+C to cancel.';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'finalConfirmation',
      message: 'Are you absolutely sure you want to delete the selected indices?',
      default: false,
      when: (answers) => answers.selectedIndices.length > 0
    }
  ]);

  return {
    confirmed: answers.finalConfirmation,
    selectedDatasets: answers.selectedIndices.map(idx => existingDatasets[idx])
  };
}

/**
 * Delete selected dataset indices
 * @param {Array} selectedDatasets Array of datasets to delete
 */
async function deleteDatasetIndices(selectedDatasets) {
  console.log('\n🗑️  Starting deletion process...');
  
  for (const dataset of selectedDatasets) {
    try {
      console.log(`   Deleting index: ${dataset.index}...`);
      await esClient.indices.delete({ index: dataset.index });
      console.log(`   ✅ Successfully deleted: ${dataset.index}`);
    } catch (error) {
      console.error(`   ❌ Failed to delete ${dataset.index}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Deletion process completed!');
}

/**
 * Clean up local data files if they exist
 * @param {Array} selectedDatasets Array of datasets that were deleted
 */
async function cleanupLocalFiles(selectedDatasets) {
  const answers = await inquirer.prompt([{
    type: 'confirm',
    name: 'cleanupFiles',
    message: 'Do you also want to delete the local data files (CSV/JSON files)?',
    default: false
  }]);

  if (!answers.cleanupFiles) {
    return;
  }

  console.log('\n🧹 Cleaning up local data files...');
  const dataDir = path.join(__dirname, 'downloaded_data');
  
  for (const dataset of selectedDatasets) {
    try {
      // Check for CSV files
      const csvPath = path.join(dataDir, `${dataset.index}.csv`);
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
        console.log(`   ✅ Deleted: ${csvPath}`);
      }
      
      // Check for JSON files
      const jsonPath = path.join(dataDir, `${dataset.index}.json`);
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath);
        console.log(`   ✅ Deleted: ${jsonPath}`);
      }
      
      // Check for local path files (like TMDB)
      if (dataset.localPath) {
        const localPath = path.resolve(dataset.localPath);
        if (fs.existsSync(localPath)) {
          const deleteLocal = await inquirer.prompt([{
            type: 'confirm',
            name: 'deleteLocalPath',
            message: `Delete original local file: ${localPath}?`,
            default: false
          }]);
          
          if (deleteLocal.deleteLocalPath) {
            fs.unlinkSync(localPath);
            console.log(`   ✅ Deleted: ${localPath}`);
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error cleaning up files for ${dataset.index}: ${error.message}`);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🧹 Dataset Cleanup Tool');
    console.log('=======================\n');
    
    // Step 1: Check Elasticsearch health
    const isElasticsearchRunning = await checkElasticsearchHealth();
    if (!isElasticsearchRunning) {
      console.log('\n💡 Please start Elasticsearch and try again.');
      process.exit(1);
    }
    
    // Step 2: Get existing dataset indices
    const existingDatasets = await getExistingDatasetIndices();
    
    // Step 3: Display existing datasets
    displayExistingDatasets(existingDatasets);
    
    if (existingDatasets.length === 0) {
      console.log('\n✨ Nothing to clean up. All dataset indices are already clean!');
      process.exit(0);
    }
    
    // Step 4: Get user confirmation
    const { confirmed, selectedDatasets } = await confirmDeletion(existingDatasets);
    
    if (!confirmed) {
      console.log('\n🚫 Cleanup cancelled by user.');
      process.exit(0);
    }
    
    // Step 5: Delete selected indices
    await deleteDatasetIndices(selectedDatasets);
    
    // Step 6: Clean up local files
    await cleanupLocalFiles(selectedDatasets);
    
    console.log('\n✨ Dataset cleanup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ An error occurred during cleanup:', error.message);
    process.exit(1);
  } finally {
    // Close Elasticsearch client
    try {
      await esClient.close();
    } catch (error) {
      // Ignore close errors
    }
  }
}

// Run the cleanup tool
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkElasticsearchHealth,
  getExistingDatasetIndices,
  deleteDatasetIndices
}; 