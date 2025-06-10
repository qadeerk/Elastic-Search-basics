#!/usr/bin/env node

// Required packages: inquirer, @elastic/elasticsearch, csvtojson  
// (If using Node.js < 18, also install node-fetch or use axios for fetching)

// Import necessary libraries
const inquirer = require('inquirer');
const { Client } = require('@elastic/elasticsearch');
const fetch = require('node-fetch');  // Use node-fetch for Node < 18; for Node 18+, you can use global fetch
const csv = require('csvtojson');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { datasets, ES_CONFIG } = require('./datasets');

// Ensure data directory exists for saving downloaded files
const dataDir = './scripts/downloaded_data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize Elasticsearch client using shared configuration
const esClient = new Client({ node: ES_CONFIG.host });

// Define loader functions for each dataset format
async function loadCsvDataset(dataset) {
  console.log(`\nDownloading CSV dataset: ${dataset.name} (${dataset.size})...`);
  const response = await fetch(dataset.url);
  if (!response.ok) {
    throw new Error(`Failed to download CSV from ${dataset.url}: ${response.statusText}`);
  }
  const csvText = await response.text();
  // Save the raw CSV data to a local file in the data directory
  fs.writeFileSync(`${dataDir}/${dataset.index}.csv`, csvText);
  console.log(`Parsing CSV data...`);
  const records = await csv().fromString(csvText);  // convert CSV text to array of JSON objects
  console.log(`Parsed ${records.length} records from CSV. Indexing into Elasticsearch...`);

  // Ensure the target index exists (create if not exists)
  await esClient.indices.create({ index: dataset.index }, { ignore: [400] });

  // Index documents in bulk for efficiency
  const body = records.flatMap(doc => [{ index: { _index: dataset.index } }, doc]);
  const bulkResponse = await esClient.bulk({ refresh: true, body });
  if (bulkResponse.errors) {
    console.error('Errors occurred during bulk indexing.');
    // (Optional) inspect bulkResponse.items for error details
  }

  console.log(`Indexed ${records.length} records into index "${dataset.index}".`);
}

async function loadJsonDataset(dataset) {
  if (dataset.localPath) {
    // Handle local file
    console.log(`\nLoading local JSON dataset: ${dataset.name} (${dataset.size})...`);
    const filePath = path.resolve(dataset.localPath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found: ${filePath}`);
    }

    console.log(`Processing local file: ${filePath}`);
    
    // Ensure the target index exists
    await esClient.indices.create({ index: dataset.index }, { ignore: [400] });

    // Process file line by line to handle large files efficiently
    const fileStream = fs.createReadStream(filePath);
    
    // For tmdb.json, we need to read the entire file as it's a single JSON object
    if (dataset.index === 'tmdb_movies') {
      console.log('Reading TMDB JSON file as single object...');
      const jsonData = fs.readFileSync(filePath, 'utf8');
      const moviesObject = JSON.parse(jsonData);
      
      // Convert the object with numbered keys to an array of records
      const records = Object.values(moviesObject);
      console.log(`Parsed ${records.length} movie records from TMDB JSON.`);
      
      // Index documents in bulk for efficiency
      let recordCount = 0;
      let batchSize = 1000;
      let batch = [];

      for (const record of records) {
        batch.push({ index: { _index: dataset.index } });
        batch.push(record);
        
        // Process batch when it reaches the desired size
        if (batch.length >= batchSize * 2) {
          const bulkResponse = await esClient.bulk({ refresh: false, body: batch });
          if (bulkResponse.errors) {
            console.error('Some errors occurred during bulk indexing.');
          }
          recordCount += batchSize;
          console.log(`Indexed ${recordCount} records so far...`);
          batch = [];
        }
      }

      // Process remaining records in the final batch
      if (batch.length > 0) {
        const bulkResponse = await esClient.bulk({ refresh: false, body: batch });
        if (bulkResponse.errors) {
          console.error('Some errors occurred during final bulk indexing.');
        }
        recordCount += batch.length / 2;
      }

      // Refresh the index after all documents are loaded
      await esClient.indices.refresh({ index: dataset.index });
      
      console.log(`Indexed ${recordCount} records into index "${dataset.index}".`);
      return;
    }
    
    // For other JSON files, use line-by-line processing (NDJSON format)
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let recordCount = 0;
    let batchSize = 1000; // Process in batches for efficiency
    let batch = [];

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const record = JSON.parse(line);
          batch.push({ index: { _index: dataset.index } });
          batch.push(record);
          
          // Process batch when it reaches the desired size
          if (batch.length >= batchSize * 2) { // *2 because each record has index action + document
            const bulkResponse = await esClient.bulk({ refresh: false, body: batch });
            if (bulkResponse.errors) {
              console.error('Some errors occurred during bulk indexing.');
            }
            recordCount += batchSize;
            console.log(`Indexed ${recordCount} records so far...`);
            batch = []; // Reset batch
          }
        } catch (parseError) {
          console.warn(`Failed to parse line: ${line.substring(0, 100)}...`);
        }
      }
    }

    // Process remaining records in the final batch
    if (batch.length > 0) {
      const bulkResponse = await esClient.bulk({ refresh: false, body: batch });
      if (bulkResponse.errors) {
        console.error('Some errors occurred during final bulk indexing.');
      }
      recordCount += batch.length / 2; // Divide by 2 because of index action + document pairs
    }

    // Refresh the index after all documents are loaded
    await esClient.indices.refresh({ index: dataset.index });
    
    console.log(`Indexed ${recordCount} records into index "${dataset.index}".`);
  } else {
    // Handle remote URL (existing functionality)
    console.log(`\nDownloading JSON dataset: ${dataset.name} (${dataset.size})...`);
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to download JSON from ${dataset.url}: ${response.statusText}`);
    }
    const jsonText = await response.text();
    // Save the raw JSON data to a local file in the data directory
    fs.writeFileSync(`${dataDir}/${dataset.index}.json`, jsonText);
    console.log(`Parsing JSON data...`);
    let records;
    try {
      records = JSON.parse(jsonText);
    } catch (err) {
      // If JSON is line-delimited (NDJSON), parse each line separately
      records = jsonText.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
    }
    // If the JSON is an object with a property (e.g., { data: [...] }), adjust accordingly:
    if (!Array.isArray(records) && records.data) {
      records = records.data;
    }
    console.log(`Parsed ${records.length} records from JSON. Indexing into Elasticsearch...`);

    // Ensure the target index exists
    await esClient.indices.create({ index: dataset.index }, { ignore: [400] });

    // Index each document (could also use bulk indexing for large datasets)
    for (const doc of records) {
      await esClient.index({ index: dataset.index, body: doc });
    }
    await esClient.indices.refresh({ index: dataset.index });

    console.log(`Indexed ${records.length} records into index "${dataset.index}".`);
  }
}

// Map format to loader function for extensibility
const loaders = {
  'csv': loadCsvDataset,
  'json': loadJsonDataset
};

// Run the interactive prompt
(async () => {
  try {
    // Prepare choices for inquirer (display name and size)
    const choices = datasets.map((ds, idx) => ({
      name: `${ds.name} (${ds.size})`,
      value: idx
    }));
    const answers = await inquirer.prompt([{
      type: 'list',
      name: 'datasetIndex',
      message: 'Select a dataset to download and load into Elasticsearch:',
      choices: choices
    }]);

    const selectedDataset = datasets[answers.datasetIndex];
    console.log(`\nYou chose: ${selectedDataset.name}. Starting loading process...`);

    // Invoke the appropriate loader based on dataset format
    await loaders[selectedDataset.format](selectedDataset);

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    // Optional: close Elasticsearch client connections if needed
    await esClient.close();
  }
})();
