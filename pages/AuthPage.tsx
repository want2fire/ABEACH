
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
      // Verify against the personnel table
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('name', name.trim())
        .eq('access_code', accessCode.trim())
        .single();

      if (error || !data) {
        throw new Error('找不到此使用者或驗證碼錯誤');
      }

      onLogin(data as unknown as Personnel);
      
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查姓名與身分證末四碼');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-sky-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">餐飲業學習進度追蹤器</h1>
          <p className="text-sky-100 mt-2">請輸入姓名與身分證末四碼登入</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 rounded text-sm bg-red-100 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="請輸入完整姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">身分證末四碼 (作為密碼)</label>
              <input
                type="password"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="例如：1234"
                maxLength={4}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-bold"
            >
              {isLoading ? '驗證中...' : '登入系統'}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-6 text-center">
            若無法登入，請聯繫店長或管理員確認您的資料。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
