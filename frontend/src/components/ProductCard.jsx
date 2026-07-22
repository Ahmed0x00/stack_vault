import React from 'react';
import { 
  Info, 
  ShoppingCart, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Sparkles,
  Key,
  Tv,
  Palette,
  GraduationCap,
  Mail,
  Box
} from 'lucide-react';

function getCategoryIcon(catId = '') {
  switch (catId) {
    case 'ai': return Sparkles;
    case 'software': return Key;
    case 'streaming': return Tv;
    case 'design': return Palette;
    case 'learning': return GraduationCap;
    case 'emails': return Mail;
    default: return Box;
  }
}

function cleanText(text = '') {
  return text
    .replace(/[^\x00-\x7F]/g, '') // remove weird unicode / emoji artifacts
    .replace(/^[-•\s]+/g, '')     // remove leading bullet points
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ProductCard({ product, onSelectProduct, onQuickBuy }) {
  const { id, name, category, categoryName, price, stock, inStock, description } = product;

  const CategoryIcon = getCategoryIcon(category);
  const cleanTitle = cleanText(name);
  const cleanDesc = cleanText(description);

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
        {/* Card Top: Category & Stock status */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
            <CategoryIcon className="w-3.5 h-3.5 text-indigo-400" />
            {categoryName || 'Digital Key'}
          </span>

          <div className={`badge-stock ${stockClass}`}>
            <span className="badge-dot"></span>
            {stockLabel}
          </div>
        </div>

        {/* Product Title */}
        <h3 className="font-bold text-base text-white mb-2 leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
          {cleanTitle || name}
        </h3>

        {/* Short Description Preview */}
        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-6">
          {cleanDesc || 'Instant digital fulfillment key with complete replacement warranty.'}
        </p>
      </div>

      {/* Card Footer: Price & Action Buttons */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Price</span>
          <div className="text-lg font-extrabold text-white flex items-baseline gap-1 font-mono">
            ${price.toFixed(2)} <span className="text-[10px] text-slate-400 font-sans font-normal">USD</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectProduct(product)}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all"
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
