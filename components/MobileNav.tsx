import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, DollarSign, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const MobileNav = () => {
  const { logout } = useAppContext();

  const linkClass = ({isActive}: {isActive: boolean}) => 
    `flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-teal-600' : 'text-slate-400'}`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between px-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <NavLink to="/" className={linkClass}>
        <LayoutDashboard size={22} />
        <span className="text-[10px] mt-1 font-medium">Painel</span>
      </NavLink>
      <NavLink to="/calendar" className={linkClass}>
        <Calendar size={22} />
        <span className="text-[10px] mt-1 font-medium">Agenda</span>
      </NavLink>
      <NavLink to="/patients" className={linkClass}>
        <Users size={22} />
        <span className="text-[10px] mt-1 font-medium">Pacientes</span>
      </NavLink>
      <NavLink to="/financial" className={linkClass}>
        <DollarSign size={22} />
        <span className="text-[10px] mt-1 font-medium">Caixa</span>
      </NavLink>
      <button 
        onClick={logout}
        className="flex flex-col items-center justify-center w-full py-2 text-red-400 hover:text-red-600"
      >
        <LogOut size={22} />
        <span className="text-[10px] mt-1 font-medium">Sair</span>
      </button>
    </div>
  );
};