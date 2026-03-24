/**
 * Haraj-Maareb - Comments Logic (comments.js)
 * ================================================
 * Handles adding and deleting comments on ad details page.
 * See comments.md for API documentation.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const COMMENTS = {
    adId: null,

    /**
     * Initialize comments section.
     * @param {number} adId - The ad ID.
     * @param {Array} comments - Existing comments from API response.
     */
    init(adId, comments = []) {
        this.adId = adId;
        this.renderComments(comments);
        this.bindEvents();

        // Show add comment form only for logged-in users
        const addForm = document.getElementById('addCommentForm');
        if (addForm && AUTH.isLoggedIn()) {
            addForm.classList.remove('d-none');
        }
    },

    /**
     * Bind comment form events.
     */
    bindEvents() {
        const btn = document.getElementById('btnPostComment');
        if (btn) {
            btn.addEventListener('click', () => this.addComment());
        }

        // Character counter
        const textarea = document.getElementById('commentInput');
        const counter = document.getElementById('commentCharCount');
        if (textarea && counter) {
            textarea.addEventListener('input', () => {
                counter.textContent = `${textarea.value.length} / 1000`;
            });
        }
    },

    // ============================================
    // RENDER COMMENTS
    // ============================================

    /**
     * Render comments list.
     * @param {Array} comments - Array of comment objects.
     */
    renderComments(comments) {
        const container = document.getElementById('commentsList');
        const countEl = document.getElementById('commentsCount');
        if (!container) return;

        if (countEl) countEl.textContent = comments ? comments.length : 0;

        if (!comments || comments.length === 0) {
            container.innerHTML = `
                <div class="comments-empty text-center py-4">
                    <i class="bi bi-chat-square-text" style="font-size:2rem; opacity:0.2; display:block; margin-bottom:8px;"></i>
                    <p class="text-muted mb-0" style="font-size:0.9rem;">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                </div>
            `;
            return;
        }

        const currentUser = AUTH.getUser();
        const currentUserId = currentUser?.id;

        container.innerHTML = comments.map(comment => {
            const isOwner = currentUserId && String(currentUserId) === String(comment.user_id);
            const userName = comment.user?.name || 'مستخدم';
            const initial = userName.charAt(0);
            const timeAgo = this.timeAgo(comment.created_at);

            return `
                <div class="comment-item" id="comment-${comment.id}">
                    <div class="comment-avatar">${initial}</div>
                    <div class="comment-body">
                        <div class="comment-header">
                            <a href="user-profile.html?id=${comment.user_id}" class="comment-author">${userName}</a>
                            <span class="comment-time">${timeAgo}</span>
                            ${isOwner ? `
                                <button class="comment-delete-btn" onclick="COMMENTS.deleteComment(${comment.id})" title="حذف التعليق">
                                    <i class="bi bi-trash3"></i>
                                </button>
                            ` : ''}
                        </div>
                        <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ============================================
    // ADD COMMENT
    // ============================================

    /**
     * Add a new comment.
     * POST /comments - See comments.md
     */
    async addComment() {
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        const textarea = document.getElementById('commentInput');
        const content = textarea?.value.trim();
        const btn = document.getElementById('btnPostComment');

        if (!content) {
            this.showToast('يرجى كتابة تعليقك أولاً', 'danger');
            textarea?.focus();
            return;
        }

        if (content.length > 1000) {
            this.showToast('التعليق يجب ألا يتجاوز 1000 حرف', 'danger');
            return;
        }

        // Loading state
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> جاري النشر...';

        const result = await API.post('/comments', {
            ad_id: this.adId,
            content: content,
        });

        btn.disabled = false;
        btn.innerHTML = originalText;

        if (result.success && result.data) {
            // Clear input
            textarea.value = '';
            const counter = document.getElementById('commentCharCount');
            if (counter) counter.textContent = '0 / 1000';

            // Append new comment to the list
            const comment = result.data;
            const currentUser = AUTH.getUser();
            comment.user = comment.user || { id: currentUser?.id, name: currentUser?.name };
            comment.user_id = comment.user_id || currentUser?.id;

            this.appendComment(comment);
            this.showToast('تم نشر تعليقك بنجاح ✓', 'success');
        } else {
            if (result.message === 'blocked_interaction' || result._status === 403) {
                this.showToast('لا يمكنك التعليق بسبب الحظر', 'danger');
            } else if (result.errors) {
                const msg = Object.values(result.errors).flat().join(', ');
                this.showToast(msg, 'danger');
            } else {
                this.showToast(result.message || 'حدث خطأ أثناء نشر التعليق', 'danger');
            }
        }
    },

    /**
     * Append a single comment to the list.
     */
    appendComment(comment) {
        const container = document.getElementById('commentsList');
        if (!container) return;

        // Remove empty state if present
        const emptyState = container.querySelector('.comments-empty');
        if (emptyState) emptyState.remove();

        const userName = comment.user?.name || 'مستخدم';
        const initial = userName.charAt(0);
        const currentUser = AUTH.getUser();
        const isOwner = currentUser && String(currentUser.id) === String(comment.user_id);

        const html = `
            <div class="comment-item comment-new" id="comment-${comment.id}">
                <div class="comment-avatar">${initial}</div>
                <div class="comment-body">
                    <div class="comment-header">
                        <a href="user-profile.html?id=${comment.user_id}" class="comment-author">${userName}</a>
                        <span class="comment-time">الآن</span>
                        ${isOwner ? `
                            <button class="comment-delete-btn" onclick="COMMENTS.deleteComment(${comment.id})" title="حذف التعليق">
                                <i class="bi bi-trash3"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);

        // Update count
        const countEl = document.getElementById('commentsCount');
        if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;

        // Scroll to new comment
        const newComment = document.getElementById(`comment-${comment.id}`);
        if (newComment) {
            newComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    // ============================================
    // DELETE COMMENT
    // ============================================

    /**
     * Delete a comment.
     * DELETE /comments/{id} - See comments.md
     */
    async deleteComment(commentId) {
        if (!confirm('هل أنت متأكد من حذف التعليق؟')) return;

        const commentEl = document.getElementById(`comment-${commentId}`);
        if (commentEl) {
            commentEl.style.opacity = '0.5';
            commentEl.style.pointerEvents = 'none';
        }

        const result = await API.delete(`/comments/${commentId}`);

        if (result.success || result.message === 'comment_deleted') {
            if (commentEl) {
                commentEl.style.transition = 'all 0.3s ease';
                commentEl.style.transform = 'translateX(30px)';
                commentEl.style.opacity = '0';
                setTimeout(() => {
                    commentEl.remove();

                    // Update count
                    const countEl = document.getElementById('commentsCount');
                    if (countEl) {
                        const newCount = Math.max(0, parseInt(countEl.textContent || 0) - 1);
                        countEl.textContent = newCount;

                        // Show empty state if no comments left
                        if (newCount === 0) {
                            const container = document.getElementById('commentsList');
                            if (container) {
                                container.innerHTML = `
                                    <div class="comments-empty text-center py-4">
                                        <i class="bi bi-chat-square-text" style="font-size:2rem; opacity:0.2; display:block; margin-bottom:8px;"></i>
                                        <p class="text-muted mb-0" style="font-size:0.9rem;">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                                    </div>
                                `;
                            }
                        }
                    }
                }, 300);
            }
            this.showToast('تم حذف التعليق', 'success');
        } else {
            if (commentEl) {
                commentEl.style.opacity = '1';
                commentEl.style.pointerEvents = 'auto';
            }
            this.showToast(result.message === 'unauthorized' ? 'لا يمكنك حذف هذا التعليق' : 'حدث خطأ أثناء الحذف', 'danger');
        }
    },

    // ============================================
    // HELPERS
    // ============================================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    timeAgo(dateStr) {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffMin < 1) return 'الآن';
        if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
        if (diffHr < 24) return `منذ ${diffHr} ساعة`;
        if (diffDay < 7) return `منذ ${diffDay} يوم`;
        return date.toLocaleDateString('ar-SA');
    },

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
