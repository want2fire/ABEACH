import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { type UserProfile } from '../types';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast to UserProfile to match the interface
      setUsers(data as UserProfile[]);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('無法讀取使用者列表，您可能沒有權限。');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'admin' | 'user' } : u));
    } catch (err: any) {
      console.error('Error updating role:', err);
      alert('更新權限失敗');
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
      <h1 className="text-3xl font-bold text-slate-900 mb-6">權限管理</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">註冊時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">權限角色</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md bg-white border"
                    >
                      <option value="user">一般使用者 (User)</option>
                      <option value="admin">管理員 (Admin)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
            <div className="p-6 text-center text-slate-500">沒有找到使用者資料</div>
        )}
      </div>
      <div className="mt-4 bg-sky-50 p-4 rounded-md text-sm text-sky-800">
        <p><strong>提示：</strong> 只有「管理員」可以看到此頁面並修改他人權限。修改後權限即時生效。</p>
      </div>
    </div>
  );
};

export default UserManagementPage;