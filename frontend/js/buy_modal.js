/**
 * buy_modal.js
 * Handles the popup purchasing flow directly from shop/home pages.
 * Supports both authenticated users and guests (auto-creates a guest session).
 */

async function openBuyModal(productId) {
  // Show a loading overlay first
  const existing = document.getElementById('sv-buy-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sv-buy-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
  overlay.innerHTML = `<div style="color:#fff;font-size:16px;">Loading...</div>`;
  document.body.appendChild(overlay);

  try {
    // Fetch product details (no auth required)
    const res = await apiFetch(`/api/products/${encodeURIComponent(productId)}`);
    if (!res || !res.product) throw new Error('Product not found');
    const p = res.product;
    const price = typeof p.price === 'number' ? p.price.toFixed(2) : p.price;
    const logoHtml = getProductImageHtml(p.name, p.category, `<div style="width:48px;height:48px;border-radius:12px;background:#2d323f;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-box" style="color:#fff;font-size:24px;"></i></div>`).replace('class="product-thumb"', 'style="width:48px;height:48px;"');

    // Build the modal UI
    overlay.innerHTML = `
      <div style="background:#111319;border:1px solid #22252e;border-radius:16px;padding:24px;max-width:500px;width:100%;box-sizing:border-box;position:relative;animation: modalFadeIn 0.2s ease-out;margin:0 16px;">
        <button id="buy-modal-close" style="position:absolute;top:16px;right:16px;background:none;border:none;color:#9a9ca6;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
        
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          ${logoHtml}
          <div style="flex:1;min-width:0;">
            <h2 style="margin:0;font-size:18px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(p.name || '').replace(/</g, '&lt;')}</h2>
            <div style="color:#9a9ca6;font-size:13px;margin-top:4px;">${p.categoryName || p.category || ''} · <span style="color:${p.inStock ? '#10b981' : '#ef4444'}">${p.inStock ? `In Stock (${p.stock || 0})` : 'Out of Stock'}</span></div>
          </div>
        </div>

        <div style="background:#161922;border:1px solid #22252e;border-radius:12px;padding:16px;margin-bottom:24px;max-height:180px;overflow-y:auto;box-sizing:border-box;">
          <p style="margin:0;color:#c0c2cc;font-size:14px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;">${(p.description || 'No description provided.').replace(/</g, '&lt;')}</p>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;background:#161922;padding:16px;border-radius:12px;border:1px solid #22252e;box-sizing:border-box;flex-wrap:wrap;gap:12px;">
          <div style="color:#fff;font-size:15px;font-weight:600;">Quantity</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="qty-minus" style="width:36px;height:36px;border-radius:8px;border:1px solid #323644;background:#22252e;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;font-size:20px;font-weight:bold;line-height:1;">-</button>
            <input type="number" id="qty-input" value="1" min="1" max="1000" style="width:60px;height:36px;background:#111319;border:1px solid #323644;border-radius:8px;color:#fff;font-size:16px;font-weight:600;text-align:center;outline:none;-moz-appearance:textfield;box-sizing:border-box;">
            <button id="qty-plus" style="width:36px;height:36px;border-radius:8px;border:1px solid #323644;background:#22252e;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;font-size:20px;font-weight:bold;line-height:1;">+</button>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div style="color:#9a9ca6;font-size:14px;">Total Price</div>
          <div id="buy-total" style="color:#fff;font-size:24px;font-weight:700;">$${price}</div>
        </div>

        <button id="confirm-buy-btn" ${!p.inStock ? 'disabled' : ''} style="width:100%;background:${p.inStock ? '#6d5ef8' : '#2d323f'};color:${p.inStock ? '#fff' : '#9a9ca6'};border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:600;cursor:${p.inStock ? 'pointer' : 'not-allowed'};transition:opacity 0.2s;">
          ${p.inStock ? 'Confirm Purchase' : 'Out of Stock'}
        </button>

        <div id="buy-guest-note" style="display:none;margin-top:12px;padding:12px;background:#161922;border:1px solid #22252e;border-radius:10px;font-size:12.5px;color:#9a9ca6;text-align:center;">
          You're purchasing as a <strong style="color:#f4f4f6;">Guest</strong>. 
          <a href="register.html" style="color:#6d5ef8;font-weight:600;">Create an account</a> to save your orders and balance.
        </div>
      </div>
    `;

    // Add specific CSS for number input to hide spinners
    if (!document.getElementById('buy-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'buy-modal-styles';
      style.innerHTML = `
        @keyframes modalFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        #qty-input::-webkit-outer-spin-button, #qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        #confirm-buy-btn:hover { opacity: 0.9; }
      `;
      document.head.appendChild(style);
    }

    const closeBtn = overlay.querySelector('#buy-modal-close');
    const qtyMinus = overlay.querySelector('#qty-minus');
    const qtyPlus = overlay.querySelector('#qty-plus');
    const qtyInput = overlay.querySelector('#qty-input');
    const totalEl = overlay.querySelector('#buy-total');
    const confirmBtn = overlay.querySelector('#confirm-buy-btn');
    const guestNote = overlay.querySelector('#buy-guest-note');

    const unitPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price);

    // Show guest note if not logged in
    const isLoggedIn = !!(getToken() && getUser());
    if (!isLoggedIn && guestNote) guestNote.style.display = 'block';

    function updateTotal() {
      let qty = parseInt(qtyInput.value) || 1;
      if (qty < 1) qty = 1;
      totalEl.textContent = '$' + (unitPrice * qty).toFixed(2);
    }

    qtyMinus.addEventListener('click', () => {
      let qty = parseInt(qtyInput.value) || 1;
      if (qty > 1) {
        qtyInput.value = qty - 1;
        updateTotal();
      }
    });

    qtyPlus.addEventListener('click', () => {
      let qty = parseInt(qtyInput.value) || 1;
      qtyInput.value = qty + 1;
      updateTotal();
    });

    qtyInput.addEventListener('input', updateTotal);
    qtyInput.addEventListener('blur', () => {
      let qty = parseInt(qtyInput.value);
      if (isNaN(qty) || qty < 1) qtyInput.value = 1;
      updateTotal();
    });

    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    confirmBtn.addEventListener('click', async () => {
      const qty = parseInt(qtyInput.value) || 1;
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

      try {
        // Ensure the user has a token (create guest session if needed)
        let token = getToken();
        if (!token) {
          // Auto-create a guest session — no login required
          const guestRes = await fetch(`${API_BASE}/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!guestRes.ok) throw new Error('Failed to create guest session');
          const guestData = await guestRes.json();
          localStorage.setItem('sv_token', guestData.token);
          localStorage.setItem('sv_user', JSON.stringify(guestData.user));
          localStorage.setItem('sv_is_guest', '1');
          token = guestData.token;
        }

        // Place the order — correct endpoint: POST /api/orders
        const buyRes = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: p.id, quantity: qty }),
        });

        const buyData = await buyRes.json();

        if (!buyRes.ok) {
          // Handle insufficient balance — guide guest to deposit
          if (buyRes.status === 402) {
            throw {
              error: `Insufficient balance. You need $${buyData.needed} more. ` +
                `<a href="top_up_balance.html" style="color:#6d5ef8;font-weight:600;">Top up here</a>`,
              isHtml: true,
            };
          }
          throw { error: buyData.error || 'Purchase failed' };
        }

        if (buyData && buyData.order) {
          const o = buyData.order;
          svToast('Purchase successful!', 'success');
          // Update local balance display
          const freshUser = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('sv_token')}` },
          }).then(r => r.ok ? r.json() : null).catch(() => null);

          if (freshUser && freshUser.user) {
            localStorage.setItem('sv_user', JSON.stringify(freshUser.user));
            const balEl = document.getElementById('shell-balance');
            if (balEl) balEl.innerHTML = '$' + (freshUser.user.balance / 100).toFixed(2) + ' <span>USD</span>';
          }
          
          const keysJoined = (o.keys || []).join('\n').replace(/</g, '&lt;');
          
          overlay.innerHTML = `
            <div style="background:#111319;border:1px solid #22252e;border-radius:16px;padding:24px;max-width:500px;width:100%;box-sizing:border-box;position:relative;animation: modalFadeIn 0.2s ease-out;margin:0 16px;">
              <button onclick="document.getElementById('sv-buy-modal').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:#9a9ca6;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
              
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:56px;height:56px;border-radius:50%;background:rgba(16,185,129,0.1);color:#10b981;font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                  <i class="fa-solid fa-check"></i>
                </div>
                <h2 style="margin:0 0 8px;font-size:20px;color:#fff;">Purchase Successful!</h2>
                <div style="color:#9a9ca6;font-size:14px;">Order #${o.id} &bull; ${o.productName} (x${o.quantity})</div>
              </div>
              
              <div style="background:#161922;border:1px solid #22252e;border-radius:12px;padding:16px;margin-bottom:24px;">
                <div style="color:#c0c2cc;font-size:13px;font-family:monospace;white-space:pre-wrap;word-break:break-all;max-height:150px;overflow-y:auto;">${keysJoined}</div>
              </div>
              
              <div style="display:flex;gap:12px;">
                <button id="download-keys-btn" style="flex:1;background:#2d323f;color:#fff;border:none;border-radius:10px;padding:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;">
                  <i class="fa-solid fa-download"></i> Download
                </button>
                <button onclick="window.location.href='my_orders.html'" style="flex:1;background:#6d5ef8;color:#fff;border:none;border-radius:10px;padding:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;">
                  View All Orders
                </button>
              </div>
            </div>
          `;
          
          document.getElementById('download-keys-btn').addEventListener('click', async () => {
            const btn = document.getElementById('download-keys-btn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading...';
            btn.disabled = true;
            
            try {
              const response = await fetch(`${API_BASE}/orders/${o.id}/download`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sv_token')}` }
              });
              
              if (!response.ok) {
                svToast('Download failed. Please try again.', 'error');
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                return;
              }
              
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              const cd = response.headers.get('Content-Disposition');
              a.download = (cd && cd.split('filename=')[1]) ? cd.split('filename=')[1].replace(/"/g, '') : `order_${o.id}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              btn.innerHTML = originalHtml;
              btn.disabled = false;
            } catch (err) {
              svToast('Server unavailable, try again', 'error');
              btn.innerHTML = originalHtml;
              btn.disabled = false;
            }
          });
        } else {
          throw new Error('Purchase failed');
        }
      } catch (err) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = p.inStock ? 'Confirm Purchase' : 'Out of Stock';
        const msg = (err && err.error) || 'Purchase failed. Please try again.';
        if (err && err.isHtml) {
          // Show the HTML message (with deposit link)
          const errDiv = document.getElementById('buy-modal-err');
          if (errDiv) {
            errDiv.innerHTML = msg;
            errDiv.style.display = 'block';
          } else {
            svToast('Insufficient balance — please top up your account.', 'error');
          }
        } else {
          svToast(msg, 'error');
        }
      }
    });

  } catch (err) {
    overlay.innerHTML = `<div style="background:#111319;border-radius:12px;padding:24px;color:#fff;max-width:400px;text-align:center;">
      <i class="fa-solid fa-circle-exclamation" style="font-size:32px;color:#ef4444;margin-bottom:16px;"></i>
      <h3 style="margin:0 0 8px;">Error</h3>
      <p style="color:#9a9ca6;margin:0 0 16px;">Failed to load product details.</p>
      <button onclick="document.getElementById('sv-buy-modal').remove()" style="background:#22252e;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;">Close</button>
    </div>`;
  }
}
