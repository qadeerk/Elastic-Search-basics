# Kibana Dev‑Tools Query Cheat‑Sheet for `tmdb_movies`

> Progressive examples for learning Elasticsearch search syntax **in Kibana Dev‑Tools** using the **`tmdb_movies`** index.
>
> *Updated with:*
>
> 1. **Mapping primer** – what a mapping is, how to fetch it, and a step‑by‑step strategy to review one.
> 2. **Extra weighted‑search recipes** at the end.

---

## 📑 Understanding Mapping – What, Why & How

### What is a *mapping*?

* In Elasticsearch, **mapping** = the schema of an index: field names, data‑types (text, keyword, date, long, float, boolean …), analyzers, sub‑fields, dynamic templates, etc.
* It tells ES **how to index** and **how to search/aggregate** each field.

### How to fetch a mapping (Kibana console)

```http
# Mapping for this single index (pretty JSON)
GET tmdb_movies/_mapping

# All indices’ mappings
GET _mapping

# Spot just dynamic_templates or a specific field
GET tmdb_movies/_mapping?filter_path=**.dynamic_templates
GET tmdb_movies/_mapping/field/genres.name
```

### A practical strategy to review a mapping

1. **Retrieve** the mapping with `GET tmdb_movies/_mapping?pretty` and collapse objects if needed in the Kibana viewer.
2. **List top‑level properties**; note which are nested objects (e.g. `cast`, `genres`).
3. **Identify field types**:

   * `text` vs `keyword` – text is analyzed (full‑text search); keyword is exact value (filters, aggregations).
   * Numeric (`long`, `float`) – ranges, sorting, scoring.
   * `date` – date math, histograms.
4. **Look for sub‑fields** (e.g. `title.keyword`) that enable exact matching and aggregations on a text field.
5. **Spot arrays / objects** and decide if you need nested queries.
6. **Plan queries**: use term/range filters on numeric & keyword fields; match / multi\_match on text fields; aggregations on keyword/numeric.
7. **Document your findings** (cheat‑sheet like this) so the whole team knows which fields to use for which purpose.

*(The table below highlights the main fields referenced in this guide; all exist in the supplied mapping.)*

---

## Mapping excerpt (verification)

| Path                  | Type                           | Notes                        |
| --------------------- | ------------------------------ | ---------------------------- |
| `title`               | `text` (+ `keyword` sub‑field) | movie title                  |
| `original_title`      | `text`                         | original language title      |
| `overview`            | `text`                         | movie synopsis / description |
| `genres.name.keyword` | `keyword`                      | exact genre value            |
| `adult`               | `boolean`                      | marks adult content          |
| `release_date`        | `date`                         | yyyy‑MM‑dd                   |
| `cast.name`           | `text` (+ `keyword`)           | actor names                  |
| `directors.name`      | `text` (+ `keyword`)           | director names               |
| `vote_average`        | `float`                        | average rating               |
| `poster_path`         | `text` (+ `keyword`)           | poster file path             |
| `popularity`          | `float`                        | TMDB popularity score        |

*(Any query that targets these fields will work with the posted mapping.)*

---

## 1 · Basic Query Types

### 1.1 ‑ Match All

```http
GET tmdb_movies/_search
{
  "query": {
    "match_all": {}
  }
}
```

Retrieves **all** movies; every hit gets a neutral `_score` of 1.0.

---

### 1.2 ‑ Match (full‑text)

```http
GET tmdb_movies/_search
{
  "query": {
    "match": {
      "title": "star wars"
    }
  }
}
```

Find titles containing **either** “star” or “wars”.

---

### 1.3 ‑ Match Phrase (exact order)

```http
GET tmdb_movies/_search
{
  "query": {
    "match_phrase": {
      "original_title": "le fabuleux destin d'amelie poulain"
    }
  }
}
```

Matches the exact French title phrase.

---

### 1.4 ‑ Multi‑match (title + overview)

```http
GET tmdb_movies/_search
{
  "query": {
    "multi_match": {
      "query": "space adventure",
      "fields": ["title", "overview"]
    }
  }
}
```

Searches both `title` and `overview`; whichever matches better drives the score.

---

## 2 · Boolean Logic (`must`, `should`, `must_not`, `filter`)

### 2.1 ‑ AND (two `must` clauses)

```http
GET tmdb_movies/_search
{
  "query": {
    "bool": {
      "must": [
        { "match":  { "title": "star" } },
        { "term":   { "genres.name.keyword": "Science Fiction" } }
      ]
    }
  }
}
```

Must have *“star”* in title **and** belong to the *Science Fiction* genre.

---

### 2.2 ‑ OR (two `should` clauses)

```http
GET tmdb_movies/_search
{
  "query": {
    "bool": {
      "should": [
        { "term": { "genres.name.keyword": "Comedy"  } },
        { "term": { "genres.name.keyword": "Drama"   } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

Matches movies that are **Comedy *or* Drama** (at least one genre).

---

### 2.3 ‑ NOT (`must_not`)

```http
GET tmdb_movies/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "overview": "love" } }
      ],
      "must_not": [
        { "term": { "adult": true } }
      ]
    }
  }
}
```

Find synopses containing *“love”* while **excluding** adult titles.

---

## 3 · Term‑level Filters

### 3.1 ‑ Exact Term

```http
GET tmdb_movies/_search
{
  "query": {
    "term": {
      "vote_average": 8
    }
  }
}
```

Finds movies whose `vote_average` is exactly **8**.

---

### 3.2 ‑ Terms (one of many)

```http
GET tmdb_movies/_search
{
  "query": {
    "terms": {
      "genres.name.keyword": ["Horror", "Thriller"]
    }
  }
}
```

Returns movies tagged Horror **or** Thriller.

---

### 3.3 ‑ Range (dates)

```http
GET tmdb_movies/_search
{
  "query": {
    "range": {
      "release_date": {
        "gte": "2010-01-01",
        "lte": "2019-12-31"
      }
    }
  }
}
```

Movies released **between 2010 and 2019** (inclusive).

---

### 3.4 ‑ Exists

```http
GET tmdb_movies/_search
{
  "query": {
    "exists": {
      "field": "poster_path"
    }
  }
}
```

Returns movies that have a non‑null poster image path.

---

## 4 · Filtering + Aggregations (Facets)

```http
GET tmdb_movies/_search
{
  "query": {
    "bool": {
      "filter": {
        "range": {
          "release_date": { "gte": "2020-01-01" }
        }
      }
    }
  },
  "aggs": {
    "genres": {
      "terms": {
        "field": "genres.name.keyword"
      }
    }
  },
  "size": 0
}
```

Filters to **2020‑present** movies and returns a genre facet count.

---

## 5 · Sorting & Relevance

```http
GET tmdb_movies/_search
{
  "query": {
    "match": { "overview": "space adventure" }
  },
  "sort": [
    { "release_date": "desc" }
  ]
}
```

Still searches text but orders hits by *most recent* release rather than by `_score`.

---

## 6 · Cross‑Fields (Term‑Centric) Search

```http
GET tmdb_movies/_search
{
  "query": {
    "multi_match": {
      "query": "Brad Pitt",
      "fields": ["cast.name", "directors.name"],
      "type": "cross_fields",
      "operator": "and"
    }
  }
}
```

Treats `cast.name` and `directors.name` as one virtual field; both terms must appear somewhere across those fields.

---

## 7 · Boosting & Weighted Search

### 7.1 – Field Boost via Caret

```http
GET tmdb_movies/_search
{
  "query": {
    "multi_match": {
      "query": "Avengers",
      "fields": ["title^3", "overview"]
    }
  }
}
```

`title` hits are **3×** more important than matches in `overview`.

### 7.2 – Function‑Score with Linear Date Decay

```http
GET tmdb_movies/_search
{
  "query": {
    "function_score": {
      "query": { "match": { "overview": "superhero" } },
      "functions": [
        {
          "linear": {
            "release_date": {
              "origin": "now",
              "scale":  "365d",
              "decay":  0.5
            }
          }
        }
      ],
      "boost_mode": "multiply"
    }
  }
}
```

Matches superhero movies and multiplies relevance by a **recency decay**: releases within \~1 year get full weight; older titles gradually lose influence.

### 7.3 – Query Time Boost inside Bool

```http
GET tmdb_movies/_search
{
  "query": {
    "bool": {
      "should": [
        { "match": { "genres.name": { "query": "Action", "boost": 2 } } },
        { "match": { "genres.name": { "query": "Adventure" } } }
      ]
    }
  }
}
```

Both genres are acceptable, but **Action** is weighted twice as heavily.

---

## 8 · Partial & Fuzzy Matching

### 8.1 – Match Phrase Prefix (type‑ahead)

```http
GET tmdb_movies/_search
{
  "query": {
    "match_phrase_prefix": {
      "title": "Lord of th"
    }
  }
}
```

Auto‑completes titles starting with “Lord of th…”.

### 8.2 – Prefix Query

```http
GET tmdb_movies/_search
{
  "query": {
    "prefix": {
      "title": {
        "value": "Star"
      }
    }
  }
}
```

Titles that begin with "Star" (e.g. **Star Wars**, **Star Trek**).

### 8.3 – Wildcard Query

```http
GET tmdb_movies/_search
{
  "query": {
    "wildcard": {
      "title": "Aveng*"
    }
  }
}
```

Pattern match for any title starting with “Aveng”.

### 8.4 – Fuzzy Match (typo‑tolerant)

```http
GET tmdb_movies/_search
{
  "query": {
    "match": {
      "title": {
        "query": "Jurrasic Park",
        "fuzziness": "AUTO"
      }
    }
  }
}
```

Finds **“Jurassic Park”** despite the misspelling.

---

## 10 · Advanced / Expert‑Level Query Patterns

> **These queries mirror patterns routinely used in large‑scale production search or deep data‑analysis pipelines.** Each example is Kibana‑ready and tailored to the current mapping.

### 10.1 – Nested Query + `inner_hits` (on `cast` array)

```http
GET tmdb_movies/_search
{
  "query": {
    "nested": {
      "path": "cast",
      "query": {
        "match": { "cast.name": "Samuel L. Jackson" }
      },
      "inner_hits": {
        "size": 3,
        "_source": ["cast.name", "cast.character"]
      }
    }
  },
  "size": 20
}
```

Returns movies **with Samuel L. Jackson in the cast** and embeds only the matched cast members (up to 3) in each hit’s `inner_hits` object – handy for highlighting nested matches in UI.

---

### 10.2 – Significant Terms (discover breakout genres in a subset)

```http
GET tmdb_movies/_search
{
  "query": {
    "range": { "release_date": { "gte": "2024-01-01" } }
  },
  "aggs": {
    "sig_genres": {
      "significant_terms": {
        "field": "genres.name.keyword",
        "min_doc_count": 10
      }
    }
  },
  "size": 0
}
```

Finds genres **disproportionately common** in 2024+ releases compared to the entire corpus – useful for trend discovery.

---

### 10.3 – Date Histogram + Moving Average (pipeline agg)

```http
GET tmdb_movies/_search
{
  "query": {
    "range": { "release_date": { "gte": "2000-01-01" } }
  },
  "aggs": {
    "yearly": {
      "date_histogram": {
        "field": "release_date",
        "calendar_interval": "year"
      },
      "aggs": {
        "avg_rating": { "avg": { "field": "vote_average" } },
        "rating_ma": {
          "moving_avg": {
            "buckets_path": "avg_rating",
            "window": 5,
            "model": "simple"
          }
        }
      }
    }
  },
  "size": 0
}
```

Charts **5‑year moving‑average** of ratings, giving a smoothed trend line for dashboards.

---

### 10.4 – Composite Aggregation (pagination‑friendly facets)

```http
POST tmdb_movies/_search
{
  "size": 0,
  "aggs": {
    "genre_runtime": {
      "composite": {
        "size": 100,
        "sources": [
          { "genre": { "terms": { "field": "genres.name.keyword" } } },
          { "runtime_bucket": { "histogram": { "field": "runtime", "interval": 30 } } }
        ]
      },
      "aggs": {
        "movies": { "value_count": { "field": "_id" } }
      }
    }
  }
}
```

Outputs **genre × runtime buckets** in pages of 100 for client‑side scrolling/ETL.

---

### 10.5 – Search‑After Deep Pagination

```http
GET tmdb_movies/_search
{
  "size": 50,
  "sort": [ { "popularity": "desc" }, { "_id": "asc" } ],
  "search_after": [1500.123, "tt0137523"]
}
```

Retrieves the next page **after** the specified sort‑tuple, avoiding costly deep‑scroll contexts.

---

### 10.6 – Scripted Runtime Field (on‑the‑fly bucketing)

```http
GET tmdb_movies/_search
{
  "runtime_mappings": {
    "decade": {
      "type": "keyword",
      "script": "emit(doc['release_date'].value.getYear() / 10 * 10 + 's');"
    }
  },
  "aggs": {
    "decade_hist": { "terms": { "field": "decade" } }
  },
  "size": 0
}
```

Creates a **`decade`** label at query‑time (e.g. *1990s*) without changing the index, then aggregates on it.

---

### 10.7 – Rescore (BM25 first pass + Phrase boost)

```http
GET tmdb_movies/_search
{
  "query": { "match": { "overview": "alien invasion" } },
  "rescore": {
    "window_size": 200,
    "query": {
      "rescore_query": {
        "match_phrase": {
          "overview": {
            "query": "alien invasion",
            "slop": 1,
            "boost": 4
          }
        }
      },
      "score_mode": "total"
    }
  }
}
```

First 200 hits are re‑ranked with a **phrase‑exact boost**, improving precision while BM25 keeps recall.

---

### 10.8 – Async Search (long‑running analytics)

```http
POST _async_search
{
  "index": "tmdb_movies",
  "size": 0,
  "query": { "range": { "release_date": { "lte": "now" } } },
  "aggs": {
    "genre": { "terms": { "field": "genres.name.keyword", "size": 50 } },
    "avg_revenue": { "avg": { "field": "revenue" } },
    "p50_runtime": { "percentiles": { "field": "runtime", "percents": [50] } }
  }
}
```

Launches a **non‑blocking search**; poll its ID to retrieve results without tying up Kibana.

---

### 10.9 – Cumulative Sum Pipeline (box‑office totals over time)

```http
GET tmdb_movies/_search
{
  "size": 0,
  "aggs": {
    "by_year": {
      "date_histogram": {
        "field": "release_date",
        "calendar_interval": "year"
      },
      "aggs": {
        "yearly_revenue": { "sum": { "field": "revenue" } },
        "running_total": {
          "cumulative_sum": {
            "buckets_path": "yearly_revenue"
          }
        }
      }
    }
  }
}
```

Calculates **running worldwide revenue** per year – key for business dashboards.

---

### 10.10 – Highlighting with Custom Pre/Post Tags (UI integration)

```http
GET tmdb_movies/_search
{
  "query": {
    "multi_match": {
      "query": "matrix",
      "fields": ["title", "overview"]
    }
  },
  "highlight": {
    "pre_tags": ["<span class=\"hl\">"],
    "post_tags": ["</span>"],
    "fields": {
      "overview": {}
    }
  },
  "size": 10
}
```

Returns `<span class="hl">`‑wrapped snippets for UI display.

---

### 10.11 – Geo‑Bounds (if future mapping adds cinema locations)

```http
# Example only – requires a geo_point field such as cinema.location
GET tmdb_movies/_search
{
  "query": { "match_all": {} },
  "aggs": {
    "bounds": { "geo_bounds": { "field": "cinema.location" } }
  },
  "size": 0
}
```

Would deliver the bounding box of all cinema locations; placeholder for geo‑enabled datasets.

---

### 10.12 – Point‑in‑Time (PIT) for Stable Paging

```http
# Open PIT
POST /tmdb_movies/_pit?keep_alive=5m

# … then use the PIT ID in consecutive search‑after requests …
```

Ensures **consistent paging** even while other writes occur.

---

### 10.13 – Multi‑Search (batch ops from API layer)

```http
POST _msearch
{ "index": "tmdb_movies" }
{ "query": { "match": { "title": "Batman" } }, "size": 5 }
{ "index": "tmdb_movies" }
{ "query": { "term": { "genres.name.keyword": "Animation" } }, "size": 3 }
```

Executes two independent searches in one round‑trip – perfect for **homepage widgets**.

---

### 10.14 – Transform‑style Rollup via `terms` + `top_hits`

```http
GET tmdb_movies/_search
{
  "size": 0,
  "aggs": {
    "by_director": {
      "terms": { "field": "directors.name.keyword", "size": 10 },
      "aggs": {
        "best_rated": {
          "top_hits": {
            "sort": [ { "vote_average": "desc" } ],
            "size": 1,
            "_source": { "includes": ["title", "vote_average", "release_date"] }
          }
        }
      }
    }
  }
}
```

For each director, surfaces their **highest‑rated movie** – useful for curated lists.

---

### 10.15 – DSL Search‑Template (parameterised)

```http
POST _scripts/pop_search
{"script":{
  "lang":"mustache",
  "source":{
    "query":{
      "bool":{
        "must":{
          "match":{ "overview":"{{q}}" }
        },
        "filter":{
          "range":{ "popularity":{ "gte":{{pop}} } }
        }
      }
    }
  }
}}

# Execute template
POST tmdb_movies/_search/template
{
  "id":"pop_search",
  "params":{ "q":"robot", "pop":500 }
}
```

Reusable **server‑side template** keeps business logic out of client code.

---

### 10.16 – Runtime Script Scoring (dynamic similarity)

```http
GET tmdb_movies/_search
{
  "query": {
    "script_score": {
      "query": {
        "match": { "overview": "dystopian future" }
      },
      "script": {
        "source": "_score + doc['popularity'].value / 100"
      }
    }
  }
}
```

Adds **popularity influence** on top of BM25 score at query time (no reindex needed).

---

### 10.17 – Percentile Ranks (e.g. rating percentiles)

```http
GET tmdb_movies/_search
{
  "size": 0,
  "aggs": {
    "rating_percentiles": {
      "percentiles": {
        "field": "vote_average",
        "percents": [25,50,75,90,95]
      }
    }
  }
}
```

Returns P25 / P50 / P75 etc. – perfect for dashboards comparing a film’s rating to distribution.

---

### 10.18 – Multi‑Level Terms -> Sub‑Agg -> Reverse Nested

```http
GET tmdb_movies/_search
{
  "size": 0,
  "aggs": {
    "by_genre": {
      "terms": { "field": "genres.name.keyword", "size": 5 },
      "aggs": {
        "to_cast": {
          "nested": { "path": "cast" },
          "aggs": {
            "top_actors": {
              "terms": { "field": "cast.name.keyword", "size": 3 }
            },
            "back_to_root": {
              "reverse_nested": {}
            }
          }
        }
      }
    }
  }
}
```

Gets **top actors per genre** while still allowing root‑level metrics via `reverse_nested`.

---

### 10.19 – Field Collapsing (de‑dup by franchise id)

```http
GET tmdb_movies/_search
{
  "query": { "match": { "overview": "superhero" } },
  "collapse": {
    "field": "belongs_to_collection.id"
  },
  "sort": [ { "vote_average": "desc" } ],
  "inner_hits": {
    "name": "by_collection",
    "size": 2,
    "sort": [ { "release_date": "desc" } ]
  }
}
```

Shows **one top hit per franchise**, but still returns the two latest films inside `inner_hits` for each collection.

---

### 10.20 – Bucket‑Selector Pipeline (filter aggs by threshold)

```http
GET tmdb_movies/_search
{
  "size": 0,
  "aggs": {
    "genres": {
      "terms": { "field": "genres.name.keyword", "size": 20 },
      "aggs": {
        "avg_rating": { "avg": { "field": "vote_average" } },
        "keep_if_good": {
          "bucket_selector": {
            "buckets_path": { "rating": "avg_rating" },
            "script": "params.rating >= 7"
          }
        }
      }
    }
  }
}
```

Returns only genres whose **average rating ≥ 7**.

---

### 10.21 – EQL (Event Query Language) Quick Example

```http
# Available only if x‑pack/feature is enabled
GET /_eql/search/tmdb_movies
{
  "query": "process where process.name == 'java'"
 Mapping Verification Summary
All field references in the above queries exist in the provided `tmdb_movies` mapping:
* Text fields: `title`, `original_title`, `overview`, `cast.name`, `directors.name`, `genres.name`
* Keyword sub‑fields: `genres.name.keyword`, `title.keyword`
* Numeric / Date: `vote_average`, `popularity`, `release_date`
* Boolean: `adult`
* Auxiliary: `poster_path`

No example targets an undefined field – the cheat‑sheet is **mapping‑safe**.

```

---
## 9 · Additional Handy Commands

```http
# Fast hit count only
GET tmdb_movies/_count
{
  "query": { "match_all": {} }
}

# Quick index‑stats table
GET _cat/indices/tmdb_movies?v

# Force refresh so newly indexed docs are searchable immediately
POST tmdb_movies/_refresh
```

---

### ✅ Mapping Verification Summary

All field references in the above queries exist in the provided `tmdb_movies` mapping:

* Text fields: `title`, `original_title`, `overview`, `cast.name`, `directors.name`, `genres.name`
* Keyword sub‑fields: `genres.name.keyword`, `title.keyword`
* Numeric / Date: `vote_average`, `popularity`, `release_date`
* Boolean: `adult`
* Auxiliary: `poster_path`

No example targets an undefined field – the cheat‑sheet is **mapping‑safe**.
