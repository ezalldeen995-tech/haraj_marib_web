// public/admin/js/app.js

// --- API Base URL ---
const BASE_URL = '/api/v1';

// --- API Wrapper ---
async function apiRequest(method, endpoint, data = null) {
    showLoader();
    try {
        const token = localStorage.getItem('admin_token');
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: method,
            headers: headers
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const result = await response.json();

        // Handle Unauthenticated
        if (response.status === 401 || response.status === 403) {
            alert('Unauthorized');
            if (response.status === 401) {
                logout();
            }
            return null;
        }

        if (!response.ok) {
            throw new Error(result.message || 'API Error occurred');
        }

        return result;

    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    } finally {
        hideLoader();
    }
}

// --- Auth Utilities ---
function requireAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'index.html';
}

function getAdminUser() {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
}

// --- UI Utilities ---
function showLoader() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'loader-overlay';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    // Fallback to simple alert as required constraint, but can be styled later
    alert(`${type.toUpperCase()}: ${message}`);
}

// --- Generic Confirmation Modal ---
let confirmCallback = null;
let bsConfirmModalInstance = null;
let isConfirmListenerAttached = false;

function showConfirmModal(title, message, callback) {
    const modalEl = document.getElementById('bsConfirmModal');
    if (!modalEl) {
        // Fallback to native confirm if modal HTML is missing
        if (confirm(title + '\n' + message)) {
            if (callback) callback();
        }
        return;
    }

    if (!bsConfirmModalInstance) {
        bsConfirmModalInstance = new bootstrap.Modal(modalEl);
    }

    document.getElementById('bsConfirmTitle').innerText = title;
    document.getElementById('bsConfirmMessage').innerText = message;

    confirmCallback = callback;
    bsConfirmModalInstance.show();

    const confirmBtn = document.getElementById('bsConfirmBtn');

    // Attach listener only once to prevent multiple bindings overriding or corrupting DOM state
    if (!isConfirmListenerAttached && confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            closeConfirmModal();
            if (confirmCallback) {
                // Execute and then clear to prevent double firing on subsequent modals
                const cb = confirmCallback;
                confirmCallback = null;
                try {
                    await cb();
                } catch (err) {
                    console.error("Modal Callback Error", err);
                }
            }
        });
        isConfirmListenerAttached = true;
    }
}

function closeConfirmModal() {
    if (bsConfirmModalInstance) {
        bsConfirmModalInstance.hide();
    }
}

// --- Common Layout Setup ---
async function setupLayout() {
    let adminUser = null;

    // ALWAYS fetch fresh profile with permissions from API
    try {
        const response = await apiRequest('GET', '/me');
        if (response && response.data) {
            adminUser = response.data;
            localStorage.setItem('admin_user', JSON.stringify(adminUser));
        }
    } catch (e) {
        console.error('Failed to fetch admin profile, falling back to cache');
        adminUser = getAdminUser();
    }

    if (adminUser) {

        // Topbar Admin Name
        const adminNameEl = document.getElementById('admin-name-display');
        if (adminNameEl) {
            adminNameEl.textContent = adminUser.name || 'المشرف';
        }

        // Sidebar RBAC Logic
        const isSuperAdmin = (adminUser.phone === '777777777' || adminUser.id === 1);
        const navAdmins = document.getElementById('nav-admins');

        if (isSuperAdmin) {
            // Main Admin bypass: show ALL sidebar links
            if (navAdmins) navAdmins.style.display = 'block';
        } else if (navAdmins) {
            const perms = adminUser.permissions || [];
            if (perms.includes('full_access') || perms.includes('manage_users') || perms.includes('manage_admins')) {
                navAdmins.style.display = 'block';
            } else {
                navAdmins.style.display = 'none';

                // If they are on the admins page without permission, kick them out
                if (window.location.pathname.endsWith('admin_users.html')) {
                    window.location.href = 'dashboard.html';
                }
            }
        }
    }

    // Logout Button Listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Optional: call API logout endpoint
            apiRequest('POST', '/logout').finally(() => {
                logout();
            });
        });
    }

    // Active Sidebar Link
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize on page load (excluding login page if no token)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.endsWith('index.html')) {
        requireAuth();
        setupLayout();
    } else {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const phone = document.getElementById('phone').value;
                const password = document.getElementById('password').value;
                try {
                    const response = await fetch(`${BASE_URL}/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ phone, password })
                    });

                    const result = await response.json();

                    if (result.success === true) {
                        localStorage.setItem('admin_token', result.data.token);
                        if (result.data.user) {
                            localStorage.setItem('admin_user', JSON.stringify(result.data.user));
                        }
                        window.location.href = 'dashboard.html';
                    } else {
                        alert(result.message || 'Login failed');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Network error occurred. Please try again later.');
                }
            });
        }
    }
});
