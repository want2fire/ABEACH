
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Personnel } from '../types';

interface AuthPageProps {
  onLogin: (user: Personnel) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('name', name.trim())
        .eq('access_code', accessCode.trim())
        .single();

      if (error || !data) {
        throw new Error('找不到使用者或代碼錯誤');
      }

      onLogin(data as unknown as Personnel);
      
    } catch (err: any) {
      setError(err.message || '登入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-transparent">
      {/* Global background is handled in App.tsx now */}

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel rounded-3xl p-10 shadow-2xl border border-white/40 backdrop-blur-xl bg-white/60">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-syne font-bold text-stone-900 mb-2 tracking-tight">
              A BEACH 101
            </h1>
            <h2 className="text-xl font-syne font-bold text-pizza-600 tracking-widest mb-6">& PIZZA</h2>
            <p className="text-stone-500 font-serif text-lg">員工訓練系統</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">姓名</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full px-5 py-4 rounded-xl outline-none transition-all text-lg placeholder-stone-400 bg-white/80"
                placeholder="請輸入姓名"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">身分證末四碼</label>
              <input
                type="password"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="glass-input w-full px-5 py-4 rounded-xl outline-none transition-all text-lg placeholder-stone-400 text-center tracking-[0.5em] bg-white/80"
                placeholder="••••"
                maxLength={4}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="texture-grain w-full mt-6 py-4 px-6 rounded-xl bg-pizza-500 hover:bg-pizza-600 text-white font-bold text-lg tracking-wide shadow-lg shadow-pizza-200 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                      <span>載入中</span>
                      <span className="animate-pulse">...</span>
                  </span>
              ) : '進入系統'}
            </button>
          </form>
        </div>
        <div className="text-center mt-8 text-stone-600 text-xs font-syne tracking-widest font-bold">
            A BEACH 101 & PIZZA &copy; {new Date().getFullYear()};
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
