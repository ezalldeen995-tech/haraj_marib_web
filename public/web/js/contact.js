/**
 * Haraj-Maareb - Contact Us Logic (contact.js)
 * ================================================
 * Handles the Contact Us form: validation, submission, and UI feedback.
 * Contact endpoints are documented in contact.md.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const CONTACT_PAGE = {

    /**
     * Initialize the contact page.
     */
    init() {
        // Auth check
        if (!AUTH.isLoggedIn()) {
            const container = document.querySelector('.contact-form-card');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-lock" style="font-size: 3.5rem; color: var(--primary); opacity: 0.5;"></i>
                        <h5 class="mt-3 fw-bold">يجب تسجيل الدخول لاستخدام هذه الميزة</h5>
                        <p class="text-muted">قم بتسجيل الدخول أولاً حتى تتمكن من إرسال رسالة</p>
                        <a href="/web/login.html" class="btn btn-primary mt-2">
                            <i class="bi bi-box-arrow-in-right me-1"></i> تسجيل الدخول
                        </a>
                    </div>
                `;
            }
            return;
        }

        this.prefillUserData();
        this.bindEvents();
    },

    /**
     * Pre-fill the name field from localStorage user data.
     */
    prefillUserData() {
        const user = AUTH.getUser();
        if (user) {
            const nameInput = document.getElementById('contactName');
            if (nameInput && user.name) {
                nameInput.value = user.name;
            }
            const emailInput = document.getElementById('contactEmail');
            if (emailInput && user.email) {
                emailInput.value = user.email;
            }
            const phoneInput = document.getElementById('contactPhone');
            if (phoneInput && user.phone) {
                phoneInput.value = user.phone;
            }
        }
    },

    /**
     * Bind form events.
     */
    bindEvents() {
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Character counter for message
        const messageInput = document.getElementById('contactMessage');
        const charCount = document.getElementById('charCount');
        if (messageInput && charCount) {
            messageInput.addEventListener('input', () => {
                const len = messageInput.value.length;
                charCount.textContent = `${len} / 2000`;
                if (len > 1800) {
                    charCount.style.color = '#EF4444';
                } else {
                    charCount.style.color = '';
                }
            });
        }
    },

    /**
     * Clear all validation error states.
     */
    clearErrors() {
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
        UI.clearAlert('alertContainer');
    },

    /**
     * Show a field-level validation error.
     */
    showFieldError(fieldId, message) {
        const input = document.getElementById(fieldId);
        const errEl = document.getElementById(`err-${fieldId.replace('contact', '').toLowerCase()}`);
        if (input) input.classList.add('is-invalid');
        if (errEl) {
            errEl.textContent = message;
            errEl.style.display = 'block';
        }
    },

    /**
     * Handle form submission.
     * POST /contact - See contact.md Section 1
     */
    async handleSubmit(e) {
        e.preventDefault();
        this.clearErrors();

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        // Client-side validation
        let hasError = false;

        if (!name) {
            this.showFieldError('contactName', 'حقل الاسم مطلوب');
            hasError = true;
        }

        if (!message) {
            this.showFieldError('contactMessage', 'حقل الرسالة مطلوب');
            hasError = true;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showFieldError('contactEmail', 'البريد الإلكتروني غير صالح');
            hasError = true;
        }

        if (hasError) return;

        // Build request data
        const data = { name, message };
        if (email) data.email = email;
        if (phone) data.phone = phone;

        const submitBtn = document.getElementById('btnSubmit');
        UI.toggleBtnLoading(submitBtn, true);

        const result = await API.post('/contact', data);

        UI.toggleBtnLoading(submitBtn, false, '<i class="bi bi-send me-2"></i> إرسال الرسالة');

        if (result.success || result._status === 201) {
            // Success
            UI.showAlert('alertContainer', 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً ✉️', 'success');

            // Clear the form
            document.getElementById('contactForm').reset();
            const charCount = document.getElementById('charCount');
            if (charCount) charCount.textContent = '0 / 2000';

            // Re-prefill user data
            this.prefillUserData();

            // Show toast
            this.showToast('تم إرسال الرسالة بنجاح ✉️', 'success');
        } else {
            // Handle validation errors from server
            if (result.errors) {
                for (const [field, messages] of Object.entries(result.errors)) {
                    const fieldMap = {
                        'name': 'contactName',
                        'email': 'contactEmail',
                        'phone': 'contactPhone',
                        'message': 'contactMessage',
                    };
                    const fieldId = fieldMap[field];
                    if (fieldId) {
                        this.showFieldError(fieldId, messages[0]);
                    }
                }
            } else {
                UI.showAlert('alertContainer', getErrorMessage(result.message), 'danger');
            }
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
};


// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('contactForm') || document.querySelector('.contact-form-card')) {
        CONTACT_PAGE.init();
    }
});
