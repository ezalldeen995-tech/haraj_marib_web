/**
 * Auction Logic for Haraj Maareb
 */

window.renderAuctionTemplate = function(auction) {
    const minBid = Math.max(parseFloat(auction.current_price) + parseFloat(auction.min_bid_step), parseFloat(auction.start_price));
    
    let html = `
    <div class="bg-primary bg-opacity-10 rounded p-3 mb-3 border border-primary">
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <h6 class="text-primary mb-1 fw-bold"><i class="bi bi-hammer me-1"></i> مزاد علني</h6>
                <div class="fs-4 fw-bold text-dark"><span id="auctionCurrentPrice">${auction.current_price}</span> <small class="fs-6 text-muted">ر.ي</small></div>
            </div>
            <div class="text-end">
                <span class="badge bg-danger fs-6" id="auctionCountdown">جاري الحساب...</span>
            </div>
        </div>
    `;

    if (auction.status === 'active') {
        html += `
        <form id="bidForm" class="mt-3">
            <div class="input-group mb-2">
                <input type="number" id="bidAmount" class="form-control" min="${minBid}" step="0.01" value="${minBid}" required placeholder="المبلغ لا يقل عن ${minBid}">
                <button class="btn btn-primary fw-bold px-4" type="submit" id="btnSubmitBid">زاود الآن</button>
            </div>
            <div class="form-check text-muted" style="font-size:0.85rem">
                <input class="form-check-input" type="checkbox" id="isProxyBid">
                <label class="form-check-label" for="isProxyBid">مزايدة آلية (بروكسي)</label>
            </div>
            <div class="mt-2 d-none" id="proxyMaxAmountContainer">
                <input type="number" id="proxyMaxAmount" class="form-control form-control-sm" step="0.01" placeholder="أقصى مبلغ للمزايدة الآلية">
            </div>
            <div id="bidError" class="mt-2 text-center text-danger small"></div>
        </form>
        `;
    } else {
        html += `
        <div class="alert alert-secondary text-center fw-bold py-2 mb-0 mt-3 border-0">
            انتهى المزاد
        </div>
        `;
    }

    html += `
        <div class="mt-4">
            <h6 class="fw-bold mb-2">سجل المزايدات</h6>
            <div class="bg-white rounded border overflow-hidden" style="max-height: 200px; overflow-y: auto;">
                <table class="table table-sm table-hover mb-0 text-center" style="font-size:0.9rem">
                    <tbody id="bidHistoryTable">
                        <tr><td colspan="3" class="text-muted py-3">جاري التحميل...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
    return html;
};

const AUCTION_MODULE = {
    auctionId: null,
    endTime: null,
    timerInterval: null,
    pollInterval: null,

    init(auctionId, endTimeStr) {
        this.auctionId = auctionId;
        this.endTime = new Date(endTimeStr).getTime();
        
        // Setup proxy toggle
        const proxyCheck = document.getElementById('is-proxy') || document.getElementById('isProxyBid');
        const proxyMaxCon = document.getElementById('proxy-max-group') || document.getElementById('proxyMaxAmountContainer');
        if (proxyCheck) {
            proxyCheck.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (proxyMaxCon.classList.contains('d-none')) proxyMaxCon.classList.remove('d-none');
                    else proxyMaxCon.style.display = 'block';
                } else {
                    if (proxyMaxCon.classList.contains('d-none')) proxyMaxCon.classList.add('d-none');
                    else proxyMaxCon.style.display = 'none';
                }
            });
        }

        // Setup form submit
        const bidForm = document.getElementById('bid-form') || document.getElementById('bidForm');
        if (bidForm) {
            bidForm.addEventListener('submit', (e) => this.submitBid(e));
        }

        this.startCountdown();
        this.startPolling();
        this.fetchData(); // fetch immediately
    },

    startCountdown() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = this.endTime - now;
            const el = document.getElementById('countdown-timer') || document.getElementById('auctionCountdown');
            if (!el) return;

            if (distance < 0) {
                el.innerText = 'انتهى المزاد';
                clearInterval(this.timerInterval);
                const form = document.getElementById('bid-form') || document.getElementById('bidForm');
                if (form) form.style.display = 'none';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (el.id === 'countdown-timer') {
                // Formatting for the new UI: HH:MM:SS
                const h = String(hours + (days * 24)).padStart(2, '0');
                const m = String(minutes).padStart(2, '0');
                const s = String(seconds).padStart(2, '0');
                el.innerText = `${h}:${m}:${s}`;
            } else {
                el.innerHTML = `${days} ي ${hours} س ${minutes} د ${seconds} ث`;
            }
        };

        this.timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    },

    startPolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => this.fetchData(), 3000);
    },

    async fetchData() {
        try {
            const res = await API.get(`/auctions/${this.auctionId}`);
            if (res && !res.message) {
                // Update price
                const p = document.getElementById('current-price') || document.getElementById('auctionCurrentPrice');
                if (p) p.innerText = Number(res.current_price).toLocaleString('ar-YE');
                
                // Update bids
                this.renderBids(res.bids || []);

                // Update status
                if (res.status === 'ended') {
                    const el = document.getElementById('countdown-timer') || document.getElementById('auctionCountdown');
                    if (el) el.innerText = 'انتهى المزاد';
                    const form = document.getElementById('bid-form') || document.getElementById('bidForm');
                    if (form) form.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Auction poll error', err);
        }
    },

    renderBids(bids) {
        const tb = document.getElementById('bid-history') || document.getElementById('bidHistoryTable');
        if (!tb) return;

        if (bids.length === 0) {
            tb.innerHTML = '<tr><td colspan="3" class="text-center py-5 text-muted italic">كن أول من يزايد على هذا المنتج!</td></tr>';
            return;
        }

        const isNewUI = tb.id === 'bid-history';

        tb.innerHTML = bids.map((b, i) => {
            if (isNewUI) {
                return `
                <tr class="bid-history-item ${i === 0 ? 'highest' : ''}">
                    <td class="py-3 px-4 border-0">
                        <i class="bi bi-person-circle me-2 text-muted"></i>${b.user}
                    </td>
                    <td class="py-3 px-4 border-0 text-primary">${Number(b.amount).toLocaleString('ar-YE')} ر.ي</td>
                    <td class="py-3 px-4 border-0 text-muted small text-start">${b.time}</td>
                </tr>`;
            } else {
                return `
                <tr class="${i===0 ? 'table-success fw-bold' : ''}">
                    <td>${b.user} ${i===0 ? '<small class="text-success">(متقدم)</small>' : ''}</td>
                    <td>${Number(b.amount).toLocaleString('ar-YE')} ر.ي</td>
                    <td class="text-muted" style="font-size:0.8rem">${b.time}</td>
                </tr>`;
            }
        }).join('');
    },

    async submitBid(e) {
        e.preventDefault();
        if (!AUTH.isLoggedIn()) {
            window.location.href = '/web/login.html';
            return;
        }

        const amtEl = document.getElementById('bid-amount') || document.getElementById('bidAmount');
        const isProxyEl = document.getElementById('is-proxy') || document.getElementById('isProxyBid');
        const proxyMaxEl = document.getElementById('max-proxy-amount') || document.getElementById('proxyMaxAmount');
        const errEl = document.getElementById('bid-error') || document.getElementById('bidError');
        const btn = e.target.querySelector('button[type="submit"]');

        UI.toggleBtnLoading(btn, true);
        errEl.innerText = '';

        const res = await API.post(`/auctions/${this.auctionId}/bid`, {
            amount: amtEl.value,
            is_proxy: isProxyEl.checked,
            max_proxy_amount: isProxyEl.checked ? proxyMaxEl.value : null
        });

        UI.toggleBtnLoading(btn, false);

        if (res.success || res._status === 201 || res._status === 200) {
            errEl.innerHTML = `<span class="text-success">${res.message || 'تمت المزايدة بنجاح'}</span>`;
            e.target.reset();
            const proxyMaxCon = document.getElementById('proxy-max-group') || document.getElementById('proxyMaxAmountContainer');
            if (proxyMaxCon) {
                if (proxyMaxCon.classList.contains('d-none')) proxyMaxCon.classList.add('d-none');
                else proxyMaxCon.style.display = 'none';
            }
            this.fetchData();
        } else {
            errEl.innerHTML = `<span class="text-danger">${res.message || 'حدث خطأ أثناء المزايدة'}</span>`;
        }
    }
};
