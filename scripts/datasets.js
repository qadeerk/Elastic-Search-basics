// Dataset configurations for Elasticsearch loading and cleaning
// This module centralizes all dataset definitions to maintain consistency
// across loading and cleaning operations

const datasets = [
  {
    name: 'TMDB Movies Dataset (Local)',
    size: '~45k+ movie records',
    localPath: './scripts/data/tmdb.json',
    format: 'json',
    index: 'tmdb_movies'
  },
  {
    name: 'Electric Vehicle Population Data (Washington)',
    size: '~225k records',
    url: 'https://data.wa.gov/api/views/f6w7-q2d2/rows.csv?accessType=DOWNLOAD',
    format: 'csv',
    index: 'ev_population'
  },
  {
    name: 'MovieLens 1M (Movie Ratings)',
    size: '1,000,209 ratings',
    url: 'https://raw.githubusercontent.com/khanhnamle1994/movielens/master/ratings.csv',
    format: 'csv',
    index: 'movielens_1m'
  },
  {
    name: 'Amazon Beauty Product Ratings',
    size: '2,023,070 ratings',
    url: 'http://snap.stanford.edu/data/amazon/productGraph/categoryFiles/ratings_Beauty.csv',
    format: 'csv',
    index: 'amazon_beauty'
  },
  {
    name: 'Online Retail Dataset (UK Transactions)',
    size: '541,909 records',
    url: 'https://raw.githubusercontent.com/bigb0ss/Retail-datasets/master/Online%20Retail.csv',
    format: 'csv',
    index: 'online_retail'
  }
];

// Elasticsearch configuration
const ES_CONFIG = {
  host: 'http://localhost:9200'
};

module.exports = {
  datasets,
  ES_CONFIG
}; 