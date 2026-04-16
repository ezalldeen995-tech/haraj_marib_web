// Admin Orders logic
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

async function loadOrders() {
    const tableBody = document.querySelector('#orders-table tbody');
    const statusFilter = document.getElementById('filter-status').value;

    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>جاري التحميل...</td></tr>';

    try {
        const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        const result = await apiRequest('GET', `/admin/orders${query}`);

        if (result.success || result.orders) {
            const orders = result.orders || result.data.orders;
            if (!orders || orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">لا توجد طلبات</td></tr>';
                return;
            }

            tableBody.innerHTML = orders.map(order => renderOrderRow(order)).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">${result.message || 'خطأ في التحميل'}</td></tr>`;
        }
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">حدث خطأ في الاتصال بالخادم</td></tr>`;
    }
}

function renderOrderRow(order) {
    let badgeClass = 'bg-secondary';
    let statusText = 'غير محدد';
    switch(order.status) {
        case 'pending': badgeClass = 'bg-warning text-dark'; statusText = 'بانتظار الدفع'; break;
        case 'under_review': badgeClass = 'bg-info text-dark'; statusText = 'قيد المراجعة'; break;
        case 'paid': badgeClass = 'bg-success'; statusText = 'تم الدفع'; break;
        case 'rejected': badgeClass = 'bg-danger'; statusText = 'مرفوض'; break;
        case 'completed': badgeClass = 'bg-primary'; statusText = 'مكتمل'; break;
    }

    const proofBtn = order.paymentProof 
        ? `<button class="btn btn-sm btn-outline-primary" onclick="openReviewModal(${order.id}, '${order.paymentProof.image_path}', '${order.paymentProof.note || ''}')"><i class="bi bi-eye"></i> إيصال</button>`
        : '<span class="text-muted small">لا يوجد إيصال</span>';

    return `
        <tr>
            <td class="fw-bold">#${order.id}</td>
            <td class="text-truncate" style="max-width: 150px;" title="${order.ad?.title || ''}">${order.ad?.title || 'إعلان محذوف'}</td>
            <td class="fw-bold text-success">${Number(order.amount).toLocaleString('ar-YE')} ر.ي</td>
            <td>${order.buyer?.name || 'مشتري محذوف'}</td>
            <td>${order.seller?.name || 'بائع محذوف'}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td>${proofBtn}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-success" onclick="adminReview(${order.id}, 'accept')" title="تأكيد الدفع" ${order.status === 'paid' ? 'disabled' : ''}><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="adminReview(${order.id}, 'reject')" title="رفض الدفع" ${order.status === 'rejected' ? 'disabled' : ''}><i class="bi bi-x-lg"></i></button>
                </div>
            </td>
        </tr>
    `;
}

function openReviewModal(orderId, imagePath, note) {
    document.getElementById('reviewOrderId').value = orderId;
    document.getElementById('reviewImg').src = `/storage/${imagePath}`;
    document.getElementById('reviewNote').textContent = note || 'لا توجد ملاحظات';
    
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
}

async function submitReview(action) {
    const orderId = document.getElementById('reviewOrderId').value;
    const modalEl = document.getElementById('reviewModal');
    
    // Check if we need to show rejection fields first
    const rejFields = document.getElementById('adminRejectionFields');
    if (action === 'reject' && rejFields.classList.contains('d-none')) {
        rejFields.classList.remove('d-none');
        return; // Let the admin fill the fields and click again
    }

    const modal = bootstrap.Modal.getInstance(modalEl);
    
    let extraData = null;
    if (action === 'reject') {
        extraData = new FormData();
        extraData.append('action', action);
        const imgInput = document.getElementById('adminRejectionImage');
        const noteInput = document.getElementById('adminRejectionNote');
        if (imgInput.files[0]) extraData.append('rejection_image', imgInput.files[0]);
        if (noteInput.value) extraData.append('rejection_note', noteInput.value);
    }

    if (modal) modal.hide();
    
    await adminReview(orderId, action, extraData);
    
    // Reset fields for next time
    if (rejFields) rejFields.classList.add('d-none');
    document.getElementById('adminRejectionImage').value = '';
    document.getElementById('adminRejectionNote').value = '';
}

async function adminReview(orderId, action, extraData = null) {
    if(!extraData && !confirm(`هل أنت متأكد من ${action === 'accept' ? 'تأكيد' : 'رفض'} الدفع لهذا الطلب؟`)) return;

    try {
        let result;
        if (extraData) {
            // Using FormData for rejection with image
            const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/review`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                },
                body: extraData
            });
            result = await response.json();
        } else {
            result = await apiRequest('POST', `/admin/orders/${orderId}/review`, { action });
        }

        if (result.success || result.data || result.message) {
            showToast('تم تحديث حالة الطلب بنجاح', 'success');
            loadOrders();
        } else {
            showToast(result.error || result.message || 'حدث خطأ', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال', 'error');
    }
}
