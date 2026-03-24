# Ratings API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. Rate a User
**Endpoint:** `POST /ratings`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute (General API Limit)
**Description:** Rate a user from 1 to 5 stars. If you have already rated this user, your rating will be updated (upsert behavior via `updateOrCreate`).

**Request Body (`application/json`):**
```json
{
  "user_id": 3,
  "rating": 4,
  "comment": "بائع موثوق"
}
```
| Field | Type | Required | Nullable | Description |
|---|---|---|---|---|
| `user_id` | Integer | Yes | No | ID of the user to rate (must exist in users table) |
| `rating` | Integer | Yes | No | Rating value: min 1, max 5 |
| `comment` | String | No | Yes | Optional comment (max: 500 chars) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rating": {
      "id": 1,
      "user_id": 3,
      "rater_id": 1,
      "rating": 4,
      "comment": "بائع موثوق",
      "created_at": "2026-03-07T12:00:00.000000Z",
      "updated_at": "2026-03-07T12:00:00.000000Z"
    },
    "average": 4.25
  }
}
```

**Error — Self Rating (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot rate yourself"
}
```

**Error — Blocked User (403 Forbidden):**
```json
{
  "success": false,
  "message": "You cannot interact with this user"
}
```

**Validation Error (422 Unprocessable Entity):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "user_id": ["The selected user id is invalid."],
    "rating": ["The rating must be between 1 and 5."]
  }
}
```

---

## Notes
- **Upsert behavior**: If the authenticated user has already rated the target user, the existing rating is updated instead of creating a duplicate.
- **Average recalculation**: The response includes the recalculated average rating for the target user after the new rating is applied.
- **Block check**: Rating is prevented if either user has blocked the other.
