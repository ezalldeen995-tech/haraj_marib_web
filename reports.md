# Reports API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. Report an Ad (User)
**Endpoint:** `POST /reports`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute
**Description:** Submit a report against an ad for violating platform rules.

**Request Body (`application/json`):**
```json
{
  "ad_id": 5,
  "reason": "محتوى مخالف أو احتيال"
}
```
| Field | Type | Required | Description |
|---|---|---|---|
| `ad_id` | Integer | Yes | ID of the ad being reported (must exist) |
| `reason` | String | Yes | Reason for the report (max: 1000 chars) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Report submitted",
  "data": {
    "id": 1,
    "ad_id": 5,
    "reporter_id": 1,
    "reason": "محتوى مخالف أو احتيال",
    "status": "pending",
    "created_at": "2026-03-07T12:00:00.000000Z",
    "updated_at": "2026-03-07T12:00:00.000000Z"
  }
}
```

**Validation Error (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "ad_id": ["The selected ad id is invalid."],
    "reason": ["The reason field is required."]
  }
}
```

---

## 2. List All Reports (Admin Only)
**Endpoint:** `GET /admin/reports`
**Auth Required:** Yes (Bearer Token + Admin Role)
**Description:** Get a paginated list of all reported ads.

**Success Response (200 OK):**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "ad_id": 5,
      "reporter_id": 1,
      "reason": "محتوى مخالف أو احتيال",
      "status": "pending",
      "created_at": "2026-03-07T12:00:00.000000Z",
      "ad": { "id": 5, "title": "..." },
      "reporter": { "id": 1, "name": "أحمد" }
    }
  ],
  "per_page": 20,
  "total": 3
}
```

---

## 3. Dismiss a Report (Admin Only)
**Endpoint:** `POST /admin/reports/{id}/dismiss`
**Auth Required:** Yes (Bearer Token + Admin Role)
**Description:** Mark a report as dismissed/reviewed.

**Path Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | Integer | Yes | Report ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Report dismissed"
}
```

---

## Notes
- **Status values**: `pending`, `dismissed`
- The Report model has relationships: `ad` (BelongsTo Ad), `reporter` (BelongsTo User via `reporter_id`)
- A user cannot report their own ad (validated server-side)
