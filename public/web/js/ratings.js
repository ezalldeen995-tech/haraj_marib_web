/**
 * Haraj-Maareb - Ratings & User Profile Logic (ratings.js)
 * ================================================
 * Handles User Public Profile page, rating modal, star input, and rating submission.
 * Rating endpoints are documented in ratings.md.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

// ============================================
// RATING STAR LABELS
// ============================================
const RATING_LABELS = {
    0: 'لم يتم التقييم بعد',
    1: 'سيء جداً ⭐',
    2: 'سيء ⭐⭐',
    3: 'مقبول ⭐⭐⭐',
    4: 'جيد ⭐⭐⭐⭐',
    5: 'ممتاز ⭐⭐⭐⭐⭐',
};


// ============================================
// USER PROFILE PAGE
// ============================================
const USER_PROFILE = {
    userId: null,
    adsPage: 1,
    adsLastPage: 1,

    /**
     * Initialize the user profile page.
     */
    init() {
        const params = new URLSearchParams(window.location.search);
        this.userId = params.get('id');

        if (!this.userId) {
            document.getElementById('profileHeaderCard').innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-circle" style="font-size: 4rem; color: var(--primary);"></i>
                    <h4 class="mt-3">لم يتم تحديد المستخدم</h4>
                    <a href="/web/ads.html" class="btn btn-primary mt-3">العودة للإعلانات</a>
                </div>
            `;
            return;
        }

        this.loadUserProfile();
        this.loadUserAds();
        this.loadUserRatings();
    },

    /**
     * Fetch user info. There may not be a dedicated public profile endpoint,
     * so we use basic info from ads or assume /users/{id} might exist.
     * For now, we'll load ads by this user and extract user data from the first ad,
     * or handle it gracefully.
     */
    async loadUserProfile() {
        // Try to fetch ads by this user to get user data
        const result = await API.get(`/ads?user_id=${this.userId}&per_page=1`);

        if (result.success && result.data) {
            const ads = result.data.data || result.data;
            if (ads.length > 0 && ads[0].user) {
                const user = ads[0].user;
                this.renderProfileHeader(user);
            } else {
                // Fallback: just show user ID
                document.getElementById('userName').textContent = `مستخدم #${this.userId}`;
            }
        }

        // Check if logged-in user is NOT this user → show Rate button
        if (AUTH.isLoggedIn()) {
            const currentUser = AUTH.getUser();
            const currentId = currentUser ? String(currentUser.id) : null;
            if (currentId !== String(this.userId)) {
                const area = document.getElementById('rateButtonArea');
                if (area) {
                    area.innerHTML = `
                        <button class="btn btn-warning btn-sm" onclick="RATING_MODAL.open(${this.userId})">
                            <i class="bi bi-star me-1"></i> تقييم المستخدم
                        </button>
                    `;
                }
            }
        }
    },

    /**
     * Render profile header with user info.
     */
    renderProfileHeader(user) {
        const nameEl = document.getElementById('userName');
        const sinceEl = document.getElementById('userSince');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) nameEl.textContent = user.name || `مستخدم #${this.userId}`;
        if (sinceEl && user.created_at) {
            sinceEl.innerHTML = `<i class="bi bi-calendar3 me-1"></i> عضو منذ ${new Date(user.created_at).toLocaleDateString('ar-YE')}`;
        }

        if (avatarEl && user.avatar) {
            avatarEl.innerHTML = `<img src="/storage/${user.avatar}" alt="${user.name}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">`;
        }

        // Update page title
        document.title = `${user.name || 'مستخدم'} - حراج مأرب`;

        // Update rating summary if available
        if (typeof user.average_rating !== 'undefined') {
            this.updateRatingSummary(user.average_rating, user.ratings_count || 0);
        }
    },

    /**
     * Update the star display and rating counts.
     */
    updateRatingSummary(avg, count) {
        const avgEl = document.getElementById('ratingAvg');
        const countEl = document.getElementById('ratingCount');
        const starsEl = document.getElementById('userStars');

        if (avgEl) avgEl.textContent = parseFloat(avg).toFixed(1);
        if (countEl) countEl.textContent = `(${count} تقييم)`;

        if (starsEl) {
            const rounded = Math.round(avg);
            starsEl.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('i');
                star.className = i <= rounded ? 'bi bi-star-fill' : 'bi bi-star';
                starsEl.appendChild(star);
            }
        }
    },

    /**
     * Load this user's ads.
     */
    async loadUserAds(page = 1) {
        this.adsPage = page;
        const grid = document.getElementById('userAdsGrid');
        if (!grid) return;

        grid.innerHTML = this.renderSkeletons(3);

        const result = await API.get(`/ads?user_id=${this.userId}&page=${page}`);

        if (result.success && result.data) {
            const ads = result.data.data || result.data;
            this.adsLastPage = result.data.last_page || 1;

            if (!Array.isArray(ads) || ads.length === 0) {
                grid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-megaphone" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.4;"></i>
                        <h5 class="mt-3 text-muted">لا توجد إعلانات لهذا المستخدم</h5>
                    </div>
                `;
            } else {
                grid.innerHTML = ads.map(ad => this.renderAdCard(ad)).join('');
            }

            const pag = document.getElementById('adsPaginationArea');
            if (pag) pag.innerHTML = this.renderPagination();
        }
    },

    /**
     * Load ratings for this user.
     */
    async loadUserRatings() {
        const container = document.getElementById('ratingsListContainer');
        if (!container) return;

        container.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>`;

        // Try to fetch ratings via a possible endpoint or the user's data
        // Since the API might not have a GET /ratings endpoint, we handle gracefully
        const result = await API.get(`/ratings?user_id=${this.userId}`);

        if (result.success && result.data) {
            const ratings = Array.isArray(result.data) ? result.data : (result.data.data || []);

            if (ratings.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-star" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.4;"></i>
                        <h5 class="mt-3 text-muted">لا توجد تقييمات حتى الآن</h5>
                    </div>
                `;
            } else {
                container.innerHTML = ratings.map(r => this.renderRatingCard(r)).join('');
            }
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-star" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.4;"></i>
                    <h5 class="mt-3 text-muted">لا توجد تقييمات حتى الآن</h5>
                </div>
            `;
        }
    },

    /**
     * Render a single rating review card.
     */
    renderRatingCard(rating) {
        const stars = Array.from({ length: 5 }, (_, i) =>
            `<i class="bi ${i < rating.rating ? 'bi-star-fill' : 'bi-star'}"></i>`
        ).join('');

        const date = rating.created_at ? new Date(rating.created_at).toLocaleDateString('ar-YE') : '';
        const raterName = rating.rater?.name || 'مستخدم';

        return `
            <div class="rating-review-card">
                <div class="d-flex align-items-start gap-3">
                    <div class="rating-review-avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center justify-content-between mb-1">
                            <h6 class="fw-bold mb-0">${raterName}</h6>
                            <small class="text-muted">${date}</small>
                        </div>
                        <div class="rating-review-stars mb-2">${stars}</div>
                        ${rating.comment ? `<p class="mb-0 text-muted" style="font-size:0.95rem;">${rating.comment}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    renderAdCard(ad) {
        const image = (ad.images && ad.images.length > 0)
            ? `/storage/${ad.images[0].image_path}`
            : 'https://placehold.co/400x250/FFEDD5/F97316?text=لا+توجد+صورة';
        const price = Number(ad.price).toLocaleString('ar-YE');
        const date = ad.created_at ? new Date(ad.created_at).toLocaleDateString('ar-YE') : '';

        return `
            <div class="col-md-6 col-lg-4 mb-4 ad-card-animate">
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
                    <div class="ad-card-footer">
                        <a href="ad-details.html?id=${ad.id}" class="btn btn-outline-primary btn-sm w-100">
                            <i class="bi bi-eye me-1"></i> عرض التفاصيل
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

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

    renderPagination() {
        if (this.adsLastPage <= 1) return '';
        let items = '';
        items += `<li class="page-item ${this.adsPage <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="USER_PROFILE.loadUserAds(${this.adsPage - 1}); return false;">
                <i class="bi bi-chevron-right"></i> السابق
            </a></li>`;

        let start = Math.max(1, this.adsPage - 2);
        let end = Math.min(this.adsLastPage, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);

        for (let i = start; i <= end; i++) {
            items += `<li class="page-item ${i === this.adsPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="USER_PROFILE.loadUserAds(${i}); return false;">${i}</a></li>`;
        }

        items += `<li class="page-item ${this.adsPage >= this.adsLastPage ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="USER_PROFILE.loadUserAds(${this.adsPage + 1}); return false;">
                التالي <i class="bi bi-chevron-left"></i>
            </a></li>`;

        return `<nav><ul class="pagination justify-content-center">${items}</ul></nav>`;
    },
};


// ============================================
// RATING MODAL CONTROLLER
// ============================================
const RATING_MODAL = {
    targetUserId: null,
    selectedRating: 0,
    modalInstance: null,

    /**
     * Open the rating modal for a given user.
     */
    open(userId) {
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        this.targetUserId = userId;
        this.selectedRating = 0;
        this.resetUI();

        const modalEl = document.getElementById('ratingModal');
        if (!modalEl) return;

        this.modalInstance = new bootstrap.Modal(modalEl);
        this.modalInstance.show();
    },

    /**
     * Reset modal UI state.
     */
    resetUI() {
        const starsContainer = document.getElementById('ratingStarsInput');
        if (starsContainer) {
            starsContainer.querySelectorAll('i').forEach(star => {
                star.className = 'bi bi-star';
            });
        }
        const label = document.getElementById('ratingLabel');
        if (label) label.textContent = RATING_LABELS[0];

        const comment = document.getElementById('ratingComment');
        if (comment) comment.value = '';

        const hidden = document.getElementById('ratingValue');
        if (hidden) hidden.value = '0';

        const alertContainer = document.getElementById('ratingAlertContainer');
        if (alertContainer) alertContainer.innerHTML = '';
    },

    /**
     * Set rating value and update stars visually.
     */
    setRating(value) {
        this.selectedRating = value;
        const hidden = document.getElementById('ratingValue');
        if (hidden) hidden.value = value;

        const starsContainer = document.getElementById('ratingStarsInput');
        if (starsContainer) {
            starsContainer.querySelectorAll('i').forEach((star, i) => {
                star.className = (i < value) ? 'bi bi-star-fill' : 'bi bi-star';
            });
        }

        const label = document.getElementById('ratingLabel');
        if (label) label.textContent = RATING_LABELS[value] || '';
    },

    /**
     * Highlight stars on hover.
     */
    hoverStars(value) {
        const starsContainer = document.getElementById('ratingStarsInput');
        if (starsContainer) {
            starsContainer.querySelectorAll('i').forEach((star, i) => {
                star.className = (i < value) ? 'bi bi-star-fill' : 'bi bi-star';
            });
        }
    },

    /**
     * Restore stars to selected value on mouse leave.
     */
    restoreStars() {
        this.setRating(this.selectedRating);
    },

    /**
     * Submit rating.
     * POST /ratings - See ratings.md
     */
    async submit() {
        const alertContainer = document.getElementById('ratingAlertContainer');
        if (alertContainer) alertContainer.innerHTML = '';

        if (this.selectedRating === 0) {
            if (alertContainer) {
                alertContainer.innerHTML = `<div class="alert alert-danger alert-app py-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> يرجى اختيار عدد النجوم</div>`;
            }
            return;
        }

        const comment = document.getElementById('ratingComment')?.value.trim();
        const submitBtn = document.getElementById('btnSubmitRating');

        UI.toggleBtnLoading(submitBtn, true);

        const data = {
            user_id: this.targetUserId,
            rating: this.selectedRating,
        };
        if (comment) data.comment = comment;

        const result = await API.post('/ratings', data);

        UI.toggleBtnLoading(submitBtn, false, '<i class="bi bi-send me-1"></i> إرسال التقييم');

        if (result.success || (result.data && result.data.rating)) {
            // Close modal
            if (this.modalInstance) this.modalInstance.hide();

            // Toast
            showRatingToast('شكراً لتقييمك ⭐', 'success');

            // Update profile page rating if on it
            if (result.data && typeof result.data.average !== 'undefined') {
                const ratingsCount = document.getElementById('ratingCount');
                const currentCount = ratingsCount ? parseInt(ratingsCount.textContent.replace(/\D/g, '')) || 0 : 0;
                USER_PROFILE.updateRatingSummary(result.data.average, currentCount + 1);
                USER_PROFILE.loadUserRatings();
            }
        } else {
            // Handle errors
            let errorMsg = 'حدث خطأ أثناء إرسال التقييم';
            if (result.message === 'cannot_rate_self') {
                errorMsg = 'لا يمكنك تقييم نفسك';
            } else if (result.message === 'blocked_interaction') {
                errorMsg = 'لا يمكنك التفاعل مع هذا المستخدم';
            } else if (result.errors) {
                errorMsg = Object.values(result.errors).flat().join('<br>');
            }

            if (alertContainer) {
                alertContainer.innerHTML = `<div class="alert alert-danger alert-app py-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> ${errorMsg}</div>`;
            }
        }
    },
};


/**
 * Show toast notification.
 */
function showRatingToast(message, type = 'success') {
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
}


// ============================================
// STAR INTERACTION EVENTS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const starsContainer = document.getElementById('ratingStarsInput');
    if (starsContainer) {
        starsContainer.querySelectorAll('i').forEach(star => {
            star.addEventListener('click', () => {
                RATING_MODAL.setRating(parseInt(star.dataset.value));
            });
            star.addEventListener('mouseenter', () => {
                RATING_MODAL.hoverStars(parseInt(star.dataset.value));
            });
        });
        starsContainer.addEventListener('mouseleave', () => {
            RATING_MODAL.restoreStars();
        });
    }

    // Submit rating button
    const submitBtn = document.getElementById('btnSubmitRating');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => RATING_MODAL.submit());
    }

    // Profile page init
    if (document.getElementById('profileHeaderCard')) {
        USER_PROFILE.init();
    }
});
