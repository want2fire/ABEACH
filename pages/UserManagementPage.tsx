import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { type Personnel, type UserRole, type JobTitle } from '../types';

// Modal Component for Adding/Editing User
interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: Partial<Personnel> | null; // null = add new, object = edit
    onSave: (userData: Partial<Personnel>) => Promise<void>;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<Partial<Personnel>>({
        name: '',
        gender: '男性',
        dob: '',
        phone: '',
        jobTitle: '一般員工',
        access_code: '',
        role: 'user',
        status: '在職'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(user);
        } else {
            // Reset for new user
            setFormData({
                name: '',
                gender: '男性',
                dob: '',
                phone: '',
                jobTitle: '一般員工',
                access_code: '',
                role: 'user',
                status: '在職'
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="glass-panel rounded-3xl w-full max-w-2xl shadow-2xl bg-white flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-stone-800">{user ? '編輯用戶資料' : '新增用戶'}</h3>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-800 text-2xl">&times;</button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form id="userForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">姓名</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="glass-input w-full px-4 py-3 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">電話</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="glass-input w-full px-4 py-3 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">性別</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl">
                                <option value="男性">男性</option>
                                <option value="女性">女性</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">出生年月日</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="glass-input w-full px-4 py-3 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">職稱</label>
                            <select name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl">
                                <option value="一般員工">一般員工</option>
                                <option value="A TEAM">A TEAM</option>
                                <option value="內場DUTY">內場DUTY</option>
                                <option value="外場DUTY">外場DUTY</option>
                                <option value="管理員">管理員</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">狀態</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl">
                                <option value="在職">在職</option>
                                <option value="支援">支援</option>
                                <option value="離職">離職</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">登入碼 (身分證末四碼)</label>
                            <input 
                                type="text" 
                                name="access_code" 
                                value={formData.access_code} 
                                onChange={handleChange} 
                                required 
                                maxLength={4} 
                                className="glass-input w-full px-4 py-3 rounded-xl bg-white text-stone-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">系統權限</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl">
                                <option value="user">User (僅查看)</option>
                                <option value="duty">Duty (管理任務)</option>
                                <option value="admin">Admin (完全控制)</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-stone-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-full text-stone-500 hover:bg-stone-100 text-xs font-bold uppercase">取消</button>
                    <button type="submit" form="userForm" disabled={loading} className="texture-grain px-8 py-3 rounded-full bg-pizza-500 text-white hover:bg-pizza-600 shadow-lg font-bold text-xs uppercase tracking-widest">
                        {loading ? '儲存中...' : '確認儲存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserManagementPage: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<Personnel> | null>(null);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPersonnel(data as unknown as Personnel[]);
    } catch (err: any) {
      setError('無法讀取人員資料。');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating or updating user
  const handleSaveUser = async (userData: Partial<Personnel>) => {
      try {
          if (userData.id) {
              // Update existing
              const { error } = await supabase
                  .from('personnel')
                  .update({
                      name: userData.name,
                      gender: userData.gender,
                      dob: userData.dob,
                      phone: userData.phone,
                      job_title: userData.jobTitle,
                      status: userData.status,
                      access_code: userData.access_code,
                      role: userData.role
                  })
                  .eq('id', userData.id);
              if (error) throw error;
          } else {
              // Insert new
              // First add job tag if needed (though logic is usually in App.tsx, simplified here to assume tags exist or we just insert text)
              const { error } = await supabase
                  .from('personnel')
                  .insert({
                      id: crypto.randomUUID(),
                      name: userData.name,
                      gender: userData.gender,
                      dob: userData.dob,
                      phone: userData.phone,
                      job_title: userData.jobTitle,
                      status: userData.status,
                      access_code: userData.access_code,
                      role: userData.role
                  });
              if (error) throw error;
          }
          fetchPersonnel(); // Refresh list
      } catch (err: any) {
          alert('儲存失敗: ' + err.message);
      }
  };

  const openAddModal = () => {
      setEditingUser(null);
      setIsModalOpen(true);
  };

  const openEditModal = (user: Personnel) => {
      setEditingUser(user);
      setIsModalOpen(true);
  };

  if (loading && personnel.length === 0) return <div className="p-8 text-center text-pizza-500 font-bold">載入中...</div>;
  if (error) return <div className="container mx-auto p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={editingUser} 
        onSave={handleSaveUser} 
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-stone-900">權限管理</h1>
        <button 
            onClick={openAddModal}
            className="texture-grain px-6 py-3 rounded-full bg-stone-900 text-white hover:bg-pizza-500 shadow-xl text-xs font-bold uppercase tracking-widest transition-all transform hover:scale-105"
        >
            新增用戶
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white bg-white/70">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-stone-100 border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">職稱</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">登入碼</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">系統權限</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {personnel.map((p) => (
                <tr key={p.id} className="hover:bg-white transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-stone-800">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">{p.jobTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-stone-600">{p.access_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${p.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' : p.role === 'duty' ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                        {p.role === 'admin' ? 'Admin' : p.role === 'duty' ? 'Duty' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => openEditModal(p)}
                        className="text-stone-400 hover:text-pizza-600 font-bold text-xs uppercase"
                      >
                        編輯
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;