const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');

// Connect to Elasticsearch
const client = new Client({ node: 'http://localhost:9200' });

// Load TMDB data
const movies = JSON.parse(fs.readFileSync('data/tmdb_movies.json', 'utf-8'));

async function loadData() {
  const ops = movies.flatMap(movie => [
    { index: { _index: 'tmdb', _id: movie.id } },
    movie
  ]);

  const bulkResponse = await client.bulk({ refresh: true, operations: ops });
  if (bulkResponse.errors) {
    console.error('Indexing errors:', bulkResponse.items.filter(i => i.index && i.index.error));
  } else {
    console.log(`Indexed ${movies.length} movies into 'tmdb' index.`);
  }
}

loadData().catch(err => console.error('Error loading data', err));
