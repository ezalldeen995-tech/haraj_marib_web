/**
 * Haraj-Maareb - Chat Logic (chat.js)
 * ================================================
 * Handles conversations list, messages, sending,
 * and starting new conversations from ad-details.
 * See chat.md for API documentation.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

const CHAT = {
    activeConversationId: null,
    conversations: [],
    currentPage: 1,
    lastPage: 1,
    userId: null,

    /**
     * Initialize chat page.
     */
    init() {
        // Auth guard
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        // Get current user ID
        const user = AUTH.getUser();
        this.userId = user?.id;

        this.bindEvents();
        this.loadConversations();

        // Check URL params for direct navigation
        const params = new URLSearchParams(window.location.search);
        const adId = params.get('ad_id');
        const conversationId = params.get('conversation_id');

        if (adId) {
            this.startConversation(adId);
        } else if (conversationId) {
            // Coming from notification click — auto-select after conversations load
            this.pendingConversationId = parseInt(conversationId);
        }
    },

    /**
     * Bind all events.
     */
    bindEvents() {
        // Send message form
        const form = document.getElementById('sendMessageForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        // Back to list (mobile)
        const backBtn = document.getElementById('btnBackToList');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showSidebar());
        }

        // Search conversations
        const searchInput = document.getElementById('searchConversations');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterConversations(e.target.value));
        }

        // Load more messages
        const loadMoreBtn = document.getElementById('btnLoadMore');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadOlderMessages());
        }

        // Enter sends message
        const msgInput = document.getElementById('messageInput');
        if (msgInput) {
            msgInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    form?.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            });
        }
    },

    // ============================================
    // CONVERSATIONS
    // ============================================

    /**
     * Load conversations list.
     * GET /chat/conversations — See chat.md Section 3
     */
    async loadConversations() {
        const result = await API.get('/chat/conversations');

        const list = document.getElementById('conversationsList');
        if (!list) return;

        if (result.success && result.data) {
            const conversations = Array.isArray(result.data) ? result.data : (result.data.data || []);
            this.conversations = conversations;

            if (conversations.length === 0) {
                list.innerHTML = `
                    <div class="chat-empty-conversations">
                        <i class="bi bi-chat-square"></i>
                        <p>لا توجد محادثات بعد</p>
                        <small class="text-muted">تصفح الإعلانات وابدأ محادثة مع البائع</small>
                    </div>
                `;
                return;
            }

            this.renderConversations(conversations);

            // Auto-select conversation based on URL params
            const params = new URLSearchParams(window.location.search);
            if (this.pendingConversationId) {
                // Coming from notification — open specific conversation
                this.selectConversation(this.pendingConversationId);
                this.pendingConversationId = null;
            } else if (!params.get('ad_id') && window.innerWidth >= 992) {
                this.selectConversation(conversations[0].id);
            }
        } else {
            list.innerHTML = `
                <div class="chat-empty-conversations">
                    <i class="bi bi-exclamation-circle"></i>
                    <p class="text-danger">تعذر تحميل المحادثات</p>
                </div>
            `;
        }
    },

    /**
     * Render conversations in the sidebar.
     */
    renderConversations(conversations) {
        const list = document.getElementById('conversationsList');
        if (!list) return;

        list.innerHTML = conversations.map(conv => {
            const otherUser = this.getOtherUser(conv);
            const lastMsg = conv.messages?.[0];
            const unread = conv.unread_count || 0;
            const adTitle = conv.ad?.title || 'إعلان';
            const adImg = conv.ad?.images?.[0]
                ? `/storage/${conv.ad.images[0].image_path}`
                : 'https://placehold.co/48x48/FFEDD5/F97316?text=📦';
            const avatar = otherUser?.avatar || 'https://placehold.co/48x48/FFEDD5/F97316?text=👤';
            const timeAgo = lastMsg ? this.timeAgo(lastMsg.created_at) : '';
            const snippet = lastMsg?.content
                ? (lastMsg.content.length > 40 ? lastMsg.content.substring(0, 40) + '...' : lastMsg.content)
                : 'لا توجد رسائل';

            return `
                <div class="chat-conv-item ${unread > 0 ? 'unread' : ''}" data-id="${conv.id}" onclick="CHAT.selectConversation(${conv.id})">
                    <div class="chat-conv-avatar">
                        <img src="${avatar}" alt="${otherUser?.name || ''}" loading="lazy">
                    </div>
                    <div class="chat-conv-info">
                        <div class="chat-conv-top">
                            <span class="chat-conv-name">${otherUser?.name || 'مستخدم'}</span>
                            <span class="chat-conv-time">${timeAgo}</span>
                        </div>
                        <div class="chat-conv-bottom">
                            <span class="chat-conv-snippet">${snippet}</span>
                            ${unread > 0 ? `<span class="chat-conv-badge">${unread}</span>` : ''}
                        </div>
                        <div class="chat-conv-ad">
                            <img src="${adImg}" alt="" class="chat-conv-ad-img">
                            <span class="chat-conv-ad-title">${adTitle}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Filter conversations by search input.
     */
    filterConversations(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            this.renderConversations(this.conversations);
            return;
        }
        const filtered = this.conversations.filter(conv => {
            const other = this.getOtherUser(conv);
            const name = (other?.name || '').toLowerCase();
            const adTitle = (conv.ad?.title || '').toLowerCase();
            return name.includes(q) || adTitle.includes(q);
        });
        this.renderConversations(filtered);
    },

    /**
     * Get the other user (buyer or seller) in a conversation.
     */
    getOtherUser(conv) {
        if (this.userId && conv.buyer_id === this.userId) {
            return conv.seller;
        }
        return conv.buyer;
    },

    // ============================================
    // MESSAGES
    // ============================================

    /**
     * Select/open a conversation.
     */
    async selectConversation(conversationId) {
        this.activeConversationId = conversationId;
        this.currentPage = 1;
        this.lastPage = 1;

        // Highlight active item
        document.querySelectorAll('.chat-conv-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.chat-conv-item[data-id="${conversationId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.classList.remove('unread');
            // Remove badge
            const badge = activeItem.querySelector('.chat-conv-badge');
            if (badge) badge.remove();
        }

        // Show chat window, hide empty state
        document.getElementById('chatEmptyState')?.classList.add('d-none');
        document.getElementById('chatActive')?.classList.remove('d-none');

        // Show chat window on mobile
        this.showChatWindow();

        // Set header info
        const conv = this.conversations.find(c => c.id === conversationId);
        if (conv) {
            const otherUser = this.getOtherUser(conv);
            document.getElementById('chatHeaderName').textContent = otherUser?.name || 'مستخدم';
            document.getElementById('chatHeaderAvatar').src = otherUser?.avatar || 'https://placehold.co/40x40/FFEDD5/F97316?text=👤';
            document.getElementById('chatHeaderAd').textContent = conv.ad?.title || 'إعلان';
            document.getElementById('chatHeaderAdLink').href = `ad-details.html?id=${conv.ad_id}`;

            // Show rate button for the other user
            const rateBtn = document.getElementById('btnRateChatUser');
            if (rateBtn && otherUser?.id && typeof RATING_MODAL !== 'undefined') {
                rateBtn.classList.remove('d-none');
                rateBtn.onclick = () => RATING_MODAL.open(otherUser.id);
            }
        }

        // Loading
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
        `;

        // Fetch messages
        // GET /chat/conversations/{id}/messages — See chat.md Section 4
        const result = await API.get(`/chat/conversations/${conversationId}/messages`);

        if (result.success && result.data) {
            const data = result.data;
            const messages = Array.isArray(data) ? data : (data.data || []);
            const meta = data.meta || result.meta || {};
            this.currentPage = meta.current_page || 1;
            this.lastPage = meta.last_page || 1;

            // Reverse: API returns newest first, we display oldest at top
            const sorted = [...messages].reverse();

            messagesContainer.innerHTML = '';

            // Show load more button if more pages exist
            const loadMore = document.getElementById('loadMoreMessages');
            if (this.currentPage < this.lastPage) {
                if (!loadMore) {
                    const btn = document.createElement('div');
                    btn.className = 'text-center py-3';
                    btn.id = 'loadMoreMessages';
                    btn.innerHTML = `<button class="btn btn-sm btn-outline-secondary" onclick="CHAT.loadOlderMessages()"><i class="bi bi-arrow-up me-1"></i> تحميل رسائل أقدم</button>`;
                    messagesContainer.prepend(btn);
                } else {
                    loadMore.style.display = 'block';
                    messagesContainer.prepend(loadMore);
                }
            }

            // Render messages
            sorted.forEach(msg => this.appendMessage(msg, false));

            // Scroll to bottom
            this.scrollToBottom();
        } else {
            messagesContainer.innerHTML = `<div class="text-center py-5"><p class="text-muted">تعذر تحميل الرسائل</p></div>`;
        }

        // Focus input
        document.getElementById('messageInput')?.focus();
    },

    /**
     * Load older messages (pagination).
     */
    async loadOlderMessages() {
        if (this.currentPage >= this.lastPage || !this.activeConversationId) return;

        const nextPage = this.currentPage + 1;
        const result = await API.get(`/chat/conversations/${this.activeConversationId}/messages?page=${nextPage}`);

        if (result.success && result.data) {
            const data = result.data;
            const messages = Array.isArray(data) ? data : (data.data || []);
            const meta = data.meta || result.meta || {};
            this.currentPage = meta.current_page || nextPage;
            this.lastPage = meta.last_page || this.lastPage;

            const sorted = [...messages].reverse();
            const container = document.getElementById('chatMessages');
            const loadMoreBtn = document.getElementById('loadMoreMessages');

            // Insert older messages at the top (after loadMore button)
            sorted.forEach(msg => {
                const bubble = this.createMessageBubble(msg);
                if (loadMoreBtn) {
                    loadMoreBtn.after(bubble);
                } else {
                    container.prepend(bubble);
                }
            });

            // Hide load more if no more pages
            if (this.currentPage >= this.lastPage && loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    },

    /**
     * Append a message bubble to the messages container.
     */
    appendMessage(msg, scrollToBottom = true) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const bubble = this.createMessageBubble(msg);
        container.appendChild(bubble);

        if (scrollToBottom) this.scrollToBottom();
    },

    /**
     * Create a message bubble DOM element.
     */
    createMessageBubble(msg) {
        const isSent = msg.sender_id === this.userId;
        const div = document.createElement('div');
        div.className = `chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'}`;

        const time = new Date(msg.created_at).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
        });

        div.innerHTML = `
            <div class="chat-bubble-content">${this.escapeHtml(msg.content)}</div>
            <div class="chat-bubble-time">
                ${time}
                ${isSent ? `<i class="bi bi-check2${msg.is_read ? '-all text-info' : ''}"></i>` : ''}
            </div>
        `;

        return div;
    },

    /**
     * Scroll messages container to bottom.
     */
    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        if (container) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    },

    // ============================================
    // SEND MESSAGE
    // ============================================

    /**
     * Handle sending a message.
     * POST /chat/messages — See chat.md Section 2
     */
    async handleSendMessage(e) {
        e.preventDefault();

        const input = document.getElementById('messageInput');
        const content = input?.value.trim();
        if (!content || !this.activeConversationId) return;

        const sendBtn = document.getElementById('btnSendMessage');

        // Optimistic UI: append immediately
        const tempMsg = {
            id: Date.now(),
            conversation_id: this.activeConversationId,
            sender_id: this.userId,
            content: content,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        this.appendMessage(tempMsg);
        input.value = '';

        // Update sidebar snippet
        this.updateSidebarSnippet(this.activeConversationId, content);

        // Send to API
        sendBtn.disabled = true;
        const result = await API.post('/chat/send', {
            conversation_id: this.activeConversationId,
            content: content,
        });
        sendBtn.disabled = false;

        if (!result.success) {
            // Check for blocked interaction
            if (result.message === 'blocked_interaction' || result._status === 403) {
                // Disable chat input
                const msgInput = document.getElementById('messageInput');
                const sendBtn = document.getElementById('btnSendMessage');
                if (msgInput) { msgInput.disabled = true; msgInput.placeholder = 'تم حظر التواصل'; }
                if (sendBtn) sendBtn.disabled = true;

                // Show blocked banner
                const form = document.getElementById('sendMessageForm');
                if (form) {
                    const banner = document.createElement('div');
                    banner.className = 'chat-blocked-banner';
                    banner.innerHTML = '<i class="bi bi-slash-circle me-2"></i> لقد قمت بحظر هذا المستخدم أو تم حظرك من قبله';
                    form.parentNode.insertBefore(banner, form);
                    form.style.display = 'none';
                }

                // Mark last bubble with error
                const bubbles = document.querySelectorAll('.chat-bubble-sent');
                const lastBubble = bubbles[bubbles.length - 1];
                if (lastBubble) lastBubble.remove();
            } else {
                // Show error indicator on the last bubble
                const bubbles = document.querySelectorAll('.chat-bubble-sent');
                const lastBubble = bubbles[bubbles.length - 1];
                if (lastBubble) {
                    const errorIcon = document.createElement('span');
                    errorIcon.className = 'chat-bubble-error';
                    errorIcon.innerHTML = '<i class="bi bi-exclamation-circle-fill text-danger"></i>';
                    errorIcon.title = 'فشل إرسال الرسالة';
                    lastBubble.appendChild(errorIcon);
                }
            }
        }

        input.focus();
    },

    /**
     * Update the last message snippet in the sidebar for a conversation.
     */
    updateSidebarSnippet(conversationId, text) {
        const item = document.querySelector(`.chat-conv-item[data-id="${conversationId}"] .chat-conv-snippet`);
        if (item) {
            item.textContent = text.length > 40 ? text.substring(0, 40) + '...' : text;
        }
    },

    // ============================================
    // START CONVERSATION
    // ============================================

    /**
     * Start or get conversation from ad page.
     * POST /chat/start — See chat.md Section 1
     */
    async startConversation(adId) {
        const result = await API.post('/chat/start', { ad_id: parseInt(adId) });

        if (result.success && result.data) {
            const conv = result.data;

            // Reload conversations to include the new one
            await this.loadConversations();

            // Select the conversation
            this.selectConversation(conv.id);
        } else {
            const msg = result.message;
            let errorText = 'حدث خطأ أثناء بدء المحادثة';
            if (msg === 'cannot_message_self') errorText = 'لا يمكنك مراسلة نفسك';
            if (msg === 'blocked_interaction') errorText = 'لا يمكن التواصل مع هذا المستخدم';

            // Show error in chat window
            document.getElementById('chatEmptyState').innerHTML = `
                <div class="chat-empty-icon"><i class="bi bi-exclamation-circle text-danger"></i></div>
                <h4 class="text-danger">${errorText}</h4>
                <a href="ads.html" class="btn btn-outline-primary mt-2"><i class="bi bi-arrow-right me-1"></i> تصفح الإعلانات</a>
            `;
        }
    },

    // ============================================
    // MOBILE RESPONSIVENESS
    // ============================================

    /**
     * Show sidebar (mobile): hide chat window, show sidebar.
     */
    showSidebar() {
        document.getElementById('chatSidebar')?.classList.remove('chat-hidden-mobile');
        document.getElementById('chatWindow')?.classList.add('chat-hidden-mobile');
    },

    /**
     * Show chat window (mobile): hide sidebar, show chat window.
     */
    showChatWindow() {
        if (window.innerWidth < 992) {
            document.getElementById('chatSidebar')?.classList.add('chat-hidden-mobile');
            document.getElementById('chatWindow')?.classList.remove('chat-hidden-mobile');
        }
    },

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Escape HTML to prevent XSS.
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Relative time ago string.
     */
    timeAgo(dateStr) {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffMin < 1) return 'الآن';
        if (diffMin < 60) return `${diffMin} د`;
        if (diffHr < 24) return `${diffHr} س`;
        if (diffDay < 7) return `${diffDay} ي`;
        return date.toLocaleDateString('ar-SA');
    },
};


// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chatMessages') || document.getElementById('conversationsList')) {
        CHAT.init();
    }
});
