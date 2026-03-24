/**
 * Haraj-Maareb - Block User Logic (block.js)
 * ================================================
 * Handles blocking/unblocking users from ad-details page.
 * See blocks.md for API documentation.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const BLOCK_USER = {
    userId: null,
    isBlocked: false,

    /**
     * Initialize block feature on ad details page.
     * @param {number} sellerId - The seller/user ID to block.
     */
    init(sellerId) {
        if (!sellerId) return;
        this.userId = sellerId;

        const btn = document.getElementById('btnBlockUser');
        if (!btn) return;

        // Only show for logged-in users who are NOT the ad owner
        const currentUser = AUTH.getUser();
        if (!AUTH.isLoggedIn() || (currentUser && currentUser.id == sellerId)) {
            return; // Don't show block button for own ads
        }

        btn.classList.remove('d-none');
        btn.addEventListener('click', () => this.toggleBlock());
    },

    /**
     * Toggle block/unblock user with confirmation.
     * POST /block/toggle - See blocks.md
     */
    async toggleBlock() {
        const btn = document.getElementById('btnBlockUser');
        if (!btn) return;

        // Confirmation dialog
        const msg = this.isBlocked
            ? 'هل تريد إلغاء حظر هذا المستخدم؟'
            : 'هل أنت متأكد من حظر هذا المستخدم؟ لن يتمكن من مراسلتك.';

        if (!confirm(msg)) return;

        // Loading state
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> جاري...';

        const result = await API.post('/block/toggle', {
            user_id: this.userId,
        });

        btn.disabled = false;

        if (result.success && result.data) {
            this.isBlocked = result.data.blocked;
            this.updateUI();

            // Toast
            const toastMsg = this.isBlocked
                ? 'تم حظر المستخدم بنجاح ⛔'
                : 'تم إلغاء الحظر ✅';
            this.showToast(toastMsg, this.isBlocked ? 'danger' : 'success');
        } else {
            btn.innerHTML = originalHtml;

            // Handle errors
            if (result.message === 'cannot_block_self' || result._status === 400) {
                alert('لا يمكنك حظر نفسك');
            } else {
                this.showToast('حدث خطأ أثناء العملية', 'danger');
            }
        }
    },

    /**
     * Update button and chat button UI based on block state.
     */
    updateUI() {
        const btn = document.getElementById('btnBlockUser');
        const chatBtn = document.getElementById('btnChat');

        if (btn) {
            if (this.isBlocked) {
                btn.innerHTML = '<i class="bi bi-unlock me-1"></i> إلغاء الحظر';
                btn.className = 'btn btn-danger btn-sm mt-2 w-100';
            } else {
                btn.innerHTML = '<i class="bi bi-slash-circle me-1"></i> حظر المستخدم';
                btn.className = 'btn btn-outline-secondary btn-sm mt-2 w-100';
            }
        }

        if (chatBtn) {
            if (this.isBlocked) {
                chatBtn.disabled = true;
                chatBtn.classList.remove('btn-primary');
                chatBtn.classList.add('btn-secondary');
                chatBtn.innerHTML = '<i class="bi bi-chat-dots me-1"></i> تم حظر المستخدم';
            } else {
                chatBtn.disabled = false;
                chatBtn.classList.remove('btn-secondary');
                chatBtn.classList.add('btn-primary');
                chatBtn.innerHTML = '<i class="bi bi-chat-dots me-1"></i> تواصل مع البائع';
            }
        }
    },

    /**
     * Show toast notification.
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
        const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-slash-circle';

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
};
