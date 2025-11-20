
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Login successful, App.tsx auth listener will handle redirect
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Check if session was created immediately (means Confirm Email is disabled in Supabase)
        if (data.session) {
             // Auto-login successful, no need to show message
        } else if (data.user && !data.session) {
            // User created but session is null, meaning email verification is required
            setMessage({ type: 'success', text: '註冊成功！請檢查您的信箱以驗證帳號。' });
            setIsLogin(true); // Switch back to login view
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '發生錯誤，請稍後再試。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-sky-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">餐飲業學習進度追蹤器</h1>
          <p className="text-sky-100 mt-2">請先登入以存取資料</p>
        </div>
        
        <div className="p-8">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              className={`flex-1 pb-2 text-center font-medium ${isLogin ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLogin(true); setMessage(null); }}
            >
              登入
            </button>
            <button
              className={`flex-1 pb-2 text-center font-medium ${!isLogin ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLogin(false); setMessage(null); }}
            >
              註冊
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">電子郵件</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="********"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '處理中...' : (isLogin ? '登入' : '註冊')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
