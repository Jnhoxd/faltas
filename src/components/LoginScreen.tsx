import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { RegisterForm } from './RegisterForm';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} onRegisterSuccess={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 login-screen-bg">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-10 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-sky-400/40 via-cyan-300/30 to-transparent blur-3xl animate-float-slow" />
        <div className="absolute right-[-4rem] bottom-20 h-80 w-80 rounded-full bg-gradient-to-tr from-fuchsia-400/30 via-purple-400/20 to-transparent blur-3xl animate-float-slow animation-delay-2000" />
      </div>
      <div className="max-w-sm w-full space-y-6 bg-white/90 p-6 rounded-[1.75rem] border border-white/70 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.3)] backdrop-blur-xl">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-950/5 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-fuchsia-400" />
          <div className="relative text-center">
            <div className="mx-auto inline-flex items-center justify-center rounded-full bg-white/90 p-3 shadow-lg shadow-sky-200/20">
              <LogIn className="h-7 w-7 text-sky-600" />
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Controle de Alunos SENAC
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Acesse o sistema com seu login.
            </p>
          </div>
        </div>

        <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm shadow-slate-200/40">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full bg-transparent px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm shadow-slate-200/40">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full bg-transparent px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-3xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-300/30 transition hover:shadow-xl hover:shadow-cyan-300/30 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                loading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus size={18} />
                Criar nova conta
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}