# TMDB Movies Examples

This folder contains query examples for the TMDB Movies dataset, organized into logical categories.

## Structure

### Files
- `loader.js` - Main loader that imports and registers all example categories
- `basic-queries.js` - Basic search queries (match, phrase, multi-match)
- `boolean-logic.js` - Boolean queries (must, should, must_not, filter)
- `range-filtering.js` - Range and filtering queries (dates, ratings, exists)
- `advanced-features.js` - Advanced features (boosting, fuzzy, aggregations, nested)

## Categories

### Basic Queries (`basic-queries.js`)
- **Basic Match Query** - Simple title search with BM25 scoring
- **Match Phrase Query** - Exact phrase matching in order
- **Multi-Match Query** - Search across multiple fields (title, overview)
- **Match All Query** - Retrieve all documents with neutral scoring

### Boolean Logic (`boolean-logic.js`)
- **Boolean Must Query (AND)** - Combine conditions that all must match
- **Boolean Should Query (OR)** - Combine conditions with OR logic
- **Boolean Must Not Query (NOT)** - Exclude documents matching conditions
- **Boolean with Filter Context** - Combine query and filter contexts for performance

### Range & Filtering (`range-filtering.js`)
- **Date Range Query** - Filter by release date ranges
- **Rating Range Filter** - Filter by rating with combined text search
- **Popularity Range Query** - Find movies by popularity threshold
- **Field Exists Filter** - Ensure required fields are present

### Advanced Features (`advanced-features.js`)
- **Boosted Multi-Match** - Field importance weighting (title^3)
- **Fuzzy Match Query** - Handle typos and misspellings
- **Faceted Search with Aggregations** - Genre and year facets
- **Complex Query with Cast Search** - Nested queries with highlighting
- **Function Score with Date Decay** - Custom scoring with recency boost

## Usage

Examples are automatically loaded via the `loader.js` file and made available through the main examples registry. Each example includes:

- **Query**: The Elasticsearch query with variable placeholders
- **Explanation**: Educational description of what the query does
- **Concepts**: Elasticsearch concepts demonstrated
- **Variable Hints**: Helper text for input fields

## Elasticsearch Concepts Covered

- Full-text search and analysis
- Boolean query logic (must, should, must_not, filter)
- Range queries and date math
- Field boosting and relevance scoring
- Fuzzy matching and typo tolerance
- Aggregations and faceted search
- Nested queries for complex data structures
- Function scoring and custom relevance
- Query vs Filter context optimization 