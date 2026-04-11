/**
 * Haraj-Maareb - Ads Logic (ads.js)
 * ================================================
 * Handles Ads listing, filtering, Ad details, and Post Ad form.
 * Ad endpoints are documented in ad.md.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

// ============================================
// ADS LIST PAGE
// ============================================
const ADS_PAGE = {
    currentPage: 1,
    lastPage: 1,
    currentSort: 'newest',
    currentView: 'grid',

    /**
     * Initialize the ads list page.
     */
    init() {
        this.bindEvents();

        // Populate category filter dynamically
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category_id') || '';
        CATEGORIES.populate('categoryFilter', 'جميع الأقسام', categoryFromUrl);

        this.loadAds();
    },

    /**
     * Bind filter, sort, pagination, and view toggle events.
     */
    bindEvents() {
        // Search
        const searchBtn = document.getElementById('btnSearch');
        const searchInput = document.getElementById('searchInput');
        if (searchBtn) searchBtn.addEventListener('click', () => this.loadAds(1));
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.loadAds(1);
            });
        }

        // Sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadAds(1);
            });
        }

        // View toggle
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Price filter
        const priceFilterBtn = document.getElementById('btnApplyPrice');
        if (priceFilterBtn) priceFilterBtn.addEventListener('click', () => this.loadAds(1));

        // Category filter
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => this.loadAds(1));
        }
    },

    /**
     * Build query string from current filters.
     */
    buildQueryParams(page) {
        const params = new URLSearchParams();
        params.set('page', page);

        const search = document.getElementById('searchInput')?.value.trim();
        if (search) params.set('search', search);

        const category = document.getElementById('categoryFilter')?.value;
        if (category) params.set('category_id', category);

        const minPrice = document.getElementById('minPrice')?.value;
        const maxPrice = document.getElementById('maxPrice')?.value;
        if (minPrice) params.set('min_price', minPrice);
        if (maxPrice) params.set('max_price', maxPrice);

        // Sort mapping
        if (this.currentSort === 'newest') params.set('sort', 'latest');
        else if (this.currentSort === 'oldest') params.set('sort', 'oldest');
        else if (this.currentSort === 'price_asc') params.set('sort', 'price_asc');
        else if (this.currentSort === 'price_desc') params.set('sort', 'price_desc');

        return params.toString();
    },

    /**
     * Fetch and render ads list.
     * GET /ads - See ad.md Section 1
     */
    async loadAds(page = 1) {
        this.currentPage = page;
        const adsGrid = document.getElementById('adsGrid');
        const paginationArea = document.getElementById('paginationArea');
        if (!adsGrid) return;

        // Show loading skeleton
        adsGrid.innerHTML = this.renderSkeletons(6);

        const query = this.buildQueryParams(page);
        const result = await API.get(`/ads?${query}`);

        if (result.success && result.data) {
            let ads = result.data.data || result.data;
            if (!Array.isArray(ads)) ads = [];

            this.lastPage = result.data.last_page || 1;
            this.currentPage = result.data.current_page || 1;

            if (ads.length === 0) {
                adsGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-inbox" style="font-size: 4rem; color: var(--text-secondary); opacity: 0.4;"></i>
                        <h5 class="mt-3" style="color: var(--text-secondary);">لا توجد إعلانات</h5>
                        <p class="text-muted">جرّب تغيير معايير البحث أو الفلترة</p>
                    </div>
                `;
            } else {
                adsGrid.innerHTML = ads.map(ad => this.renderAdCard(ad)).join('');
            }

            // Render pagination
            if (paginationArea) {
                paginationArea.innerHTML = this.renderPagination();
            }

            // Update result count
            const resultCount = document.getElementById('resultCount');
            if (resultCount) {
                const total = result.data.total || ads.length;
                resultCount.textContent = `${total} إعلان`;
            }
        } else {
            adsGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: var(--primary);"></i>
                    <h5 class="mt-3">حدث خطأ في تحميل الإعلانات</h5>
                    <button class="btn btn-primary btn-sm mt-2" onclick="ADS_PAGE.loadAds()">إعادة المحاولة</button>
                </div>
            `;
        }
    },

    /**
     * Render a single ad card.
     */
    renderAdCard(ad) {
        const image = ad.images && ad.images.length > 0
            ? `/storage/${ad.images[0].image_path}`
            : 'https://placehold.co/400x250/FFEDD5/F97316?text=لا+توجد+صورة';
        const price = Number(ad.price).toLocaleString('ar-YE');
        const date = ad.created_at ? new Date(ad.created_at).toLocaleDateString('ar-YE') : '';
        const isFeatured = ad.is_featured ? '<span class="ad-badge-featured"><i class="bi bi-star-fill"></i> مميز</span>' : '';

        if (this.currentView === 'list') {
            return `
                <div class="col-12 mb-3 ad-card-animate">
                    <div class="ad-card ad-card-list d-flex">
                        <div class="ad-card-img-list">
                            <img src="${image}" alt="${ad.title}" loading="lazy">
                            ${isFeatured}
                        </div>
                        <div class="ad-card-body flex-grow-1 p-3">
                            <h5 class="ad-card-title">${ad.title}</h5>
                            <div class="ad-card-price">${price} ر.ي</div>
                            <div class="ad-card-meta">
                                <span><i class="bi bi-geo-alt"></i> ${ad.address_text || 'اليمن'}</span>
                                <span><i class="bi bi-clock"></i> ${date}</span>
                                <span><i class="bi bi-eye"></i> ${ad.views_count || 0}</span>
                            </div>
                            <a href="ad-details.html?id=${ad.id}" class="btn btn-outline-primary btn-sm mt-2">عرض التفاصيل</a>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="col-md-6 col-lg-4 mb-4 ad-card-animate">
                <div class="ad-card">
                    <div class="ad-card-img">
                        <img src="${image}" alt="${ad.title}" loading="lazy">
                        ${isFeatured}
                    </div>
                    <div class="ad-card-body">
                        <h5 class="ad-card-title">${ad.title}</h5>
                        <div class="ad-card-price">${price} ر.ي</div>
                        <div class="ad-card-meta">
                            <span><i class="bi bi-geo-alt"></i> ${ad.address_text || 'اليمن'}</span>
                            <span><i class="bi bi-clock"></i> ${date}</span>
                        </div>
                    </div>
                    <div class="ad-card-footer">
                        <a href="ad-details.html?id=${ad.id}" class="btn btn-outline-primary btn-sm w-100">
                            <i class="bi bi-eye me-1"></i> عرض التفاصيل
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render loading skeletons.
     */
    renderSkeletons(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="ad-card skeleton-card">
                        <div class="skeleton-img"></div>
                        <div class="ad-card-body">
                            <div class="skeleton-line" style="width:80%"></div>
                            <div class="skeleton-line" style="width:40%"></div>
                            <div class="skeleton-line" style="width:60%"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        return html;
    },

    /**
     * Render pagination controls.
     */
    renderPagination() {
        if (this.lastPage <= 1) return '';

        let items = '';
        // Previous button
        items += `<li class="page-item ${this.currentPage <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="ADS_PAGE.loadAds(${this.currentPage - 1}); return false;">
                <i class="bi bi-chevron-right"></i> السابق
            </a>
        </li>`;

        // Page numbers (show max 5)
        let start = Math.max(1, this.currentPage - 2);
        let end = Math.min(this.lastPage, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);

        for (let i = start; i <= end; i++) {
            items += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="ADS_PAGE.loadAds(${i}); return false;">${i}</a>
            </li>`;
        }

        // Next button
        items += `<li class="page-item ${this.currentPage >= this.lastPage ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="ADS_PAGE.loadAds(${this.currentPage + 1}); return false;">
                التالي <i class="bi bi-chevron-left"></i>
            </a>
        </li>`;

        return `<nav><ul class="pagination justify-content-center">${items}</ul></nav>`;
    },

    /**
     * Switch between grid and list view.
     */
    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.loadAds(this.currentPage);
    },
};


// ============================================
// AD DETAILS PAGE
// ============================================
const AD_DETAILS = {
    adId: null,

    /**
     * Initialize the ad details page.
     */
    init() {
        const params = new URLSearchParams(window.location.search);
        this.adId = params.get('id');

        if (!this.adId) {
            document.getElementById('adDetailsContainer').innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-circle" style="font-size: 4rem; color: var(--primary);"></i>
                    <h4 class="mt-3">لم يتم تحديد إعلان</h4>
                    <a href="ads.html" class="btn btn-primary mt-3">العودة للإعلانات</a>
                </div>
            `;
            return;
        }

        this.loadAdDetails();
        this.bindEvents();
    },

    bindEvents() {
        const favBtn = document.getElementById('btnFavorite');
        if (favBtn) {
            favBtn.addEventListener('click', () => this.toggleFavorite());
        }

        const chatBtn = document.getElementById('btnChat');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => this.startChat());
        }
    },

    /**
     * Fetch ad details.
     * GET /ads/{id} - See ad.md Section 2
     */
    async loadAdDetails() {
        const container = document.getElementById('adDetailsContainer');
        if (!container) return;

        const result = await API.get(`/ads/${this.adId}`);

        if (result.success && result.data) {
            this.renderAdDetails(result.data);
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle" style="font-size: 4rem; color: var(--primary);"></i>
                    <h4 class="mt-3">لم يتم العثور على الإعلان</h4>
                    <a href="ads.html" class="btn btn-primary mt-3">العودة للإعلانات</a>
                </div>
            `;
        }
    },

    /**
     * Render ad details into the page.
     */
    renderAdDetails(ad) {
        // Images
        const imagesContainer = document.getElementById('adImages');
        if (imagesContainer && ad.images && ad.images.length > 0) {
            // Main image
            const mainImg = document.getElementById('mainAdImage');
            if (mainImg) mainImg.src = `/storage/${ad.images[0].image_path}`;

            // Thumbnails
            const thumbs = document.getElementById('adThumbnails');
            if (thumbs) {
                thumbs.innerHTML = ad.images.map((img, i) => `
                    <div class="ad-thumb ${i === 0 ? 'active' : ''}" onclick="AD_DETAILS.switchImage(${i}, '${'/storage/' + img.image_path}')">
                        <img src="/storage/${img.image_path}" alt="صورة ${i + 1}" loading="lazy">
                    </div>
                `).join('');
            }
        }

        // Info
        const title = document.getElementById('adTitle');
        const price = document.getElementById('adPrice');
        const desc = document.getElementById('adDescription');
        const address = document.getElementById('adAddress');
        const date = document.getElementById('adDate');
        const views = document.getElementById('adViews');
        const category = document.getElementById('adCategory');

        if (title) title.textContent = ad.title || '';
        if (price) price.textContent = `${Number(ad.price).toLocaleString('ar-YE')} ر.ي`;
        if (desc) desc.textContent = ad.description || '';
        if (address) address.textContent = ad.address_text || 'غير محدد';
        if (date) date.textContent = ad.created_at ? new Date(ad.created_at).toLocaleDateString('ar-YE') : '';
        if (views) views.textContent = ad.views_count || 0;
        if (category) category.textContent = ad.category?.name || '';

        // User Card
        const userName = document.getElementById('adUserName');
        const userDate = document.getElementById('adUserDate');
        const userLink = document.getElementById('adUserLink');
        if (userName) userName.textContent = ad.user?.name || 'مستخدم';
        if (userDate && ad.user?.created_at) {
            userDate.textContent = `عضو منذ ${new Date(ad.user.created_at).toLocaleDateString('ar-YE')}`;
        }
        // Link to user public profile
        if (userLink && ad.user?.id) {
            userLink.href = `user-profile.html?id=${ad.user.id}`;
        }
        // Show rate button if logged in and not the ad owner
        const rateBtn = document.getElementById('btnRateUser');
        if (rateBtn && ad.user?.id && AUTH.isLoggedIn()) {
            const currentUser = AUTH.getUser();
            if (currentUser && String(currentUser.id) !== String(ad.user.id)) {
                rateBtn.classList.remove('d-none');
                rateBtn.addEventListener('click', () => {
                    if (typeof RATING_MODAL !== 'undefined') {
                        RATING_MODAL.open(ad.user.id);
                    }
                });
            }
        }

        // Initialize block user feature
        if (typeof BLOCK_USER !== 'undefined' && ad.user?.id) {
            BLOCK_USER.init(ad.user.id);
        }

        // Initialize comments section
        if (typeof COMMENTS !== 'undefined') {
            COMMENTS.init(ad.id, ad.comments || []);
        }

        // Favorite state
        const favBtn = document.getElementById('btnFavorite');
        if (favBtn && ad.is_favorited) {
            favBtn.classList.remove('btn-outline-primary');
            favBtn.classList.add('btn-primary');
            const icon = favBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('bi-heart');
                icon.classList.add('bi-heart-fill');
            }
        }

        // Page title
        document.title = `${ad.title} - حراج مأرب`;
    },

    /**
     * Switch main image on thumbnail click.
     */
    switchImage(index, src) {
        const mainImg = document.getElementById('mainAdImage');
        if (mainImg) mainImg.src = src;

        document.querySelectorAll('.ad-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    },

    /**
     * Toggle favorite.
     * POST /favorites/toggle - See favorites.md
     */
    async toggleFavorite() {
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        const btn = document.getElementById('btnFavorite');
        btn.disabled = true;

        const result = await API.post('/favorites/toggle', { ad_id: this.adId });

        btn.disabled = false;

        if (result.success || result.data) {
            const isFav = result.data?.favorited ?? result.favorited;
            btn.classList.toggle('btn-primary', isFav);
            btn.classList.toggle('btn-outline-primary', !isFav);
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('bi-heart-fill', isFav);
                icon.classList.toggle('bi-heart', !isFav);
            }

            // Show toast
            const msg = isFav ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة';
            AD_DETAILS.showToast(msg, isFav ? 'success' : 'danger');
        }
    },

    /**
     * Show a toast notification.
     */
    showToast(message, type = 'success') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
            container.style.zIndex = '1100';
            document.body.appendChild(container);
        }

        const toastId = 'toast-' + Date.now();
        const bgColor = type === 'success' ? '#22C55E' : '#EF4444';
        const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill';

        container.insertAdjacentHTML('beforeend', `
            <div id="${toastId}" class="toast align-items-center text-white border-0 show" role="alert"
                 style="background:${bgColor}; border-radius:10px; font-family:'Cairo',sans-serif; min-width:280px; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
                <div class="d-flex">
                    <div class="toast-body fw-bold">
                        <i class="bi ${icon} me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="document.getElementById('${toastId}').remove()"></button>
                </div>
            </div>
        `);

        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.style.transition = 'opacity 0.3s ease';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    },

    /**
     * Start chat with seller.
     */
    startChat() {
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }
        window.location.href = `/web/chat.html?ad_id=${this.adId}`;
    },
};


// ============================================
// POST AD PAGE
// ============================================
const POST_AD = {
    /**
     * Initialize the post ad page.
     */
    init() {
        // Check auth - redirect if not logged in
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        this.loadCategories();
        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('postAdForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Image preview
        const imageInput = document.getElementById('adImages');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.previewImages(e));
        }
    },

    /**
     * Load categories into select dropdown.
     * Uses global CATEGORIES helper from app.js
     */
    async loadCategories() {
        await CATEGORIES.populate('adCategory', 'اختر القسم...');
    },

    /**
     * Preview selected images before upload.
     */
    previewImages(e) {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;

        preview.innerHTML = '';
        const files = e.target.files;

        if (files.length > 5) {
            UI.showAlert('alertContainer', 'يمكنك رفع 5 صور كحد أقصى.', 'danger');
            e.target.value = '';
            return;
        }

        Array.from(files).forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                preview.innerHTML += `
                    <div class="image-preview-item">
                        <img src="${ev.target.result}" alt="صورة ${i + 1}">
                        <span class="image-preview-num">${i + 1}</span>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Handle post ad form submission.
     * POST /ads - See ad.md Section 3
     */
    async handleSubmit(e) {
        e.preventDefault();
        UI.clearAlert('alertContainer');

        const form = document.getElementById('postAdForm');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Build FormData (multipart/form-data for images)
        const formData = new FormData();
        formData.append('title', document.getElementById('adTitle').value.trim());
        formData.append('description', document.getElementById('adDescription').value.trim());
        formData.append('price', document.getElementById('adPrice').value);
        formData.append('category_id', document.getElementById('adCategory').value);
        formData.append('address_text', document.getElementById('adAddress').value.trim());

        const lat = document.getElementById('adLat')?.value;
        const lng = document.getElementById('adLng')?.value;
        if (lat) formData.append('lat', lat);
        if (lng) formData.append('lng', lng);

        const year = document.getElementById('adYear')?.value;
        if (year) formData.append('year', year);

        // Append images
        const imageInput = document.getElementById('adImages');
        if (imageInput && imageInput.files.length > 0) {
            Array.from(imageInput.files).forEach(file => {
                formData.append('images[]', file);
            });
        } else {
            UI.showAlert('alertContainer', 'يرجى إضافة صورة واحدة على الأقل.', 'danger');
            return;
        }

        UI.toggleBtnLoading(submitBtn, true);

        // Send as multipart - use raw fetch because API.post sends JSON
        try {
            const response = await fetch(`${API_BASE_URL}/ads`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${AUTH.getToken()}`,
                },
                body: formData,
            });

            const result = await response.json();
            UI.toggleBtnLoading(submitBtn, false);

            if (result.success) {
                UI.showAlert('alertContainer', 'تم نشر الإعلان بنجاح! جاري التحويل...', 'success');
                const adId = result.data?.id;
                setTimeout(() => {
                    window.location.href = adId ? `ad-details.html?id=${adId}` : 'ads.html';
                }, 1500);
            } else {
                // Handle validation errors
                if (result.errors) {
                    const messages = Object.values(result.errors).flat().join('<br>');
                    UI.showAlert('alertContainer', messages, 'danger');
                } else {
                    UI.showAlert('alertContainer', getErrorMessage(result.message), 'danger');
                }
            }
        } catch (error) {
            UI.toggleBtnLoading(submitBtn, false);
            UI.showAlert('alertContainer', getErrorMessage('network_error'), 'danger');
        }
    },
};


// ============================================
// PAGE INITIALIZATION - Auto-detect which page
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Ads list page
    if (document.getElementById('adsGrid')) {
        ADS_PAGE.init();
    }

    // Ad details page
    if (document.getElementById('adDetailsContainer')) {
        AD_DETAILS.init();
    }

    // Post ad page
    if (document.getElementById('postAdForm')) {
        POST_AD.init();
    }
});
