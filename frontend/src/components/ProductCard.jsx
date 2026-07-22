import React from 'react';
import { Info, ShoppingCart, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function ProductCard({ product, onSelectProduct, onQuickBuy }) {
  const { id, name, categoryName, price, stock, inStock, description } = product;

  let stockClass = 'in';
  let stockLabel = `${stock > 0 ? stock : 'In'} Stock`;
  let StockIcon = CheckCircle2;

  if (!inStock || stock === 0) {
    stockClass = 'out';
    stockLabel = 'Sold Out';
    StockIcon = XCircle;
  } else if (stock <= 3) {
    stockClass = 'low';
    stockLabel = `Only ${stock} Left`;
    StockIcon = AlertTriangle;
  }

  return (
    <div className="glass-card p-6 flex flex-col justify-between group h-full">
      <div>
        {/* Card Header: Category & Stock status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            {categoryName || 'Digital Key'}
          </span>

          <div className={`badge-stock ${stockClass}`}>
            <span className="badge-dot"></span>
            {stockLabel}
          </div>
        </div>

        {/* Product Title */}
        <h3 className="font-bold text-lg text-white mb-2 font-['Outfit'] group-hover:text-indigo-300 transition-colors line-clamp-2">
          {name}
        </h3>

        {/* Short Description */}
        <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed mb-6">
          {description || 'Instant digital fulfillment key with complete warranty.'}
        </p>
      </div>

      {/* Card Footer: Price & Action Buttons */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Price</span>
          <div className="text-xl font-extrabold text-white font-['Outfit'] flex items-baseline gap-1">
            ${price.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">USD</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectProduct(product)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all"
            title="View Details"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => onQuickBuy(product)}
            disabled={!inStock || stock === 0}
            className={`btn-primary text-xs py-2.5 px-3.5 ${
              !inStock || stock === 0 ? 'opacity-50 cursor-not-allowed filter grayscale' : ''
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {inStock && stock > 0 ? 'Buy Now' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
