import React, { useState, useEffect } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { Search, X, Layers, Filter } from 'lucide-react';

export default function ShopPage({ onOpenAuth }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await api.get('/products');
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to load shop catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'ai', name: 'AI Subscriptions' },
    { id: 'software', name: 'Software Keys' },
    { id: 'streaming', name: 'Streaming' },
    { id: 'design', name: 'Design & Editing' },
    { id: 'learning', name: 'Learning' },
    { id: 'emails', name: 'Bulk Emails' },
  ];

  const filtered = products.filter((p) => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q));

    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-8 py-8">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white">Product Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">Browse wholesale digital keys and accounts with instant automated delivery.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products or keys..."
            className="input-field pl-10 pr-10 py-2.5 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const count = cat.id === 'all' 
            ? products.length 
            : products.filter(p => p.category === cat.id).length;

          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                isActive 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.name}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-card p-6 h-64 animate-pulse bg-slate-900/40"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-12 text-center space-y-4 max-w-md mx-auto">
          <Layers className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white font-['Outfit']">No Products Found</h3>
          <p className="text-xs text-slate-400">
            No products matched your search "{searchQuery}" in the selected category.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="btn-secondary text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onQuickBuy={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      )}

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
