# Comments API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. Add Comment
**Endpoint:** `POST /comments`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute (General API Limit)
**Description:** Add a new comment to a specific ad. The endpoint validates that the user is not blocked by the ad owner (and vice versa) before allowing the comment.

**Request Body (`application/json`):**
```json
{
  "ad_id": 12,
  "content": "هل المنتج لا يزال متوفراً؟"
}
```

**Fields Description:**
| Field | Type | Required | Description |
|---|---|---|---|
| `ad_id` | Integer | Yes | The ID of the ad to comment on (must exist). |
| `content` | String | Yes | The comment text (max 1000 characters). |

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "ad_id": 12,
    "user_id": 4,
    "content": "هل المنتج لا يزال متوفراً؟",
    "created_at": "2023-10-25T14:30:00.000000Z",
    "updated_at": "2023-10-25T14:30:00.000000Z"
  },
  "message": "comment_created"
}
```

**Error Response - Blocked Interaction (403 Forbidden):**
```json
{
  "success": false,
  "message": "blocked_interaction"
}
```

**Validation Error (422 Unprocessable Entity):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "ad_id": [
      "The selected ad id is invalid."
    ],
    "content": [
      "The content field is required."
    ]
  }
}
```

---

## 2. Delete Comment
**Endpoint:** `DELETE /comments/{id}`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute
**Description:** Delete an existing comment by its ID. Users can only delete their own comments.

**URL Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | Integer | Yes | The ID of the comment to delete. |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "comment_deleted"
}
```

**Error Response - Unauthorized (403 Forbidden):**
Returned if the authenticated user is not the owner of the comment.
```json
{
  "success": false,
  "message": "unauthorized"
}
```

**Error Response - Not Found (404 Not Found):**
```json
{
  "message": "No query results for model [App\\Models\\Comment] 999"
}
```

---

## Notes
- To read comments for a specific ad, you generally fetch the ad details (`GET /ads/{id}`) which should include the comments relation and their respective users, rather than having a standalone GET endpoint for comments.
- Interactions are constrained by the `BlockService`. Trying to comment on an ad where either the commenter or the ad owner has blocked the other will result in a `403 Forbidden` with the `blocked_interaction` message.
