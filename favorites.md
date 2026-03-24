# Favorites API Endpoints

Base URL: `http://haraj-maareb.test/api/v1`

## 1. Toggle Favorite
**Endpoint:** `POST /favorites/toggle`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute (General API Limit)
**Description:** Add an ad to favorites, or remove it if it's already in favorites.

**Request Body (`application/json`):**
```json
{
  "ad_id": 1
}
```
| Field | Type | Required | Description |
|---|---|---|---|
| `ad_id` | Integer | Yes | The ID of the ad to favorite/unfavorite |

**Success Response (200 OK) - Added:**
```json
{
  "favorited": true
}
```

**Success Response (200 OK) - Removed:**
```json
{
  "favorited": false
}
```

**Validation Error Response (422 Unprocessable Entity):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "ad_id": [
      "The selected ad id is invalid."
    ]
  }
}
```

---

## 2. Get My Favorites
**Endpoint:** `GET /favorites`
**Auth Required:** Yes (Bearer Token)
**Rate Limit:** 60/minute (General API Limit)
**Description:** Get a paginated list of the authenticated user's favorite ads.

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
      "user_id": 1,
      "category_id": 2,
      "title": "Toyota Camry 2020",
      "description": "Clean car...",
      "price": 25000,
      "currency": null,
      "address_text": "Sana'a",
      "lat": "15.35",
      "lng": "44.20",
      "status": "active",
      "is_featured": true,
      "views_count": 120,
      "expires_at": "2026-04-07T00:00:00.000000Z",
      "created_at": "2026-03-01T10:00:00.000000Z",
      "updated_at": "2026-03-07T12:00:00.000000Z",
      "deleted_at": null
    }
  ],
  "first_page_url": "http://haraj-maareb.test/api/v1/favorites?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": "http://haraj-maareb.test/api/v1/favorites?page=1",
  "next_page_url": null,
  "path": "http://haraj-maareb.test/api/v1/favorites",
  "per_page": 10,
  "prev_page_url": null,
  "to": 1,
  "total": 1
}
```

**Unauthorized Response (401 Unauthorized):**
```json
{
  "message": "Unauthenticated."
}
```
