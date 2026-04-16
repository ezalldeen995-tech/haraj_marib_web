/**
 * Haraj-Maareb - Profile Logic (profile.js)
 * ================================================
 * Handles Profile loading, updating, avatar upload,
 * favorites, and account deletion.
 * See profile.md for API documentation.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const PROFILE = {
    userData: null,

    /**
     * Initialize profile page.
     */
    init() {
        // Auth guard
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        this.loadProfile();
        this.loadFavorites();
        this.loadMyAds();
        this.bindEvents();
    },

    /**
     * Bind all events.
     */
    bindEvents() {
        // Edit profile form
        const editForm = document.getElementById('editProfileForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleUpdateProfile(e));
        }

        // Avatar upload
        const avatarOverlay = document.getElementById('avatarOverlay');
        const avatarInput = document.getElementById('avatarInput');
        if (avatarOverlay) {
            avatarOverlay.addEventListener('click', () => avatarInput?.click());
        }
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Delete account modal
        const deleteInput = document.getElementById('deleteConfirmInput');
        const confirmBtn = document.getElementById('btnConfirmDelete');
        if (deleteInput && confirmBtn) {
            deleteInput.addEventListener('input', (e) => {
                confirmBtn.disabled = e.target.value.trim() !== 'DELETE';
            });
        }
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.handleDeleteAccount());
        }

        // Sidebar navigation
        document.querySelectorAll('.profile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.dataset.section;
                if (sectionId) {
                    // Update active state
                    document.querySelectorAll('.profile-nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    // Scroll into view
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    },

    /**
     * Fetch user profile data.
     * GET /profile - See profile.md Section 1
     */
    async loadProfile() {
        const result = await API.get('/profile');

        if (result.success && result.data) {
            const { user, active_ads_count, rating_avg } = result.data;
            this.userData = user;

            // Populate header card
            const avatarPath = user.avatar || user.avatar_url;
            const avatar = API.resolveImageUrl(avatarPath, 'https://placehold.co/120x120/FFEDD5/F97316?text=👤');
            document.getElementById('profileAvatar').src = avatar;
            document.getElementById('sidebarAvatarImg').src = avatar;
            document.getElementById('profileName').textContent = user.name || 'مستخدم';
            document.getElementById('sidebarName').textContent = user.name || 'مستخدم';
            document.getElementById('profilePhone').innerHTML = `<i class="bi bi-telephone me-1"></i> ${user.phone || '---'}`;

            // Stats
            document.getElementById('profileAdsCount').textContent = active_ads_count || 0;
            document.getElementById('profileRating').textContent = rating_avg || 0;

            // Populate edit form
            document.getElementById('editName').value = user.name || '';
            document.getElementById('editEmail').value = user.email || '';
        } else {
            UI.showAlert('alertContainer', 'حدث خطأ أثناء تحميل بيانات الحساب', 'danger');
        }
    },

    /**
     * Update profile.
     * POST /profile/update - See profile.md Section 2
     */
    async handleUpdateProfile(e) {
        e.preventDefault();
        UI.clearAlert('alertContainer');

        const submitBtn = document.getElementById('btnSaveProfile');
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();

        const data = {};
        if (name) data.name = name;
        if (email) data.email = email;

        UI.toggleBtnLoading(submitBtn, true);
        const result = await API.post('/profile/update', data);
        UI.toggleBtnLoading(submitBtn, false);

        if (result.success) {
            UI.showAlert('alertContainer', 'تم تحديث البيانات بنجاح ✓', 'success');

            // Update displayed name
            document.getElementById('profileName').textContent = name;
            document.getElementById('sidebarName').textContent = name;

            // Update localStorage user data
            const stored = AUTH.getUser();
            if (stored) {
                stored.name = name;
                stored.email = email;
                localStorage.setItem('user', JSON.stringify(stored));
            }

            // Re-render navbar
            if (typeof updateNavAuthState === 'function') updateNavAuthState();
        } else {
            if (result.errors) {
                const messages = Object.values(result.errors).flat().join('<br>');
                UI.showAlert('alertContainer', messages, 'danger');
            } else {
                UI.showAlert('alertContainer', getErrorMessage(result.message), 'danger');
            }
        }
    },

    /**
     * Handle avatar file selection and upload.
     * POST /profile/avatar - See profile.md Section 3
     */
    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            UI.showAlert('alertContainer', 'حجم الصورة يجب ألا يتجاوز 2 ميجا.', 'danger');
            return;
        }

        // Preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('profileAvatar').src = ev.target.result;
            document.getElementById('sidebarAvatarImg').src = ev.target.result;
        };
        reader.readAsDataURL(file);

        // Show spinner
        const spinner = document.getElementById('avatarSpinner');
        spinner?.classList.remove('d-none');

        // Upload
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${AUTH.getToken()}`,
                },
                body: formData,
            });

            const result = await response.json();
            spinner?.classList.add('d-none');

            if (result.success) {
                UI.showAlert('alertContainer', 'تم تحديث الصورة الشخصية بنجاح ✓', 'success');

                // Update avatar URL in localStorage
                const stored = AUTH.getUser();
                if (stored && result.data?.avatar) {
                    stored.avatar = result.data.avatar;
                    localStorage.setItem('user', JSON.stringify(stored));
                }
            } else {
                UI.showAlert('alertContainer', 'حدث خطأ أثناء رفع الصورة', 'danger');
                // Revert preview
                if (this.userData?.avatar) {
                    document.getElementById('profileAvatar').src = this.userData.avatar;
                    document.getElementById('sidebarAvatarImg').src = this.userData.avatar;
                }
            }
        } catch (err) {
            spinner?.classList.add('d-none');
            UI.showAlert('alertContainer', getErrorMessage('network_error'), 'danger');
        }
    },

    /**
     * Load user's favorite ads.
     * GET /favorites - See api.md
     */
    async loadFavorites() {
        const grid = document.getElementById('favoritesGrid');
        if (!grid) return;

        const result = await API.get('/favorites');

        if (result.success && result.data) {
            const favorites = Array.isArray(result.data) ? result.data : (result.data.data || []);
            if (favorites.length === 0) {
                grid.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-heart" style="font-size:2.5rem; color: var(--text-secondary); opacity:0.3;"></i>
                        <p class="text-muted mt-2">لا توجد إعلانات مفضلة بعد.</p>
                    </div>
                `;
            } else {
                grid.innerHTML = favorites.map(fav => {
                    const ad = fav.ad || fav;
                    const image = API.resolveImageUrl(ad.images && ad.images.length > 0 ? ad.images[0].image_path : null, 'https://placehold.co/300x180/FFEDD5/F97316?text=لا+صورة');
                    const price = Number(ad.price || 0).toLocaleString('ar-YE');
                    return `
                        <div class="col-md-6 col-lg-4">
                            <div class="ad-card" style="height:auto;">
                                <div class="ad-card-img"><img src="${image}" alt="${ad.title}" loading="lazy"></div>
                                <div class="ad-card-body">
                                    <h6 class="ad-card-title">${ad.title || ''}</h6>
                                    <div class="ad-card-price">${price} ر.ي</div>
                                </div>
                                <div class="ad-card-footer">
                                    <a href="ad-details.html?id=${ad.id}" class="btn btn-outline-primary btn-sm w-100">عرض</a>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } else {
            grid.innerHTML = `<div class="col-12 text-center py-4"><p class="text-muted">تعذر تحميل المفضلة.</p></div>`;
        }
    },

    /**
     * Load user's own ads.
     * GET /ads?user_id=me (or similar filter)
     */
    async loadMyAds() {
        const grid = document.getElementById('myAdsGrid');
        if (!grid) return;

        // Try loading user ads from the general ads endpoint
        const result = await API.get('/ads?my_ads=1');

        if (result.success && result.data) {
            const ads = Array.isArray(result.data) ? result.data : (result.data.data || []);
            if (ads.length === 0) {
                grid.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-megaphone" style="font-size:2.5rem; color: var(--text-secondary); opacity:0.3;"></i>
                        <p class="text-muted mt-2">لم تنشر أي إعلانات بعد.</p>
                        <a href="post-ad.html" class="btn btn-primary btn-sm mt-1"><i class="bi bi-plus-circle me-1"></i> أضف إعلان</a>
                    </div>
                `;
            } else {
                grid.innerHTML = ads.map(ad => {
                    const image = API.resolveImageUrl(ad.images && ad.images.length > 0 ? ad.images[0].image_path : null, 'https://placehold.co/300x180/FFEDD5/F97316?text=لا+صورة');
                    const price = Number(ad.price || 0).toLocaleString('ar-YE');
                    const statusMap = { active: '🟢 نشط', pending: '🟡 قيد المراجعة', rejected: '🔴 مرفوض', expired: '⚫ منتهي' };
                    const statusText = statusMap[ad.status] || ad.status || '';
                    return `
                        <div class="col-md-6 col-lg-4">
                            <div class="ad-card" style="height:auto;">
                                <div class="ad-card-img"><img src="${image}" alt="${ad.title}" loading="lazy"></div>
                                <div class="ad-card-body">
                                    <h6 class="ad-card-title">${ad.title || ''}</h6>
                                    <div class="ad-card-price">${price} ر.ي</div>
                                    <small class="text-muted">${statusText}</small>
                                </div>
                                <div class="ad-card-footer">
                                    <a href="ad-details.html?id=${ad.id}" class="btn btn-outline-primary btn-sm w-100">عرض</a>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } else {
            grid.innerHTML = `<div class="col-12 text-center py-4"><p class="text-muted">تعذر تحميل إعلاناتك.</p></div>`;
        }
    },

    /**
     * Delete account.
     * DELETE /profile/delete - See profile.md Section 5
     */
    async handleDeleteAccount() {
        const confirmBtn = document.getElementById('btnConfirmDelete');
        UI.toggleBtnLoading(confirmBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/profile/delete`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH.getToken()}`,
                },
            });

            const result = await response.json();
            UI.toggleBtnLoading(confirmBtn, false);

            if (result.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
                if (modal) modal.hide();

                // Clear everything and redirect
                localStorage.clear();
                window.location.href = '/web/index.html';
            } else {
                UI.showAlert('alertContainer', 'حدث خطأ أثناء حذف الحساب.', 'danger');
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
                if (modal) modal.hide();
            }
        } catch (err) {
            UI.toggleBtnLoading(confirmBtn, false);
            UI.showAlert('alertContainer', getErrorMessage('network_error'), 'danger');
        }
    },
};


// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('editProfileForm')) {
        PROFILE.init();
    }
});
