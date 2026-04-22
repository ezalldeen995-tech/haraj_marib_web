document.addEventListener('DOMContentLoaded', () => {
    const auctionContainer = document.getElementById('auction-container');
    if (!auctionContainer) return;

    const auctionId = auctionContainer.dataset.auctionId;
    const currentPriceEl = document.getElementById('current-price');
    const bidHistoryEl = document.getElementById('bid-history');
    const countdownEl = document.getElementById('countdown-timer');
    const bidForm = document.getElementById('bid-form');
    const errorMessageEl = document.getElementById('bid-error');
    
    let endTimeStr = auctionContainer.dataset.endTime;
    let endTime = new Date(endTimeStr).getTime();

    // Use global prefix if defined, else /api/
    const apiPrefix = window.API_BASE_URL || '/api';

    // Setup Polling every 3 seconds for real-time feel
    setInterval(() => {
        fetch(`${apiPrefix}/auctions/${auctionId}`)
        .then(res => res.json())
        .then(data => {
            if (data.current_price) {
                currentPriceEl.innerText = data.current_price;
            }
            if (data.status === 'ended') {
                countdownEl.innerText = 'Auction Ended';
                countdownEl.classList.add('text-red-500');
                if (bidForm) bidForm.style.display = 'none';
            }
            if (data.bids) {
                renderBids(data.bids);
            }
        }).catch(err => console.log('Polling error:', err));
    }, 3000);

    // Bidding Submission
    if (bidForm) {
        bidForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = document.getElementById('bid-amount').value;
            const isProxy = document.getElementById('is-proxy') ? document.getElementById('is-proxy').checked : false;
            const maxProxyAmount = document.getElementById('max-proxy-amount') ? document.getElementById('max-proxy-amount').value : null;

            errorMessageEl.innerHTML = '<p class="text-blue-500 text-sm mt-1">Placing bid...</p>';

            try {
                // Determine token dynamically (often stored in localStorage 'token' or similar in Vite apps)
                const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';

                const response = await fetch(`${apiPrefix}/auctions/${auctionId}/bid`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount, is_proxy: isProxy, max_proxy_amount: maxProxyAmount
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    errorMessageEl.innerHTML = `<p class="text-red-500 text-sm mt-1">${result.message}</p>`;
                } else {
                    errorMessageEl.innerHTML = `<p class="text-green-500 text-sm mt-1">${result.message}</p>`;
                    // Let the poller update the UI natively or force an update
                    fetch(`${apiPrefix}/auctions/${auctionId}`).then(res=>res.json()).then(data=>{
                        if(data.current_price) currentPriceEl.innerText = data.current_price;
                        if(data.bids) renderBids(data.bids);
                    });
                    bidForm.reset();
                }
            } catch (err) {
                errorMessageEl.innerHTML = `<p class="text-red-500 text-sm mt-1">A network error occurred.</p>`;
            }
        });
    }

    // Proxy max amount input toggling
    const proxyCheck = document.getElementById('is-proxy');
    const proxyMaxDiv = document.getElementById('proxy-max-group');
    if (proxyCheck && proxyMaxDiv) {
        proxyCheck.addEventListener('change', (e) => {
            proxyMaxDiv.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Countdown Timer logic
    setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            countdownEl.innerHTML = "Auction Ended";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownEl.innerHTML = `Ending in: <strong>${days}d ${hours}h ${minutes}m ${seconds}s</strong>`;
    }, 1000);

    function renderBids(bids) {
        if (bids.length === 0) {
            bidHistoryEl.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">No bids yet</td></tr>';
            return;
        }
        
        bidHistoryEl.innerHTML = bids.map((bid, index) => `
            <tr class="border-b ${index === 0 ? 'bg-green-50' : ''}">
                <td class="py-3 px-2">${bid.user} ${index === 0 ? '<span class="text-xs bg-green-500 text-white rounded px-2 py-1 ml-2">Winner</span>' : ''}</td>
                <td class="py-3 px-2 font-bold text-gray-800">${bid.amount} SARS</td>
                <td class="py-3 px-2 text-gray-400 text-sm">${bid.time}</td>
            </tr>
        `).join('');
    }
});
