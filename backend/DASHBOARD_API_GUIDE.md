# Dashboard API - Usage Guide

## Endpoints Summary

The dashboard API provides three main endpoints for surveillance metrics and trend analysis:

### 1. Past Statistics Endpoint
**Endpoint:** `GET /api/dashboard/stats/past?days=30`

**Description:** Retrieves aggregated report statistics over a specified number of days.

**Query Parameters:**
- `days` (optional, default: 30): Number of days to look back (1-365)

**Example Requests:**
```bash
# Get statistics for last 30 days
curl http://localhost:8000/api/dashboard/stats/past

# Get statistics for last 7 days
curl http://localhost:8000/api/dashboard/stats/past?days=7

# Get statistics for last 90 days
curl http://localhost:8000/api/dashboard/stats/past?days=90
```

**Example Response:**
```json
{
  "total_reports": 156,
  "reporting_period": "last 30 days",
  "by_type": [
    {
      "type": "human",
      "count": 89,
      "sick_cases": 45,
      "death_cases": 2,
      "percentage": 57.05
    },
    {
      "type": "animal",
      "count": 52,
      "sick_cases": 38,
      "death_cases": 8,
      "percentage": 33.33
    },
    {
      "type": "environment",
      "count": 15,
      "sick_cases": 0,
      "death_cases": 0,
      "percentage": 9.62
    }
  ],
  "timestamp": "2026-05-21T10:30:45.123456+00:00"
}
```

---

### 2. Seven-Day Trend Endpoint
**Endpoint:** `GET /api/dashboard/trends/7days`

**Description:** Returns time series data for daily report counts over the last 7 days. Perfect for charts and graphs.

**Example Request:**
```bash
curl http://localhost:8000/api/dashboard/trends/7days
```

**Example Response:**
```json
{
  "period": "7 days",
  "start_date": "2026-05-15",
  "end_date": "2026-05-21",
  "data": [
    {
      "date": "2026-05-15",
      "human": 12,
      "animal": 5,
      "environment": 2,
      "total": 19
    },
    {
      "date": "2026-05-16",
      "human": 14,
      "animal": 8,
      "environment": 1,
      "total": 23
    },
    {
      "date": "2026-05-17",
      "human": 10,
      "animal": 6,
      "environment": 3,
      "total": 19
    },
    {
      "date": "2026-05-18",
      "human": 15,
      "animal": 7,
      "environment": 2,
      "total": 24
    },
    {
      "date": "2026-05-19",
      "human": 18,
      "animal": 9,
      "environment": 1,
      "total": 28
    },
    {
      "date": "2026-05-20",
      "human": 16,
      "animal": 11,
      "environment": 4,
      "total": 31
    },
    {
      "date": "2026-05-21",
      "human": 8,
      "animal": 6,
      "environment": 2,
      "total": 16
    }
  ],
  "summary": {
    "human": 93,
    "animal": 52,
    "environment": 15
  }
}
```

---

### 3. Dashboard Summary Endpoint
**Endpoint:** `GET /api/dashboard/summary`

**Description:** Quick overview combining all-time and today's statistics.

**Example Request:**
```bash
curl http://localhost:8000/api/dashboard/summary
```

**Example Response:**
```json
{
  "total_reports_all_time": 542,
  "total_reports_today": 16,
  "reports_by_type": {
    "human": 312,
    "animal": 178,
    "environment": 52
  },
  "today_reports_by_type": {
    "human": 8,
    "animal": 6,
    "environment": 2
  },
  "total_deaths": 45,
  "total_sick_cases": 289,
  "timestamp": "2026-05-21T10:35:00.123456+00:00"
}
```

---

## Frontend Integration Examples

### React Component Example
```jsx
import { useState, useEffect } from 'react';

function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await fetch('/api/dashboard/stats/past?days=30');
        const trendRes = await fetch('/api/dashboard/trends/7days');
        
        setStats(await statsRes.json());
        setTrend(await trendRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Display stats by type */}
      {stats?.by_type.map(type => (
        <div key={type.type}>
          <h3>{type.type.toUpperCase()}</h3>
          <p>Count: {type.count}</p>
          <p>Sick Cases: {type.sick_cases}</p>
          <p>Deaths: {type.death_cases}</p>
          <p>Percentage: {type.percentage}%</p>
        </div>
      ))}
      
      {/* Display trend chart */}
      {trend?.data && renderChart(trend.data)}
    </div>
  );
}
```

---

## Data Structure Reference

### Report Item Structure (DynamoDB)
```python
{
  "report_id": "uuid-string",
  "submitted_at": "2026-05-21T10:30:45.123456+00:00",  # ISO format
  "lat": 40.7128,  # Latitude (Decimal in DynamoDB)
  "long": -74.0060,  # Longitude (Decimal in DynamoDB)
  "report": [
    {
      "type": "human",  # or "animal", "environment"
      "sick_flag": True,
      "symptoms": ["fever", "cough"],
      "death_flag": False,
      "number_affected": 3
    },
    {
      "type": "animal",
      "sick_flag": True,
      "symptoms": ["lethargy"],
      "death_flag": True,
      "species": "Gallus gallus",
      "number_affected": 5
    }
  ]
}
```

---

## Error Handling

All endpoints return proper HTTP status codes:

- **200 OK**: Successful response
- **400 Bad Request**: Invalid query parameters (e.g., `days` outside 1-365 range)
- **500 Internal Server Error**: Database or processing error

**Error Response Format:**
```json
{
  "detail": "Days must be between 1 and 365"
}
```

---

## Performance Considerations

- **Scan Operation**: Currently uses DynamoDB `scan()` which reads all items. For production with large datasets, consider:
  - Adding GSI (Global Secondary Index) on `submitted_at`
  - Implementing pagination
  - Using batch queries by date ranges
  
- **Caching**: Consider caching dashboard stats (they don't need real-time updates)
  
- **Query Optimization**: For 7-day trends, ensure reports have proper `submitted_at` timestamps

---

## Testing Checklist

- [ ] Verify stats endpoint with various day ranges
- [ ] Check date boundary handling (spanning midnight)
- [ ] Validate percentage calculations sum to 100%
- [ ] Test with empty database (should return zeros)
- [ ] Verify timezone handling (UTC stored in DynamoDB)
- [ ] Check sick_flag and death_flag counting accuracy
- [ ] Test trend endpoint returns exactly 7 data points
- [ ] Validate all response schemas match Pydantic models
