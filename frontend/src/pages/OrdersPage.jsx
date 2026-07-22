import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { PackageCheck, Download, Copy, Check, ExternalLink, Key } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleCopyKey = (keyText, index) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyIndex(index);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  return (
    <div className="space-y-8 py-8">
      
      <div>
        <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white">Order History</h1>
        <p className="text-slate-400 text-sm mt-1">View your previous purchases and re-download license credentials anytime.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card p-6 h-32 animate-pulse bg-slate-900/40"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4 max-w-md mx-auto">
          <PackageCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white font-['Outfit']">No Orders Found</h3>
          <p className="text-xs text-slate-400">You haven't made any purchases yet.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary text-xs">
            Browse Shop Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => (
            <div key={order.id} className="glass-card p-6 space-y-4 border border-white/10">
              
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    Order #{order.id}
                  </span>
                  <h3 className="text-xl font-bold text-white font-['Outfit'] mt-1">
                    {order.productName} <span className="text-slate-400 text-sm font-normal">x{order.quantity}</span>
                  </h3>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Purchased on {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Charged</span>
                    <span className="text-lg font-extrabold text-emerald-400 font-mono">${order.totalPaid} USD</span>
                  </div>

                  <a 
                    href={`http://localhost:3001/api/orders/${order.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-emerald text-xs py-2 px-3 shrink-0"
                    title="Download Receipt & Key File"
                  >
                    <Download className="w-3.5 h-3.5" /> TXT File
                  </a>
                </div>
              </div>

              {/* Delivered Key Box */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 font-mono">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> License Credentials / Keys:
                </span>
                
                <div className="space-y-2">
                  {order.keys.map((k, kIdx) => {
                    const uniqueKeyId = `${idx}-${kIdx}`;
                    return (
                      <div 
                        key={kIdx} 
                        className="flex items-center justify-between gap-3 bg-black/60 border border-white/10 p-3 rounded-xl font-mono text-xs text-slate-200"
                      >
                        <span className="truncate select-all flex-1">{k}</span>
                        <button 
                          onClick={() => handleCopyKey(k, uniqueKeyId)}
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                          title="Copy Key"
                        >
                          {copiedKeyIndex === uniqueKeyId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
