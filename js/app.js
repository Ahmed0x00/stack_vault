/**
 * StackVault Website Application Logic
 * Telegram Bot: https://t.me/stackvault_bot
 */

const TELEGRAM_BOT_URL = 'https://t.me/stackvault_bot';

const PRODUCTS = [
  {
    id: 'chatgpt-pro-k12',
    name: 'ChatGPT Pro K12',
    category: 'ai',
    categoryName: 'AI Subscriptions',
    price: 0.50,
    stock: 28,
    description: 'ChatGPT Pro account access with priority bandwidth & peak-hour access.',
    features: ['Full ChatGPT Pro Account', 'High-Speed Priority', 'Instant Telegram Delivery', 'Warranty Guarantee']
  },
  {
    id: 'super-grok-10d',
    name: 'Super Grok 10D FW',
    category: 'ai',
    categoryName: 'AI Subscriptions',
    price: 0.90,
    stock: 2,
    description: 'Super Grok access for 10 days with full real-time capabilities.',
    features: ['10 Days Full Access', 'Real-Time Intelligence', 'Fast Delivery', 'Replacement Support']
  },
  {
    id: 'office-pro-2021',
    name: 'Office Pro Plus 2021 Lifetime',
    category: 'software',
    categoryName: 'Software Keys',
    price: 0.50,
    stock: 8,
    description: 'Lifetime genuine activation license key for Microsoft Office Pro Plus 2021.',
    features: ['Genuine Retail Key', 'Lifetime 1 PC License', 'Official Microsoft Online Activation', 'Word, Excel, PowerPoint, Outlook']
  },
  {
    id: 'chatgpt-plus-1m',
    name: 'ChatGPT Plus 1 Month',
    category: 'ai',
    categoryName: 'AI Subscriptions',
    price: 0.95,
    stock: 0,
    description: '1 month ChatGPT Plus subscription access with GPT-4 and DALL-E.',
    features: ['1 Month Subscription', 'GPT-4 & GPT-4o Access', 'Custom GPTs Enabled', 'Restocking Soon']
  },
  {
    id: 'amazon-prime-6m',
    name: 'Amazon Prime 6Months 6Profiles',
    category: 'streaming',
    categoryName: 'Streaming',
    price: 1.50,
    stock: 11,
    description: 'Amazon Prime Video access for 6 months with 6 separate user profiles.',
    features: ['6 Months Access', '6 Profiles Included', 'HD & 4K Streaming', 'Instant Telegram Bot Access']
  },
  {
    id: 'canva-pro-2yr',
    name: 'Canva Pro 2 yrs FW',
    category: 'design',
    categoryName: 'Design & Editing',
    price: 0.60,
    stock: 31,
    description: 'Canva Pro access for 2 full years on your own personal email.',
    features: ['2 Years Pro Access', '100M+ Stock Assets & Templates', 'Background Remover', 'Custom Brand Kits']
  },
  {
    id: 'coursera-plus-12m',
    name: 'Coursera Plus 12 Months',
    category: 'learning',
    categoryName: 'Learning',
    price: 1.90,
    stock: 9,
    description: 'Coursera Plus access for 12 months with unlimited certificates.',
    features: ['12 Months Unlimited Learning', '7,000+ Courses & Specializations', 'Top University Certificates', 'Full Warranty']
  },
  {
    id: 'gemini-pro-18m',
    name: 'Gemini Pro 18Months (link)',
    category: 'ai',
    categoryName: 'AI Subscriptions',
    price: 0.65,
    stock: 43,
    description: 'Google Gemini Pro access for 18 months via direct activation link.',
    features: ['18 Months Gemini Pro Access', 'Direct Activation Link', 'Fast Setup', '24/7 Automated Fulfillment']
  },
  {
    id: 'outlook-hotmail-bulk',
    name: 'Emails Outlook / Hotmail',
    category: 'emails',
    categoryName: 'Bulk Emails',
    price: 0.04,
    stock: 290,
    description: 'Fresh Outlook / Hotmail email accounts formatted for bulk usage.',
    features: ['Fresh Registered Accounts', 'IMAP / POP3 Enabled', 'Standard format email:pass', 'Bulk Available']
  },
  {
    id: 'office-365-1yr',
    name: 'Microsoft Office 365 Plus 1 year',
    category: 'software',
    categoryName: 'Software Keys',
    price: 0.50,
    stock: 12,
    description: 'Microsoft Office 365 Plus subscription for 1 year with 1TB OneDrive.',
    features: ['1 Year Subscription', '5 Devices Simultaneous Login', '1TB OneDrive Storage', 'Official Download']
  },
  {
    id: 'capcut-pro-1m',
    name: 'Capcut Pro 1 Month FW',
    category: 'design',
    categoryName: 'Design & Editing',
    price: 1.85,
    stock: 5,
    description: 'CapCut Pro access for 1 month with full premium tools and no watermark.',
    features: ['1 Month Full Access', 'Premium AI Effects & Captions', '4K 60fps No Watermark Export', 'Desktop & Mobile Sync']
  }
];

let activeCategory = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupEvents();
});

function renderProducts() {
  const container = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  if (!container) return;

  const filtered = PRODUCTS.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  container.style.display = 'grid';

  container.innerHTML = filtered.map(p => {
    const isSoldOut = p.stock === 0;
    const stockClass = isSoldOut ? 'product-stock out' : p.stock <= 5 ? 'product-stock low' : 'product-stock in';
    const stockText = isSoldOut ? 'Sold out' : `${p.stock} in stock`;
    const buyUrl = `${TELEGRAM_BOT_URL}?start=buy_${p.id}`;

    return `
      <div class="product-card">
        <div>
          <div class="product-card-head">
            <span class="category-tag">${p.categoryName}</span>
            <span class="${stockClass}">
              <span class="dot"></span> ${stockText}
            </span>
          </div>

          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
        </div>

        <div class="card-foot">
          <div class="price">
            $${p.price.toFixed(2)} <span class="unit">USD</span>
          </div>

          <div class="card-btn-group">
            <button class="btn-details" onclick="openProductModal('${p.id}')">Info</button>
            <a href="${isSoldOut ? '#' : buyUrl}" target="_blank" rel="noopener" class="btn-buy-card ${isSoldOut ? 'disabled' : ''}">
              ${isSoldOut ? 'Out of Stock' : 'Buy via Bot'}
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupEvents() {
  // Category Filtering
  const catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      renderProducts();
    });
  });

  // Search Input
  const searchInput = document.getElementById('product-search');
  const searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClear) searchClear.style.display = searchQuery ? 'block' : 'none';
      renderProducts();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      searchClear.style.display = 'none';
      renderProducts();
    });
  }

  // Mobile nav toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navMenu.style.display === 'flex';
      navMenu.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '68px';
        navMenu.style.left = '0';
        navMenu.style.width = '100%';
        navMenu.style.background = '#0b0c10';
        navMenu.style.padding = '20px';
        navMenu.style.borderBottom = '1px solid var(--border-color)';
      }
    });
  }

  // ESC Close Modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

window.openProductModal = function(productId) {
  const p = PRODUCTS.find(item => item.id === productId);
  if (!p) return;

  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-content');
  if (!modal || !content) return;

  const isSoldOut = p.stock === 0;
  const buyUrl = `${TELEGRAM_BOT_URL}?start=buy_${p.id}`;

  content.innerHTML = `
    <span class="category-tag">${p.categoryName}</span>
    <h2 style="font-size: 1.4rem; font-weight: 700; margin: 4px 0 12px; color: #fff;">${p.name}</h2>
    
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.6;">${p.description}</p>

    <h4 style="font-size: 0.88rem; font-weight: 600; margin-bottom: 10px; color: var(--text-main);">Features & Included Services:</h4>
    <ul style="list-style: none; margin-bottom: 24px;">
      ${p.features.map(f => `<li style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="stroke: var(--accent-green);"><polyline points="20 6 9 17 4 12"/></svg>
        ${f}
      </li>`).join('')}
    </ul>

    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid var(--border-color);">
      <div style="font-size: 1.5rem; font-weight: 700;">$${p.price.toFixed(2)}</div>
      <a href="${isSoldOut ? '#' : buyUrl}" target="_blank" rel="noopener" class="btn primary ${isSoldOut ? 'disabled' : ''}">
        ${isSoldOut ? 'Sold Out' : 'Order via Telegram Bot'}
      </a>
    </div>
  `;

  modal.classList.add('active');
};

window.closeModal = function() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
};
