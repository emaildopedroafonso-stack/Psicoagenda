import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BrainCircuit, Lock, Mail, Phone, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER';
type RegisterMethod = 'EMAIL' | 'PHONE';
type RegisterStep = 'DATA_INPUT' | 'VERIFICATION';

const Login = () => {
  const { login, loginWithGoogle, sendVerificationCode, verifyAndRegister } = useAppContext();
  const navigate = useNavigate();

  // Estados Globais da Tela
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados de Cadastro
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('EMAIL');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('DATA_INPUT');
  
  // Dados do Formulário de Cadastro
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState(''); // Email ou Telefone
  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      login(loginEmail, loginPassword);
      navigate('/');
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    navigate('/');
  };

  // --- Funções de Cadastro ---

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newContact || !newPassword) {
        setErrorMsg("Preencha todos os campos.");
        return;
    }
    setErrorMsg('');
    setIsLoading(true);
    
    // Chama o contexto para simular envio
    await sendVerificationCode(newContact);
    
    setIsLoading(false);
    setRegisterStep('VERIFICATION');
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const success = await verifyAndRegister(verificationCode, {
        name: newName,
        contact: newContact,
        type: registerMethod
    });

    setIsLoading(false);

    if (success) {
        navigate('/');
    } else {
        setErrorMsg("Código inválido. Tente novamente.");
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setRegisterStep('DATA_INPUT');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4 max-h-[95vh] overflow-y-auto relative overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-8 pb-0 flex flex-col items-center">
          <div className="bg-teal-100 p-3 rounded-full mb-4">
            <BrainCircuit className="text-teal-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Psico-Agenda</h1>
          <p className="text-slate-500 text-sm mb-6">Gestão Inteligente para Psicólogos</p>

          {/* Abas de Navegação */}
          <div className="flex w-full bg-slate-100 p-1 rounded-xl mb-6">
            <button 
                onClick={() => switchMode('LOGIN')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    authMode === 'LOGIN' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                Entrar
            </button>
            <button 
                onClick={() => switchMode('REGISTER')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    authMode === 'REGISTER' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                Criar Conta
            </button>
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="px-8 pb-8">
            
            {/* LOGIN FORM */}
            {authMode === 'LOGIN' && (
                <div className="animate-fade-in">
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">E-mail Profissional</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md mt-4"
                        >
                            Acessar Painel
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="mx-4 text-xs text-slate-400 uppercase font-bold">Ou</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Entrar com Google
                    </button>
                </div>
            )}

            {/* REGISTER FORM */}
            {authMode === 'REGISTER' && registerStep === 'DATA_INPUT' && (
                <div className="animate-fade-in">
                    <div className="flex gap-4 mb-4 justify-center">
                        <button 
                            onClick={() => setRegisterMethod('EMAIL')}
                            className={`pb-1 text-xs font-bold uppercase border-b-2 transition-colors ${registerMethod === 'EMAIL' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-400'}`}
                        >
                            Usar E-mail
                        </button>
                        <button 
                            onClick={() => setRegisterMethod('PHONE')}
                            className={`pb-1 text-xs font-bold uppercase border-b-2 transition-colors ${registerMethod === 'PHONE' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-400'}`}
                        >
                            Usar Celular
                        </button>
                    </div>

                    <form onSubmit={handleSendCode} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nome Completo</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Dr(a). Seu Nome"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                {registerMethod === 'EMAIL' ? 'Seu Melhor E-mail' : 'Número de Celular'}
                            </label>
                            <div className="relative">
                                {registerMethod === 'EMAIL' ? (
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                ) : (
                                    <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                )}
                                <input
                                    type={registerMethod === 'EMAIL' ? 'email' : 'tel'}
                                    value={newContact}
                                    onChange={(e) => setNewContact(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder={registerMethod === 'EMAIL' ? "email@exemplo.com" : "(11) 99999-9999"}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Criar Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>

                        {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md mt-4 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Continuar <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </div>
            )}

            {/* VERIFICATION FORM */}
            {authMode === 'REGISTER' && registerStep === 'VERIFICATION' && (
                <div className="animate-fade-in text-center">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Confirme seu cadastro</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Enviamos um código para <br/><strong>{newContact}</strong>
                    </p>

                    <form onSubmit={handleVerifyAndCreate} className="space-y-4">
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full text-center text-2xl tracking-widest px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />

                        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "Validar e Entrar"}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setRegisterStep('DATA_INPUT')}
                            className="text-slate-400 text-sm hover:text-slate-600 underline"
                        >
                            Voltar e corrigir dados
                        </button>
                    </form>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Login;