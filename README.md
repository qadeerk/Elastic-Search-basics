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
   docker pull docker.elastic.co/elasticsearch/elasticsearch:8.8.2
   docker pull docker.elastic.co/kibana/kibana:8.8.2
   ```

3. **Run Elasticsearch Container**  
   ```bash
   docker run -d --name es01 -p 9200:9200 -p 9300:9300 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     docker.elastic.co/elasticsearch/elasticsearch:8.8.2
   ```

4. **Run Kibana Container**  
   ```bash
   docker run -d --name kib01 -p 5601:5601 \
     -e "ELASTICSEARCH_HOSTS=http://es01:9200" --network="container:es01" \
     docker.elastic.co/kibana/kibana:8.8.2
   ```

5. **Verify**  
   - Elasticsearch: http://localhost:9200  
   - Kibana: http://localhost:5601  

---

## Project Structure for Training Repository

```
elasticsearch_training_repo/
├── README.md
├── data/
│   └── tmdb_movies.json
└── scripts/
    └── load_tmdb.js
```

- **data/**: Contains datasets for ingestion.  
- **scripts/**: Node.js scripts to load data into Elasticsearch.  

---

## Loading the TMDB Dataset into Elasticsearch

1. **Prepare Data**  
   - Place your TMDB JSON file in `data/tmdb_movies.json`.

2. **Install Dependencies**  
   ```bash
   npm init -y
   npm install @elastic/elasticsearch
   ```

3. **Run Loader Script**  
   ```bash
   node scripts/load_tmdb.js
   ```

4. **Verify Data**  
   In Kibana Dev Tools:
   ```http
   GET tmdb/_count
   ```

---

*Prepared by Abdul Qadeer Khan*
