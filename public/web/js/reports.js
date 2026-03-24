/**
 * Haraj-Maareb - Report Ad Logic (reports.js)
 * ================================================
 * Handles the Report Ad modal and submission.
 * Report endpoints are documented in reports.md.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const REPORT_AD = {
    adId: null,
    modalInstance: null,
    submitted: false,

    /**
     * Initialize report feature on ad details page.
     */
    init(adId) {
        this.adId = adId;

        // Show report button only for logged-in users (not ad owner — handled by ads.js)
        const btn = document.getElementById('btnReportAd');
        if (btn && AUTH.isLoggedIn()) {
            btn.classList.remove('d-none');
            btn.addEventListener('click', () => this.openModal());
        }

        // Character counter
        const textarea = document.getElementById('reportReason');
        const counter = document.getElementById('reportCharCount');
        if (textarea && counter) {
            textarea.addEventListener('input', () => {
                const len = textarea.value.length;
                counter.textContent = `${len} / 1000`;
                counter.style.color = len > 900 ? '#EF4444' : '';
            });
        }

        // Submit button
        const submitBtn = document.getElementById('btnSubmitReport');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submit());
        }
    },

    /**
     * Open the report modal.
     */
    openModal() {
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        if (this.submitted) return; // Already reported

        this.resetModal();

        const modalEl = document.getElementById('reportModal');
        if (!modalEl) return;

        this.modalInstance = new bootstrap.Modal(modalEl);
        this.modalInstance.show();
    },

    /**
     * Reset modal state.
     */
    resetModal() {
        const textarea = document.getElementById('reportReason');
        if (textarea) textarea.value = '';

        const counter = document.getElementById('reportCharCount');
        if (counter) counter.textContent = '0 / 1000';

        const alert = document.getElementById('reportAlertContainer');
        if (alert) alert.innerHTML = '';
    },

    /**
     * Submit report.
     * POST /reports - See reports.md Section 1
     */
    async submit() {
        const alert = document.getElementById('reportAlertContainer');
        if (alert) alert.innerHTML = '';

        const reason = document.getElementById('reportReason')?.value.trim();

        // Client-side validation
        if (!reason) {
            if (alert) {
                alert.innerHTML = `<div class="alert alert-danger py-2" style="font-size:0.9rem;">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i> يرجى كتابة سبب الإبلاغ
                </div>`;
            }
            return;
        }

        const submitBtn = document.getElementById('btnSubmitReport');
        UI.toggleBtnLoading(submitBtn, true);

        const result = await API.post('/reports', {
            ad_id: this.adId,
            reason: reason,
        });

        UI.toggleBtnLoading(submitBtn, false, '<i class="bi bi-flag me-1"></i> إرسال البلاغ');

        if (result.success || result._status === 201) {
            // Success
            this.submitted = true;

            // Close modal
            if (this.modalInstance) this.modalInstance.hide();

            // Disable report button
            const btn = document.getElementById('btnReportAd');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> تم الإبلاغ';
                btn.classList.remove('btn-outline-danger');
                btn.classList.add('btn-secondary');
            }

            // Toast
            this.showToast('شكراً، تم إرسال بلاغك وسيتم مراجعته ✅', 'success');
        } else {
            // Handle errors
            let errorMsg = 'حدث خطأ أثناء إرسال البلاغ';

            if (result._status === 403 || (result.message && result.message.includes('own'))) {
                errorMsg = 'لا يمكنك الإبلاغ عن إعلانك الخاص';
            } else if (result._status === 422 && result.errors) {
                errorMsg = Object.values(result.errors).flat().join('<br>');
            } else if (result.message) {
                errorMsg = result.message;
            }

            if (alert) {
                alert.innerHTML = `<div class="alert alert-danger py-2" style="font-size:0.9rem;">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i> ${errorMsg}
                </div>`;
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
};


// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize on ad-details page
    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');
    if (adId && document.getElementById('btnReportAd')) {
        REPORT_AD.init(parseInt(adId));
    }
});
