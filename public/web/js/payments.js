/**
 * Haraj-Maareb - Payments Logic (payments.js)
 * ================================================
 * Handles subscription request form, receipt upload,
 * and payment history display.
 * See payment.md for API documentation.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const PAYMENTS = {

    /**
     * Initialize payments page.
     */
    init() {
        // Auth guard
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        this.loadBankDetails();
        this.loadPaymentHistory();
        this.bindEvents();
    },

    /**
     * Load bank details from app settings.
     * Uses SETTINGS helper from app.js
     */
    async loadBankDetails() {
        // Load settings (will use cache if available)
        await SETTINGS.load();

        const bankName = SETTINGS.get('bank_name');
        const bankHolder = SETTINGS.get('bank_account_name');
        const bankAccount = SETTINGS.get('bank_account_number');

        const nameEl = document.getElementById('bankName');
        const holderEl = document.getElementById('bankHolder');
        const accountEl = document.getElementById('bankAccount');

        if (bankName && nameEl) nameEl.textContent = bankName;
        if (bankHolder && holderEl) holderEl.textContent = bankHolder;
        if (bankAccount && accountEl) accountEl.textContent = bankAccount;

        // If all empty, show fallback
        if (!bankName && !bankHolder && !bankAccount) {
            const card = document.querySelector('.payment-bank-details');
            if (card) {
                card.innerHTML = `
                    <div class="text-center py-3">
                        <i class="bi bi-info-circle" style="font-size:1.5rem; color:var(--primary); display:block; margin-bottom:8px;"></i>
                        <p class="text-muted mb-0" style="font-size:0.9rem;">يرجى التواصل مع الإدارة لمعرفة معلومات الحساب البنكي</p>
                    </div>
                `;
            }
        }
    },

    /**
     * Bind all events.
     */
    bindEvents() {
        // Form submission
        const form = document.getElementById('paymentForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Plan selection (clickable cards)
        document.querySelectorAll('.payment-plan-option').forEach(option => {
            option.addEventListener('click', () => {
                // Clear all active
                document.querySelectorAll('.payment-plan-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');

                // Set form values from the selected plan
                const months = option.dataset.months;
                const price = option.dataset.price;
                document.getElementById('paymentMonths').value = months;
                document.getElementById('paymentAmount').value = price;
            });
        });

        // Receipt upload area
        const uploadArea = document.getElementById('receiptUploadArea');
        const fileInput = document.getElementById('receiptInput');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());

            // Drag & Drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    fileInput.files = e.dataTransfer.files;
                    this.previewReceipt(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.previewReceipt(e.target.files[0]);
                }
            });
        }

        // Remove receipt preview
        const removeBtn = document.getElementById('removeReceipt');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.clearReceipt());
        }
    },

    /**
     * Preview the selected receipt image.
     */
    previewReceipt(file) {
        // Validate size (4MB)
        if (file.size > 4 * 1024 * 1024) {
            UI.showAlert('alertContainer', 'حجم الصورة يجب ألا يتجاوز 4 ميجابايت.', 'danger');
            this.clearReceipt();
            return;
        }

        // Validate type
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            UI.showAlert('alertContainer', 'يجب أن تكون الصورة بصيغة JPEG أو PNG.', 'danger');
            this.clearReceipt();
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('receiptPreviewImg').src = ev.target.result;
            document.getElementById('receiptPreview')?.classList.remove('d-none');
            document.getElementById('receiptUploadArea')?.classList.add('d-none');
        };
        reader.readAsDataURL(file);
    },

    /**
     * Clear receipt preview and reset file input.
     */
    clearReceipt() {
        document.getElementById('receiptInput').value = '';
        document.getElementById('receiptPreview')?.classList.add('d-none');
        document.getElementById('receiptUploadArea')?.classList.remove('d-none');
    },

    // ============================================
    // SUBMIT PAYMENT REQUEST
    // ============================================

    /**
     * Handle subscription request form submission.
     * POST /payments/request — See payment.md Section 1
     */
    async handleSubmit(e) {
        e.preventDefault();
        UI.clearAlert('alertContainer');

        const months = document.getElementById('paymentMonths').value;
        const amount = document.getElementById('paymentAmount').value;
        const fileInput = document.getElementById('receiptInput');
        const file = fileInput?.files[0];
        const submitBtn = document.getElementById('btnSubmitPayment');

        // Client-side validation
        if (!months) {
            UI.showAlert('alertContainer', 'يرجى اختيار مدة الاشتراك.', 'danger');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            UI.showAlert('alertContainer', 'يرجى إدخال المبلغ المحول.', 'danger');
            return;
        }
        if (!file) {
            UI.showAlert('alertContainer', 'يرجى رفع صورة الإيصال.', 'danger');
            return;
        }

        // Build FormData
        const formData = new FormData();
        formData.append('months', months);
        formData.append('amount', amount);
        formData.append('receipt_image', file);

        UI.toggleBtnLoading(submitBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/payments/request`, {
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
                UI.showAlert('alertContainer', 'تم إرسال طلبك بنجاح ✓ سيتم مراجعته قريباً.', 'success');

                // Reset form
                document.getElementById('paymentForm').reset();
                this.clearReceipt();
                document.querySelectorAll('.payment-plan-option').forEach(o => o.classList.remove('selected'));

                // Reload history
                this.loadPaymentHistory();
            } else {
                if (result.errors) {
                    const messages = Object.values(result.errors).flat().join('<br>');
                    UI.showAlert('alertContainer', messages, 'danger');
                } else {
                    UI.showAlert('alertContainer', result.message || 'حدث خطأ أثناء إرسال الطلب.', 'danger');
                }
            }
        } catch (err) {
            UI.toggleBtnLoading(submitBtn, false);
            UI.showAlert('alertContainer', 'حدث خطأ في الاتصال. حاول مرة أخرى.', 'danger');
        }
    },

    // ============================================
    // PAYMENT HISTORY
    // ============================================

    /**
     * Load payment history.
     * GET /payments — See payment.md Section 2
     */
    async loadPaymentHistory(page = 1) {
        const container = document.getElementById('paymentHistoryList');
        if (!container) return;

        const result = await API.get(`/payments?page=${page}`);

        if (result.success && result.data) {
            const payments = Array.isArray(result.data) ? result.data : (result.data.data || []);
            const meta = result.data.meta || result.meta || {};

            if (payments.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-credit-card" style="font-size:2.5rem; opacity:0.2; display:block; margin-bottom:12px;"></i>
                        <p class="text-muted mb-0">لا توجد مدفوعات سابقة</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = payments.map(payment => {
                const statusMap = {
                    pending: { text: 'قيد المراجعة', class: 'payment-status-pending', icon: 'bi-hourglass-split' },
                    approved: { text: 'مقبول', class: 'payment-status-approved', icon: 'bi-check-circle-fill' },
                    rejected: { text: 'مرفوض', class: 'payment-status-rejected', icon: 'bi-x-circle-fill' },
                };
                const status = statusMap[payment.status] || statusMap.pending;
                const monthsMap = { 1: 'شهر', 3: '3 أشهر', 6: '6 أشهر', 12: '12 شهر' };
                const monthLabel = monthsMap[payment.months] || `${payment.months} شهر`;
                const amount = Number(payment.amount || 0).toLocaleString('ar-YE');
                const date = new Date(payment.created_at).toLocaleDateString('ar-SA');
                const receiptUrl = payment.receipt_image
                    ? `http://haraj-maareb.test/storage/${payment.receipt_image}`
                    : null;

                return `
                    <div class="payment-history-item">
                        <div class="payment-history-top">
                            <div>
                                <span class="fw-bold" style="color:var(--primary);">${amount} ر.ي</span>
                                <span class="text-muted mx-1">—</span>
                                <span class="text-muted">${monthLabel}</span>
                            </div>
                            <span class="payment-status-badge ${status.class}">
                                <i class="bi ${status.icon} me-1"></i> ${status.text}
                            </span>
                        </div>
                        <div class="payment-history-bottom">
                            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${date}</small>
                            ${receiptUrl ? `
                                <button class="btn btn-sm btn-outline-primary" onclick="PAYMENTS.viewReceipt('${receiptUrl}')">
                                    <i class="bi bi-image me-1"></i> الإيصال
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // Pagination
            this.renderPagination(meta);
        } else {
            container.innerHTML = `<div class="text-center py-4"><p class="text-muted">تعذر تحميل السجل</p></div>`;
        }
    },

    /**
     * Render pagination controls.
     */
    renderPagination(meta) {
        const container = document.getElementById('paymentPagination');
        if (!container || !meta.last_page || meta.last_page <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let html = '<nav><ul class="pagination pagination-sm justify-content-center mb-0">';
        for (let i = 1; i <= meta.last_page; i++) {
            html += `
                <li class="page-item ${i === meta.current_page ? 'active' : ''}">
                    <button class="page-link" onclick="PAYMENTS.loadPaymentHistory(${i})">${i}</button>
                </li>
            `;
        }
        html += '</ul></nav>';
        container.innerHTML = html;
    },

    /**
     * View receipt image in modal.
     */
    viewReceipt(imageUrl) {
        document.getElementById('receiptModalImg').src = imageUrl;
        const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
        modal.show();
    },
};


// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('paymentForm')) {
        PAYMENTS.init();
    }
});
