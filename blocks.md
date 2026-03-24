# Block Users API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. Toggle Block User
**Endpoint:** `POST /block/toggle`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute (General API Limit)
**Description:** Block or unblock another user. If the user is already blocked, this endpoint unblocks them. If they are not blocked, it blocks them. Blocking prevents interactions such as messaging and commenting.

**Request Body (`application/json`):**
```json
{
  "user_id": 4
}
```

**Fields Description:**
| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | Integer | Yes | The ID of the user to block/unblock (must exist in `users` table). |

**Success Response - User Blocked (200 OK):**
```json
{
  "success": true,
  "data": {
    "blocked": true
  },
  "message": "user_blocked"
}
```

**Success Response - User Unblocked (200 OK):**
```json
{
  "success": true,
  "data": {
    "blocked": false
  },
  "message": "user_unblocked"
}
```

**Error Response - Cannot Block Self (400 Bad Request):**
```json
{
  "success": false,
  "message": "cannot_block_self"
}
```

**Validation Error (422 Unprocessable Entity):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "user_id": [
      "The selected user id is invalid."
    ]
  }
}
```

---

## Notes
- The blocking mechanism prevents mutual interaction:
  - Users cannot comment on ads owned by a user they have blocked, or a user who has blocked them.
  - Users cannot send messages in a chat if either party has blocked the other.
  - Users cannot submit ratings for blocked users.
- Self-blocking is server-validated and returns a `400 Bad Request` with message `cannot_block_self`.
- Data is stored in the `blocked_users` table (`user_id`, `blocked_user_id`).
