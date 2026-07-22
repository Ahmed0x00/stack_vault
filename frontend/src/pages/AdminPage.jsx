import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ShieldCheck, Users, PackageCheck, TrendingUp, DollarSign, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const { isAdmin } = useAuth();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [targetUserId, setTargetUserId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [crediting, setCrediting] = useState(false);
  const [creditMsg, setCreditMsg] = useState('');
  const [creditError, setCreditError] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      const usersRes = await api.get('/admin/users');
      setStats(statsRes.data.stats);
      setUsersList(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleAddBalance = async (e) => {
    e.preventDefault();
    setCreditMsg('');
    setCreditError('');
    setCrediting(true);

    try {
      const res = await api.post('/admin/add-balance', {
        userId: targetUserId,
        amountDollars: amountInput,
        description: descInput || 'Manual admin balance top up',
      });

      setCreditMsg(res.data.message);
      setAmountInput('');
      setDescInput('');
      loadAdminData();
    } catch (err) {
      setCreditError(err.response?.data?.error || 'Failed to credit user balance');
    } finally {
      setCrediting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-16 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white font-['Outfit']">Admin Access Required</h2>
        <p className="text-slate-400 text-sm">You do not have permission to view the administrative panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-['Outfit'] text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-400" /> Admin Control Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">Live performance metrics & user balance management.</p>
        </div>

        <button onClick={loadAdminData} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Stats
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => <div key={n} className="glass-card h-28 animate-pulse"></div>)}
        </div>
      ) : (
        /* Stats Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="glass-card p-6 space-y-2 border-indigo-500/30">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-indigo-400" /> Total Users
            </span>
            <div className="text-3xl font-black text-white font-['Outfit']">
              {stats?.totalUsers || 0}
            </div>
          </div>

          <div className="glass-card p-6 space-y-2 border-purple-500/30">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 font-mono">
              <PackageCheck className="w-4 h-4 text-purple-400" /> Total Orders
            </span>
            <div className="text-3xl font-black text-white font-['Outfit']">
              {stats?.totalOrders || 0}
            </div>
          </div>

          <div className="glass-card p-6 space-y-2 border-emerald-500/30">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Total Net Profit
            </span>
            <div className="text-3xl font-black text-emerald-400 font-['Outfit'] font-mono">
              ${stats?.totalProfit || '0.00'}
            </div>
          </div>

          <div className="glass-card p-6 space-y-2 border-amber-500/30">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 font-mono">
              <DollarSign className="w-4 h-4 text-amber-400" /> ProdSeller API Balance
            </span>
            <div className="text-2xl font-black text-amber-400 font-['Outfit'] font-mono">
              ${stats?.supplierApi?.balance || '0.00'}
            </div>
          </div>

        </div>
      )}

      {/* Grid: Manual Balance Top-up & Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Manual Credit Form */}
        <div className="glass-card p-6 space-y-6 lg:col-span-1 border border-purple-500/20">
          <h3 className="font-bold text-lg text-white font-['Outfit'] flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-purple-400" /> Credit User Balance
          </h3>

          {creditMsg && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">{creditMsg}</p>}
          {creditError && <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">{creditError}</p>}

          <form onSubmit={handleAddBalance} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select User</label>
              <select
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="input-field text-xs py-2.5"
              >
                <option value="">-- Choose User --</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.id} {u.username} ({u.email}) - ${u.balanceDollars}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 10.00"
                className="input-field text-xs py-2.5 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Reason / Note</label>
              <input
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="e.g. Manual top-up via support"
                className="input-field text-xs py-2.5"
              />
            </div>

            <button type="submit" disabled={crediting} className="btn-primary w-full justify-center text-xs py-2.5">
              {crediting ? 'Crediting...' : 'Add Balance Now'}
            </button>
          </form>
        </div>

        {/* Registered Users Table */}
        <div className="glass-card p-6 space-y-4 lg:col-span-2">
          <h3 className="font-bold text-lg text-white font-['Outfit'] flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Registered Users ({usersList.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10 font-mono">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-indigo-400">#{u.id}</td>
                    <td className="p-3 font-sans font-semibold text-white">{u.username}</td>
                    <td className="p-3 text-slate-400">{u.email}</td>
                    <td className="p-3 font-bold text-emerald-400">${u.balanceDollars}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
