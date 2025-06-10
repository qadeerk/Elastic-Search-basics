# Elasticsearch Training Repository

## Overview
This repository contains materials for Elasticsearch Basic Search Training on Windows using Docker and Node.js. It includes instructions for installing Elasticsearch & Kibana, project structure, and loading the TMDB dataset.

---

## 1. Installing Elasticsearch and Kibana via Docker on Windows

1. **Install Docker Desktop for Windows**  
   - Download and install from https://www.docker.com/products/docker-desktop  
   - Allocate at least 4GB memory in Docker settings.

2. **Pull Docker Images**  
   ```bash
   docker pull docker.elastic.co/elasticsearch/elasticsearch:9.0.2
   docker pull docker.elastic.co/kibana/kibana:9.0.2
   ```

3. **Run Elasticsearch Container**  
   ```bash
   docker run -d --name es01 -p 9200:9200 -p 9300:9300 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     docker.elastic.co/elasticsearch/elasticsearch:9.0.2
   ```

4. **Run Kibana Container**  
   ```bash
   docker run -d --name kib01 -p 5601:5601 \
     -e "ELASTICSEARCH_HOSTS=http://es01:9200" --network="container:es01" \
     docker.elastic.co/kibana/kibana:9.0.2
   ```

5. **Verify**  
   - Elasticsearch: http://localhost:9200  
   - Kibana: http://localhost:5601  

---

## 2. Dataset Management Scripts

This repository includes comprehensive dataset management tools for loading and cleaning multiple datasets into Elasticsearch.

### Available Scripts

```bash
npm run load-dataset     # Interactive dataset loader with multiple dataset options
npm run clean-dataset    # Interactive dataset cleaner with safety confirmations
```

### Prerequisites for Dataset Scripts

```bash
npm install
```

---

## 3. Project Structure for Training Repository

```
elasticsearch_training_repo/
├── README.md
├── data/
│   └── tmdb_movies.json
├── scripts/
│   ├── datasets.js          # Centralized dataset configurations
│   ├── loadDataset.js       # Interactive dataset loader
│   ├── cleanDataset.js      # Interactive dataset cleaner
│   └── load_tmdb.js         # Legacy TMDB loader
└── package.json
```

- **data/**: Contains datasets for ingestion.  
- **scripts/**: Node.js scripts to load and manage data in Elasticsearch.  
- **scripts/datasets.js**: Centralized dataset configurations used by both loader and cleaner.

---

## 4. Loading the TMDB Dataset into Elasticsearch

### Prerequisites
1. **Installing Elasticsearch and Kibana via Docker on Windows** (See section 1 above)
2. **Install Dependencies**
   ```bash
   npm install
   ```

### Steps

1. **Run Interactive Dataset Loader**
   ```bash
   npm run load-dataset
   ```

2. **Select Dataset**
   - Select `TMDB Movies Dataset (Local) (~45k+ movie records)` and press Enter

3. **Verify Data in Kibana**
   - Go to http://localhost:5601/app/management/data/index_management/indices 
   - Verify that `tmdb_movies` index is present

4. **Access Kibana Dev Tools**
   - Go to http://localhost:5601/app/dev_tools?#/console
   - explore draftCourceContent.md

---

*Prepared by Abdul Qadeer Khan*
