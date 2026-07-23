/**
 * buy_modal.js
 * Handles the popup purchasing flow directly from shop/home pages
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
    // Fetch product details
    const res = await apiFetch(`/api/products/${encodeURIComponent(productId)}`);
    if (!res || !res.product) throw new Error('Product not found');
    const p = res.product;
    const price = typeof p.price === 'number' ? p.price.toFixed(2) : p.price;
    const logoHtml = getProductImageHtml(p.name, p.category, `<div style="width:48px;height:48px;border-radius:12px;background:#2d323f;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-box" style="color:#fff;font-size:24px;"></i></div>`).replace('class="product-thumb"', 'style="width:48px;height:48px;"');

    // Build the modal UI
    overlay.innerHTML = `
      <div style="background:#111319;border:1px solid #22252e;border-radius:16px;padding:32px;max-width:500px;width:100%;position:relative;animation: modalFadeIn 0.2s ease-out;">
        <button id="buy-modal-close" style="position:absolute;top:20px;right:20px;background:none;border:none;color:#9a9ca6;font-size:20px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          ${logoHtml}
          <div>
            <h2 style="margin:0;font-size:20px;color:#fff;">${(p.name || '').replace(/</g, '&lt;')}</h2>
            <div style="color:#9a9ca6;font-size:14px;margin-top:4px;">${p.categoryName || p.category || ''} · <span style="color:${p.inStock ? '#10b981' : '#ef4444'}">${p.inStock ? `In Stock (${p.stock || 0})` : 'Out of Stock'}</span></div>
          </div>
        </div>

        <div style="background:#161922;border:1px solid #22252e;border-radius:12px;padding:16px;margin-bottom:24px;max-height:200px;overflow-y:auto;">
          <p style="margin:0;color:#c0c2cc;font-size:14px;line-height:1.6;white-space:pre-wrap;">${(p.description || 'No description provided.').replace(/</g, '&lt;')}</p>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;background:#161922;padding:16px;border-radius:12px;border:1px solid #22252e;">
          <div style="color:#fff;font-size:16px;font-weight:600;">Quantity</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <button id="qty-minus" style="width:36px;height:36px;border-radius:8px;border:1px solid #323644;background:#22252e;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;"><i class="fa-solid fa-minus"></i></button>
            <input type="number" id="qty-input" value="1" min="1" max="1000" style="width:70px;height:36px;background:#111319;border:1px solid #323644;border-radius:8px;color:#fff;font-size:16px;font-weight:600;text-align:center;outline:none;-moz-appearance:textfield;">
            <button id="qty-plus" style="width:36px;height:36px;border-radius:8px;border:1px solid #323644;background:#22252e;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div style="color:#9a9ca6;font-size:14px;">Total Price</div>
          <div id="buy-total" style="color:#fff;font-size:24px;font-weight:700;">$${price}</div>
        </div>

        <button id="confirm-buy-btn" ${!p.inStock ? 'disabled' : ''} style="width:100%;background:${p.inStock ? '#6d5ef8' : '#2d323f'};color:${p.inStock ? '#fff' : '#9a9ca6'};border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:600;cursor:${p.inStock ? 'pointer' : 'not-allowed'};transition:opacity 0.2s;">
          ${p.inStock ? 'Confirm Purchase' : 'Out of Stock'}
        </button>
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

    const unitPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price);

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
      if (!getToken() || !getUser()) {
        window.location.href = 'login.html';
        return;
      }
      
      const qty = parseInt(qtyInput.value) || 1;
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

      try {
        const buyRes = await apiFetch('/api/orders/buy', {
          method: 'POST',
          body: JSON.stringify({ productId: p.id, quantity: qty })
        });
        
        if (buyRes && buyRes.order) {
          svToast('Purchase successful!', 'success');
          // Update local balance
          apiFetch('/api/auth/me').then((data) => {
            if (data && data.user) {
              localStorage.setItem('sv_user', JSON.stringify(data.user));
              // Update balance UI if element exists
              const balEl = document.getElementById('shell-balance');
              if (balEl) balEl.innerHTML = formatBalance(data.user.balance) + ' <span>USD</span>';
            }
          });
          overlay.remove();
          // Optionally route to my_orders
          setTimeout(() => { window.location.href = 'my_orders.html'; }, 1500);
        } else {
          throw new Error('Purchase failed');
        }
      } catch (err) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Confirm Purchase';
        svToast((err && err.error) || 'Purchase failed', 'error');
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
