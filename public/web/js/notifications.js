/**
 * Haraj-Maareb - Notifications Logic (notifications.js)
 * ================================================
 * Handles loading, filtering, and marking notifications as read.
 * See notifications.md for API documentation.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const NOTIFICATIONS = {
    currentTab: 'all', // 'all' or 'unread'
    currentPage: 1,
    lastPage: 1,

    /**
     * Initialize notifications page.
     */
    init() {
        // Auth guard
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        this.bindEvents();
        this.loadNotifications();
    },

    /**
     * Bind UI events.
     */
    bindEvents() {
        // Tab switching
        const tabs = document.querySelectorAll('#notificationTabs .nav-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                this.currentTab = tab.dataset.filter;
                this.currentPage = 1; // Reset to page 1 on filter change
                this.loadNotifications();
            });
        });

        // Mark all as read button
        const btnMarkAll = document.getElementById('btnMarkAllRead');
        if (btnMarkAll) {
            btnMarkAll.addEventListener('click', () => this.markAllAsRead());
        }
    },

    /**
     * Load notifications from API.
     * GET /notifications?unread_only=1 — See notifications.md Section 1
     */
    async loadNotifications(page = 1) {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        this.currentPage = page;

        // Optionally show a full skeleton if page 1, or just a small loader if > 1
        if (page === 1) {
            list.innerHTML = `
                <div class="list-group-item p-4">
                    <div class="d-flex w-100 align-items-center">
                        <div class="skeleton-circle me-3" style="width: 48px; height: 48px;"></div>
                        <div class="flex-grow-1">
                            <div class="skeleton-line w-50 mb-2"></div>
                            <div class="skeleton-line w-75"></div>
                        </div>
                    </div>
                </div>
                <div class="list-group-item p-4">
                    <div class="d-flex w-100 align-items-center">
                        <div class="skeleton-circle me-3" style="width: 48px; height: 48px;"></div>
                        <div class="flex-grow-1">
                            <div class="skeleton-line w-50 mb-2"></div>
                            <div class="skeleton-line w-75"></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Append small loader at the bottom
            const loader = document.createElement('div');
            loader.className = 'text-center py-3';
            loader.id = 'paginationLoader';
            loader.innerHTML = '<span class="spinner-border text-primary spinner-border-sm"></span> جاري التحميل...';
            list.parentElement.appendChild(loader);
        }

        // Build endpoint with query params
        let endpoint = `/notifications?page=${page}`;
        if (this.currentTab === 'unread') {
            endpoint += '&unread_only=1';
        }

        const result = await API.get(endpoint);

        // Remove pagination loader if it exists
        const loader = document.getElementById('paginationLoader');
        if (loader) loader.remove();

        if (result.success && result.data) {
            const data = result.data;
            const notifs = Array.isArray(data) ? data : (data.data || []);
            const meta = data.meta || result.meta || {};
            this.lastPage = meta.last_page || 1;

            if (page === 1) {
                list.innerHTML = ''; // Clear for first page
            }

            if (notifs.length === 0 && page === 1) {
                list.innerHTML = `
                    <div class="text-center py-5">
                        <div class="mb-3">
                            <i class="bi bi-bell-slash text-muted" style="font-size: 3rem; opacity: 0.5;"></i>
                        </div>
                        <h5 class="text-muted fw-bold">لا توجد إشعارات</h5>
                        <p class="text-muted">لم تتلقَ أي إشعارات متطابقة مع هذا الفلتر.</p>
                    </div>
                `;
                this.renderPagination(meta);
                return;
            }

            // Append items
            notifs.forEach(item => {
                list.appendChild(this.createNotificationElement(item));
            });

            this.renderPagination(meta);
        } else {
            if (page === 1) {
                list.innerHTML = `
                    <div class="text-center py-5">
                        <p class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i> تعذر تحميل الإشعارات.</p>
                    </div>
                `;
            }
        }
    },

    /**
     * Create a single notification DOM element.
     */
    createNotificationElement(item) {
        const isUnread = item.read_at === null;
        const div = document.createElement('a');
        div.href = "#"; // Handled by click listener
        div.className = `list-group-item list-group-item-action p-4 notification-item ${isUnread ? 'unread' : 'read'}`;
        div.dataset.id = item.id;

        // Dynamic icons based on notification type
        let iconClass = 'bi-bell-fill';
        let iconColor = 'text-primary';

        const data = item.data || {};

        // Build display title and message based on notification data structure
        let title = data.title || 'إشعار جديد';
        let message = data.message || 'لديك تحديث جديد في حسابك';

        // Handle our NewMessageNotification format
        if (data.type === 'new_message') {
            iconClass = 'bi-chat-dots-fill';
            iconColor = 'text-success';
            title = `رسالة جديدة من ${data.sender_name || 'مستخدم'}`;
            message = data.message_preview || 'لديك رسالة جديدة';
        } else if (title.includes('إعلان')) {
            iconClass = 'bi-megaphone-fill';
            iconColor = 'text-warning';
        } else if (title.includes('رسالة') || title.includes('محادثة')) {
            iconClass = 'bi-chat-dots-fill';
            iconColor = 'text-success';
        } else if (title.includes('مراجعة') || title.includes('رفض') || title.includes('قبول')) {
            iconClass = 'bi-info-circle-fill';
            iconColor = 'text-danger';
        }

        const time = new Date(item.created_at).toLocaleString('ar-SA', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        div.innerHTML = `
            <div class="d-flex w-100 align-items-start">
                <div class="notification-icon-wrapper me-3 d-flex align-items-center justify-content-center bg-light rounded-circle" style="width: 48px; height: 48px; flex-shrink: 0;">
                    <i class="bi ${iconClass} ${iconColor} fs-5"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                        <h6 class="mb-0 fw-bold notification-title ${isUnread ? 'text-dark' : 'text-secondary'}">${title}</h6>
                        <small class="text-muted notification-time" style="font-size: 0.75rem;">${time}</small>
                    </div>
                    <p class="mb-0 notification-msg text-secondary" style="font-size: 0.9rem;">${message}</p>
                </div>
                ${isUnread ? '<div class="notification-indicator ms-2 mt-2 rounded-circle bg-primary" style="width: 10px; height: 10px; flex-shrink: 0;"></div>' : ''}
            </div>
        `;

        // Click handler
        div.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleNotificationClick(item.id, data, div);
        });

        return div;
    },

    /**
     * Render pagination controls.
     */
    renderPagination(meta) {
        const container = document.getElementById('notificationsPagination');
        if (!container) return;

        if (!meta.last_page || meta.last_page <= 1) {
            container.innerHTML = '';
            container.classList.add('d-none');
            return;
        }

        container.classList.remove('d-none');
        let html = '<nav><ul class="pagination pagination-sm justify-content-center mb-0">';
        for (let i = 1; i <= meta.last_page; i++) {
            html += `
                <li class="page-item ${i === meta.current_page ? 'active' : ''}">
                    <button class="page-link" onclick="NOTIFICATIONS.loadNotifications(${i})">${i}</button>
                </li>
            `;
        }
        html += '</ul></nav>';
        container.innerHTML = html;
    },

    /**
     * Handle click on a single notification.
     * POST /notifications/{id}/read
     */
    async handleNotificationClick(id, data, element) {
        // Optimistic UI update
        if (element.classList.contains('unread')) {
            element.classList.remove('unread');
            element.classList.add('read');
            const title = element.querySelector('.notification-title');
            if (title) {
                title.classList.remove('text-dark');
                title.classList.add('text-secondary');
            }
            const indicator = element.querySelector('.notification-indicator');
            if (indicator) indicator.remove();

            // Fire API call without waiting
            API.post(`/notifications/${id}/read`, {}).then(res => {
                if (res.success) {
                    // Update global navbar badge
                    if (typeof loadUnreadNotificationsCount === 'function') {
                        loadUnreadNotificationsCount();
                    }
                }
            });
        }

        // Navigate based on notification type
        if (data.type === 'new_message' && data.conversation_id) {
            window.location.href = `/web/chat.html?conversation_id=${data.conversation_id}`;
        } else if (data.ad_id) {
            window.location.href = `/web/ad-details.html?id=${data.ad_id}`;
        }
    },

    /**
     * Mark all notifications as read.
     * POST /notifications/read-all
     */
    async markAllAsRead() {
        const btn = document.getElementById('btnMarkAllRead');
        if (btn) btn.disabled = true;

        const result = await API.post('/notifications/read-all', {});

        if (btn) btn.disabled = false;

        if (result.success) {
            // Update UI
            document.querySelectorAll('.notification-item.unread').forEach(el => {
                el.classList.remove('unread');
                el.classList.add('read');
                const title = el.querySelector('.notification-title');
                if (title) {
                    title.classList.remove('text-dark');
                    title.classList.add('text-secondary');
                }
                const indicator = el.querySelector('.notification-indicator');
                if (indicator) indicator.remove();
            });

            // If current tab is 'unread', we should empty the list
            if (this.currentTab === 'unread') {
                this.loadNotifications(1);
            }

            // Update global navbar badge
            if (typeof loadUnreadNotificationsCount === 'function') {
                loadUnreadNotificationsCount();
            }
        }
    }
};

// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('notificationsList')) {
        NOTIFICATIONS.init();
    }
});
