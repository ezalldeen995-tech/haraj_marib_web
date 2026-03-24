// test-config.js — Test dialog data: filter examples, query params, body examples
const TEST_CONFIG = {
  // ── Ads List: rich filter/sort/param options ──
  "ads-list": {
    queryParams: [
      { name: "category_id", label: "Category ID", defaultValue: "2", suggestions: ["1 — General", "2 — Cars", "3 — Electronics", "4 — Real Estate"], enabled: false },
      { name: "min_price", label: "Min Price", defaultValue: "1000", suggestions: ["500", "1000", "5000", "10000"], enabled: false },
      { name: "max_price", label: "Max Price", defaultValue: "50000", suggestions: ["10000", "25000", "50000", "100000"], enabled: false },
      { name: "address_text", label: "Address", defaultValue: "صنعاء", suggestions: ["صنعاء", "عدن", "تعز", "المكلا"], enabled: false },
      { name: "status", label: "Status", defaultValue: "active", suggestions: ["active", "pending", "rejected", "expired"], enabled: false },
      { name: "sort", label: "Sort By", defaultValue: "created_at", suggestions: ["created_at", "price"], enabled: false },
      { name: "page", label: "Page", defaultValue: "1", suggestions: ["1", "2", "3"], enabled: false }
    ],
    presets: [
      { name: "All Active Ads", params: {} },
      { name: "Cars Only", params: { category_id: "2" } },
      { name: "Price Range 5K-25K", params: { min_price: "5000", max_price: "25000" } },
      { name: "Sort by Price", params: { sort: "price" } },
      { name: "Sana'a Location", params: { address_text: "صنعاء" } },
      { name: "Full Filter", params: { category_id: "2", min_price: "1000", max_price: "50000", sort: "price", address_text: "صنعاء" } }
    ]
  },

  // ── Ads Show: path param ──
  "ads-show": {
    pathParams: [
      { name: "id", label: "Ad ID", defaultValue: "1", suggestions: ["1", "2", "5", "10"] }
    ]
  },

  // ── Ads Store: full body example ──
  "ads-store": {
    defaultBody: {
      title: "سيارة تويوتا كامري 2020",
      description: "سيارة نظيفة جدا، كيلومترات قليلة، مالك واحد، صيانة كاملة",
      price: 25000,
      category_id: 2,
      address_text: "صنعاء - شارع الستين",
      lat: 15.35,
      lng: 44.20,
      year: 2020
    },
    notes: "images[] must be sent as multipart/form-data file upload"
  },

  // ── Ads Update ──
  "ads-update": {
    pathParams: [
      { name: "id", label: "Ad ID", defaultValue: "1", suggestions: ["1", "2", "5"] }
    ],
    defaultBody: {
      title: "سيارة تويوتا كامري 2020 - محدث",
      description: "تم تحديث الوصف - سيارة نظيفة مع إطارات جديدة",
      price: 22000
    }
  },

  // ── Ads Delete ──
  "ads-delete": {
    pathParams: [
      { name: "id", label: "Ad ID", defaultValue: "1", suggestions: ["1", "2", "5"] }
    ]
  },

  // ── Ads Renew ──
  "ads-renew": {
    pathParams: [
      { name: "id", label: "Ad ID", defaultValue: "1", suggestions: ["1", "2", "5"] }
    ]
  },

  // ── Register ──
  "register": {
    defaultBody: {
      name: "محمد أحمد",
      phone: "771234567",
      password: "password123",
      password_confirmation: "password123"
    }
  },

  // ── Login ──
  "login": {
    defaultBody: {
      phone: "771234567",
      password: "password123"
    }
  },

  // ── OTP Request ──
  "otp-request": {
    defaultBody: { phone: "771234567" }
  },

  // ── OTP Verify ──
  "otp-verify": {
    defaultBody: { phone: "771234567", code: "123456" }
  },

  // ── Password Forgot ──
  "password-forgot": {
    defaultBody: { phone: "771234567" }
  },

  // ── Password Reset ──
  "password-reset": {
    defaultBody: {
      phone: "771234567",
      otp: "123456",
      new_password: "newpassword123",
      new_password_confirmation: "newpassword123"
    }
  },

  // ── Profile Update ──
  "profile-update": {
    defaultBody: {
      name: "أحمد محمد",
      email: "ahmed@example.com"
    }
  },

  // ── Profile Avatar ──
  "profile-avatar": {
    notes: "avatar must be sent as multipart/form-data file upload (image, max 2MB)"
  },

  // ── Profile Device Token ──
  "profile-token": {
    defaultBody: { device_token: "fMrV2x8BRJK:APA91bHexample..." }
  },

  // ── Chat Start ──
  "chat-start": {
    defaultBody: { ad_id: 1 }
  },

  // ── Chat Send ──
  "chat-send": {
    defaultBody: {
      conversation_id: 1,
      content: "مرحبا، هل السلعة لا تزال متاحة؟"
    }
  },

  // ── Chat Messages ──
  "chat-messages": {
    pathParams: [
      { name: "id", label: "Conversation ID", defaultValue: "1", suggestions: ["1", "2", "3"] }
    ]
  },

  // ── Payments Request ──
  "payments-request": {
    defaultBody: {
      amount: 5000,
      months: 3
    },
    notes: "receipt_image must be sent as multipart/form-data file upload"
  },

  // ── Comments Store ──
  "comments-store": {
    defaultBody: { ad_id: 1, content: "إعلان ممتاز!" }
  },

  // ── Comments Delete ──
  "comments-delete": {
    pathParams: [
      { name: "id", label: "Comment ID", defaultValue: "1", suggestions: ["1", "2", "3"] }
    ]
  },

  // ── Ratings Store ──
  "ratings-store": {
    defaultBody: { user_id: 3, rating: 4, comment: "بائع موثوق" }
  },

  // ── Favorites Toggle ──
  "favorites-toggle": {
    defaultBody: { ad_id: 1 }
  },

  // ── Favorites List ──
  "favorites-list": {
    queryParams: [
      { name: "page", label: "Page", defaultValue: "1", suggestions: ["1", "2", "3"], enabled: false }
    ]
  },

  // ── Block Toggle ──
  "block-toggle": {
    defaultBody: { user_id: 5 }
  },

  // ── Contact Store ──
  "contact-store": {
    defaultBody: {
      name: "أحمد",
      email: "ahmed@example.com",
      phone: "771234567",
      message: "لدي استفسار بخصوص..."
    }
  },

  // ── Admin Contact Messages ──
  "contact-list": {
    queryParams: [
      { name: "page", label: "Page", defaultValue: "1", suggestions: ["1", "2", "3"], enabled: false }
    ]
  },

  // ── Admin endpoints ──
  "admin-approve-payment": {
    pathParams: [
      { name: "id", label: "Payment ID", defaultValue: "1", suggestions: ["1", "2", "3"] }
    ]
  },
  "admin-reject-payment": {
    pathParams: [
      { name: "id", label: "Payment ID", defaultValue: "1", suggestions: ["1", "2", "3"] }
    ],
    defaultBody: { admin_notes: "صورة الإيصال غير واضحة" }
  },
  "admin-approve-ad": {
    pathParams: [
      { name: "id", label: "Ad ID", defaultValue: "1", suggestions: ["1", "2", "5"] }
    ]
  },
  "admin-reject-ad": {
    pathParams: [
      { name: "id", label: "Ad ID", defaultValue: "1", suggestions: ["1", "2", "5"] }
    ]
  },
  "admin-logs": {
    queryParams: [
      { name: "page", label: "Page", defaultValue: "1", suggestions: ["1", "2", "3"], enabled: false }
    ]
  },
  "admin-settings-update": {
    defaultBody: { key: "subscription_price", value: "6000" }
  },
};
