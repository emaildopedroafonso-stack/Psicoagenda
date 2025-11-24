import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BrainCircuit, Lock, Mail, Chrome } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email, password);
      navigate('/');
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-100 p-3 rounded-full mb-4">
            <BrainCircuit className="text-teal-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Psico-Agenda</h1>
          <p className="text-slate-500">Acesso ao Consultório Virtual</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">E-mail Profissional</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="psicologo@exemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Acessar Sistema
          </button>
        </form>

        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-4 text-xs text-slate-400 uppercase font-bold">Ou continue com</span>
            <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
           <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                />
                <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                />
                <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                />
                <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                />
            </svg>
            Entrar com Google
        </button>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Ambiente Seguro. Criptografia de ponta a ponta simulada.</p>
          <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 inline-block text-left">
             <p className="font-bold">Conta de Teste:</p>
             <p>Login: teste@teste.com</p>
             <p>Senha: 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;