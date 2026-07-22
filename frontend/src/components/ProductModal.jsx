import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  X, 
  CheckCircle, 
  ShoppingCart, 
  Wallet, 
  AlertCircle, 
  Download, 
  Plus, 
  Minus, 
  Zap,
  ShieldCheck
} from 'lucide-react';

export default function ProductModal({ product, onClose, onOpenAuth }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  if (!product) return null;

  const unitPrice = product.price;
  const totalPrice = (unitPrice * quantity).toFixed(2);
  const userBalanceDollars = user ? user.balance / 100 : 0;
  const hasEnoughBalance = userBalanceDollars >= parseFloat(totalPrice);
  const neededBalance = (parseFloat(totalPrice) - userBalanceDollars).toFixed(2);

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    const maxQty = product.stock ? Math.min(product.stock, 50) : 50;
    if (newQty >= 1 && newQty <= maxQty) {
      setQuantity(newQty);
      setError('');
    }
  };

  const handleConfirmPurchase = async () => {
    if (!isAuthenticated) {
      onClose();
      onOpenAuth();
      return;
    }

    if (!hasEnoughBalance) {
      setError(`Insufficient account balance. You need $${neededBalance} more.`);
      return;
    }

    setPurchasing(true);
    setError('');

    try {
      const res = await api.post('/orders', {
        productId: product.id,
        quantity: quantity,
      });

      setSuccessOrder(res.data.order);
      await refreshUser();
    } catch (err) {
      console.error('Purchase error:', err);
      const msg = err.response?.data?.error || 'Failed to complete order. Please try again.';
      setError(msg);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-white/15 shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successOrder ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white font-['Outfit']">Order Complete! 🎉</h2>
              <p className="text-slate-400 text-sm mt-1">
                Purchased <strong className="text-white">{successOrder.productName}</strong> (x{successOrder.quantity})
              </p>
            </div>

            {/* Delivered Keys Box */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 text-left space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                Your Delivered Credentials / Keys:
              </span>
              <div className="space-y-1 font-mono text-sm text-slate-200 bg-black/50 p-3 rounded-lg border border-white/10 max-h-40 overflow-y-auto select-all">
                {successOrder.keys.map((k, i) => (
                  <div key={i} className="py-0.5 border-b border-white/5 last:border-none">
                    {i + 1}. {k}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a 
                href={`http://localhost:3001/api/orders/${successOrder.id}/download`} 
                target="_blank"
                rel="noopener noreferrer"
                className="btn-emerald flex-1 justify-center py-3"
              >
                <Download className="w-4 h-4" /> Download Key File (.txt)
              </a>

              <button 
                onClick={() => { onClose(); navigate('/account/orders'); }}
                className="btn-secondary flex-1 justify-center py-3"
              >
                View All Orders
              </button>
            </div>
          </div>
        ) : (
          /* Normal Purchase Details Form */
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                {product.categoryName || 'Product'}
              </span>
              <h2 className="text-2xl font-black text-white font-['Outfit'] mt-2">
                {product.name}
              </h2>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-white/5">
              {product.description}
            </p>

            {/* Features Bullet List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Product Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Automated Instant Delivery
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Genuine Supplier Key
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> 100% Replacement Warranty
                </div>
              </div>
            </div>

            {/* Quantity Selector & Price Summary */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Quantity</span>
                <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1 border border-white/10">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-md bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-white w-6 text-center">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stock || 50)}
                    className="w-8 h-8 rounded-md bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total Charge</span>
                  <div className="text-2xl font-extrabold text-emerald-400 font-['Outfit']">
                    ${totalPrice} <span className="text-xs text-slate-400 font-normal">USD</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Your Balance</span>
                  <span className={`text-sm font-bold font-mono ${hasEnoughBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${userBalanceDollars.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Error / Low Balance Notice */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p>{error}</p>
                  {!hasEnoughBalance && isAuthenticated && (
                    <button 
                      onClick={() => { onClose(); navigate('/deposit'); }}
                      className="mt-2 text-xs font-bold text-emerald-400 underline hover:text-emerald-300 block"
                    >
                      Click here to Top Up Balance now →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="btn-secondary flex-1 justify-center py-3"
              >
                Cancel
              </button>

              <button 
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                className="btn-primary flex-1 justify-center py-3"
              >
                <ShoppingCart className="w-4 h-4" />
                {purchasing ? 'Processing...' : !isAuthenticated ? 'Sign In to Buy' : `Confirm Purchase ($${totalPrice})`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
