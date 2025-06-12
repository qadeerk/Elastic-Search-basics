export const logsExamples = [
  {
    id: 'error_logs',
    title: 'Error Log Search',
    description: 'Find error logs within a time range',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "level.keyword": "ERROR"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "timestamp": {
              "gte": "{{date:startTime}}",
              "lte": "{{date:endTime}}"
            }
          }
        }
      ]
    }
  },
  "sort": [
    { "timestamp": "desc" }
  ]
}`,
    explanation: 'Filters logs by error level and time range. Sorts by timestamp descending to show recent errors first.',
    concepts: ['Term queries', 'Time-based filtering', 'Log levels', 'Descending sort'],
    variableHints: {
      'date:startTime': 'Enter start time (e.g., "2024-01-01T00:00:00")',
      'date:endTime': 'Enter end time (e.g., "2024-01-02T00:00:00")'
    }
  },
  {
    id: 'application_monitoring',
    title: 'Application Performance Monitoring',
    description: 'Monitor slow requests and errors by service',
    query: `{
  "query": {
    "bool": {
      "should": [
        {
          "range": {
            "response_time": {
              "gte": {{slowThreshold}}
            }
          }
        },
        {
          "terms": {
            "level.keyword": ["ERROR", "FATAL"]
          }
        }
      ],
      "filter": [
        {
          "term": {
            "service.keyword": "{{serviceName}}"
          }
        },
        {
          "range": {
            "timestamp": {
              "gte": "now-1h"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "error_types": {
      "terms": {
        "field": "error_type.keyword"
      }
    },
    "avg_response_time": {
      "avg": {
        "field": "response_time"
      }
    }
  }
}`,
    explanation: 'Monitors application performance by finding slow requests or errors. Includes aggregations for error analysis and performance metrics.',
    concepts: ['Performance monitoring', 'Should queries', 'Time-based filters', 'Application metrics'],
    variableHints: {
      slowThreshold: 'Enter slow request threshold in ms (e.g., 1000)',
      serviceName: 'Enter service name (e.g., "user-service")'
    }
  },
  {
    id: 'log_pattern_search',
    title: 'Log Pattern Search',
    description: 'Search for specific patterns in log messages',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "wildcard": {
            "message": "*{{pattern}}*"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "timestamp": {
              "gte": "now-24h"
            }
          }
        }
      ]
    }
  },
  "highlight": {
    "fields": {
      "message": {}
    }
  }
}`,
    explanation: 'Uses wildcard queries to find log messages containing specific patterns. Includes highlighting to show matched terms.',
    concepts: ['Wildcard queries', 'Pattern matching', 'Highlighting', 'Recent time filtering'],
    variableHints: {
      pattern: 'Enter pattern to search for (e.g., "database connection")'
    }
  },
  {
    id: 'log_aggregation_timeline',
    title: 'Log Count Timeline',
    description: 'Create timeline of log counts by level',
    query: `{
  "size": 0,
  "query": {
    "range": {
      "timestamp": {
        "gte": "{{date:startDate}}",
        "lte": "{{date:endDate}}"
      }
    }
  },
  "aggs": {
    "logs_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "{{interval}}"
      },
      "aggs": {
        "by_level": {
          "terms": {
            "field": "level.keyword"
          }
        }
      }
    }
  }
}`,
    explanation: 'Creates a timeline showing log counts over time, broken down by log level. Perfect for monitoring dashboards.',
    concepts: ['Date histograms', 'Time-series analysis', 'Nested aggregations', 'Dashboard metrics'],
    variableHints: {
      'date:startDate': 'Enter start date (e.g., "2024-01-01")',
      'date:endDate': 'Enter end date (e.g., "2024-01-07")',
      interval: 'Enter time interval (e.g., "1h", "1d")'
    }
  },
  {
    id: 'user_activity_logs',
    title: 'User Activity Analysis',
    description: 'Analyze user activity patterns in logs',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "exists": {
            "field": "user_id"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "action.keyword": "{{action}}"
          }
        },
        {
          "range": {
            "timestamp": {
              "gte": "now-7d"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "top_users": {
      "terms": {
        "field": "user_id.keyword",
        "size": 10
      }
    },
    "activity_by_hour": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "hour"
      }
    }
  },
  "sort": [
    { "timestamp": "desc" }
  ]
}`,
    explanation: 'Analyzes user activity by filtering for specific actions and showing top users and hourly activity patterns.',
    concepts: ['User analytics', 'Activity tracking', 'Top N aggregations', 'Time patterns'],
    variableHints: {
      action: 'Enter action type (e.g., "login", "purchase", "view")'
    }
  }
]; 