
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Announcement, TagData, UserRole, SOPBlock, Personnel } from '../types';
import ReactQuill from 'react-quill';
import { TrashIcon } from '../components/icons/TrashIcon';

// --- Custom Font & Size Registration ---
let Quill: any = null;
if (ReactQuill && (ReactQuill as any).Quill) {
    Quill = (ReactQuill as any).Quill;
} else if ((window as any).Quill) {
    Quill = (window as any).Quill;
}

if (Quill) {
    const Font = Quill.import('formats/font') as any;
    Font.whitelist = ['inter', 'roboto', 'playfair', 'syne', 'dela', 'noto'];
    Quill.register(Font, true);

    const Size = Quill.import('attributors/style/size');
    Size.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];
    Quill.register(Size, true);
}

// Helpers
const autoLinkHtml = (html: string): string => {
    if (!html) return '';
    const container = document.createElement('div');
    container.innerHTML = html;

    const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes: Node[] = [];
    while(walk.nextNode()) nodes.push(walk.currentNode);

    nodes.forEach(node => {
        if(node.parentElement && ['A', 'SCRIPT', 'STYLE', 'BUTTON', 'TEXTAREA', 'CODE', 'PRE'].includes(node.parentElement.tagName)) return;
        
        const text = node.textContent || '';
        const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
        
        if(!urlRegex.test(text)) return;

        const fragment = document.createDocumentFragment();
        let lastIdx = 0;
        let match;
        
        while ((match = urlRegex.exec(text)) !== null) {
            const before = text.slice(lastIdx, match.index);
            if(before) fragment.appendChild(document.createTextNode(before));
            
            let url = match[0];
            const href = url.startsWith('www.') ? `https://${url}` : url;
            
            const punctuation = /[.,;:!?)]+$/;
            let suffix = '';
            const pMatch = url.match(punctuation);
            if(pMatch) {
                suffix = pMatch[0];
                url = url.slice(0, -suffix.length);
            }

            const a = document.createElement('a');
            a.href = href.startsWith('www.') ? `https://${url}` : (url.startsWith('http') ? url : `https://${url}`);
            a.target = '_blank';
            a.rel = "noopener noreferrer";
            a.className = "text-pizza-500 underline hover:text-pizza-600 font-medium transition-colors";
            a.textContent = url;
            fragment.appendChild(a);
            
            if(suffix) fragment.appendChild(document.createTextNode(suffix));

            lastIdx = match.index + match[0].length;
        }
        
        const after = text.slice(lastIdx);
        if(after) fragment.appendChild(document.createTextNode(after));
        
        node.parentNode?.replaceChild(fragment, node);
    });

    return container.innerHTML;
};

const convertBlocksToHtml = (blocks: SOPBlock[]): string => {
    if (!blocks || blocks.length === 0) return '';
    const richTextBlock = blocks.find(b => b.type === 'richtext');
    if (richTextBlock) return autoLinkHtml(richTextBlock.content);

    let rawHtml = blocks.filter(b => b.type !== 'table').map(block => {
        let text = block.content || '';
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #f97316; text-decoration: underline;">$1</a>');
        
        switch (block.type) {
            case 'heading-1': return `<h1>${text}</h1>`;
            case 'heading-2': return `<h2>${text}</h2>`;
            case 'heading-3': return `<h3>${text}</h3>`;
            case 'bullet-list': return `<ul><li>${text}</li></ul>`;
            case 'number-list': return `<ol><li>${text}</li></ol>`;
            case 'image': return `<img src="${block.content}" alt="Image" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`;
            case 'video': return `<p><a href="${block.content}" target="_blank">📺 觀看影片</a></p>`;
            case 'pdf': return `<p><a href="${block.content}" target="_blank">📄 下載 PDF 文件</a></p>`;
            case 'divider': return `<hr />`;
            case 'callout': return `<blockquote style="border-left: 4px solid orange; padding-left: 10px; color: #666; background: #fffaf0; padding: 10px;">${text}</blockquote>`;
            default: return `<p>${text}</p>`;
        }
    }).join('');

    return autoLinkHtml(rawHtml);
};

const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
};

interface AnnouncementDetailPageProps {
    userRole: UserRole;
    userId: string;
    userName: string;
}

const AnnouncementDetailPage: React.FC<AnnouncementDetailPageProps> = ({ userRole, userId, userName }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit State
    const [editTitle, setEditTitle] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editCycle, setEditCycle] = useState('');
    const [editRoles, setEditRoles] = useState<string[]>([]);
    const [editStations, setEditStations] = useState<string[]>([]);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editorHtml, setEditorHtml] = useState('');
    
    // Read Status
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [readCount, setReadCount] = useState(0);
    const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
    const [managerVerifiedIds, setManagerVerifiedIds] = useState<Set<string>>(new Set());
    const [verificationDetails, setVerificationDetails] = useState<Record<string, { confirmedBy: string, confirmedAt: string }>>({});
    const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);

    // Tags
    const [tagOptions, setTagOptions] = useState<{ jobs: TagData[], stations: TagData[], categories: TagData[] }>({ jobs: [], stations: [], categories: [] });

    // Quill ref
    const quillRef = useRef<ReactQuill>(null);

    // Toolbar modules
    const modules = useMemo(() => ({
        toolbar: {
          container: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'clean']
          ]
        },
        clipboard: { matchVisual: false }
    }), []);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);

        // Fetch Announcement
        const { data: anno } = await supabase.from('announcements').select('*').eq('id', id).single();
        if (!anno) {
            navigate('/announcement-list');
            return;
        }
        setAnnouncement(anno as any);
        setEditorHtml(convertBlocksToHtml(anno.content || []));

        // Initialize Edit State
        setEditTitle(anno.title);
        setEditCategory(anno.category);
        setEditCycle(anno.cycle_type);
        setEditRoles(anno.target_roles || []);
        setEditStations(anno.target_stations || []);
        setEditStartDate(anno.start_date);
        setEditEndDate(anno.end_date || '');
        setEditIsActive(anno.is_active);

        // Fetch Tags
        const { data: tagsData } = await supabase.from('tags').select('*').in('category', ['job', 'station', 'anno_category']);
        const tags = tagsData as any[] | null;

        if (tags) {
            setTagOptions({
                jobs: tags.filter((t:any) => t.category === 'job'),
                stations: tags.filter((t:any) => t.category === 'station'),
                categories: tags.filter((t:any) => t.category === 'anno_category')
            });
        }

        // Fetch ALL Personnel (to ensure we can resolve names for verifiers, even if they aren't '在職')
        const { data: people } = await supabase.from('personnel').select('id, name, station, status').order('station');
        if (people) {
            setAllPersonnel((people as any[]).map((p:any) => ({...p, station: p.station || '未分配'})) as any);
        }

        // Fetch Read Status
        const { data: reads } = await supabase.from('announcement_reads').select('*').eq('announcement_id', id);
        
        if (reads) {
            const cIds = new Set<string>();
            const vIds = new Set<string>();
            const details: Record<string, { confirmedBy: string, confirmedAt: string }> = {};
            
            reads.forEach((r: any) => {
                if (r.is_confirmed) cIds.add(r.personnel_id);
                if (r.confirmed_by) {
                    vIds.add(r.personnel_id);
                    details[r.personnel_id] = { confirmedBy: r.confirmed_by, confirmedAt: r.confirmed_at };
                }
            });
            
            setConfirmedIds(cIds);
            setManagerVerifiedIds(vIds);
            setVerificationDetails(details);
            setReadCount(cIds.size);
            
            if (cIds.has(userId)) setIsConfirmed(true);
        }

        setLoading(false);
    };

    const handleSave = async () => {
        if (!id) return;

        const linkedHtml = autoLinkHtml(editorHtml);
        const blocks: SOPBlock[] = [{ id: crypto.randomUUID(), type: 'richtext', content: linkedHtml }];

        const { error } = await supabase.from('announcements').update({
            title: editTitle,
            category: editCategory,
            cycle_type: editCycle,
            target_roles: editRoles,
            target_stations: editStations,
            start_date: editStartDate,
            end_date: editEndDate || null,
            is_active: editIsActive,
            content: blocks
        }).eq('id', id);

        if (error) alert('儲存失敗: ' + error.message);
        else {
            setIsEditing(false);
            fetchData();
        }
    };

    const handleDelete = async () => {
        if (!id || !window.confirm('確定要刪除此公告嗎？')) return;
        await supabase.from('announcements').delete().eq('id', id);
        navigate('/announcement-list');
    };

    const handleConfirmRead = async () => {
        if (!id) return;
        const now = new Date().toISOString();
        const { error } = await supabase.from('announcement_reads').upsert({
            announcement_id: id,
            personnel_id: userId,
            read_at: now,
            is_confirmed: true
        }, { onConflict: 'announcement_id, personnel_id' });

        if (error) alert('確認失敗');
        else {
            setIsConfirmed(true);
            setReadCount(prev => prev + 1);
            setConfirmedIds(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });
        }
    };

    const handleManagerVerify = async (personnelId: string, verify: boolean) => {
        if (!id) return;
        
        const now = new Date().toISOString();

        // Optimistic update
        setManagerVerifiedIds(prev => {
            const next = new Set(prev);
            if (verify) next.add(personnelId);
            else next.delete(personnelId);
            return next;
        });

        setVerificationDetails(prev => {
            const next = { ...prev };
            if (verify) {
                next[personnelId] = { confirmedBy: userId, confirmedAt: now };
            } else {
                delete next[personnelId];
            }
            return next;
        });

        const { error } = await supabase.from('announcement_reads').update({
            confirmed_by: verify ? userId : null,
            confirmed_at: verify ? now : null
        }).eq('announcement_id', id).eq('personnel_id', personnelId);

        if (error) {
            alert('更新失敗: ' + error.message);
            // Revert
            setManagerVerifiedIds(prev => {
                const next = new Set(prev);
                if (!verify) next.add(personnelId);
                else next.delete(personnelId);
                return next;
            });
            setVerificationDetails(prev => {
                 const next = { ...prev };
                 if (!verify) {
                 } else {
                     delete next[personnelId];
                 }
                 return next;
            });
            fetchData(); // Safety refetch
        }
    };

    const getLocalDateStr = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate reading stats by station (Only Active Personnel)
    const personnelByStation = useMemo(() => {
        const grouped: Record<string, Personnel[]> = {};
        allPersonnel.forEach(p => {
            if (p.status === '在職') {
                const st = p.station || '未分配';
                if (!grouped[st]) grouped[st] = [];
                grouped[st].push(p);
            }
        });
        return grouped;
    }, [allPersonnel]);

    // Helper to get verifier name
    const getVerifierName = (verifierId: string) => {
        if (verifierId === userId) return userName; // Current user
        const person = allPersonnel.find(p => p.id === verifierId);
        return person ? person.name : '未知';
    };

    if (loading) return <div className="p-10 text-center text-stone-500 font-bold">載入中...</div>;
    if (!announcement) return null;

    const canManage = ['admin', 'duty'].includes(userRole);

    return (
        <div className="container mx-auto p-6 sm:p-10 max-w-4xl pb-32">
            <div className="flex justify-between items-start mb-6">
                <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-stone-600 font-bold text-sm uppercase tracking-widest">← 返回</button>
                {canManage && !isEditing && (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-pizza-500 transition-all">編輯公告</button>
                    </div>
                )}
            </div>

            {isEditing ? (
                 <div className="glass-panel p-8 rounded-3xl bg-white shadow-xl animate-fade-in space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">標題</label>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="glass-input w-full px-4 py-3 rounded-xl text-lg font-bold" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">分類</label>
                             <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="glass-input w-full px-4 py-3 rounded-xl">
                                {tagOptions.categories.map(c => <option key={c.id} value={c.value}>{c.value}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">週期/類型</label>
                             <select value={editCycle} onChange={e => setEditCycle(e.target.value)} className="glass-input w-full px-4 py-3 rounded-xl">
                                <option value="daily">每日</option>
                                <option value="weekly">每週</option>
                                <option value="monthly">每月</option>
                                <option value="fixed">固定日期</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">開始日期</label>
                             <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="glass-input w-full px-4 py-3 rounded-xl" />
                        </div>
                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">結束日期</label>
                                <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 px-3 py-1 rounded-lg border border-stone-200 transition-colors">
                                     <input 
                                         type="checkbox" 
                                         checked={!editEndDate}
                                         onChange={(e) => {
                                             if (e.target.checked) setEditEndDate('');
                                             else setEditEndDate(editStartDate || getLocalDateStr());
                                         }}
                                         className="w-4 h-4 text-pizza-500 rounded border-stone-300 focus:ring-pizza-500"
                                     />
                                     <span className="text-xs font-bold text-stone-600">永久有效</span>
                                 </label>
                             </div>
                             <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} disabled={!editEndDate} className={`glass-input w-full px-4 py-3 rounded-xl ${!editEndDate ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''}`} />
                        </div>
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">發送對象 (職等)</label>
                         <div className="flex flex-wrap gap-2 mb-4">
                            {tagOptions.jobs.map(job => (
                                <button
                                    key={job.id}
                                    type="button"
                                    onClick={() => setEditRoles(toggleArrayItem(editRoles, job.value))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${editRoles.includes(job.value) ? 'bg-pizza-500 text-white border-pizza-500' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                                >
                                    {job.value}
                                </button>
                            ))}
                         </div>
                         <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">發送對象 (站區)</label>
                         <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setEditStations(toggleArrayItem(editStations, '全體'))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${editStations.includes('全體') ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                            >
                                全體
                            </button>
                            {tagOptions.stations.filter(st => st.value !== '全體').map(st => (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => setEditStations(toggleArrayItem(editStations, st.value))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${editStations.includes(st.value) ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                                >
                                    {st.value}
                                </button>
                            ))}
                         </div>
                    </div>
                    
                    <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">公告狀態</label>
                         <div className="flex items-center gap-3">
                             <button type="button" onClick={() => setEditIsActive(true)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase ${editIsActive ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-400'}`}>啟用</button>
                             <button type="button" onClick={() => setEditIsActive(false)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase ${!editIsActive ? 'bg-stone-500 text-white' : 'bg-stone-100 text-stone-400'}`}>停用</button>
                         </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">內容</label>
                        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                            <ReactQuill 
                                ref={quillRef}
                                theme="snow"
                                value={editorHtml}
                                onChange={setEditorHtml}
                                modules={modules}
                                className="h-64 mb-10"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-stone-100">
                        <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2"><TrashIcon className="w-4 h-4"/> 刪除公告</button>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsEditing(false); fetchData(); }} className="px-6 py-2 rounded-full border border-stone-200 text-stone-500 font-bold text-xs uppercase hover:bg-stone-50">取消</button>
                            <button onClick={handleSave} className="px-8 py-2 rounded-full bg-pizza-500 text-white font-bold text-xs uppercase shadow-lg hover:bg-pizza-600">儲存變更</button>
                        </div>
                    </div>
                 </div>
            ) : (
                <div className="space-y-8">
                    <div className="glass-panel p-8 sm:p-10 rounded-3xl bg-white shadow-xl relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-20 blur-2xl ${announcement.category === '營運' ? 'bg-blue-500' : announcement.category === '包場' ? 'bg-purple-500' : 'bg-pizza-500'}`}></div>
                        
                        <div className="relative z-10">
                            <div className="flex gap-2 mb-4">
                                <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold uppercase tracking-wider">{announcement.category}</span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${announcement.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-500'}`}>{announcement.is_active ? '發布中' : '已停用'}</span>
                            </div>
                            
                            <h1 className="text-3xl sm:text-4xl font-dela text-stone-900 mb-6 leading-tight">{announcement.title}</h1>
                            
                            <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-stone-500 font-medium mb-8 border-b border-stone-100 pb-8">
                                <div className="flex items-center gap-2">
                                    <span className="text-stone-300">📅</span> 
                                    <span>{announcement.start_date} {announcement.end_date ? `~ ${announcement.end_date}` : '起'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-stone-300">👥</span>
                                    <span>{announcement.target_roles?.join(', ') || '全員'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-stone-300">📍</span>
                                    <span>{announcement.target_stations?.join(', ') || '全區'}</span>
                                </div>
                            </div>

                            <div className="prose prose-stone max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: editorHtml }} />
                                {(!editorHtml || editorHtml === '<p><br></p>') && <p className="text-stone-400 italic">無內容</p>}
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Section */}
                    <div className="glass-panel p-6 rounded-3xl bg-white/80 border border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                         <div className="text-center sm:text-left">
                             <h3 className="text-lg font-bold text-stone-800 mb-1">閱讀確認</h3>
                             <p className="text-stone-500 text-xs">已有 <span className="text-pizza-600 font-bold text-base">{readCount}</span> 人確認收到此公告</p>
                         </div>
                         
                         {isConfirmed ? (
                             <div className="px-8 py-3 bg-green-100 text-green-700 rounded-full font-bold text-sm uppercase tracking-widest flex items-center gap-2 cursor-default">
                                 <span>✓</span> 已確認
                             </div>
                         ) : (
                             <button 
                                onClick={handleConfirmRead}
                                className="texture-grain px-8 py-3 bg-pizza-500 text-white rounded-full font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-pizza-600 hover:scale-105 transition-all animate-pulse"
                             >
                                 收到確認
                             </button>
                         )}
                    </div>

                    {/* Detailed Read Status Checklist (Admin/Duty Only) */}
                    {canManage && (
                        <div className="glass-panel p-8 rounded-3xl bg-white/60 border border-white mt-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">閱讀狀況清單</h3>
                                <div className="flex gap-4 text-xs font-bold">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> 已讀</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-stone-300"></div> 未讀</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 border border-blue-500 rounded bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 bg-blue-500 rounded-sm"></div></div> 主管確認</div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {Object.entries(personnelByStation).map(([station, people]) => (
                                    <div key={station}>
                                        <h4 className="text-xs font-bold text-stone-800 mb-3 border-b border-stone-200 pb-1">{station || '未分配'}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {(people as Personnel[]).map((p: Personnel) => {
                                                const isRead = confirmedIds.has(p.id);
                                                const isVerified = managerVerifiedIds.has(p.id);
                                                const vDetail = verificationDetails[p.id];
                                                
                                                return (
                                                    <div 
                                                        key={p.id} 
                                                        className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                                                            isRead 
                                                                ? 'bg-green-50 border-green-200' 
                                                                : 'bg-white border-stone-200 opacity-70'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${isRead ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-stone-300'}`}>
                                                                {isRead && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <span className={`text-sm font-bold truncate ${isRead ? 'text-green-800' : 'text-stone-500'}`}>{p.name}</span>
                                                        </div>
                                                        
                                                        {isRead && (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {isVerified && vDetail && (
                                                                    <div className="text-[9px] text-stone-400 text-right leading-tight min-w-fit">
                                                                        <div className="font-bold">{getVerifierName(vDetail.confirmedBy)}</div>
                                                                        <div>{new Date(vDetail.confirmedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                                    </div>
                                                                )}
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={isVerified}
                                                                    onChange={(e) => handleManagerVerify(p.id, e.target.checked)}
                                                                    className="shrink-0 w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                    title="主管確認"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnnouncementDetailPage;
