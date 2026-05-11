# Epicore API

The Epicore API returns structured data on verified public health events globally. Query closed events by date range and receive JSON with outbreak details, source references, and verification outcomes.

## Endpoint

```
GET https://epicore.org/scripts/EventsAPI2.php
```

### Query parameters

| Parameter   | Type   | Required | Format       | Example       |
|-------------|--------|----------|--------------|---------------|
| `start_date`| string | yes      | `YYYY-MM-DD` | `2026-02-01`  |
| `end_date`  | string | yes      | `YYYY-MM-DD` | `2026-02-28`  |

### Example request

```
https://epicore.org/scripts/EventsAPI2.php?start_date=2026-02-01&end_date=2026-02-28
```

## Response

The endpoint returns `application/json`. Example:

```json
{
  "EventsList": {
    "all": [
      {
        "event_id": "12345",
        "title": "Suspected cholera outbreak in Region X",
        "description": null,
        "create_date": "15-Jan-2025",
        "action_date": "20-Jan-2025",
        "outcome": "VP",
        "phe_description": "Cholera",
        "phe_additional": "Additional context...",
        "source": "MR",
        "source_details": "https://example.com/news-article",
        "iso_action_date": "2025-01-20 14:30:00",
        "event_id_int": 12345,
        "country": "Thailand"
      }
    ]
  },
  "closedEvents": null,
  "numNotRatedResponses": null
}
```

## Field reference

| Field              | Type             | Description |
|--------------------|------------------|-------------|
| `event_id`         | string           | RFI ID as a string |
| `title`            | string           | RFI title describing the health event |
| `description`      | string \| null   | Currently always null |
| `create_date`      | string           | RFI creation date — `DD-Mon-YYYY` (e.g. `15-Jan-2025`) |
| `action_date`      | string           | Closure date — `DD-Mon-YYYY` |
| `outcome`          | string           | Verification outcome — see codes below |
| `phe_description`  | string           | Public health event description (e.g. `Cholera`) |
| `phe_additional`   | string           | Additional context for the event |
| `source`           | string           | Source type code — see codes below |
| `source_details`   | string           | URL or text description of the source |
| `iso_action_date`  | string           | Closure date in ISO format `YYYY-MM-DD HH:MM:SS` |
| `event_id_int`     | integer          | RFI ID as an integer |
| `country`          | string           | Full country name where the event occurred |

### Outcome codes

| Code | Meaning |
|------|---------|
| `VP` | Verified Positive |
| `VN` | Verified Negative |
| `UP` | Update |

### Source codes

| Code | Meaning |
|------|---------|
| `OR` | Official Report |
| `MR` | Media Report |
| `OC` | Other Communication |

## Quick examples

**curl**
```bash
curl "https://epicore.org/scripts/EventsAPI2.php?start_date=2026-02-01&end_date=2026-02-28"
```

**Python**
```python
import requests

resp = requests.get(
    "https://epicore.org/scripts/EventsAPI2.php",
    params={"start_date": "2026-02-01", "end_date": "2026-02-28"},
    timeout=30,
)
events = resp.json()["EventsList"]["all"]
print(f"Returned {len(events)} events")
```

**JavaScript (Node, fetch)**
```javascript
const url = new URL("https://epicore.org/scripts/EventsAPI2.php");
url.search = new URLSearchParams({
  start_date: "2026-02-01",
  end_date: "2026-02-28",
}).toString();

const res = await fetch(url);
const data = await res.json();
console.log(`Returned ${data.EventsList.all.length} events`);
```
