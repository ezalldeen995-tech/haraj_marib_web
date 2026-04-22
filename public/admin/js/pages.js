// public/admin/js/pages.js

// ==== DASHBOARD LOGIC ====
async function loadDashboard() {
    try {
        // Fetch stats
        const resStats = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        });
        const statsData = await resStats.json();

        if (statsData.success) {
            document.getElementById('stat-users').innerText = statsData.data.users_this_month;
            document.getElementById('stat-active-ads').innerText = statsData.data.ads.active;
            document.getElementById('stat-pending-ads').innerText = statsData.data.ads.pending;
            document.getElementById('stat-revenue').innerText = statsData.data.payments.revenue.toFixed(2);
        }

        // Fetch pending payments (short list format)
        const resPayments = await fetch(`${BASE_URL}/admin/payments/pending`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        });
        const paymentsData = await resPayments.json();

        const tbody = document.querySelector('#recent-payments-table tbody');
        tbody.innerHTML = ''; // clear

        if (paymentsData.success && paymentsData.data.length > 0) {
            // take up to 5
            const recent = paymentsData.data.slice(0, 5);
            recent.forEach(pay => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${pay.id}</td>
                    <td>${pay.user ? pay.user.name : 'Unknown User'}</td>
                    <td>${pay.amount}</td>
                    <td>${pay.months}</td>
                    <td>${new Date(pay.created_at).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No pending payments.</td></tr>';
        }

        // Fetch Analytics for Charts
        const resAnalytics = await fetch(`${BASE_URL}/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        });
        const analyticsData = await resAnalytics.json();

        if (analyticsData.success) {
            renderCharts(analyticsData.data);
        }
    } catch (error) {
        console.error("Dashboard Load Error:", error);
    }
}

function renderCharts(data) {
    // Registrations Chart
    const regCtx = document.getElementById('registrationsChart');
    if (regCtx) {
        const labels = data.registrations_last_7_days.map(item => item.date);
        const counts = data.registrations_last_7_days.map(item => item.count);

        new Chart(regCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Users',
                    data: counts,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Ads Category Doughnut Chart
    const catCtx = document.getElementById('adsCategoryChart');
    if (catCtx) {
        const labels = data.ads_by_category.map(item => item.category ? item.category.name_en : 'Unknown');
        const counts = data.ads_by_category.map(item => item.count);

        new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                }]
            },
            options: {
                responsive: true
            }
        });
    }
}

// ==== USERS LOGIC ====
let currentPageUsers = 1;
async function loadUsers(page = 1) {
    currentPageUsers = page;
    const searchInput = document.getElementById('search-input').value;
    let url = `/admin/users?page=${page}`;
    if (searchInput) url += `&search=${encodeURIComponent(searchInput)}`;

    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';

    const res = await apiRequest('GET', url);


    if (!res) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">API error or unauthenticated.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    // Safely fallback to Array if data is missing or object structured differently
    const users = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No data found.</td></tr>';
    } else {
        users.forEach(user => {
            const tr = document.createElement('tr');
            const statusBadge = user.is_blocked
                ? '<span class="badge rounded-pill bg-danger px-3 py-2">محظور</span>'
                : '<span class="badge rounded-pill bg-success px-3 py-2">نشط</span>';

            const toggleBtn = user.is_blocked
                ? `<button class="btn btn-sm btn-success px-3 fw-bold shadow-sm" onclick="toggleBlockUser(${user.id})"><i class="bi bi-unlock"></i> فك الحظر</button>`
                : `<button class="btn btn-sm btn-danger px-3 fw-bold shadow-sm" onclick="toggleBlockUser(${user.id})"><i class="bi bi-lock"></i> حظر</button>`;

            tr.innerHTML = `
                <td>#${user.id}</td>
                <td>${user.name}</td>
                <td>${user.phone}</td>
                <td>${user.email}</td>
                <td>${statusBadge}</td>
                <td>${toggleBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderPagination('users-pagination', res.meta, loadUsers);
}

async function toggleBlockUser(id) {
    showConfirmModal('Toggle Block', 'Are you sure you want to toggle block status for this user?', async () => {
        const res = await apiRequest('POST', `/admin/users/${id}/toggle-block`);
        if (res) {
            showToast(res.message, 'success');
            loadUsers(currentPageUsers);
        }
    });
}

// ==== ADS LOGIC ====
let currentPageAds = 1;
let currentAdsData = {};
async function loadAds(page = 1) {
    currentPageAds = page;
    const statusFilter = document.getElementById('filter-status').value;
    let url = `/admin/ads?page=${page}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    const tbody = document.querySelector('#ads-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';

    const res = await apiRequest('GET', url);


    if (!res) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">API error or unauthenticated.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    // Safely fallback to Array if data is missing
    const ads = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    currentAdsData = {};

    if (ads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No data found.</td></tr>';
    } else {
        ads.forEach(ad => {
            currentAdsData[ad.id] = ad;
            const tr = document.createElement('tr');

            let statusBadge = '<span class="badge rounded-pill bg-success px-3 py-2">نشط</span>';
            if (ad.status === 'pending') statusBadge = '<span class="badge rounded-pill bg-warning px-3 py-2 text-dark">معلق</span>';
            if (ad.status === 'rejected') statusBadge = '<span class="badge rounded-pill bg-danger px-3 py-2">مرفوض</span>';
            if (ad.status === 'sold') statusBadge = '<span class="badge rounded-pill bg-info px-3 py-2 text-dark">مباع</span>';

            if (ad.auction) {
                statusBadge += ' <span class="badge rounded-pill bg-primary px-3 py-2 ms-1"><i class="bi bi-hammer"></i> مزاد</span>';
            }

            let actions = '';
            if (ad.status === 'pending') {
                actions += `<button class="btn btn-sm btn-success btn-approve shadow-sm ms-1" data-id="${ad.id}"><i class="bi bi-check-circle" style="pointer-events: none;"></i> قبول</button>`;
                actions += `<button class="btn btn-sm btn-warning btn-reject shadow-sm ms-1" data-id="${ad.id}"><i class="bi bi-x-circle" style="pointer-events: none;"></i> رفض</button>`;
            }
            // For now frontend force deletes
            actions += `<button class="btn btn-sm btn-danger btn-delete shadow-sm" data-id="${ad.id}"><i class="bi bi-trash" style="pointer-events: none;"></i> حذف</button>`;

            let imgThumbnail = '<div class="text-muted text-center" style="font-size:0.8rem;">لا توجد صورة</div>';
            if (ad.images && ad.images.length > 0) {
                const imgPath = ad.images[0].image_path;
                const storageBase = typeof BASE_URL !== 'undefined' ? BASE_URL.replace('/api/v1', '/storage') : '/storage';
                const imgUrl = imgPath ? `${storageBase}/${imgPath}` : (ad.images[0].url || '');
                if (imgUrl) {
                    imgThumbnail = `<img src="${imgUrl}" alt="صورة" class="rounded border shadow-sm" style="width: 50px; height: 50px; object-fit: cover;">`;
                }
            }

            tr.innerHTML = `
                <td>#${ad.id}</td>
                <td>${ad.title}</td>
                <td class="text-center">${imgThumbnail}</td>
                <td>${ad.user ? ad.user.name : 'Unknown User'}</td>
                <td>${ad.category ? ad.category.name_en : 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderPagination('ads-pagination', res.meta, loadAds);
}

// ==== AUCTIONS LOGIC ====
let currentPageAuctions = 1;
async function loadAuctions(page = 1) {
    currentPageAuctions = page;
    const statusFilter = document.getElementById('filter-status').value;
    let url = `/admin/auctions?page=${page}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    const tbody = document.querySelector('#auctions-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading...</td></tr>';

    const res = await apiRequest('GET', url);

    if (!res) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">API error or unauthenticated.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    const auctions = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    if (auctions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد مزادات.</td></tr>';
    } else {
        auctions.forEach((auction, index) => {
            const tr = document.createElement('tr');

            let statusBadge = '<span class="badge rounded-pill bg-success px-3 py-2">نشط</span>';
            if (auction.status === 'ended') statusBadge = '<span class="badge rounded-pill bg-info px-3 py-2 text-dark">منتهي</span>';
            if (auction.status === 'cancelled') statusBadge = '<span class="badge rounded-pill bg-danger px-3 py-2">ملغي</span>';

            const adTitle = auction.ad ? auction.ad.title : 'إعلان محذوف';
            const price = Number(auction.current_price).toLocaleString('ar-YE');
            const startPrice = Number(auction.start_price).toLocaleString('ar-YE');
            const bidsCount = auction.bids ? auction.bids.length : 0;
            const endDate = new Date(auction.end_time).toLocaleString('ar-YE');

            tr.innerHTML = `
                <td>#${auction.id}</td>
                <td title="${adTitle}">${adTitle.length > 25 ? adTitle.substring(0, 25) + '...' : adTitle}</td>
                <td class="text-success fw-bold">${price} ر.ي</td>
                <td>${startPrice} ر.ي</td>
                <td><span class="badge bg-secondary">${bidsCount} مزايدات</span></td>
                <td><small>${endDate}</small></td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (res.meta) {
        renderPagination('auctions-pagination', res.meta, loadAuctions);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Event Delegation. Attach one listener to the Table Body.
    const adsTableBody = document.querySelector('#ads-table tbody');
    if (adsTableBody) {
        adsTableBody.addEventListener('click', async (e) => {
            // Find closest action button if click was on or inside it (e.g. on the <i> icon)
            const targetBtn = e.target.closest('.btn-approve, .btn-reject, .btn-delete');

            // If the click wasn't on one of our action buttons, do nothing
            if (!targetBtn) return;

            const id = targetBtn.getAttribute('data-id');
            console.log('Button clicked! ID:', id);

            if (!id) {
                console.error("Action button clicked but no data-id found");
                return;
            }

            if (targetBtn.classList.contains('btn-approve')) {
                console.log('Approve clicked for ID:', id);

                const ad = currentAdsData[id];
                const adTitle = ad?.title || 'غير معروف';
                const publisherName = ad?.user?.name || 'غير معروف';
                const adPrice = ad?.price ? ad.price + ' ' + (ad.currency || '') : 'غير محدد';
                const adDesc = ad?.description || 'لا يوجد وصف';

                let detailsMsg = `
                <div class="text-end mb-3 p-3 bg-light rounded border" style="font-size: 0.95rem;">
                        <h6 class="text-primary fw-bold mb-3 border-bottom pb-2"><i class="bi bi-info-circle me-1"></i> تفاصيل الإعلان: ${ad?.auction ? '<span class="badge bg-warning text-dark"><i class="bi bi-hammer"></i> مزاد</span>' : ''}</h6>
                        <div class="row mb-2">
                            <div class="col-sm-4 text-muted">اسم الإعلان:</div>
                            <div class="col-sm-8 fw-bold">${adTitle}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-sm-4 text-muted">الناشر:</div>
                            <div class="col-sm-8 fw-bold">${publisherName}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-sm-4 text-muted">السعر:</div>
                            <div class="col-sm-8 fw-bold text-success">${adPrice}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-sm-4 text-muted">الوصف:</div>
                            <div class="col-sm-8" style="max-height: 80px; overflow-y: auto;">${adDesc}</div>
                        </div>
                `;

                if (ad?.images && ad?.images.length > 0) {
                    const imgPath = ad.images[0].image_path;
                    const storageBase = typeof BASE_URL !== 'undefined' ? BASE_URL.replace('/api/v1', '/storage') : '/storage';
                    const imgUrl = imgPath ? `${storageBase}/${imgPath}` : (ad.images[0].url || '');
                    if (imgUrl) {
                        detailsMsg += `<div class="mt-3 text-center"><img src="${imgUrl}" alt="صورة المنتج" class="img-fluid rounded border shadow-sm" style="max-height: 160px; object-fit: cover;"></div>`;
                    }
                }

                detailsMsg += `</div><p class="mb-0 fs-6 fw-bold">هل أنت متأكد من قبول هذا الإعلان؟</p>`;

                showConfirmModal('تأكيد قبول الإعلان', detailsMsg, async () => {
                    console.log('Sending Approve API Request for ID:', id);
                    const res = await apiRequest('POST', `/admin/ads/${id}/approve`);
                    if (res) { showToast('تمت الموافقة', 'success'); loadAds(currentPageAds); }
                });
            } else if (targetBtn.classList.contains('btn-reject')) {
                console.log('Reject clicked for ID:', id);
                showConfirmModal('Reject Ad', 'Reject this ad?', async () => {
                    console.log('Sending Reject API Request for ID:', id);
                    const res = await apiRequest('POST', `/admin/ads/${id}/reject`);
                    if (res) { showToast('تم الرفض', 'success'); loadAds(currentPageAds); }
                });
            } else if (targetBtn.classList.contains('btn-delete')) {
                console.log('Delete clicked for ID:', id);
                showConfirmModal('Delete Ad', 'Are you sure you want to delete this ad?', async () => {
                    console.log('Sending Delete API Request for ID:', id);
                    try {
                        const res = await apiRequest('DELETE', `/admin/ads/${id}`);
                        if (res) { showToast('Ad deleted', 'success'); loadAds(currentPageAds); }
                    } catch (err) {
                        console.error("Delete Ad Error", err);
                        showToast('Failed to delete ad: ' + err.message, 'error');
                    }
                });
            }
        });
    } else {
        // adsTableBody is only present on ads.html — silence on other pages
    }
});

// ==== PAYMENTS LOGIC ====
async function loadPayments() {
    const tbody = document.querySelector('#payments-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading...</td></tr>';

    // We only load pending based on AdminController provided 
    const res = await apiRequest('GET', `/admin/payments/pending`);


    if (!res) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">API error or unauthenticated.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    // Safely fallback
    const payments = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No data found.</td></tr>';
    } else {
        payments.forEach(pay => {
            const tr = document.createElement('tr');

            const rcptBtn = `<button class="btn btn-sm btn-info text-white shadow-sm ms-1" onclick="viewReceipt('${pay.receipt}')"><i class="bi bi-receipt"></i> الإيصال</button>`;
            let actions = `<button class="btn btn-sm btn-success shadow-sm ms-1" onclick="approvePayment(${pay.id})"><i class="bi bi-check-circle"></i> قبول</button>`;
            actions += `<button class="btn btn-sm btn-danger shadow-sm" onclick="rejectPayment(${pay.id})"><i class="bi bi-x-circle"></i> رفض</button>`;

            tr.innerHTML = `
                <td>#${pay.id}</td>
                <td>${pay.user ? pay.user.name : 'Unknown User'}</td>
                <td>${pay.amount}</td>
                <td>${pay.months}</td>
                <td>${new Date(pay.created_at).toLocaleDateString()}</td>
                <td>${rcptBtn}</td>
                <td>${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function viewReceipt(filename) {
    const modal = document.getElementById('receipt-modal');
    const img = document.getElementById('receipt-img-src');
    if (!filename) {
        alert("No receipt available.");
        return;
    }
    // Storage link assumes public/storage/receipts/ or similar - adjust per backend config
    const storageBase = typeof BASE_URL !== 'undefined' ? BASE_URL.replace('/api/v1', '/storage') : '/storage';
    img.src = `${storageBase}/receipts/${filename}`;
    /* NOTE: Adjust path if backend stores elsewhere like '/storage/' without receipts */
    // Fallback if needed
    img.onerror = function () {
        this.src = `${storageBase}/${filename}`;
    };
    modal.classList.add('active');
}

async function approvePayment(id) {
    showConfirmModal('Approve Payment', 'Approve payment and activate subscription?', async () => {
        const res = await apiRequest('POST', `/admin/payments/${id}/approve`);
        if (res) { showToast(res.message, 'success'); loadPayments(); }
    });
}

async function rejectPayment(id) {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled
    const res = await apiRequest('POST', `/admin/payments/${id}/reject`, { admin_notes: reason });
    if (res) { showToast(res.message, 'success'); loadPayments(); }
}

// ==== SETTINGS LOGIC ====
async function loadSettings() {
    const container = document.getElementById('settings-container');
    container.innerHTML = '<div class="text-center text-muted py-4">جاري التحميل...</div>';

    const res = await apiRequest('GET', `/admin/settings`);
    if (!res) return;

    container.innerHTML = '';

    // Keys we handle specifically in the UI
    const specificKeys = [
        'app_name', 'subscription_price_monthly',
        'contact_email', 'contact_phone', 'contact_location', 'working_hours',
        'whatsapp_url', 'telegram_url', 'facebook_url', 'twitter_url', 'auction_durations'
    ];

    if (res.data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">لم يتم تهيئة أي إعدادات بعد.</div>';
    } else {
        res.data.forEach(setting => {
            // If it's a specific key, populate its input
            if (specificKeys.includes(setting.key)) {
                const input = document.getElementById(`setting-${setting.key}`);
                if (input) {
                    input.value = setting.value || '';
                }
            } else {
                // Otherwise add to generic container
                const div = document.createElement('div');
                div.className = 'mb-3';
                div.innerHTML = `
                    <label class="form-label fw-bold">${setting.key}</label>
                    <div class="input-group">
                        <input type="text" id="setting-${setting.key}" class="form-control" value="${setting.value || ''}">
                        <button class="btn btn-primary" onclick="updateSetting('${setting.key}')"><i class="bi bi-save"></i> حفظ</button>
                    </div>
                `;
                container.appendChild(div);
            }
        });
    }
}

async function updateSetting(key) {
    const val = document.getElementById(`setting-${key}`).value;
    const res = await apiRequest('POST', `/admin/settings`, { key: key, value: val });
    if (res) {
        showToast(res.message, 'success');
    }
}

// ==== CATEGORIES LOGIC ====
let currentCategoriesData = [];
async function loadCategories() {
    const tbody = document.querySelector('#categories-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">جاري التحميل...</td></tr>';

    try {
        const res = await apiRequest('GET', '/admin/categories');
        if (!res || !res.success) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">فشل في تحميل البيانات</td></tr>';
            return;
        }

        currentCategoriesData = res.data;
        tbody.innerHTML = '';

        if (currentCategoriesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">لا توجد أقسام مضافة حالياً.</td></tr>';
        } else {
            currentCategoriesData.forEach((cat, index) => {
                const tr = document.createElement('tr');
                const statusBadge = cat.is_active
                    ? '<span class="badge bg-success-subtle text-success px-3 py-2 border border-success-subtle">نشط</span>'
                    : '<span class="badge bg-danger-subtle text-danger px-3 py-2 border border-danger-subtle">غير نشط</span>';

                const storageBase = typeof BASE_URL !== 'undefined' ? BASE_URL.replace('/api/v1', '/storage') : '/storage';
                const iconHtml = cat.icon
                    ? `<img src="${storageBase}/${cat.icon}" class="rounded border shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">`
                    : '<span class="text-muted small">لا يوجد</span>';

                tr.innerHTML = `
                    <td class="fw-bold text-muted">${index + 1}</td>
                    <td><span class="fw-bold">${cat.name_ar}</span></td>
                    <td><span class="text-secondary">${cat.name_en}</span></td>
                    <td>${iconHtml}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="btn-group shadow-sm">
                            <button class="btn btn-sm btn-light border-end" onclick="openCategoryModal(${cat.id})" title="تعديل">
                                <i class="bi bi-pencil-square text-primary"></i>
                            </button>
                            <button class="btn btn-sm btn-light" onclick="deleteCategory(${cat.id})" title="حذف">
                                <i class="bi bi-trash text-danger"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Load Categories Error:", error);
    }
}

function openCategoryModal(id = null) {
    const modalEl = document.getElementById('categoryModal');
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById('category-form');
    form.reset();

    document.getElementById('cat-icon-preview').style.display = 'none';
    document.getElementById('category-id').value = id || '';
    document.getElementById('categoryModalTitle').innerText = id ? 'تعديل قسم' : 'إضافة قسم جديد';

    if (id) {
        const cat = currentCategoriesData.find(c => c.id == id);
        if (cat) {
            document.getElementById('cat-name-ar').value = cat.name_ar;
            document.getElementById('cat-name-en').value = cat.name_en;
            document.getElementById('cat-active').checked = !!cat.is_active;

            if (cat.icon) {
                const storageBase = typeof BASE_URL !== 'undefined' ? BASE_URL.replace('/api/v1', '/storage') : '/storage';
                const previewImg = document.querySelector('#cat-icon-preview img');
                previewImg.src = `${storageBase}/${cat.icon}`;
                document.getElementById('cat-icon-preview').style.display = 'block';
            }
        }
    }

    modal.show();
}

async function deleteCategory(id) {
    const cat = currentCategoriesData.find(c => c.id == id);
    const msg = `هل أنت متأكد من حذف القسم <b>"${cat ? cat.name_ar : 'هذا'}"</b>؟ هذا الإجراء قد يسبب مشاكل في الإعلانات المرتبطة بهذا القسم.`;

    showConfirmModal('تأكيد الحذف', msg, async () => {
        const res = await apiRequest('DELETE', `/admin/categories/${id}`);
        if (res && res.success) {
            showToast('تم حذف القسم بنجاح', 'success');
            loadCategories();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const catForm = document.getElementById('category-form');
    if (catForm) {
        catForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('category-id').value;
            const formData = new FormData();
            formData.append('name_ar', document.getElementById('cat-name-ar').value);
            formData.append('name_en', document.getElementById('cat-name-en').value);
            formData.append('is_active', document.getElementById('cat-active').checked ? 1 : 0);

            const iconFile = document.getElementById('cat-icon').files[0];
            if (iconFile) {
                formData.append('icon', iconFile);
            }

            try {
                let res;
                if (id) {
                    // Laravel PUT/PATCH with FormData need _method hack
                    formData.append('_method', 'PUT');
                    res = await apiRequest('POST', `/admin/categories/${id}`, formData);
                } else {
                    res = await apiRequest('POST', '/admin/categories', formData);
                }

                if (res && res.success) {
                    showToast(id ? 'تم تعديل القسم بنجاح' : 'تم إضافة القسم بنجاح', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
                    loadCategories();
                }
            } catch (error) {
                console.error("Save Category Error:", error);
            }
        });
    }
});

// ==== CONTACT MESSAGES LOGIC ====
let currentPageContacts = 1;
async function loadContactMessages(page = 1) {
    currentPageContacts = page;
    const tbody = document.querySelector('#contact-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    const res = await apiRequest('GET', `/admin/contact-messages`);


    if (!res) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">API error or unauthenticated.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    // Safely fallback
    const messages = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No data found.</td></tr>';
    } else {
        messages.forEach(msg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${msg.id}</td>
                <td>${msg.name}</td>
                <td>${msg.phone || msg.email || 'N/A'}</td>
                <td><div style="max-width:300px; white-space:normal;">${msg.message}</div></td>
                <td>${new Date(msg.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger shadow-sm" onclick="deleteContactMessage(${msg.id})"><i class="bi bi-trash"></i> حذف</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (res.meta) {
        renderPagination('contact-pagination', res.meta, loadContactMessages);
    } else {
        const pCont = document.getElementById('contact-pagination');
        if (pCont) pCont.innerHTML = '';
    }
}

function deleteContactMessage(id) {
    showConfirmModal('Delete Message', 'Are you sure you want to delete this message?', async () => {
        const res = await apiRequest('DELETE', `/admin/contact-messages/${id}`);
        if (res) {
            showToast('Message deleted', 'success');
            loadContactMessages(currentPageContacts);
        }
    });
}

// ==== REPORTS LOGIC ====
let currentPageReports = 1;
async function loadReports(page = 1) {
    currentPageReports = page;
    const tbody = document.querySelector('#reports-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    const res = await apiRequest('GET', `/admin/reports`);


    if (!res) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">API error or unauthenticated.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    // Safely fallback
    const reports = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No data found.</td></tr>';
    } else {
        reports.forEach(report => {
            const tr = document.createElement('tr');

            let statusBadge = report.status === 'reviewed'
                ? '<span class="badge rounded-pill bg-success px-3 py-2">تمت المراجعة</span>'
                : '<span class="badge rounded-pill bg-warning px-3 py-2 text-dark">معلق</span>';

            let actions = report.status === 'pending'
                ? `<button class="btn btn-sm btn-primary shadow-sm" onclick="dismissReport(${report.id})"><i class="bi bi-check2-all"></i> صرف النظر</button>`
                : '';

            tr.innerHTML = `
                <td>#${report.id}</td>
                <td>${report.ad_title || 'Deleted Ad'}</td>
                <td>${report.reporter_name || 'Unknown'}</td>
                <td><div style="max-width:250px; white-space:normal;">${report.reason}</div></td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (res.meta) {
        renderPagination('reports-pagination', res.meta, loadReports);
    } else {
        const pCont = document.getElementById('reports-pagination');
        if (pCont) pCont.innerHTML = '';
    }
}

function dismissReport(id) {
    showConfirmModal('Dismiss Report', 'Mark this report as reviewed?', async () => {
        const res = await apiRequest('POST', `/admin/reports/${id}/dismiss`);
        if (res) {
            showToast('Report dismissed', 'success');
            loadReports(currentPageReports);
        }
    });
}

// ==== ACTIVITY LOGS LOGIC ====
let currentPageLogs = 1;
async function loadLogs(page = 1) {
    currentPageLogs = page;
    const tbody = document.querySelector('#logs-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading...</td></tr>';
    const res = await apiRequest('GET', `/admin/activity-logs?page=${page}`);


    if (!res) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">API error or unauthenticated.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    // Safely fallback
    const logs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No data found.</td></tr>';
    } else {
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${log.id}</td>
                <td>${log.user ? log.user.name : 'System'}</td>
                <td>${log.action}</td>
                <td><div style="font-size:0.75rem; color:#6B7280; max-width:400px; white-space:normal; word-wrap:break-word;">${log.description || ''}</div></td>
                <td>${new Date(log.created_at).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    renderPagination('logs-pagination', res.meta, loadLogs);
}

// ==== NOTIFICATIONS LOGIC ====
document.addEventListener('DOMContentLoaded', () => {
    const notifForm = document.getElementById('notification-form');
    if (notifForm) {
        notifForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('notif-title').value;
            const body = document.getElementById('notif-body').value;

            showConfirmModal('Send Global Notification', 'Are you sure you want to push this to ALL users?', async () => {
                const res = await apiRequest('POST', `/admin/notifications/send`, { title, body });
                if (res) {
                    showToast('Notification dispatched successfully', 'success');
                    notifForm.reset();
                }
            });
        });
    }
});

// ==== UTILS ====
function renderPagination(containerId, paginator, loadFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!paginator || typeof paginator.last_page === 'undefined' || paginator.last_page <= 1) return;

    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    ul.className = 'pagination pagination-sm mb-0';

    // Prev Button
    const liPrev = document.createElement('li');
    liPrev.className = `page-item ${paginator.current_page === 1 ? 'disabled' : ''}`;
    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-link';
    btnPrev.innerHTML = 'السابق';
    btnPrev.onclick = () => { if (paginator.current_page > 1) loadFunc(paginator.current_page - 1); };
    liPrev.appendChild(btnPrev);
    ul.appendChild(liPrev);

    // Page indicator
    const liCurr = document.createElement('li');
    liCurr.className = 'page-item active';
    const spanCurr = document.createElement('span');
    spanCurr.className = 'page-link';
    spanCurr.innerText = `${paginator.current_page} من ${paginator.last_page}`;
    liCurr.appendChild(spanCurr);
    ul.appendChild(liCurr);

    // Next Button
    const liNext = document.createElement('li');
    liNext.className = `page-item ${paginator.current_page === paginator.last_page ? 'disabled' : ''}`;
    const btnNext = document.createElement('button');
    btnNext.className = 'page-link';
    btnNext.innerHTML = 'التالي';
    btnNext.onclick = () => { if (paginator.current_page < paginator.last_page) loadFunc(paginator.current_page + 1); };
    liNext.appendChild(btnNext);
    ul.appendChild(liNext);

    nav.appendChild(ul);
    container.appendChild(nav);
}
