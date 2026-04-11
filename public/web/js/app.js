/**
 * Haraj-Maareb - Main Application Logic (app.js)
 * ================================================
 * Core helpers: API requests, authentication, and UI utilities.
 * Auth endpoints are documented in auth.md.
 */

'use strict';

// --- API Base URL ---
const API_BASE_URL = 'http://haraj.test/api/v1';

// ============================================
// API Helper Object
// ============================================
const API = {
    /**
     * Send a POST request to the API.
     * Automatically includes Content-Type and Auth token if available.
     * @param {string} endpoint - API endpoint (e.g., '/login')
     * @param {object} data - Request body data
     * @returns {Promise<object>} Parsed JSON response
     */
    async post(endpoint, data) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // Attach Bearer token if user is logged in
        const token = AUTH.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data),
            });

            const result = await response.json();

            // Attach HTTP status to the result for error handling
            result._status = response.status;

            return result;
        } catch (error) {
            console.error(`API POST ${endpoint} Error:`, error);
            return {
                success: false,
                message: 'network_error',
                _status: 0,
            };
        }
    },

    /**
     * Send a GET request to the API.
     * Automatically includes Auth header if token exists.
     * @param {string} endpoint - API endpoint (e.g., '/me')
     * @returns {Promise<object>} Parsed JSON response
     */
    async get(endpoint) {
        const headers = {
            'Accept': 'application/json',
        };

        const token = AUTH.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: headers,
            });

            const result = await response.json();
            result._status = response.status;

            return result;
        } catch (error) {
            console.error(`API GET ${endpoint} Error:`, error);
            return {
                success: false,
                message: 'network_error',
                _status: 0,
            };
        }
    },

    /**
     * Send a DELETE request to the API.
     * @param {string} endpoint - API endpoint (e.g., '/comments/5')
     * @returns {Promise<object>} Parsed JSON response
     */
    async delete(endpoint) {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        const token = AUTH.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: headers,
            });

            const result = await response.json();
            result._status = response.status;

            return result;
        } catch (error) {
            console.error(`API DELETE ${endpoint} Error:`, error);
            return {
                success: false,
                message: 'network_error',
                _status: 0,
            };
        }
    },
};

// ============================================
// CATEGORIES - Global Categories Loader
// ============================================
const CATEGORIES = {
    CACHE_KEY: 'categories_cache',
    CACHE_TS_KEY: 'categories_cache_ts',
    CACHE_TTL: 60 * 60 * 1000, // 1 hour in ms

    /**
     * Load categories from cache or API.
     * GET /categories - See categories.md
     * @returns {Promise<Array>} List of category objects
     */
    async load() {
        // Check cache
        const cached = localStorage.getItem(this.CACHE_KEY);
        const cachedTs = localStorage.getItem(this.CACHE_TS_KEY);

        if (cached && cachedTs) {
            const age = Date.now() - parseInt(cachedTs, 10);
            if (age < this.CACHE_TTL) {
                try { return JSON.parse(cached); } catch (e) { /* fallthrough */ }
            }
        }

        // Fetch from API
        const result = await API.get('/categories');
        let categories = [];

        if (result.data) {
            categories = Array.isArray(result.data) ? result.data : (result.data.data || []);
        } else if (Array.isArray(result)) {
            categories = result;
        }

        // Save to cache
        if (categories && categories.length > 0) {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(categories));
            localStorage.setItem(this.CACHE_TS_KEY, String(Date.now()));
        }

        return categories;
    },

    /**
     * Populate a <select> element with category options.
     * Supports parent/child hierarchy via parent_id.
     * @param {string} selectId - The ID of the <select> element
     * @param {string} [defaultText] - Default option text (e.g., 'جميع الأقسام')
     * @param {string} [selectedValue] - Pre-select a value
     */
    async populate(selectId, defaultText = 'اختر القسم...', selectedValue = '') {
        const select = document.getElementById(selectId);
        if (!select) return;

        const categories = await this.load();

        // Clear existing options (keep first default)
        select.innerHTML = `<option value="">${defaultText}</option>`;

        // Separate parents and children
        const parents = categories.filter(c => !c.parent_id);
        const children = categories.filter(c => c.parent_id);

        parents.forEach(parent => {
            const opt = document.createElement('option');
            opt.value = parent.id;
            opt.textContent = parent.name || parent.name_ar || parent.name_en;
            if (String(parent.id) === String(selectedValue)) opt.selected = true;
            select.appendChild(opt);

            // Add children indented
            children.filter(c => c.parent_id === parent.id).forEach(child => {
                const childOpt = document.createElement('option');
                childOpt.value = child.id;
                childOpt.textContent = `-- ${child.name || child.name_ar || child.name_en}`;
                if (String(child.id) === String(selectedValue)) childOpt.selected = true;
                select.appendChild(childOpt);
            });
        });

        // Add orphan children (parent_id not matching any parent)
        const parentIds = new Set(parents.map(p => p.id));
        children.filter(c => !parentIds.has(c.parent_id)).forEach(child => {
            const opt = document.createElement('option');
            opt.value = child.id;
            opt.textContent = child.name || child.name_ar || child.name_en;
            if (String(child.id) === String(selectedValue)) opt.selected = true;
            select.appendChild(opt);
        });
    },
};

// ============================================
// SETTINGS - Global App Settings Loader
// ============================================
const SETTINGS = {
    CACHE_KEY: 'app_settings',
    CACHE_TS_KEY: 'app_settings_ts',
    CACHE_TTL: 60 * 60 * 1000, // 1 hour

    /**
     * Load settings from cache or API.
     * GET /settings - See settings.md
     * @returns {Promise<Array>} List of setting objects
     */
    async load() {
        // Check cache
        const cached = localStorage.getItem(this.CACHE_KEY);
        const cachedTs = localStorage.getItem(this.CACHE_TS_KEY);

        if (cached && cachedTs) {
            const age = Date.now() - parseInt(cachedTs, 10);
            if (age < this.CACHE_TTL) {
                try { return JSON.parse(cached); } catch (e) { /* fallthrough */ }
            }
        }

        // Fetch from API
        const result = await API.get('/settings');
        let settings = [];

        if (result.data) {
            settings = Array.isArray(result.data) ? result.data : (result.data.data || []);
        } else if (Array.isArray(result)) {
            settings = result;
        }

        // Save to cache
        if (settings && settings.length > 0) {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(settings));
            localStorage.setItem(this.CACHE_TS_KEY, String(Date.now()));
        }

        return settings;
    },

    /**
     * Get a setting value by key.
     * @param {string} key - Setting key (e.g., 'site_name')
     * @param {string} [fallback] - Default value if not found
     * @returns {string|null}
     */
    get(key, fallback = null) {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (!cached) return fallback;
            const settings = JSON.parse(cached);
            const item = settings.find(s => s.key === key);
            return item ? item.value : fallback;
        } catch (e) {
            return fallback;
        }
    },

    /**
     * Get all settings as a key-value map.
     * @returns {object}
     */
    getAll() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (!cached) return {};
            const settings = JSON.parse(cached);
            const map = {};
            settings.forEach(s => { map[s.key] = s.value; });
            return map;
        } catch (e) {
            return {};
        }
    },
};

// ============================================
// AUTH Object - Authentication State Management
// ============================================
const AUTH = {
    /**
     * Check if user is currently logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!localStorage.getItem('authToken');
    },

    /**
     * Get the stored auth token.
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Save auth token and optional user data to localStorage.
     * @param {string} token
     * @param {object} [user] - Optional user data
     */
    saveSession(token, user = null) {
        localStorage.setItem('authToken', token);
        if (user) {
            localStorage.setItem('authUser', JSON.stringify(user));
        }
    },

    /**
     * Get stored user data from localStorage.
     * @returns {object|null}
     */
    getUser() {
        const user = localStorage.getItem('authUser');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Clear all auth data and redirect to login page.
     */
    logout() {
        // Optionally call the logout endpoint to invalidate the token
        // See auth.md - Section 9: POST /logout
        const token = AUTH.getToken();
        if (token) {
            API.post('/logout', {}).catch(() => { });
        }

        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        window.location.href = '/web/login.html';
    },
};

// ============================================
// UI Helper Object
// ============================================
const UI = {
    /**
     * Show an alert message inside a container element.
     * @param {string} containerId - ID of the container element
     * @param {string} message - Alert message text
     * @param {string} [type='danger'] - Alert type ('danger', 'success', 'warning')
     */
    showAlert(containerId, message, type = 'danger') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-${type} alert-app" role="alert">
                <i class="bi bi-${type === 'danger' ? 'exclamation-triangle' : 'check-circle'}-fill me-2"></i>
                ${message}
            </div>
        `;

        // Auto-dismiss after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }
    },

    /**
     * Clear alerts from a container element.
     * @param {string} containerId
     */
    clearAlert(containerId) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
    },

    /**
     * Toggle loading state on a button.
     * @param {HTMLButtonElement} btn - The button element
     * @param {boolean} loading - Whether to show loading state
     * @param {string} [originalText] - Original button text to restore
     */
    toggleBtnLoading(btn, loading, originalText = '') {
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> جاري التحميل...`;
        } else {
            btn.disabled = false;
            btn.innerHTML = originalText || btn.dataset.originalText || 'إرسال';
        }
    },
};

// ============================================
// Navbar Auth State - Update navbar buttons based on login status
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Hero Search Form (Homepage)
    const heroSearchForm = document.getElementById('heroSearchForm');
    if (heroSearchForm) {
        heroSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('heroSearchInput').value.trim();
            if (query) {
                window.location.href = `/web/ads.html?search=${encodeURIComponent(query)}`;
            }
        });
    }

    // Load Recent Ads (Homepage)
    const recentAdsGrid = document.getElementById('homeRecentAdsGrid');
    if (recentAdsGrid) {
        API.get('/ads?sort=latest&per_page=8').then(result => {
            if (result.success && result.data && result.data.data) {
                const ads = result.data.data;
                if (ads.length === 0) {
                    recentAdsGrid.innerHTML = '<div class="col-12 text-center text-muted">لا توجد إعلانات حالياً</div>';
                    return;
                }
                
                recentAdsGrid.innerHTML = ads.map((ad, index) => {
                    const delay = index * 0.05;
                    const imgPath = ad.images && ad.images[0] ? ad.images[0].image_path : null;
                    const img = imgPath ? (imgPath.startsWith('http') ? imgPath : `/storage/${imgPath}`) : 'https://placehold.co/600x400/FFEDD5/F97316?text=بدون+صورة';
                    const priceStr = ad.price > 0 ? `${ad.price.toLocaleString('en-US')} ${ad.currency}` : 'على السوم';
                    const location = ad.location || 'غير محدد';
                    const timeAgo = ad.created_at ? new Date(ad.created_at).toLocaleDateString('ar-SA') : '';
                    
                    return `
                        <div class="col-12 col-sm-6 col-lg-3" style="animation: fadeInUp 0.5s ease forwards; animation-delay: ${delay}s; opacity: 0;">
                            <a href="/web/ad-details.html?id=${ad.id}" class="text-decoration-none">
                                <div class="ad-card h-100">
                                    <div class="ad-card-img">
                                        <img src="${img}" alt="${ad.title}" loading="lazy">
                                    </div>
                                    <div class="ad-card-body">
                                        <h6 class="ad-card-title text-dark">${ad.title}</h6>
                                        <div class="ad-card-price">${priceStr}</div>
                                        <div class="ad-card-meta text-muted" style="font-size: 0.8rem;">
                                            <span class="d-inline-block me-3"><i class="bi bi-geo-alt"></i> ${location}</span>
                                            <span class="d-inline-block"><i class="bi bi-clock"></i> ${timeAgo}</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    `;
                }).join('');
            } else {
                recentAdsGrid.innerHTML = '<div class="col-12 text-center text-danger">تعذر تحميل الإعلانات</div>';
            }
        }).catch(err => {
            recentAdsGrid.innerHTML = '<div class="col-12 text-center text-danger">تعذر تحميل الإعلانات</div>';
        });
    }

    const navAuthArea = document.getElementById('navAuthArea');
    if (navAuthArea) {
        if (AUTH.isLoggedIn()) {
            navAuthArea.innerHTML = `
                <div class="d-flex gap-3 align-items-center">
                    <a href="/web/post-ad.html" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-circle me-1"></i> أضف إعلان
                    </a>
                    
                    <!-- Notifications Bell -->
                    <a href="/web/notifications.html" class="position-relative text-dark text-decoration-none" id="navbarBellLink" title="الإشعارات">
                        <i class="bi bi-bell fs-5"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none" id="navbarNotificationBadge" style="font-size: 0.65rem;">
                            0
                        </span>
                    </a>

                    <!-- User Menu Dropdown -->
                    <div class="dropdown">
                        <button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle me-1"></i> حسابي
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="/web/profile.html"><i class="bi bi-person me-2"></i>الملف الشخصي</a></li>
                            <li><a class="dropdown-item" href="/web/profile.html"><i class="bi bi-megaphone me-2"></i>إعلاناتي</a></li>
                            <li><a class="dropdown-item" href="/web/favorites.html"><i class="bi bi-heart me-2"></i>المفضلة</a></li>
                            <li><a class="dropdown-item" href="/web/payments.html"><i class="bi bi-credit-card me-2"></i>الاشتراكات والمدفوعات</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" id="btnLogout"><i class="bi bi-box-arrow-right me-2"></i>تسجيل الخروج</a></li>
                        </ul>
                    </div>
                </div>
            `;

            // Bind logout
            const btnLogout = document.getElementById('btnLogout');
            if (btnLogout) {
                btnLogout.addEventListener('click', (e) => {
                    e.preventDefault();
                    AUTH.logout();
                });
            }

            // Fetch unread notifications count
            loadUnreadNotificationsCount();

        } else {
            navAuthArea.innerHTML = `
                <div class="d-flex gap-2">
                    <a href="/web/login.html" class="btn btn-outline-primary btn-sm">تسجيل الدخول</a>
                    <a href="/web/post-ad.html" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-circle me-1"></i> أضف إعلان
                    </a>
                </div>
            `;
        }
    }
});

/**
 * Fetch and update the unread notifications count in the navbar badge.
 */
async function loadUnreadNotificationsCount() {
    const badge = document.getElementById('navbarNotificationBadge');
    if (!badge) return;

    try {
        const result = await API.get('/notifications/unread-count');
        if (result && result.success && result.data && typeof result.data.count !== 'undefined') {
            const count = parseInt(result.data.count);
            if (count > 0) {
                badge.textContent = count > 99 ? '+99' : count;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        }
    } catch (err) {
        console.error('Failed to load notification count', err);
    }
}

// ============================================
// Error Message Translations
// ============================================
const ERROR_MESSAGES = {
    'network_error': 'خطأ في الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
    'login_failed': 'رقم الجوال أو كلمة المرور غير صحيحة.',
    'register_success': 'تم إنشاء الحساب بنجاح!',
    'otp_sent': 'تم إرسال كود التفعيل إلى جوالك.',
    'phone_verified': 'تم تأكيد رقم الجوال بنجاح!',
    'password_reset_success': 'تم تغيير كلمة المرور بنجاح.',
    'validation_error': 'يرجى التحقق من البيانات المدخلة.',
};

/**
 * Get a user-friendly error message.
 * @param {string} key - Message key from the API
 * @returns {string}
 */
function getErrorMessage(key) {
    return ERROR_MESSAGES[key] || key || 'حدث خطأ غير متوقع.';
}
