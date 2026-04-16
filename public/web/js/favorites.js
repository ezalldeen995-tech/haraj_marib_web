/**
 * Haraj-Maareb - Favorites Logic (favorites.js)
 * ================================================
 * Handles the My Favorites page: loading, rendering, removing, and pagination.
 * Favorites endpoints are documented in favorites.md.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const FAVORITES_PAGE = {
    currentPage: 1,
    lastPage: 1,

    /**
     * Initialize the favorites page.
     */
    init() {
        // Require auth
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        this.loadFavorites();
    },

    /**
     * Fetch and render the user's favorite ads.
     * GET /favorites - See favorites.md Section 2
     */
    async loadFavorites(page = 1) {
        this.currentPage = page;
        const grid = document.getElementById('favoritesGrid');
        const paginationArea = document.getElementById('paginationArea');
        if (!grid) return;

        // Show skeleton loaders
        grid.innerHTML = this.renderSkeletons(6);

        const result = await API.get(`/favorites?page=${page}`);

        if (result.success || result.data) {
            const responseData = result.data || result;
            const ads = responseData.data || responseData;
            this.lastPage = responseData.last_page || 1;
            this.currentPage = responseData.current_page || 1;
            const total = responseData.total || (Array.isArray(ads) ? ads.length : 0);

            // Update count
            const favCount = document.getElementById('favCount');
            if (favCount) {
                favCount.textContent = total > 0 ? `${total} إعلان في المفضلة` : '';
            }

            if (!Array.isArray(ads) || ads.length === 0) {
                grid.innerHTML = this.renderEmptyState();
            } else {
                grid.innerHTML = ads.map(ad => this.renderFavCard(ad)).join('');
            }

            // Pagination
            if (paginationArea) {
                paginationArea.innerHTML = this.renderPagination();
            }
        } else {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: var(--primary);"></i>
                    <h5 class="mt-3">حدث خطأ في تحميل المفضلة</h5>
                    <button class="btn btn-primary btn-sm mt-2" onclick="FAVORITES_PAGE.loadFavorites()">إعادة المحاولة</button>
                </div>
            `;
        }
    },

    /**
     * Render a single favorite ad card.
     */
    renderFavCard(ad) {
        const image = API.resolveImageUrl((ad.images && ad.images.length > 0) ? (ad.images[0].image_path || ad.images[0]) : null, 'https://placehold.co/400x250/FFEDD5/F97316?text=لا+توجد+صورة');
        const price = Number(ad.price).toLocaleString('ar-YE');
        const date = ad.created_at ? new Date(ad.created_at).toLocaleDateString('ar-YE') : '';

        return `
            <div class="col-md-6 col-lg-4 mb-4 ad-card-animate" id="fav-card-${ad.id}">
                <div class="ad-card">
                    <div class="ad-card-img">
                        <img src="${image}" alt="${ad.title}" loading="lazy">
                    </div>
                    <div class="ad-card-body">
                        <h5 class="ad-card-title">${ad.title}</h5>
                        <div class="ad-card-price">${price} ر.ي</div>
                        <div class="ad-card-meta">
                            <span><i class="bi bi-geo-alt"></i> ${ad.address_text || 'اليمن'}</span>
                            <span><i class="bi bi-clock"></i> ${date}</span>
                        </div>
                    </div>
                    <div class="ad-card-footer d-flex gap-2">
                        <a href="ad-details.html?id=${ad.id}" class="btn btn-outline-primary btn-sm flex-grow-1">
                            <i class="bi bi-eye me-1"></i> عرض التفاصيل
                        </a>
                        <button class="btn btn-outline-danger btn-sm fav-remove-btn" onclick="FAVORITES_PAGE.removeFavorite(${ad.id})" title="إزالة من المفضلة">
                            <i class="bi bi-heart-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render empty state illustration.
     */
    renderEmptyState() {
        return `
            <div class="col-12 text-center py-5">
                <div class="fav-empty-state">
                    <i class="bi bi-heart" style="font-size: 5rem; color: var(--primary); opacity: 0.3;"></i>
                    <h4 class="mt-4 fw-bold" style="color: var(--text-primary);">لا توجد إعلانات في المفضلة حالياً</h4>
                    <p class="text-muted mt-2">تصفح الإعلانات وأضف ما يعجبك إلى المفضلة بالنقر على أيقونة القلب</p>
                    <a href="/web/ads.html" class="btn btn-primary mt-3">
                        <i class="bi bi-megaphone me-1"></i> تصفح الإعلانات
                    </a>
                </div>
            </div>
        `;
    },

    /**
     * Remove an ad from favorites.
     * POST /favorites/toggle - See favorites.md Section 1
     */
    async removeFavorite(adId) {
        const card = document.getElementById(`fav-card-${adId}`);

        // Optimistic UI: fade out the card
        if (card) {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
        }

        const result = await API.post('/favorites/toggle', { ad_id: adId });

        if (result.success || result.data) {
            showToast('تمت الإزالة من المفضلة', 'danger');

            // Remove card from DOM
            if (card) {
                setTimeout(() => {
                    card.remove();

                    // Check if grid is now empty
                    const grid = document.getElementById('favoritesGrid');
                    const remaining = grid ? grid.querySelectorAll('.ad-card-animate').length : 0;
                    if (remaining === 0) {
                        grid.innerHTML = this.renderEmptyState();
                        const favCount = document.getElementById('favCount');
                        if (favCount) favCount.textContent = '';
                    } else {
                        // Update count
                        const favCount = document.getElementById('favCount');
                        if (favCount) favCount.textContent = `${remaining} إعلان في المفضلة`;
                    }
                }, 300);
            }
        } else {
            // Revert optimistic UI
            if (card) {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }
            showToast('حدث خطأ أثناء الإزالة', 'danger');
        }
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
        items += `<li class="page-item ${this.currentPage <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="FAVORITES_PAGE.loadFavorites(${this.currentPage - 1}); return false;">
                <i class="bi bi-chevron-right"></i> السابق
            </a>
        </li>`;

        let start = Math.max(1, this.currentPage - 2);
        let end = Math.min(this.lastPage, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);

        for (let i = start; i <= end; i++) {
            items += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="FAVORITES_PAGE.loadFavorites(${i}); return false;">${i}</a>
            </li>`;
        }

        items += `<li class="page-item ${this.currentPage >= this.lastPage ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="FAVORITES_PAGE.loadFavorites(${this.currentPage + 1}); return false;">
                التالي <i class="bi bi-chevron-left"></i>
            </a>
        </li>`;

        return `<nav><ul class="pagination justify-content-center">${items}</ul></nav>`;
    },
};


/**
 * Show a toast notification.
 * @param {string} message - Toast message text
 * @param {string} [type='success'] - 'success' or 'danger'
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const bgColor = type === 'success' ? '#22C55E' : type === 'danger' ? '#EF4444' : '#F97316';
    const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-x-circle-fill' : 'bi-info-circle-fill';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white border-0 show" role="alert"
             style="background:${bgColor}; border-radius:10px; font-family:'Cairo',sans-serif; min-width:280px; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
            <div class="d-flex">
                <div class="toast-body fw-bold">
                    <i class="bi ${icon} me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="document.getElementById('${toastId}').remove()"></button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', toastHTML);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}


// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('favoritesGrid')) {
        FAVORITES_PAGE.init();
    }
});
