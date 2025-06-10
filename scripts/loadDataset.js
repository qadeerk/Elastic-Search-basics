#!/usr/bin/env node

// Required packages: inquirer, @elastic/elasticsearch, csvtojson  
// (If using Node.js < 18, also install node-fetch or use axios for fetching)

// Import necessary libraries
const inquirer = require('inquirer');
const { Client } = require('@elastic/elasticsearch');
const fetch = require('node-fetch');  // Use node-fetch for Node < 18; for Node 18+, you can use global fetch
const csv = require('csvtojson');

// Hard-coded Elasticsearch configuration
const ES_HOST = 'http://localhost:9200';
const esClient = new Client({ node: ES_HOST });

// Define dataset configurations (name, size, URL, format, index, etc.)
// More datasets and their loaders can be added here easily:contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}.
const datasets = [
  {
    name: 'Iris Flower Dataset',
    size: '150 records',
    url: 'https://raw.githubusercontent.com/domoritz/maps/master/data/iris.json',  // JSON array of iris data:contentReference[oaicite:2]{index=2}
    format: 'json',
    index: 'iris_data'  // Elasticsearch index name to use
  },
  {
    name: 'Electric Vehicle Population Data (Washington)',
    size: '~225k records',
    url: 'https://data.wa.gov/api/views/f6w7-q2d2/rows.csv?accessType=DOWNLOAD',  // CSV data for EV registrations:contentReference[oaicite:3]{index=3}
    format: 'csv',
    index: 'ev_population'
  }
  // Add more dataset entries here as needed, with appropriate loader logic below.
];

// Define loader functions for each dataset format
async function loadCsvDataset(dataset) {
  console.log(`\nDownloading CSV dataset: ${dataset.name} (${dataset.size})...`);
  const response = await fetch(dataset.url);
  if (!response.ok) {
    throw new Error(`Failed to download CSV from ${dataset.url}: ${response.statusText}`);
  }
  const csvText = await response.text();
  console.log(`Parsing CSV data...`);
  const records = await csv().fromString(csvText);  // convert CSV text to array of JSON objects
  console.log(`Parsed ${records.length} records from CSV. Indexing into Elasticsearch...`);

  // Ensure the target index exists (create if not exists)
  await esClient.indices.create({ index: dataset.index }, { ignore: [400] });

  // Index documents in bulk for efficiency
  const body = records.flatMap(doc => [{ index: { _index: dataset.index } }, doc]);
  const { body: bulkResponse } = await esClient.bulk({ refresh: true, body });
  if (bulkResponse.errors) {
    console.error('Errors occurred during bulk indexing.');
    // (Optional) inspect bulkResponse.items for error details
  }

  console.log(`Indexed ${records.length} records into index "${dataset.index}".`);
}

async function loadJsonDataset(dataset) {
  console.log(`\nDownloading JSON dataset: ${dataset.name} (${dataset.size})...`);
  const response = await fetch(dataset.url);
  if (!response.ok) {
    throw new Error(`Failed to download JSON from ${dataset.url}: ${response.statusText}`);
  }
  const jsonText = await response.text();
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
    // await loaders[selectedDataset.format](selectedDataset);

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    // Optional: close Elasticsearch client connections if needed
    await esClient.close();
  }
})();
