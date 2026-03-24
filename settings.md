# Settings API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. Get All Settings (Public)
**Endpoint:** `GET /settings`
**Auth Required:** No
**Rate Limit:** 60/minute (General API Limit)
**Description:** Retrieve all public application settings as key-value pairs. Results are cached server-side for 1 hour.

**Request Parameters:**
None.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "site_name",
      "value": "حراج مأرب",
      "created_at": "2026-03-01T12:00:00.000000Z",
      "updated_at": "2026-03-01T12:00:00.000000Z"
    },
    {
      "id": 2,
      "key": "contact_email",
      "value": "info@haraj-maareb.test",
      "created_at": "2026-03-01T12:00:00.000000Z",
      "updated_at": "2026-03-01T12:00:00.000000Z"
    },
    {
      "id": 3,
      "key": "contact_phone",
      "value": "+967771234567",
      "created_at": "2026-03-01T12:00:00.000000Z",
      "updated_at": "2026-03-01T12:00:00.000000Z"
    }
  ],
  "message": "data_retrieved"
}
```

**Fields Description:**
| Field | Type | Description |
|---|---|---|
| `id` | Integer | Setting record ID |
| `key` | String | Setting key name (unique identifier) |
| `value` | String | Setting value |
| `created_at` | Timestamp | Creation date |
| `updated_at` | Timestamp | Last update date |

---

## 2. Get/Update Settings (Admin Only)
**Endpoint:** `GET|POST /admin/settings`
**Auth Required:** Yes (Bearer Token + Admin Role)
**Description:** Retrieve or update application settings.

### GET — Retrieve all settings
Same response format as the public endpoint above.

### POST — Update settings
**Request Body (`application/json`):**
```json
{
  "site_name": "حراج مأرب",
  "contact_email": "support@haraj-maareb.test",
  "contact_phone": "+967777777777",
  "subscription_price": "5000"
}
```
Each key-value pair in the body will be updated or created via `updateOrCreate`.

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings updated"
}
```

---

## Notes
- The Setting model uses a simple `key` / `value` structure.
- Helper methods: `Setting::get('key', 'default')` and `Setting::set('key', 'value')`.
- Public settings are cached for 1 hour on the server to improve performance.
