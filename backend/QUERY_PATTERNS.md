# Dashboard API - Database Query Patterns

## Overview
This document explains the DynamoDB query patterns used in the dashboard endpoints and how data is aggregated from the reports table.

---

## Database Schema Reference

### epihack_reports Table Structure
```
Primary Key: report_id (String)

Sample Document:
{
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "submitted_at": "2026-05-21T14:30:45.123456+00:00",
  "lat": Decimal('40.7128'),
  "long": Decimal('-74.0060'),
  "report": [
    {
      "type": "human",
      "sick_flag": True/False,
      "death_flag": True/False,
      "symptoms": ["fever", "cough", "shortness_of_breath"],
      "number_affected": 3
    },
    {
      "type": "animal",
      "sick_flag": True/False,
      "death_flag": True/False,
      "species": "Gallus gallus",
      "number_affected": 5
    },
    {
      "type": "environment",
      "sick_flag": False,
      "death_flag": False,
      "symptoms": ["water_contamination"]
    }
  ]
}
```

---

## Query Patterns Used

### 1. Full Table Scan
**Operation**: `db.scan(REPORTS)`

**What it does**:
- Retrieves ALL documents from the epihack_reports table
- Returns list of deserialized dictionaries
- No filtering at database level

**Code Location**: `dashboard.py`, all endpoint functions

**Example**:
```python
all_reports = db.scan(REPORTS)  # Returns list[dict]
# Result: [report1, report2, report3, ...]
```

**Performance**:
- ⚠️ Reads entire table into memory
- Suitable for: <10,000 records
- For larger datasets: Use GSI on submitted_at

---

### 2. Application-Level Filtering

#### By Date Range
```python
# Define cutoff date
cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)

# Filter in Python
recent_reports = [
    r for r in all_reports
    if (_parse_timestamp(r.get("submitted_at", "")) and 
        _parse_timestamp(r.get("submitted_at")) >= cutoff_date)
]
```

**Why application-level?**:
- DynamoDB doesn't have efficient range queries on non-key attributes without GSI
- Current implementation uses `scan()` which doesn't support FilterExpression well
- Data volume is small enough for in-memory filtering

---

### 3. Nested Array Extraction

#### Extract Report Type Entries
```python
def _extract_report_type_data(report_item: dict) -> list[dict]:
    """
    From single report document:
    {
      "report_id": "...",
      "report": [
        {"type": "human", "sick_flag": True, ...},
        {"type": "animal", "sick_flag": False, ...}
      ]
    }
    
    Extract to:
    [
      {"type": "human", "sick_flag": True, ...},
      {"type": "animal", "sick_flag": False, ...}
    ]
    """
```

**Why separate**:
- Each report document has multiple type entries
- Need to count individual report types, not documents
- Must flatten nested structure for aggregation

---

### 4. Multi-Level Aggregation

#### Pattern: Date → Type → Counts
```python
# Initialize structure
aggregation = {
    "2026-05-21": {"human": 0, "animal": 0, "environment": 0},
    "2026-05-20": {"human": 0, "animal": 0, "environment": 0},
    ...
}

# Iterate and count
for report in all_reports:
    report_date = parse_date(report["submitted_at"])
    for item in report["report"]:
        report_type = item["type"]
        aggregation[report_date][report_type] += 1

# Result: Daily breakdown by type
```

**Benefits**:
- Efficient dictionary lookups: O(1)
- Pre-initialized structure avoids gaps
- Easy conversion to response format

---

### 5. Flag Counting

#### sick_flag and death_flag Aggregation
```python
stats = {
    "human": {"count": 0, "sick": 0, "deaths": 0},
    "animal": {"count": 0, "sick": 0, "deaths": 0},
    "environment": {"count": 0, "sick": 0, "deaths": 0},
}

for report in all_reports:
    for item in report["report"]:
        report_type = item["type"]
        
        # Count total
        stats[report_type]["count"] += 1
        
        # Count sick cases
        if item.get("sick_flag"):
            stats[report_type]["sick"] += 1
        
        # Count deaths
        if item.get("death_flag"):
            stats[report_type]["deaths"] += 1
```

**Logic**:
- Boolean flags default to False
- Use `.get()` for safe field access
- Conditional increment for flags

---

## Data Type Handling

### DynamoDB → Python Type Conversions

**Decimal (DynamoDB) → float/int (Python)**
```python
# DynamoDB stores: Decimal('40.7128')
# Our deserializer converts it to: 40.7128

def _deserialize(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, dict):
        return {k: _deserialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deserialize(i) for i in obj]
    return obj
```

**Timestamp String → datetime Object**
```python
# DynamoDB stores: "2026-05-21T14:30:45.123456+00:00"
# Parse to: datetime(2026, 5, 21, 14, 30, 45, ...)

def _parse_timestamp(timestamp_str: str) -> datetime | None:
    try:
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except ValueError:
        try:
            return datetime.strptime(timestamp_str, "%Y-%m-%d")
        except ValueError:
            return None
```

---

## Query Optimization Opportunities

### Current State
```python
# O(n) full scan
all_reports = db.scan(REPORTS)

# O(n) filtering
filtered = [r for r in all_reports if date_check(r)]

# O(n * m) nested iteration (m = items per report)
for report in filtered:
    for item in report["report"]:
        # Process item
```

**Complexity**: O(n * m) where n = report count, m = avg items per report

---

### Recommended GSI for Production

**Create Global Secondary Index**:
```python
# GSI Configuration
GSI_Name: "submitted_at-index"
Partition Key: "submitted_at" (String)
Sort Key: None (or "report_id")
Projection: ALL

# Query becomes:
response = dynamodb_resource.query(
    IndexName='submitted_at-index',
    KeyConditionExpression='submitted_at >= :date',
    ExpressionAttributeValues={':date': cutoff_date_iso}
)

# Complexity improves to: O(k) where k = matching items
```

---

## Error Handling in Queries

### Graceful Degradation
```python
# Missing timestamp
timestamp_str = report.get("submitted_at", "")  # Default empty string
parsed_ts = _parse_timestamp(timestamp_str)     # Returns None if invalid

if parsed_ts:
    # Use timestamp
else:
    # Skip report or log warning

# Missing nested field
report_items = report.get("report", [])  # Default empty list
for item in report_items:  # Won't crash if missing
    report_type = item.get("type", "unknown")  # Safe access
```

### Result
- No crashes on missing data
- Reports with bad timestamps are skipped
- Empty reports return 0 counts

---

## Sample Query Results

### Input: Database with 5 Reports
```
Report 1: 2026-05-21, [human(sick), human(sick), animal(death)]
Report 2: 2026-05-21, [human(alive), environment]
Report 3: 2026-05-20, [animal(death), animal(death)]
Report 4: 2026-05-20, [human(alive), human(alive)]
Report 5: 2026-05-19, [human(sick)]
```

### Output: /api/dashboard/trends/7days
```json
{
  "data": [
    {"date": "2026-05-19", "human": 1, "animal": 0, "environment": 0, "total": 1},
    {"date": "2026-05-20", "human": 2, "animal": 2, "environment": 0, "total": 4},
    {"date": "2026-05-21", "human": 3, "animal": 1, "environment": 1, "total": 5},
    {"date": "2026-05-22", "human": 0, "animal": 0, "environment": 0, "total": 0},
    ...
  ],
  "summary": {"human": 6, "animal": 3, "environment": 1}
}
```

### Output: /api/dashboard/stats/past?days=3
```json
{
  "total_reports": 5,
  "by_type": [
    {"type": "human", "count": 6, "sick_cases": 2, "death_cases": 0, "percentage": 60.0},
    {"type": "animal", "count": 3, "sick_cases": 0, "death_cases": 2, "percentage": 30.0},
    {"type": "environment", "count": 1, "sick_cases": 0, "death_cases": 0, "percentage": 10.0}
  ]
}
```

---

## Query Testing Guide

### 1. Test Empty Database
```bash
curl http://localhost:8000/api/dashboard/stats/past?days=30
# Expected: All counts = 0, percentages = 0
```

### 2. Test with Sample Data
```bash
# Submit multiple reports via POST /api/reports
curl -X POST http://localhost:8000/api/reports \
  -F "report=@sample_report.json" \
  -F "animal_images=@image1.jpg"

# Query dashboard
curl http://localhost:8000/api/dashboard/stats/past
```

### 3. Test Date Filtering
```bash
# Query different date ranges
curl "http://localhost:8000/api/dashboard/stats/past?days=7"
curl "http://localhost:8000/api/dashboard/stats/past?days=30"
curl "http://localhost:8000/api/dashboard/stats/past?days=90"

# Should show increasing totals as days increase
```

### 4. Test Trend Endpoint
```bash
curl http://localhost:8000/api/dashboard/trends/7days

# Verify:
# - Exactly 7 data points returned
# - Dates are consecutive
# - Totals = human + animal + environment
```

---

## Migration Plan for Large Datasets

### Phase 1: Current (< 10k records)
- Use `scan()` with application-level filtering
- Store in-memory aggregation
- Acceptable response time: < 500ms

### Phase 2: Medium (10k - 100k records)
- Add GSI on `submitted_at`
- Use `query()` instead of `scan()`
- Add Redis caching for stats
- Response time target: < 200ms

### Phase 3: Large (100k+ records)
- Implement data archival (move old reports)
- Use time-series database (DynamoDB TTL + Timestream)
- Pre-compute daily aggregations
- Response time target: < 100ms

---

## Monitoring & Metrics

### Recommended CloudWatch Alarms
- Dashboard endpoint latency > 1 second
- DynamoDB read throttling
- Scan operation full table reads > hourly
- Failed queries (5xx errors)

### Performance Metrics to Track
- API response time (p50, p95, p99)
- DynamoDB consumed capacity
- Number of reports processed
- Cache hit rate (if added)
