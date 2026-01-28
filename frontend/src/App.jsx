import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Users, LayoutDashboard, PlusCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 fixed h-full shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary-600 tracking-tight">Cruce Nofence</h1>
            <p className="text-xs text-slate-500 mt-1">Gestión CRM & Kit Digital</p>
          </div>
          <nav className="mt-6 px-4 space-y-2">
            <Link to="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link to="/clientes" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
              <Users size={20} />
              <span className="font-medium">Clientes</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientList />} />
            <Route path="/clientes/:dni" element={<ClientDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
