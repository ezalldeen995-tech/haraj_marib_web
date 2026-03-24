# Categories API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. List All Categories
**Endpoint:** `GET /categories`
**Auth Required:** No
**Rate Limit:** 60/minute (General API Limit)
**Description:** Get a list of all active and available categories. These are used for filtering ads or when a user is creating a new ad.

**Request Parameters:**
None.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "السيارات",
      "icon": "bi-car-front",
      "parent_id": null,
      "is_active": 1,
      "created_at": "2026-03-01T12:00:00.000000Z",
      "updated_at": "2026-03-01T12:00:00.000000Z"
    },
    {
      "id": 2,
      "name": "العقارات",
      "icon": "bi-building",
      "parent_id": null,
      "is_active": 1,
      "created_at": "2026-03-01T12:05:00.000000Z",
      "updated_at": "2026-03-01T12:05:00.000000Z"
    },
    {
      "id": 3,
      "name": "أجهزة وإلكترونيات",
      "icon": "bi-phone",
      "parent_id": null,
      "is_active": 1,
      "created_at": "2026-03-01T12:10:00.000000Z",
      "updated_at": "2026-03-01T12:10:00.000000Z"
    }
  ],
  "message": "data_retrieved"
}
```

**Fields Description:**
| Field | Type | Description |
|---|---|---|
| `id` | Integer | The category unique ID |
| `name` | String | The name of the category (e.g., "السيارات") |
| `icon` | String | Bootstrap icon class or image path representing the category |
| `parent_id` | Integer (Nullable) | The ID of the parent category, if this is a subcategory |
| `is_active` | Boolean/Integer | Whether the category is active (`1`) or inactive (`0`) |
| `created_at` | Timestamp | Category creation date |
| `updated_at` | Timestamp | Category last update date |

---

## Notes
- The results from this endpoint are **cached** for 1 hour on the server side to improve performance, as categories rarely change.
- A null `parent_id` means this is a top-level main category. 
