// public/admin/js/admin_users.js

let allRoles = [];
let allAdmins = [];

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadPermissions();
    loadAdmins();

    // Form submission hook
    document.getElementById('adminForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAdmin();
    });
});

async function loadPermissions() {
    try {
        const response = await apiRequest('GET', '/admin/roles');
        if (response && response.status) {
            allRoles = response.data;
            renderPermissionsCheckboxes();
        }
    } catch (error) {
        console.error("Failed to load permissions:", error);
    }
}

function renderPermissionsCheckboxes() {
    const container = document.getElementById('permissionsContainer');
    container.innerHTML = '';
    
    allRoles.forEach(role => {
        // Build isolated col for each permission toggle
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        let displayColor = 'primary';
        if (role.name === 'full_access') displayColor = 'danger';

        col.innerHTML = `
            <div class="form-check form-switch p-3 border rounded shadow-sm bg-white hover-shadow transition">
                <input class="form-check-input ms-0 me-2 perm-checkbox" type="checkbox" role="switch" id="perm_${role.id}" value="${role.id}">
                <label class="form-check-label fw-bold text-${displayColor}" for="perm_${role.id}">
                    ${role.display_name || role.name}
                </label>
            </div>
        `;
        container.appendChild(col);
    });
}

async function loadAdmins() {
    const tbody = document.querySelector('#adminsTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">جاري التحميل...</td></tr>';
    
    try {
        const response = await apiRequest('GET', '/admin/admins');
        if (response && response.status) {
            allAdmins = response.data;
            renderAdminsTable();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger"> فشل تحميل البيانات </td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger"> فشل تحميل البيانات: غير مصرح لك </td></tr>';
    }
}

function renderAdminsTable() {
    const tbody = document.querySelector('#adminsTable tbody');
    tbody.innerHTML = '';

    if (allAdmins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">لا يوجد مشرفون لعرضهم</td></tr>';
        return;
    }

    allAdmins.forEach((admin, index) => {
        // Calculate roles badges
        let rolesHtml = '';
        if (admin.permissions && admin.permissions.length > 0) {
            if (admin.permissions.some(p => p.name === 'full_access')) {
                rolesHtml = `<span class="badge bg-danger">صلاحيات كاملة</span>`;
            } else {
                admin.permissions.forEach(p => {
                    rolesHtml += `<span class="badge bg-primary me-1 mb-1">${p.display_name}</span>`;
                });
            }
        } else {
            rolesHtml = `<span class="badge bg-secondary">لا توجد صلاحيات</span>`;
        }

        const isSuperAdmin = admin.phone === '777777777';
        
        const actionButtons = `
            <button class="btn btn-sm btn-outline-primary shadow-sm" onclick="openEditModal(${admin.id})">
                <i class="bi bi-pencil-square"></i> تعديل
            </button>
            ${!isSuperAdmin ? `
            <button class="btn btn-sm btn-outline-danger shadow-sm ms-2" onclick="confirmDeleteAdmin(${admin.id})">
                <i class="bi bi-trash"></i> حذف
            </button>` : ''}
        `;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold text-muted">${index + 1}</td>
            <td class="fw-bold">${admin.name}</td>
            <td dir="ltr" class="text-end">${admin.phone}</td>
            <td>${admin.email || '-'}</td>
            <td>${rolesHtml}</td>
            <td class="text-center">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

function openAdminModal() {
    document.getElementById('adminId').value = '';
    document.getElementById('adminName').value = '';
    document.getElementById('adminPhone').value = '';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').required = true;
    document.getElementById('passwordHint').classList.add('d-none');
    document.getElementById('adminModalLabel').innerText = 'إضافة مشرف جديد';
    
    // Uncheck all
    document.querySelectorAll('.perm-checkbox').forEach(cb => cb.checked = false);
    
    document.getElementById('adminFormError').classList.add('d-none');
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    modal.show();
}

function openEditModal(id) {
    const admin = allAdmins.find(a => a.id === id);
    if (!admin) return;

    document.getElementById('adminId').value = admin.id;
    document.getElementById('adminName').value = admin.name;
    document.getElementById('adminPhone').value = admin.phone;
    document.getElementById('adminEmail').value = admin.email || '';
    
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').required = false; // Not required for edit
    document.getElementById('passwordHint').classList.remove('d-none');
    
    document.getElementById('adminModalLabel').innerText = 'تعديل بيانات المشرف';

    // Uncheck all first
    document.querySelectorAll('.perm-checkbox').forEach(cb => cb.checked = false);
    
    // Check their permissions
    if (admin.permissions) {
        admin.permissions.forEach(p => {
            const cb = document.getElementById(`perm_${p.id}`);
            if (cb) cb.checked = true;
        });
    }

    document.getElementById('adminFormError').classList.add('d-none');
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    modal.show();
}

async function saveAdmin() {
    const id = document.getElementById('adminId').value;
    const isEdit = !!id;
    
    const payload = {
        name: document.getElementById('adminName').value,
        phone: document.getElementById('adminPhone').value,
        email: document.getElementById('adminEmail').value,
        password: document.getElementById('adminPassword').value,
        permissions: []
    };

    if (!payload.email) delete payload.email;
    if (isEdit && !payload.password) delete payload.password;

    document.querySelectorAll('.perm-checkbox:checked').forEach(cb => {
        payload.permissions.push(parseInt(cb.value));
    });

    if (payload.permissions.length === 0) {
        const errDiv = document.getElementById('adminFormError');
        errDiv.innerText = 'يرجى اختيار صلاحية واحدة على الأقل قبل الحفظ.';
        errDiv.classList.remove('d-none');
        return;
    }

    const endpoint = isEdit ? `/admin/admins/${id}` : '/admin/admins';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await apiRequest(method, endpoint, payload);
        if (response && response.status) {
            showToast(response.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('adminModal')).hide();
            loadAdmins();
        }
    } catch (error) {
        const errDiv = document.getElementById('adminFormError');
        errDiv.innerText = error.message;
        errDiv.classList.remove('d-none');
    }
}

function confirmDeleteAdmin(id) {
    document.getElementById('bsConfirmMessage').innerText = 'هل أنت متأكد من حذف هذا المشرف للأبد؟ لا يمكن التراجع عن هذا الإجراء!';
    const bsConfirmModal = new bootstrap.Modal(document.getElementById('bsConfirmModal'));
    bsConfirmModal.show();
    
    const btn = document.getElementById('bsConfirmBtn');
    btn.onclick = async () => {
        bsConfirmModal.hide();
        try {
            const response = await apiRequest('DELETE', `/admin/admins/${id}`);
            if (response && response.status) {
                showToast(response.message, 'success');
                loadAdmins();
            }
        } catch (error) {
            console.error(error);
        }
    };
}
