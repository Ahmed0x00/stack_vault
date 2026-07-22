import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { 
  Zap, 
  ShieldCheck, 
  Coins, 
  ArrowRight, 
  Bot, 
  Sparkles, 
  Lock, 
  CheckCircle2
} from 'lucide-react';

export default function HomePage({ onOpenAuth }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get('/products');
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to load home products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const featured = products.slice(0, 6);

  return (
    <div className="space-y-20 py-8">
      
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Fast • Secure • Automated Delivery
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold max-w-4xl mx-auto leading-tight tracking-tight">
          Digital Subscriptions & <br className="hidden sm:inline" />
          <span className="gradient-headline">Genuine License Keys</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
          Access ChatGPT Pro, Grok, Microsoft Office 365, Canva Pro, Coursera, Outlook emails, and streaming accounts at wholesale rates. Delivered instantly.
        </p>

        {/* Hero Call To Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/shop" className="btn-primary text-sm py-3 px-6 shadow-lg shadow-indigo-500/20">
            Explore Product Catalog <ArrowRight className="w-4 h-4" />
          </Link>

          <a 
            href="https://t.me/stackvault_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-3 px-6"
          >
            <Bot className="w-4 h-4 text-indigo-400" /> Telegram Seller Bot
          </a>
        </div>

        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
          <div className="glass-card p-4 flex items-center justify-center gap-3">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Lowest Wholesale Prices</span>
          </div>

          <div className="glass-card p-4 flex items-center justify-center gap-3">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Automated Instant Delivery</span>
          </div>

          <div className="glass-card p-4 flex items-center justify-center gap-3">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">USDT BEP20 Auto Deposit</span>
          </div>

          <div className="glass-card p-4 flex items-center justify-center gap-3">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">100% Replacement Warranty</span>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Popular Subscriptions</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Select a product to view features or buy instantly with your balance.</p>
          </div>

          <Link to="/shop" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All ({products.length}) Products →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="glass-card p-6 h-60 animate-pulse bg-slate-900/40"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onQuickBuy={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="glass-card p-8 sm:p-12 space-y-8 bg-gradient-to-br from-indigo-950/20 via-slate-900/50 to-purple-950/20 border-indigo-500/20">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold">How StackVault Works</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Get your license keys in 3 simple automated steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto text-sm font-bold font-mono">
              01
            </div>
            <h4 className="font-bold text-white text-base">Top Up Balance</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Deposit USDT automatically via BSC network to your personal deposit address or send via Binance Pay.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto text-sm font-bold font-mono">
              02
            </div>
            <h4 className="font-bold text-white text-base">Select Product</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Choose your desired AI subscription, software key, or bulk emails with live wholesale pricing.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-sm font-bold font-mono">
              03
            </div>
            <h4 className="font-bold text-white text-base">Instant Key Delivery</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your license keys appear on screen instantly and can be downloaded as a text file.
            </p>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenAuth={onOpenAuth}
        />
      )}

    </div>
  );
}
