import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Wallet, Copy, Check, AlertTriangle, ShieldCheck, Zap, Send, ArrowRight } from 'lucide-react';

export default function DepositPage() {
  const { user } = useAuth();

  const [depositInfo, setDepositInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedPayId, setCopiedPayId] = useState(false);
  const [activeTab, setActiveTab] = useState('usdt'); // 'usdt' or 'binance'

  useEffect(() => {
    async function loadDepositInfo() {
      try {
        const res = await api.get('/balance/deposit-info');
        setDepositInfo(res.data);
      } catch (err) {
        console.error('Failed to load deposit info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDepositInfo();
  }, []);

  const handleCopyAddress = () => {
    if (depositInfo?.usdt?.address) {
      navigator.clipboard.writeText(depositInfo.usdt.address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const handleCopyPayId = () => {
    if (depositInfo?.binancePay?.payId) {
      navigator.clipboard.writeText(depositInfo.binancePay.payId);
      setCopiedPayId(true);
      setTimeout(() => setCopiedPayId(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white font-['Outfit']">Access Denied</h2>
        <p className="text-slate-400 text-sm">Please sign in to top up your account balance.</p>
      </div>
    );
  }

  const currentBalance = (user.balance / 100).toFixed(2);

  return (
    <div className="space-y-8 py-8 max-w-3xl mx-auto">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white">Top Up Balance</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Add funds automatically to your StackVault USD wallet balance.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm font-bold mt-2">
          Current Balance: ${currentBalance} USD
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('usdt')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'usdt' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" /> USDT BEP20 (Instant Auto)
        </button>

        <button
          onClick={() => setActiveTab('binance')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'binance' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4 text-amber-400" /> Binance Pay (Manual)
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-8 animate-pulse h-64"></div>
      ) : activeTab === 'usdt' ? (
        /* USDT BEP20 Tab */
        <div className="glass-card p-6 sm:p-8 space-y-6 border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-900/80">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white font-['Outfit'] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" /> Personal BEP20 Deposit Address
            </h3>
            <span className="text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full">
              Automated Detector
            </span>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed">
            Send USDT to your personal permanent address below. The system automatically detects your transaction on the Binance Smart Chain and credits your account balance after 15 block confirmations.
          </p>

          {/* Deposit Address Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 block font-mono uppercase">
              Your Personal Deposit Address (BEP20 Only)
            </label>
            <div className="flex items-center gap-3 bg-black/80 border border-indigo-500/40 p-4 rounded-xl shadow-inner">
              <span className="font-mono text-sm sm:text-base text-emerald-400 font-bold truncate select-all flex-1">
                {depositInfo?.usdt?.address || user?.deposit_address}
              </span>
              <button 
                onClick={handleCopyAddress}
                className="btn-emerald text-xs py-2 px-4 shrink-0"
              >
                {copiedAddr ? (
                  <> <Check className="w-4 h-4" /> Copied! </>
                ) : (
                  <> <Copy className="w-4 h-4" /> Copy Address </>
                )}
              </button>
            </div>
          </div>

          {/* Network Warning Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" /> IMPORTANT NETWORK REQUIREMENT:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>Send <strong className="text-amber-400">BEP20 (Binance Smart Chain)</strong> USDT ONLY.</li>
              <li>Do NOT send ERC20, TRC20, or Solana USDT, or funds will be permanently lost!</li>
              <li>No minimum deposit required — any amount is auto-credited.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Binance Pay Tab */
        <div className="glass-card p-6 sm:p-8 space-y-6 border border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-slate-900/80">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white font-['Outfit'] flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" /> Binance Pay ID Deposit
            </h3>
            <span className="text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full">
              Manual Fulfillment
            </span>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed">
            Send payment directly to our official Binance Pay ID without gas fees. After sending, contact support with your payment receipt.
          </p>

          {/* Pay ID Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 block font-mono uppercase">
              Official Binance Pay ID
            </label>
            <div className="flex items-center gap-3 bg-black/80 border border-amber-500/40 p-4 rounded-xl shadow-inner">
              <span className="font-mono text-xl text-amber-400 font-extrabold select-all flex-1">
                {depositInfo?.binancePay?.payId || '1120547012'}
              </span>
              <button 
                onClick={handleCopyPayId}
                className="btn-primary text-xs py-2 px-4 shrink-0"
              >
                {copiedPayId ? (
                  <> <Check className="w-4 h-4" /> Copied! </>
                ) : (
                  <> <Copy className="w-4 h-4" /> Copy Pay ID </>
                )}
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-white/5 text-xs text-slate-300">
            <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Open Binance App → Go to <strong className="text-white">Pay</strong>.</li>
              <li>Enter Pay ID: <code className="text-amber-400 font-bold">1120547012</code> and enter your deposit amount.</li>
              <li>Send a screenshot of your receipt to <a href="https://t.me/stackvault_bot" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-bold">@stackvault_support</a>.</li>
            </ol>
          </div>
        </div>
      )}

    </div>
  );
}
