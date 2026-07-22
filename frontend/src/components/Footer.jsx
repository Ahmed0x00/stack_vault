import React from 'react';
import { ShieldCheck, Zap, Lock, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#040508] text-slate-400 text-sm mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-lg text-white font-['Outfit']">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-black">
                S
              </div>
              StackVault
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              StackVault provides cheap, high-speed digital subscriptions, license keys, and premium software accounts with automated fulfillment and 24/7 Telegram support.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 font-['Outfit']">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/shop" className="hover:text-indigo-400 transition-colors">Shop All Products</a></li>
              <li><a href="/deposit" className="hover:text-indigo-400 transition-colors">Top Up USDT / Binance</a></li>
              <li><a href="https://t.me/stackvault_bot" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Telegram Bot Seller</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 font-['Outfit']">Guarantees</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck className="w-3.5 h-3.5" /> 100% Replacement Warranty</li>
              <li className="flex items-center gap-1.5 text-indigo-400"><Zap className="w-3.5 h-3.5" /> Instant Delivery</li>
              <li className="flex items-center gap-1.5 text-amber-400"><Lock className="w-3.5 h-3.5" /> Automated BEP20 Security</li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 StackVault Digital Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://t.me/stackvault_bot" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">
              @stackvault_bot Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
