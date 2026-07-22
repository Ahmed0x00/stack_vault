import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Wallet, 
  Plus, 
  ShoppingBag, 
  User, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X,
  PackageCheck
} from 'lucide-react';

export default function Navbar({ onOpenAuth }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const balanceDollars = user ? (user.balance / 100).toFixed(2) : '0.00';

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#06080e]/80 border-b border-white/10 transition-all">
      <div className="container flex items-center justify-between h-20">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group text-decoration-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5 font-['Outfit']">
              StackVault <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">v2.0</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Digital Subscriptions & Keys</p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/shop" 
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isActive('/shop') ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Shop Catalog
          </Link>
          
          {isAuthenticated && (
            <Link 
              to="/account/orders" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive('/account/orders') ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <PackageCheck className="w-4 h-4" /> My Orders
            </Link>
          )}

          {isAdmin && (
            <Link 
              to="/admin" 
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
            </Link>
          )}

          <a 
            href="https://t.me/stackvault_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-400" /> Telegram Bot
          </a>
        </nav>

        {/* Right User State Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Balance Pill */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-indigo-500/30 rounded-xl px-3.5 py-1.5 shadow-inner">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Balance</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">${balanceDollars}</span>
                </div>
                <button 
                  onClick={() => navigate('/deposit')} 
                  className="ml-2 w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all"
                  title="Top Up Balance"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Account Profile Button */}
              <Link 
                to="/account"
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <User className="w-4 h-4 text-indigo-400" /> {user.username || 'Account'}
              </Link>

              {/* Logout Button */}
              <button 
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="btn-primary"
            >
              Sign In / Register
            </button>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0d16] border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in">
          <Link 
            to="/shop" 
            onClick={() => setMobileOpen(false)}
            className="block text-slate-200 hover:text-indigo-400 font-medium py-2"
          >
            🛍 Shop Catalog
          </Link>
          
          {isAuthenticated && (
            <>
              <Link 
                to="/account/orders" 
                onClick={() => setMobileOpen(false)}
                className="block text-slate-200 hover:text-indigo-400 font-medium py-2"
              >
                📦 My Orders
              </Link>
              <Link 
                to="/deposit" 
                onClick={() => setMobileOpen(false)}
                className="block text-emerald-400 font-bold py-2"
              >
                💰 Top Up (${balanceDollars})
              </Link>
              <Link 
                to="/account" 
                onClick={() => setMobileOpen(false)}
                className="block text-slate-200 hover:text-indigo-400 font-medium py-2"
              >
                👤 My Account ({user.username})
              </Link>
            </>
          )}

          {isAdmin && (
            <Link 
              to="/admin" 
              onClick={() => setMobileOpen(false)}
              className="block text-purple-400 font-bold py-2"
            >
              🛡 Admin Dashboard
            </Link>
          )}

          {!isAuthenticated && (
            <button 
              onClick={() => { setMobileOpen(false); onOpenAuth(); }}
              className="btn-primary w-full justify-center mt-4"
            >
              Sign In / Register
            </button>
          )}
        </div>
      )}
    </header>
  );
}
