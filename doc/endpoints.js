// endpoints.js — Display data for all API endpoints
const API_ENDPOINTS = [
  // ─── AUTH ───
  {
    group: "Auth",
    id: "register",
    method: "POST",
    path: "/api/v1/register",
    summary: "Register a new user",
    auth: false,
    body: {
      name: { type: "string", required: true, nullable: false, example: "Mohammed Ali" },
      phone: { type: "string", required: true, nullable: false, example: "771234567", note: "Yemeni phone format" },
      password: { type: "string", required: true, nullable: false, example: "password123", note: "min 6 chars" },
      password_confirmation: { type: "string", required: true, nullable: false, example: "password123" }
    },
    responses: {
      success: { status: 201, body: { token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { phone: ["The phone has already been taken."], password: ["The password confirmation does not match."] } } }
    }
  },
  {
    group: "Auth",
    id: "login",
    method: "POST",
    path: "/api/v1/login",
    summary: "Login user and get JWT token",
    auth: false,
    body: {
      phone: { type: "string", required: true, nullable: false, example: "771234567" },
      password: { type: "string", required: true, nullable: false, example: "password123" }
    },
    responses: {
      success: { status: 200, body: { token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." } },
      error: { status: 401, body: { message: "Unauthorized" } }
    }
  },
  {
    group: "Auth",
    id: "logout",
    method: "POST",
    path: "/api/v1/logout",
    summary: "Logout and invalidate token",
    auth: true,
    body: null,
    responses: {
      success: { status: 200, body: { message: "Logged out successfully" } },
      error: { status: 401, body: { message: "Unauthenticated." } }
    }
  },
  {
    group: "Auth",
    id: "refresh",
    method: "POST",
    path: "/api/v1/refresh",
    summary: "Refresh JWT token",
    auth: true,
    body: null,
    responses: {
      success: { status: 200, body: { token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...new" } },
      error: { status: 401, body: { message: "Unauthenticated." } }
    }
  },
  {
    group: "Auth",
    id: "otp-request",
    method: "POST",
    path: "/api/v1/otp/request",
    summary: "Request OTP for phone verification",
    auth: false,
    body: {
      phone: { type: "string", required: true, nullable: false, example: "771234567", note: "Must exist in users" }
    },
    responses: {
      success: { status: 200, body: { message: "OTP sent" } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { phone: ["The selected phone is invalid."] } } }
    }
  },
  {
    group: "Auth",
    id: "otp-verify",
    method: "POST",
    path: "/api/v1/otp/verify",
    summary: "Verify OTP code",
    auth: false,
    body: {
      phone: { type: "string", required: true, nullable: false, example: "771234567" },
      code: { type: "string", required: true, nullable: false, example: "123456" }
    },
    responses: {
      success: { status: 200, body: { message: "Phone verified" } },
      error: { status: 400, body: { message: "Invalid or expired code" } }
    }
  },
  {
    group: "Auth",
    id: "password-forgot",
    method: "POST",
    path: "/api/v1/password/forgot",
    summary: "Send OTP for password reset",
    auth: false,
    body: {
      phone: { type: "string", required: true, nullable: false, example: "771234567" }
    },
    responses: {
      success: { status: 200, body: { message: "OTP sent to your phone" } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { phone: ["The selected phone is invalid."] } } }
    }
  },
  {
    group: "Auth",
    id: "password-reset",
    method: "POST",
    path: "/api/v1/password/reset",
    summary: "Reset password using OTP",
    auth: false,
    body: {
      phone: { type: "string", required: true, nullable: false, example: "771234567" },
      otp: { type: "string", required: true, nullable: false, example: "123456" },
      new_password: { type: "string", required: true, nullable: false, example: "newpassword123", note: "min 6 chars" },
      new_password_confirmation: { type: "string", required: true, nullable: false, example: "newpassword123" }
    },
    responses: {
      success: { status: 200, body: { message: "Password reset successfully" } },
      error: { status: 400, body: { message: "Invalid or expired OTP" } }
    }
  },

  // ─── USER PROFILE ───
  {
    group: "User Profile",
    id: "profile",
    method: "GET",
    path: "/api/v1/profile",
    summary: "Get authenticated user profile with stats",
    auth: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          user: {
            id: 1,
            name: "Mohammed Ali",
            phone: "771***567",
            avatar_url: "https://example.com/storage/avatars/abc123.jpg | null",
            rating: 4.5,
            subscription_status: true
          },
          active_ads_count: 5,
          rating_avg: 4.5
        }
      },
      error: { status: 401, body: { message: "Unauthenticated." } }
    },
    nullableFields: ["user.avatar_url — null if no avatar uploaded"]
  },
  {
    group: "User Profile",
    id: "profile-update",
    method: "POST",
    path: "/api/v1/profile/update",
    summary: "Update basic profile fields",
    auth: true,
    body: {
      name: { type: "string", required: false, nullable: false, example: "Ahmed Mohammed", note: "sometimes|required" },
      email: { type: "string", required: false, nullable: false, example: "user@example.com", note: "sometimes|email|unique" }
    },
    responses: {
      success: {
        status: 200,
        body: { id: 1, name: "Ahmed Mohammed", phone: "771234567", email: "user@example.com", avatar: "avatars/abc.jpg", role: "user", lang: "ar", bio: null, subscription_ends_at: "2026-04-07T00:00:00.000000Z", created_at: "2026-01-01T00:00:00.000000Z", updated_at: "2026-03-07T12:00:00.000000Z" }
      },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { email: ["The email has already been taken."] } } }
    },
    nullableFields: ["email — nullable in DB", "bio — nullable", "avatar — nullable", "subscription_ends_at — null if no active subscription"]
  },
  {
    group: "User Profile",
    id: "profile-avatar",
    method: "POST",
    path: "/api/v1/profile/avatar",
    summary: "Upload/change avatar image",
    auth: true,
    contentType: "multipart/form-data",
    body: {
      avatar: { type: "file", required: true, nullable: false, example: "(image file)", note: "image|max:2048 KB, jpeg/png/jpg" }
    },
    responses: {
      success: { status: 200, body: { avatar: "avatars/resized_abc123.jpg" } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { avatar: ["The avatar must be an image."] } } }
    }
  },
  {
    group: "User Profile",
    id: "profile-token",
    method: "POST",
    path: "/api/v1/profile/token",
    summary: "Update device token for push notifications",
    auth: true,
    body: {
      device_token: { type: "string", required: true, nullable: false, example: "fMrV2x8BRJK:APA91bH..." }
    },
    responses: {
      success: { status: 200, body: { device_token: "fMrV2x8BRJK:APA91bH..." } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { device_token: ["The device token field is required."] } } }
    }
  },
  {
    group: "User Profile",
    id: "profile-delete",
    method: "DELETE",
    path: "/api/v1/profile/delete",
    summary: "Delete authenticated user account (soft delete)",
    auth: true,
    body: null,
    responses: {
      success: { status: 200, body: { message: "Account deleted" } },
      error: { status: 401, body: { message: "Unauthenticated." } }
    }
  },

  // ─── ADS ───
  {
    group: "Ads",
    id: "ads-list",
    method: "GET",
    path: "/api/v1/ads",
    summary: "List ads with filters and pagination",
    auth: false,
    body: null,
    params: ["category_id", "min_price", "max_price", "address_text", "status", "sort"],
    responses: {
      success: {
        status: 200,
        body: {
          data: [
            {
              id: 1,
              title: "Toyota Camry 2020",
              description: "Clean car, low mileage, single owner...",
              price: 25000,
              formatted_price: "25,000.00 SAR",
              location: "Sana'a, Main Street",
              images: ["https://example.com/storage/ads/img1.jpg", "https://example.com/storage/ads/img2.jpg"],
              user: { id: 1, name: "Mohammed Ali", phone: "771***567", avatar_url: "https://example.com/storage/avatars/abc.jpg", rating: 4.5, subscription_status: true },
              category: { id: 2, name: "Cars", icon: "car-icon", parent_id: null, is_active: 1 },
              is_favorited: false,
              created_at_diff: "2 hours ago"
            }
          ],
          links: { first: "...?page=1", last: "...?page=5", prev: null, next: "...?page=2" },
          meta: { current_page: 1, last_page: 5, per_page: 10, total: 50 }
        }
      },
      error: { status: 200, body: { data: [], links: {}, meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } } }
    },
    nullableFields: [
      "user.avatar_url — null if user has no avatar",
      "category.parent_id — null if top-level category",
      "links.prev — null on first page",
      "links.next — null on last page"
    ]
  },
  {
    group: "Ads",
    id: "ads-show",
    method: "GET",
    path: "/api/v1/ads/{id}",
    summary: "Show a specific ad with all relations (increments views)",
    auth: false,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          data: {
            id: 1,
            title: "Toyota Camry 2020",
            description: "Clean car, low mileage, single owner, full service history.",
            price: 25000,
            formatted_price: "25,000.00 SAR",
            location: "Sana'a, Main Street",
            images: ["https://example.com/storage/ads/img1.jpg"],
            user: { id: 1, name: "Mohammed Ali", phone: "771***567", avatar_url: null, rating: 4.5, subscription_status: true },
            category: { id: 2, name: "Cars", icon: "car-icon", parent_id: null, is_active: 1 },
            is_favorited: false,
            created_at_diff: "2 hours ago"
          }
        }
      },
      error: { status: 404, body: { message: "No query results for model [App\\Models\\Ad] 999" } }
    },
    nullableFields: ["user.avatar_url — null if no avatar", "category.parent_id — null if top-level"]
  },
  {
    group: "Ads",
    id: "ads-store",
    method: "POST",
    path: "/api/v1/ads",
    summary: "Create a new ad (free users limited to 3/day)",
    auth: true,
    contentType: "multipart/form-data",
    body: {
      title: { type: "string", required: true, nullable: false, example: "Honda Civic 2019", note: "max:255, no profanity" },
      description: { type: "string", required: true, nullable: false, example: "Great condition, low mileage, new tires installed", note: "min:10, no profanity" },
      price: { type: "number", required: true, nullable: false, example: 18000, note: "min:100" },
      category_id: { type: "integer", required: true, nullable: false, example: 2 },
      address_text: { type: "string", required: true, nullable: false, example: "Aden, Al-Mansoora" },
      lat: { type: "number", required: false, nullable: true, example: 13.0, note: "between:12,19" },
      lng: { type: "number", required: false, nullable: true, example: 45.0, note: "between:42,54" },
      year: { type: "integer", required: false, nullable: true, example: 2019 },
      "images[]": { type: "file[]", required: true, nullable: false, example: "(array of image files)", note: "max 5 images, each jpeg/png/jpg max 2048KB" }
    },
    responses: {
      success: {
        status: 201,
        body: {
          message: "Ad created successfully",
          ad: {
            id: 10,
            title: "Honda Civic 2019",
            description: "Great condition, low mileage, new tires installed",
            price: 18000,
            formatted_price: "18,000.00 SAR",
            location: "Aden, Al-Mansoora",
            images: ["https://example.com/storage/ads/resized_abc.jpg"],
            user: { id: 1, name: "Mohammed Ali", phone: "771***567", avatar_url: null, rating: 4.5, subscription_status: false },
            category: { id: 2, name: "Cars", icon: "car-icon", parent_id: null, is_active: 1 },
            is_favorited: false,
            created_at_diff: "just now"
          }
        }
      },
      error: { status: 403, body: { message: "Daily limit reached for free users. Please subscribe." } }
    },
    nullableFields: ["lat — optional", "lng — optional", "year — optional", "user.avatar_url — null if no avatar"]
  },
  {
    group: "Ads",
    id: "ads-update",
    method: "PUT",
    path: "/api/v1/ads/{id}",
    summary: "Update an existing ad (owner only)",
    auth: true,
    body: {
      title: { type: "string", required: false, nullable: false, example: "Updated Title", note: "sometimes|max:255" },
      description: { type: "string", required: false, nullable: false, example: "Updated description text here", note: "sometimes|min:10" },
      price: { type: "number", required: false, nullable: false, example: 20000, note: "sometimes|min:0" },
      category_id: { type: "integer", required: false, nullable: false, example: 3 },
      address_text: { type: "string", required: false, nullable: false, example: "Taiz, City Center" }
    },
    responses: {
      success: {
        status: 200,
        body: {
          message: "Ad updated",
          ad: { id: 10, title: "Updated Title", description: "Updated description text here", price: 20000, formatted_price: "20,000.00 SAR", location: "Taiz, City Center", images: [], user: { id: 1, name: "Mohammed", phone: "771***567", avatar_url: null, rating: 4.5, subscription_status: true }, category: { id: 3, name: "Electronics", icon: "elec-icon", parent_id: null, is_active: 1 }, is_favorited: false, created_at_diff: "3 days ago" }
        }
      },
      error: { status: 403, body: { message: "This action is unauthorized." } }
    }
  },
  {
    group: "Ads",
    id: "ads-delete",
    method: "DELETE",
    path: "/api/v1/ads/{id}",
    summary: "Delete an ad (soft delete, owner only)",
    auth: true,
    body: null,
    responses: {
      success: { status: 200, body: { message: "Ad deleted" } },
      error: { status: 403, body: { message: "This action is unauthorized." } }
    }
  },
  {
    group: "Ads",
    id: "ads-renew",
    method: "POST",
    path: "/api/v1/ads/{id}/renew",
    summary: "Renew an ad (extend expiry by 30 days, reactivate)",
    auth: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          message: "Ad renewed successfully",
          ad: { id: 10, title: "Honda Civic 2019", description: "...", price: 18000, formatted_price: "18,000.00 SAR", location: "Aden", images: [], user: { id: 1, name: "Mohammed", phone: "771***567", avatar_url: null, rating: 4.5, subscription_status: false }, category: { id: 2, name: "Cars", icon: "car-icon", parent_id: null, is_active: 1 }, is_favorited: false, created_at_diff: "5 days ago" }
        }
      },
      error: { status: 403, body: { message: "This action is unauthorized." } }
    }
  },

  // ─── CHAT ───
  {
    group: "Chat",
    id: "chat-start",
    method: "POST",
    path: "/api/v1/chat/start",
    summary: "Start or get existing conversation for an ad",
    auth: true,
    body: {
      ad_id: { type: "integer", required: true, nullable: false, example: 1 }
    },
    responses: {
      success: {
        status: 200,
        body: {
          id: 1,
          ad_id: 1,
          buyer_id: 2,
          seller_id: 1,
          created_at: "2026-03-01T10:00:00.000000Z",
          updated_at: "2026-03-07T12:00:00.000000Z",
          messages: [
            { id: 1, conversation_id: 1, sender_id: 2, content: "Is this still available?", is_read: true, created_at: "2026-03-01T10:05:00.000000Z" },
            { id: 2, conversation_id: 1, sender_id: 1, content: "Yes, it is!", is_read: false, created_at: "2026-03-01T10:10:00.000000Z" }
          ]
        }
      },
      error_self: { status: 400, body: { message: "You cannot start a conversation with yourself" } },
      error_blocked: { status: 403, body: { message: "You cannot interact with this user" } }
    }
  },
  {
    group: "Chat",
    id: "chat-send",
    method: "POST",
    path: "/api/v1/chat/send",
    summary: "Send a message in a conversation (rate limited: 12/min)",
    auth: true,
    body: {
      conversation_id: { type: "integer", required: true, nullable: false, example: 1 },
      content: { type: "string", required: true, nullable: false, example: "Hello, is this item available?", note: "max:1000" }
    },
    responses: {
      success: {
        status: 201,
        body: { data: { id: 5, content: "Hello, is this item available?", sender_id: 2, is_me: true, time_diff: "just now" } }
      },
      error_blocked: { status: 403, body: { message: "You cannot interact with this user" } },
      error_throttle: { status: 429, body: { message: "Too Many Attempts." } }
    }
  },
  {
    group: "Chat",
    id: "chats-list",
    method: "GET",
    path: "/api/v1/chats",
    summary: "Get all conversations for authenticated user",
    auth: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          data: [
            {
              id: 1,
              ad: { id: 1, title: "Toyota Camry", description: "...", price: 25000, formatted_price: "25,000.00 SAR", location: "Sana'a", images: ["https://example.com/storage/ads/img1.jpg"], user: { id: 1, name: "Owner", phone: "771***567", avatar_url: null, rating: 4.0, subscription_status: true }, category: { id: 2, name: "Cars", icon: "car", parent_id: null, is_active: 1 }, is_favorited: false, created_at_diff: "1 week ago" },
              other_user: { id: 2, name: "Buyer Name", phone: "772***890", avatar_url: "https://example.com/storage/avatars/buyer.jpg", rating: 3.5, subscription_status: false },
              last_message: { id: 5, content: "Is it available?", sender_id: 2, is_me: false, time_diff: "2 hours ago" },
              unread_count: 2
            }
          ]
        }
      },
      error: { status: 401, body: { message: "Unauthenticated." } }
    },
    nullableFields: ["last_message — null if no messages yet", "other_user.avatar_url — null if no avatar"]
  },
  {
    group: "Chat",
    id: "chat-messages",
    method: "GET",
    path: "/api/v1/chats/{id}/messages",
    summary: "Get messages for a conversation (marks incoming as read)",
    auth: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          data: [
            { id: 1, content: "Is this still available?", sender_id: 2, is_me: false, time_diff: "3 hours ago" },
            { id: 2, content: "Yes it is!", sender_id: 1, is_me: true, time_diff: "2 hours ago" }
          ]
        }
      },
      error_blocked: { status: 403, body: { message: "You cannot interact with this user" } }
    }
  },

  // ─── PAYMENTS ───
  {
    group: "Payments",
    id: "payments-request",
    method: "POST",
    path: "/api/v1/payments/request",
    summary: "Request subscription by uploading payment receipt",
    auth: true,
    contentType: "multipart/form-data",
    body: {
      receipt_image: { type: "file", required: true, nullable: false, example: "(receipt image file)", note: "image|jpeg,png,jpg|max:4096KB" },
      amount: { type: "number", required: true, nullable: false, example: 5000 },
      months: { type: "integer", required: true, nullable: false, example: 3, note: "Allowed: 1, 3, 6, 12" }
    },
    responses: {
      success: { status: 200, body: { message: "Payment request submitted successfully" } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { months: ["The selected months is invalid."] } } }
    }
  },
  {
    group: "Payments",
    id: "payments-list",
    method: "GET",
    path: "/api/v1/payments",
    summary: "Get my payment history",
    auth: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: [
          { id: 1, user_id: 1, receipt_image: "payments/receipt1.jpg", amount: 5000, status: "approved", type: "subscription", admin_notes: null, months: 3, created_at: "2026-01-15T10:00:00.000000Z", updated_at: "2026-01-16T08:00:00.000000Z" },
          { id: 2, user_id: 1, receipt_image: "payments/receipt2.jpg", amount: 2000, status: "pending", type: "subscription", admin_notes: null, months: 1, created_at: "2026-03-01T10:00:00.000000Z", updated_at: "2026-03-01T10:00:00.000000Z" }
        ]
      },
      error: { status: 401, body: { message: "Unauthenticated." } }
    },
    nullableFields: ["admin_notes — null unless admin added notes (on rejection)"]
  },

  // ─── COMMENTS ───
  {
    group: "Comments",
    id: "comments-store",
    method: "POST",
    path: "/api/v1/comments",
    summary: "Add a comment on an ad",
    auth: true,
    body: {
      ad_id: { type: "integer", required: true, nullable: false, example: 1 },
      content: { type: "string", required: true, nullable: false, example: "Great deal!" }
    },
    responses: {
      success: { status: 200, body: { id: 1, ad_id: 1, user_id: 2, content: "Great deal!", created_at: "2026-03-07T12:00:00.000000Z", updated_at: "2026-03-07T12:00:00.000000Z" } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { ad_id: ["The selected ad id is invalid."] } } }
    }
  },
  {
    group: "Comments",
    id: "comments-delete",
    method: "DELETE",
    path: "/api/v1/comments/{id}",
    summary: "Delete a comment (own comments only)",
    auth: true,
    body: null,
    responses: {
      success: { status: 200, body: { message: "Comment deleted" } },
      error: { status: 403, body: { message: "Unauthorized" } }
    }
  },

  // ─── RATINGS ───
  {
    group: "Ratings",
    id: "ratings-store",
    method: "POST",
    path: "/api/v1/ratings",
    summary: "Rate a user (1-5 stars, updates if already rated)",
    auth: true,
    body: {
      user_id: { type: "integer", required: true, nullable: false, example: 3 },
      rating: { type: "integer", required: true, nullable: false, example: 4, note: "min:1, max:5" },
      comment: { type: "string", required: false, nullable: true, example: "Very reliable seller" }
    },
    responses: {
      success: { status: 200, body: { rating: { id: 1, user_id: 3, rater_id: 1, rating: 4, comment: "Very reliable seller", created_at: "2026-03-07T12:00:00.000000Z", updated_at: "2026-03-07T12:00:00.000000Z" }, average: 4.25 } },
      error_self: { status: 400, body: { message: "Cannot rate yourself" } }
    },
    nullableFields: ["comment — nullable, optional text"]
  },

  // ─── FAVORITES ───
  {
    group: "Favorites",
    id: "favorites-toggle",
    method: "POST",
    path: "/api/v1/favorites/toggle",
    summary: "Toggle favorite on an ad (add/remove)",
    auth: true,
    body: {
      ad_id: { type: "integer", required: true, nullable: false, example: 1 }
    },
    responses: {
      success_added: { status: 200, body: { favorited: true } },
      success_removed: { status: 200, body: { favorited: false } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { ad_id: ["The selected ad id is invalid."] } } }
    }
  },
  {
    group: "Favorites",
    id: "favorites-list",
    method: "GET",
    path: "/api/v1/favorites",
    summary: "Get my favorite ads (paginated)",
    auth: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          current_page: 1,
          data: [
            { id: 1, user_id: 1, category_id: 2, title: "Toyota Camry 2020", description: "Clean car...", price: 25000, currency: null, address_text: "Sana'a", lat: "15.35", lng: "44.20", status: "active", is_featured: true, views_count: 120, expires_at: "2026-04-07T00:00:00.000000Z", created_at: "2026-03-01T10:00:00.000000Z", updated_at: "2026-03-07T12:00:00.000000Z", deleted_at: null }
          ],
          per_page: 10,
          total: 3
        }
      },
      error: { status: 401, body: { message: "Unauthenticated." } }
    },
    nullableFields: ["currency — nullable", "lat — nullable", "lng — nullable", "deleted_at — null unless soft-deleted"]
  },

  // ─── BLOCKS ───
  {
    group: "Blocks",
    id: "block-toggle",
    method: "POST",
    path: "/api/v1/block/toggle",
    summary: "Toggle block on a user (block/unblock)",
    auth: true,
    body: {
      user_id: { type: "integer", required: true, nullable: false, example: 5 }
    },
    responses: {
      success_blocked: { status: 200, body: { blocked: true } },
      success_unblocked: { status: 200, body: { blocked: false } },
      error_self: { status: 400, body: { message: "Cannot block yourself" } }
    }
  },

  // ─── CONTACT ───
  {
    group: "Contact",
    id: "contact-store",
    method: "POST",
    path: "/api/v1/contact",
    summary: "Send a contact message",
    auth: true,
    body: {
      name: { type: "string", required: true, nullable: false, example: "Ahmed" },
      email: { type: "string", required: false, nullable: true, example: "ahmed@example.com" },
      phone: { type: "string", required: false, nullable: true, example: "771234567" },
      message: { type: "string", required: true, nullable: false, example: "I have a question about..." }
    },
    responses: {
      success: { status: 201, body: { message: "Message received" } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { name: ["The name field is required."] } } }
    },
    nullableFields: ["email — optional/nullable", "phone — optional/nullable"]
  },
  {
    group: "Contact",
    id: "contact-list",
    method: "GET",
    path: "/api/v1/admin/contact-messages",
    summary: "List all contact messages (admin/auth required)",
    auth: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          current_page: 1,
          data: [
            { id: 1, name: "Ahmed", email: "ahmed@example.com", phone: null, message: "I have a question...", created_at: "2026-03-07T12:00:00.000000Z", updated_at: "2026-03-07T12:00:00.000000Z" }
          ],
          per_page: 20,
          total: 5
        }
      },
      error: { status: 401, body: { message: "Unauthenticated." } }
    },
    nullableFields: ["email — nullable", "phone — nullable"]
  },

  // ─── ADMIN ───
  {
    group: "Admin",
    id: "admin-pending-payments",
    method: "GET",
    path: "/api/v1/admin/payments/pending",
    summary: "List pending payment requests (admin only)",
    auth: true,
    adminOnly: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: [
          { id: 1, user_id: 2, receipt_image: "payments/receipt1.jpg", amount: 5000, status: "pending", type: "subscription", admin_notes: null, months: 3, created_at: "2026-03-01T10:00:00.000000Z", updated_at: "2026-03-01T10:00:00.000000Z", user: { id: 2, name: "Ahmed", phone: "772345678", email: null, avatar: null, role: "user", lang: "ar", bio: null, subscription_ends_at: null } }
        ]
      },
      error: { status: 403, body: { message: "Unauthorized" } }
    },
    nullableFields: ["admin_notes — null", "user.email — nullable", "user.avatar — nullable", "user.bio — nullable", "user.subscription_ends_at — null if never subscribed"]
  },
  {
    group: "Admin",
    id: "admin-approve-payment",
    method: "POST",
    path: "/api/v1/admin/payments/{id}/approve",
    summary: "Approve a pending payment and activate subscription",
    auth: true,
    adminOnly: true,
    body: null,
    responses: {
      success: { status: 200, body: { message: "Payment approved" } },
      error_status: { status: 400, body: { message: "Invalid payment status" } }
    }
  },
  {
    group: "Admin",
    id: "admin-reject-payment",
    method: "POST",
    path: "/api/v1/admin/payments/{id}/reject",
    summary: "Reject a payment request",
    auth: true,
    adminOnly: true,
    body: {
      admin_notes: { type: "string", required: false, nullable: true, example: "Receipt image is unclear, please resubmit" }
    },
    responses: {
      success: { status: 200, body: { message: "Payment rejected" } },
      error: { status: 404, body: { message: "No query results for model [App\\Models\\Payment] 999" } }
    },
    nullableFields: ["admin_notes — nullable"]
  },
  {
    group: "Admin",
    id: "admin-approve-ad",
    method: "POST",
    path: "/api/v1/admin/ads/{id}/approve",
    summary: "Approve a pending ad",
    auth: true,
    adminOnly: true,
    body: null,
    responses: {
      success: { status: 200, body: { message: "Ad approved" } },
      error: { status: 404, body: { message: "No query results for model [App\\Models\\Ad] 999" } }
    }
  },
  {
    group: "Admin",
    id: "admin-reject-ad",
    method: "POST",
    path: "/api/v1/admin/ads/{id}/reject",
    summary: "Reject an ad",
    auth: true,
    adminOnly: true,
    body: null,
    responses: {
      success: { status: 200, body: { message: "Ad rejected" } },
      error: { status: 404, body: { message: "No query results for model [App\\Models\\Ad] 999" } }
    }
  },
  {
    group: "Admin",
    id: "admin-logs",
    method: "GET",
    path: "/api/v1/admin/logs",
    summary: "View activity logs (paginated)",
    auth: true,
    adminOnly: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          current_page: 1,
          data: [
            { id: 1, user_id: 1, action: "login", description: "User logged in", ip_address: "192.168.1.1", created_at: "2026-03-07T12:00:00.000000Z", updated_at: "2026-03-07T12:00:00.000000Z", user: { id: 1, name: "Admin", phone: "770000000", email: "admin@example.com", role: "admin" } }
          ],
          per_page: 20, total: 100
        }
      },
      error: { status: 403, body: { message: "Unauthorized" } }
    }
  },
  {
    group: "Admin",
    id: "admin-settings-get",
    method: "GET",
    path: "/api/v1/admin/settings",
    summary: "Get all application settings",
    auth: true,
    adminOnly: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: [
          { id: 1, key: "app_name", value: "Haraj Maareb", created_at: "2026-01-01T00:00:00.000000Z", updated_at: "2026-01-01T00:00:00.000000Z" },
          { id: 2, key: "subscription_price", value: "5000", created_at: "2026-01-01T00:00:00.000000Z", updated_at: "2026-02-15T00:00:00.000000Z" }
        ]
      },
      error: { status: 403, body: { message: "Unauthorized" } }
    }
  },
  {
    group: "Admin",
    id: "admin-settings-update",
    method: "POST",
    path: "/api/v1/admin/settings",
    summary: "Update an application setting",
    auth: true,
    adminOnly: true,
    body: {
      key: { type: "string", required: true, nullable: false, example: "subscription_price" },
      value: { type: "any", required: false, nullable: true, example: "6000" }
    },
    responses: {
      success: { status: 200, body: { message: "Setting updated" } },
      error: { status: 422, body: { message: "The given data was invalid.", errors: { key: ["The key field is required."] } } }
    },
    nullableFields: ["value — nullable"]
  },
  {
    group: "Admin",
    id: "admin-dashboard-stats",
    method: "GET",
    path: "/api/v1/admin/dashboard/stats",
    summary: "Get dashboard statistics",
    auth: true,
    adminOnly: true,
    body: null,
    responses: {
      success: {
        status: 200,
        body: {
          users_this_month: 45,
          ads: { active: 120, pending: 15 },
          payments: { revenue: 250000.00 }
        }
      },
      error: { status: 403, body: { message: "Unauthorized" } }
    }
  }
];
