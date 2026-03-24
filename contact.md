# Contact Us API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. Send Contact Message
**Endpoint:** `POST /contact`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute (General API Limit)
**Description:** Send a contact/support message to the platform administrators.

**Request Body (`application/json`):**
```json
{
  "name": "أحمد",
  "email": "ahmed@example.com",
  "phone": "771234567",
  "message": "لدي استفسار بخصوص..."
}
```
| Field | Type | Required | Nullable | Description |
|---|---|---|---|---|
| `name` | String | Yes | No | Sender name |
| `email` | String | No | Yes | Sender email (must be valid email format) |
| `phone` | String | No | Yes | Sender phone number |
| `message` | String | Yes | No | Message content (max: 2000 chars) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Message received"
}
```

**Validation Error Response (422 Unprocessable Entity):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."],
    "message": ["The message field is required."]
  }
}
```

---

## 2. List Contact Messages (Admin Only)
**Endpoint:** `GET /admin/contact-messages`
**Auth Required:** Yes (Bearer Token + Admin Role)
**Rate Limit:** 60/minute
**Description:** Get a paginated list of all contact messages (newest first).

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | Integer | No | Page number for pagination |

**Success Response (200 OK):**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "name": "أحمد",
      "email": "ahmed@example.com",
      "phone": null,
      "message": "لدي استفسار بخصوص...",
      "created_at": "2026-03-07T12:00:00.000000Z",
      "updated_at": "2026-03-07T12:00:00.000000Z"
    }
  ],
  "per_page": 20,
  "total": 5
}
```

**Unauthorized Response (403 Forbidden):**
```json
{
  "message": "Unauthorized"
}
```

---

## 3. Delete Contact Message (Admin Only)
**Endpoint:** `DELETE /admin/contact-messages/{id}`
**Auth Required:** Yes (Bearer Token + Admin Role)
**Rate Limit:** 60/minute
**Description:** Permanently delete a contact message by its ID.

**Path Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | Integer | Yes | Contact message ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact message deleted"
}
```

**Not Found Response (404):**
```json
{
  "message": "No query results for model [App\\Models\\ContactMessage] 999"
}
```
