import React, { useState } from 'react';
import { Logo } from './Logo';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('mocca');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userValid = username.toLowerCase().trim() === 'mocca';
    const passValid = password.trim() === '1430';

    if (userValid && passValid) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-6 animate-fadeIn font-inter">
      <div className="mb-8 scale-90">
        <Logo />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full">
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">CONTROLE MOINHO</h2>
        <p className="text-center text-slate-400 text-xs mb-8 uppercase tracking-widest font-bold">
          Acesso Restrito
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#2563eb] text-lg font-bold text-slate-700 rounded-xl p-4 outline-none transition-all focus:bg-white"
              autoCapitalize="none"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2">
              Senha
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="****"
              className={`w-full bg-slate-50 border ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-[#2563eb]'} text-lg font-bold text-slate-700 rounded-xl p-4 outline-none transition-all placeholder:text-slate-300 tracking-widest focus:bg-white`}
              autoComplete="current-password"
              enterKeyHint="go"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center animate-bounce">
              Usuário ou senha incorretos
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-4 rounded-xl shadow-md transform transition-all active:scale-95 uppercase tracking-widest text-sm mt-4"
          >
            ENTRAR
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-300 mt-6">
          Mocca Moinho Comercial &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};