import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, DollarSign, LogOut, BrainCircuit } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Sidebar = () => {
  const { logout } = useAppContext();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Painel' },
    { to: '/calendar', icon: Calendar, label: 'Agenda' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
    { to: '/financial', icon: DollarSign, label: 'Financeiro' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col hidden md:flex">
      <div className="p-6 flex items-center gap-2 border-b border-slate-700">
        <BrainCircuit className="text-teal-400" size={32} />
        <div>
          <h1 className="text-xl font-bold">Psico-Agenda</h1>
          <p className="text-xs text-slate-400">Gestão Profissional</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-teal-600 text-white font-medium shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 w-full rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </div>
  );
};