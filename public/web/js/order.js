/**
 * Haraj-Maareb - Order Logic (order.js)
 * ================================================
 * Handles my-orders.html and order-details.html
 */

'use strict';

// ============================================
// MY ORDERS PAGE
// ============================================
const MY_ORDERS = {
    init() {
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }
        this.loadOrders();
    },

    async loadOrders() {
        const purchasesGrid = document.getElementById('purchasesGrid');
        const salesGrid = document.getElementById('salesGrid');
        
        if(purchasesGrid) purchasesGrid.innerHTML = this.renderSkeletons();
        if(salesGrid) salesGrid.innerHTML = this.renderSkeletons();

        const result = await API.get('/orders');

        if (result.success && result.data) {
            const purchases = result.data.purchases || [];
            const sales = result.data.sales || [];

            if (purchasesGrid) {
                if (purchases.length === 0) {
                    purchasesGrid.innerHTML = '<div class="col-12 text-center py-4 text-muted">لا توجد مشتريات</div>';
                } else {
                    purchasesGrid.innerHTML = purchases.map(o => this.renderOrderCard(o, 'purchase')).join('');
                }
            }

            if (salesGrid) {
                if (sales.length === 0) {
                    salesGrid.innerHTML = '<div class="col-12 text-center py-4 text-muted">لا توجد مبيعات</div>';
                } else {
                    salesGrid.innerHTML = sales.map(o => this.renderOrderCard(o, 'sale')).join('');
                }
            }
        } else {
            const err = '<div class="col-12 text-center py-4 text-danger">حدث خطأ في تحميل الطلبات</div>';
            if (purchasesGrid) purchasesGrid.innerHTML = err;
            if (salesGrid) salesGrid.innerHTML = err;
        }
    },

    renderSkeletons() {
        return `
            <div class="col-md-6 mb-3">
                <div class="card border-0 shadow-sm"><div class="card-body"><div class="skeleton-line w-75 mb-2"></div><div class="skeleton-line w-50"></div></div></div>
            </div>
        `;
    },

    renderOrderCard(order, type) {
        let badgeClass = 'bg-secondary';
        let statusText = 'غير محدد';
        
        switch(order.status) {
            case 'pending': badgeClass = 'bg-warning text-dark'; statusText = 'بانتظار الدفع'; break;
            case 'under_review': badgeClass = 'bg-info text-white'; statusText = 'قيد المراجعة'; break;
            case 'paid': badgeClass = 'bg-success'; statusText = 'تم الدفع'; break;
            case 'rejected': badgeClass = 'bg-danger'; statusText = 'مرفوض'; break;
            case 'completed': badgeClass = 'bg-primary'; statusText = 'مكتمل'; break;
        }

        const adTitle = order.ad ? order.ad.title : 'إعلان محذوف';
        const otherParty = type === 'purchase' ? (order.seller ? order.seller.name : 'مجهول') : (order.buyer ? order.buyer.name : 'مجهول');
        const price = Number(order.amount).toLocaleString('ar-YE');

        return `
            <div class="col-md-6 mb-3">
                <div class="card border-0 shadow-sm h-100" style="border-radius:12px;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0 fw-bold text-truncate" style="max-width: 70%;">${adTitle}</h6>
                            <span class="badge ${badgeClass}">${statusText}</span>
                        </div>
                        <p class="text-muted mb-1 small"><i class="bi bi-person me-1"></i> ${type === 'purchase' ? 'البائع' : 'المشتري'}: ${otherParty}</p>
                        <p class="text-primary fw-bold mb-3">${price} ر.ي</p>
                        <a href="order-details.html?id=${order.id}" class="btn btn-outline-primary btn-sm w-100">عرض التفاصيل</a>
                    </div>
                </div>
            </div>
        `;
    }
};

// ============================================
// ORDER DETAILS PAGE
// ============================================
const ORDER_DETAILS = {
    orderId: null,

    init() {
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        this.orderId = params.get('id');

        if (!this.orderId) {
            document.getElementById('orderDetailsContainer').innerHTML = '<div class="text-center py-5">طلب غير صالح</div>';
            return;
        }

        this.loadOrder();
        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('proofForm');
        if (form) {
            form.addEventListener('submit', (e) => this.uploadProof(e));
        }

        const acceptBtn = document.getElementById('btnAcceptProof');
        const rejectBtn = document.getElementById('btnRejectProof');
        
        if (acceptBtn) acceptBtn.addEventListener('click', () => this.reviewProof('accept'));
        if (rejectBtn) rejectBtn.addEventListener('click', () => this.reviewProof('reject'));
    },

    async loadOrder() {
        const container = document.getElementById('orderDetailsContainer');
        const result = await API.get(`/orders/${this.orderId}`);

        if (result.success && result.data && result.data.order) {
            this.renderOrder(result.data.order, result.data.is_buyer, result.data.is_seller);
        } else {
            container.innerHTML = `<div class="text-center py-5 text-danger">${result.message || 'حدث خطأ غير معروف'}</div>`;
        }
    },

    renderOrder(order, isBuyer, isSeller) {
        // Populate basic info
        document.getElementById('orderIdDisplay').textContent = '#' + order.id;
        document.getElementById('orderAdTitle').textContent = order.ad ? order.ad.title : 'إعلان غير متوفر';
        document.getElementById('orderAmount').textContent = Number(order.amount).toLocaleString('ar-YE') + ' ر.ي';
        document.getElementById('orderDate').textContent = new Date(order.created_at).toLocaleDateString('ar-YE');
        document.getElementById('otherPartyRole').textContent = isBuyer ? 'البائع' : 'المشتري';
        document.getElementById('otherPartyName').textContent = isBuyer ? (order.seller?.name || 'مجهول') : (order.buyer?.name || 'مجهول');

        // Status badge
        let badgeClass = 'bg-secondary';
        let statusText = 'غير محدد';
        switch(order.status) {
            case 'pending': badgeClass = 'bg-warning text-dark'; statusText = 'بانتظار الدفع'; break;
            case 'under_review': badgeClass = 'bg-info text-white'; statusText = 'قيد المراجعة'; break;
            case 'paid': badgeClass = 'bg-success'; statusText = 'تم الدفع'; break;
            case 'rejected': badgeClass = 'bg-danger'; statusText = 'مرفوض'; break;
            case 'completed': badgeClass = 'bg-primary'; statusText = 'مكتمل'; break;
        }
        document.getElementById('orderStatusBadge').className = 'badge ' + badgeClass;
        document.getElementById('orderStatusBadge').textContent = statusText;

        // Display conditional blocks
        const paymentInfoBlock = document.getElementById('paymentInfoBlock');
        const proofUploadBlock = document.getElementById('proofUploadBlock');
        const sellerReviewBlock = document.getElementById('sellerReviewBlock');
        const proofDisplayBlock = document.getElementById('proofDisplayBlock');

        // Reset visibility
        if(paymentInfoBlock) paymentInfoBlock.classList.add('d-none');
        if(proofUploadBlock) proofUploadBlock.classList.add('d-none');
        if(sellerReviewBlock) sellerReviewBlock.classList.add('d-none');
        if(proofDisplayBlock) proofDisplayBlock.classList.add('d-none');

        // Logic
        if (isBuyer && order.status === 'pending') {
            paymentInfoBlock.classList.remove('d-none');
            proofUploadBlock.classList.remove('d-none');
        }

        if (order.payment_proof) {
            proofDisplayBlock.classList.remove('d-none');
            const img = document.getElementById('proofImageDisplay');
            if (img) img.src = API.resolveImageUrl(order.payment_proof.image_path);
            const note = document.getElementById('proofNoteDisplay');
            if(note) note.textContent = order.payment_proof.note || 'لا توجد ملاحظات';
            
            const proofStatus = document.getElementById('proofStatusDisplay');
            if(proofStatus) {
                if(order.payment_proof.status === 'accepted') proofStatus.innerHTML = '<span class="text-success"><i class="bi bi-check-circle"></i> مقبول</span>';
                else if(order.payment_proof.status === 'rejected') {
                    proofStatus.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle"></i> مرفوض</span>';
                    
                    // Show rejection info
                    const rejInfo = document.getElementById('rejectionInfoDisplay');
                    const rejNote = document.getElementById('rejectionNoteDisplay');
                    const rejImgWrapper = document.getElementById('rejectionImageWrapper');
                    const rejImg = document.getElementById('rejectionImageDisplay');
                    
                    if (rejInfo) {
                        rejInfo.classList.remove('d-none');
                        if (rejNote) rejNote.textContent = order.payment_proof.rejection_note || 'تم الرفض بدون ملاحظات.';
                        
                        if (order.payment_proof.rejection_image_path) {
                            if (rejImgWrapper) rejImgWrapper.classList.remove('d-none');
                            if (rejImg) rejImg.src = API.resolveImageUrl(order.payment_proof.rejection_image_path);
                        }
                    }
                }
                else proofStatus.innerHTML = '<span class="text-warning"><i class="bi bi-clock"></i> قيد المراجعة</span>';
            }
        }

        if (isSeller && order.status === 'under_review') {
            sellerReviewBlock.classList.remove('d-none');
        }
    },

    async uploadProof(e) {
        e.preventDefault();
        UI.clearAlert('proofAlertContainer');

        const btn = document.getElementById('btnSubmitProof');
        const fileInput = document.getElementById('proofImage');
        const noteInput = document.getElementById('proofNote');

        if (!fileInput.files || fileInput.files.length === 0) {
            UI.showAlert('proofAlertContainer', 'يرجى اختيار صورة الإيصال', 'danger');
            return;
        }

        const formData = new FormData();
        formData.append('proof_image', fileInput.files[0]);
        if (noteInput.value) formData.append('note', noteInput.value);

        UI.toggleBtnLoading(btn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${this.orderId}/upload-proof`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${AUTH.getToken()}`,
                },
                body: formData
            });

            const result = await response.json();
            UI.toggleBtnLoading(btn, false);

            if (result.success || response.ok) {
                // Assuming it's success if response.ok is true even if custom format varies slightly
                UI.showAlert('proofAlertContainer', 'تم رفع إيصال الدفع بنجاح. سيتم مراجعته.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                UI.showAlert('proofAlertContainer', result.error || result.message || 'حدث خطأ', 'danger');
            }
        } catch(err) {
            UI.toggleBtnLoading(btn, false);
            UI.showAlert('proofAlertContainer', 'خطأ في الاتصال بالخادم', 'danger');
        }
    },

    async reviewProof(action) {
        const modalEl = document.getElementById('sellerConfirmModal');
        if (modalEl) {
            document.getElementById('modalConfirmAction').value = action;
            document.getElementById('modalConfirmMessage').textContent = action === 'accept' ? 'هل أنت متأكد من تأكيد استلام المبلغ المرفق؟' : 'هل أنت متأكد من رفض استلام هذا المبلغ؟';
            document.getElementById('btnExecuteConfirm').className = action === 'accept' ? 'btn btn-success flex-grow-1' : 'btn btn-danger flex-grow-1';
            document.getElementById('btnExecuteConfirm').innerHTML = action === 'accept' ? '<i class="bi bi-check-circle"></i> نعم، تأكيد وصول المبلغ' : '<i class="bi bi-x-circle"></i> نعم، رفض السند';
            
            // Rejection fields toggle
            const rejFields = document.getElementById('rejectionFields');
            if (rejFields) {
                if (action === 'reject') rejFields.classList.remove('d-none');
                else rejFields.classList.add('d-none');
            }

            // Get img and note from the existing display block
            const imgEl = document.getElementById('proofImageDisplay');
            const noteEl = document.getElementById('proofNoteDisplay');
            
            document.getElementById('modalConfirmImg').src = imgEl ? imgEl.src : '';
            document.getElementById('modalConfirmNote').textContent = noteEl ? noteEl.textContent : 'لا يوجد';

            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            const btnExe = document.getElementById('btnExecuteConfirm');
            // Remove old listeners to avoid multiple triggers
            const newBtn = btnExe.cloneNode(true);
            btnExe.parentNode.replaceChild(newBtn, btnExe);
            
            newBtn.addEventListener('click', async () => {
                newBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري التنفيذ...';
                newBtn.disabled = true;
                
                try {
                    let result;
                    if (action === 'reject') {
                        const formData = new FormData();
                        formData.append('action', action);
                        const rejImg = document.getElementById('rejectionImage');
                        const rejNote = document.getElementById('rejectionNote');
                        
                        if (rejImg && rejImg.files[0]) formData.append('rejection_image', rejImg.files[0]);
                        if (rejNote) formData.append('rejection_note', rejNote.value);
                        
                        const response = await fetch(`${API_BASE_URL}/orders/${this.orderId}/review`, {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${AUTH.getToken()}`,
                            },
                            body: formData
                        });
                        result = await response.json();
                    } else {
                        result = await API.post(`/orders/${this.orderId}/review`, { action });
                    }

                    if (result.success || result.data) {
                        alert(action === 'accept' ? 'تم قبول الإيصال بنجاح وتحديث حالة الطلب.' : 'تم رفض الإيصال.');
                        window.location.reload();
                    } else {
                        alert(result.error || result.message || 'حدث خطأ غير معروف');
                        newBtn.disabled = false;
                        newBtn.innerHTML = 'إعادة المحاولة';
                    }
                } catch (err) {
                    console.error(err);
                    alert('خطأ في الاتصال');
                    newBtn.disabled = false;
                    newBtn.innerHTML = 'إعادة المحاولة';
                }
            });

        } else {
            // Fallback natively if modal is not found
            if (!confirm(`هل أنت متأكد من ${action === 'accept' ? 'قبول' : 'رفض'} هذا الإيصال؟`)) return;
            const result = await API.post(`/orders/${this.orderId}/review`, { action });
            if (result.success || result.data) {
                alert(action === 'accept' ? 'تم قبول الإيصال' : 'تم رفض الإيصال');
                window.location.reload();
            } else {
                alert(result.error || result.message || 'حدث خطأ');
            }
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('purchasesGrid') || document.getElementById('salesGrid')) {
        MY_ORDERS.init();
    }
    if (document.getElementById('orderDetailsContainer')) {
        ORDER_DETAILS.init();
    }
});
