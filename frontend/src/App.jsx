import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage';
import DepositPage from './pages/DepositPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#06080e] text-slate-100 selection:bg-indigo-500 selection:text-white">
          
          <Navbar onOpenAuth={() => setAuthOpen(true)} />

          <main className="flex-1 container">
            <Routes>
              <Route path="/" element={<HomePage onOpenAuth={() => setAuthOpen(true)} />} />
              <Route path="/shop" element={<ShopPage onOpenAuth={() => setAuthOpen(true)} />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/account/orders" element={<OrdersPage />} />
              <Route path="/deposit" element={<DepositPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>

          <Footer />

          {authOpen && <AuthPage onClose={() => setAuthOpen(false)} />}

        </div>
      </Router>
    </AuthProvider>
  );
}
