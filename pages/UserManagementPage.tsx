
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { type Personnel } from '../types';

const UserManagementPage: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      // Query directly from personnel table
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Map the raw data if necessary, but Supabase returns matches nicely if names align
      setPersonnel(data as unknown as Personnel[]);
    } catch (err: any) {
      console.error('Error fetching personnel:', err);
      setError('無法讀取人員資料。');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: 'role' | 'access_code', value: string) => {
    try {
      const { error } = await supabase
        .from('personnel')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setPersonnel(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    } catch (err: any) {
      console.error('Error updating personnel:', err);
      alert('更新失敗');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">載入中...</div>;
  }

  if (error) {
    return (
        <div className="container mx-auto p-8">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
                {error}
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">權限與帳號管理</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">職稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">登入密碼 (身分證末四碼)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">系統權限</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {personnel.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.jobTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                     <input 
                        type="text" 
                        value={p.access_code || ''} 
                        onChange={(e) => handleUpdate(p.id, 'access_code', e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-20 text-center focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900"
                        maxLength={4}
                     />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <select
                      value={p.role || 'user'}
                      onChange={(e) => handleUpdate(p.id, 'role', e.target.value)}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md border ${p.role === 'admin' ? 'bg-red-50 font-bold text-red-700' : p.role === 'duty' ? 'bg-sky-50 font-bold text-sky-700' : 'bg-white'}`}
                    >
                      <option value="user">一般員工 (User)</option>
                      <option value="duty">Duty (管理任務)</option>
                      <option value="admin">管理員 (Admin)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {personnel.length === 0 && (
            <div className="p-6 text-center text-slate-500">沒有找到人員資料</div>
        )}
      </div>
      <div className="mt-4 bg-sky-50 p-4 rounded-md text-sm text-sky-800">
        <p><strong>提示：</strong> 修改後，該員工下次重新整理或登入時權限即生效。</p>
      </div>
    </div>
  );
};

export default UserManagementPage;
