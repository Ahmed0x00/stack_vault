import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  User, 
  Wallet, 
  Plus, 
  Package, 
  Send, 
  History, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock 
} from 'lucide-react';

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [telegramIdInput, setTelegramIdInput] = useState(user?.telegram_id || '');
  const [linkingTg, setLinkingTg] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');

  useEffect(() => {
    async function loadAccountData() {
      try {
        const res = await api.get('/balance');
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error('Failed to load transaction history:', err);
      } finally {
        setLoadingTx(false);
      }
    }
    loadAccountData();
  }, []);

  const balanceDollars = user ? (user.balance / 100).toFixed(2) : '0.00';

  const handleCopyAddress = () => {
    if (user?.deposit_address) {
      navigator.clipboard.writeText(user.deposit_address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const handleLinkTelegram = async (e) => {
    e.preventDefault();
    setLinkingTg(true);
    setLinkMsg('');
    try {
      await api.post('/auth/link-telegram', { telegram_id: telegramIdInput });
      setLinkMsg('Telegram account linked successfully!');
      await refreshUser();
    } catch (err) {
      setLinkMsg('Failed to link Telegram ID');
    } finally {
      setLinkingTg(false);
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white font-['Outfit']">Access Denied</h2>
        <p className="text-slate-400 text-sm">Please sign in to view your account dashboard.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Browse Shop</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      
      {/* Account Header Banner */}
      <div className="glass-card p-6 sm:p-8 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/80 border-indigo-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold text-2xl font-['Outfit'] shadow-lg shadow-indigo-500/20">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">{user.username}</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5" /> Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Balance Display Card */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 w-full sm:w-auto min-w-[220px] space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Account Balance
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono font-['Outfit']">
              ${balanceDollars} <span className="text-xs text-slate-400 font-normal">USD</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Link to="/deposit" className="btn-emerald text-xs py-2 px-3.5 flex-1 justify-center">
                <Plus className="w-3.5 h-3.5" /> Top Up Balance
              </Link>
              <Link to="/account/orders" className="btn-secondary text-xs py-2 px-3 flex-1 justify-center">
                <Package className="w-3.5 h-3.5" /> Orders
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Grid: Deposit Info & Telegram Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal BSC Deposit Address Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-400" /> Your BEP20 USDT Address
            </h3>
            <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              BSC Network
            </span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Send BEP20 USDT to this permanent personal address. Funds are auto-credited after 15 block confirmations.
          </p>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 p-3 rounded-xl">
            <span className="font-mono text-xs text-slate-200 truncate select-all flex-1">
              {user.deposit_address || 'Generating address...'}
            </span>
            <button 
              onClick={handleCopyAddress}
              className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 transition-colors shrink-0"
              title="Copy Address"
            >
              {copiedAddr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Telegram Link Card */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" /> Link Telegram Bot Account
          </h3>

          <p className="text-slate-400 text-xs leading-relaxed">
            Optionally link your Telegram User ID to sync your balance between the web application and <strong className="text-white">@stackvault_bot</strong>.
          </p>

          <form onSubmit={handleLinkTelegram} className="flex items-center gap-2">
            <input 
              type="text"
              value={telegramIdInput}
              onChange={(e) => setTelegramIdInput(e.target.value)}
              placeholder="Your Telegram User ID (e.g. 123456789)"
              className="input-field text-xs py-2.5 flex-1"
            />
            <button type="submit" disabled={linkingTg} className="btn-primary text-xs py-2.5 px-4">
              {linkingTg ? 'Saving...' : 'Link'}
            </button>
          </form>

          {linkMsg && <p className="text-xs text-emerald-400 font-medium">{linkMsg}</p>}
        </div>

      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-['Outfit'] text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" /> Recent Transactions
        </h3>

        {loadingTx ? (
          <div className="glass-card p-8 animate-pulse h-40"></div>
        ) : transactions.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-400 text-xs">
            No transaction records found yet.
          </div>
        ) : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        tx.isCredit 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {tx.isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-200">{tx.description || 'Transaction'}</td>
                    <td className={`p-4 font-mono font-bold ${tx.isCredit ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {tx.isCredit ? `+$${tx.amount}` : `-$${Math.abs(parseFloat(tx.amount)).toFixed(2)}`}
                    </td>
                    <td className="p-4 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
