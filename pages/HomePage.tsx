
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Personnel, Announcement } from '../types';
import { supabase } from '../lib/supabaseClient';

interface HomePageProps {
    user: Personnel | null;
}

const QUOTES = [
    { text: "Growth is painful. Change is painful. But nothing is as painful as staying stuck where you don't belong.", author: "Mandy Hale" },
    { text: "Do not wait for the perfect time and place to enter, for you are already onstage.", author: "Unknown" },
    { text: "Your brand is what other people say about you when you're not in the room.", author: "Jeff Bezos" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Quality is more important than quantity. One home run is much better than two doubles.", author: "Steve Jobs" },
    { text: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", author: "Mark Zuckerberg" },
    { text: "A brand for a company is like a reputation for a person.", author: "Jeff Bezos" }
];

type TabType = 'today' | 'week' | 'month';

interface AnnouncementWithStatus extends Announcement {
    is_confirmed?: boolean;
}

// Helper to check if date is today
const isCreatedToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const HomePage: React.FC<HomePageProps> = ({ user }) => {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>('today');
    
    // Announcement Lists
    const [todayAnnos, setTodayAnnos] = useState<AnnouncementWithStatus[]>([]);
    const [weekAnnos, setWeekAnnos] = useState<AnnouncementWithStatus[]>([]);
    const [monthAnnos, setMonthAnnos] = useState<AnnouncementWithStatus[]>([]);
    
    const [isLoadingAnnos, setIsLoadingAnnos] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        // Random initial quote
        setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
        
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % QUOTES.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // Fetch Announcements
    useEffect(() => {
        if (!user) return;
        
        const fetchAnnos = async () => {
            setIsLoadingAnnos(true);
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA'); 
            const currentDayOfWeek = now.getDay(); 
            const currentDayOfMonth = now.getDate(); 
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Fetch all potentially active announcements
            const { data: annosData } = await supabase.from('announcements')
                .select('*')
                .eq('is_active', true)
                .lte('start_date', todayStr)
                .order('start_date', { ascending: false });

            // Fetch Read Status for current user
            const { data: readsData } = await supabase
                .from('announcement_reads')
                .select('announcement_id, is_confirmed')
                .eq('personnel_id', user.id);
            
            const confirmedMap = new Set(readsData?.filter((r: any) => r.is_confirmed).map((r: any) => r.announcement_id));

            if (annosData) {
                const activeAnnos = (annosData as Announcement[]).filter(a => {
                    // 1. Role Check
                    const roleMatch = (a.target_roles || []).some(r => {
                        const rTrimmed = r.trim();
                        if (rTrimmed === '一般員工') return true;
                        if (rTrimmed === 'DUTY' && (user.jobTitle.includes('DUTY') || user.jobTitle === 'A TEAM' || user.jobTitle === '管理員')) return true;
                        if (rTrimmed === 'ATEAM' && (user.jobTitle === 'A TEAM' || user.jobTitle === '管理員')) return true;
                        if (user.jobTitle === rTrimmed) return true;
                        return false;
                    });
                    
                    // 2. Station Check
                    const stationMatch = (a.target_stations || []).some(s => {
                        const sTrimmed = s.trim();
                        if (sTrimmed === '全體') return true;
                        if (user.station === sTrimmed) return true;
                        return false;
                    });

                    // 3. Cycle Check
                    let cycleMatch = true;
                    if (a.cycle_type === 'monthly') {
                        if (currentDayOfMonth !== 1) cycleMatch = false;
                    } else if (a.cycle_type === 'fixed') {
                        if (a.end_date && todayStr > a.end_date) cycleMatch = false;
                    } else if (a.cycle_type.startsWith('weekly')) {
                        if (a.cycle_type.includes(':')) {
                             const daysStr = a.cycle_type.split(':')[1];
                             const days = daysStr.split(',').map(Number);
                             if (!days.includes(currentDayOfWeek)) cycleMatch = false;
                        } else {
                             if (currentDayOfWeek !== 1) cycleMatch = false;
                        }
                    }
                    
                    return roleMatch && stationMatch && cycleMatch;
                }).map(a => ({
                    ...a,
                    is_confirmed: confirmedMap.has(a.id)
                }));

                // Categorize Logic
                const todayList: AnnouncementWithStatus[] = [];
                const weekList: AnnouncementWithStatus[] = [];
                const monthList: AnnouncementWithStatus[] = [];

                activeAnnos.forEach(a => {
                    // Calculate Duration
                    let duration = Infinity;
                    if (a.end_date) {
                        const start = new Date(a.start_date);
                        const end = new Date(a.end_date);
                        const diff = end.getTime() - start.getTime();
                        duration = Math.ceil(diff / (1000 * 3600 * 24)) + 1; // inclusive
                    }

                    if (duration <= 6) {
                        todayList.push(a);
                    } else {
                        const isPermanent = !a.end_date;
                        const endDate = a.end_date ? new Date(a.end_date) : new Date(8640000000000000);
                        
                        // Normalize endOfMonth
                        const endOfMonthObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        endOfMonthObj.setHours(23, 59, 59, 999);

                        if (isPermanent || endDate >= endOfMonthObj) {
                            monthList.push(a);
                        } else {
                            weekList.push(a);
                        }
                    }
                });

                // Sorting Logic:
                // 1. Unconfirmed First
                // 2. New (Created Today) First
                // 3. Start Date (Newest First)
                const sorter = (a: AnnouncementWithStatus, b: AnnouncementWithStatus) => {
                    // Priority 1: Unconfirmed at top
                    if (a.is_confirmed !== b.is_confirmed) {
                        return a.is_confirmed ? 1 : -1;
                    }
                    
                    // Priority 2: Created Today (NEW!) at top (only if confirmation status is same)
                    const isANew = isCreatedToday(a.created_at);
                    const isBNew = isCreatedToday(b.created_at);
                    if (isANew !== isBNew) {
                        return isANew ? -1 : 1;
                    }

                    // Priority 3: Start Date
                    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                };

                setTodayAnnos(todayList.sort(sorter));
                setWeekAnnos(weekList.sort(sorter));
                setMonthAnnos(monthList.sort(sorter));
                
                // Determine default active tab
                if (todayList.length > 0) setActiveTab('today');
                else if (weekList.length > 0) setActiveTab('week');
                else setActiveTab('month');
            }
            setIsLoadingAnnos(false);
        };
        fetchAnnos();
    }, [user]);

    const getCurrentList = () => {
        switch(activeTab) {
            case 'today': return todayAnnos;
            case 'week': return weekAnnos;
            case 'month': return monthAnnos;
            default: return todayAnnos;
        }
    };

    const currentList = getCurrentList();
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const paginatedList = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const isUserRole = user?.role === 'user';

    return (
        <div className="min-h-screen bg-transparent text-stone-900 font-sans relative flex flex-col">
            {/* Main Content */}
            <div className="relative z-10 flex-grow flex flex-col justify-center items-center px-6 py-12 md:py-20">
                
                {/* Notebook Style Announcement Section */}
                <div className="w-full max-w-4xl mb-16 animate-fade-in relative flex flex-row items-stretch">
                    
                    {/* Left: Content Area */}
                    <div className="flex-grow bg-white/90 backdrop-blur-md rounded-l-3xl rounded-tr-3xl shadow-xl border border-stone-200 min-h-[320px] relative z-10 flex flex-col">
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-stone-200 border-dashed flex justify-between items-baseline bg-stone-50/50 rounded-tl-3xl">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-dela text-stone-800 tracking-wide">公告</h2>
                                <span className="px-3 py-1 bg-stone-800 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                                    {activeTab === 'today' ? '本日' : activeTab === 'week' ? '本週' : '本月'}
                                </span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="p-6 md:p-8 flex-grow space-y-3">
                            {isLoadingAnnos ? (
                                <p className="text-center text-stone-400 font-bold py-8">載入中...</p>
                            ) : paginatedList.length > 0 ? (
                                paginatedList.map(anno => (
                                    <Link 
                                        key={anno.id} 
                                        to={`/announcement/${anno.id}`}
                                        className={`block group ${anno.is_confirmed ? 'opacity-50 grayscale order-last' : ''}`}
                                    >
                                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <span className={`shrink-0 w-2 h-2 rounded-full ${anno.category === '營運' ? 'bg-blue-400' : anno.category === '包場' ? 'bg-purple-400' : 'bg-pizza-500'}`}></span>
                                                
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {isCreatedToday(anno.created_at) && (
                                                        <span className="animate-bounce px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm whitespace-nowrap">NEW!</span>
                                                    )}
                                                    <span className={`text-lg font-bold text-stone-700 truncate group-hover:text-pizza-600 transition-colors ${anno.is_confirmed ? 'line-through decoration-stone-300' : ''}`}>{anno.title}</span>
                                                </div>

                                                <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] font-bold rounded hidden md:inline-block whitespace-nowrap">{anno.category}</span>
                                                {anno.is_confirmed && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded whitespace-nowrap">已確認</span>
                                                )}
                                            </div>
                                            <span className="text-stone-400 group-hover:text-pizza-500 transition-colors font-bold text-xl ml-4">→</span>
                                        </div>
                                        <div className="h-px bg-stone-100 mx-3 group-hover:bg-stone-200 transition-colors"></div>
                                    </Link>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-60 py-10">
                                    <p className="text-sm font-bold uppercase tracking-widest mb-2">暫無公告</p>
                                    <div className="w-8 h-1 bg-stone-200 rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-stone-100 border-dashed flex justify-center items-center gap-6">
                            <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="text-stone-400 hover:text-stone-800 disabled:opacity-30 font-bold text-lg transition-colors"
                            >
                                &lt;
                            </button>
                            <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">
                                {paginatedList.length > 0 ? `${currentPage} / ${totalPages || 1}` : '-'}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="text-stone-400 hover:text-stone-800 disabled:opacity-30 font-bold text-lg transition-colors"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>

                    {/* Right: Vertical Tabs */}
                    <div className="flex flex-col gap-1 pt-8 -ml-1 z-0">
                        {[
                            { id: 'today', label: '本日', color: 'bg-pizza-500' },
                            { id: 'week', label: '本週', color: 'bg-blue-500' },
                            { id: 'month', label: '本月', color: 'bg-stone-700' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`
                                    writing-vertical-rl py-6 px-3 rounded-r-xl text-xs font-bold tracking-widest transition-all duration-300 shadow-md border-y border-r border-white/20
                                    ${activeTab === tab.id 
                                        ? `${tab.color} text-white translate-x-0 scale-110 z-20` 
                                        : 'bg-white/80 text-stone-400 hover:bg-stone-50 translate-x-[-2px] hover:translate-x-0 z-0'}
                                `}
                                style={{ writingMode: 'vertical-rl' }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-w-5xl w-full text-center mb-12">
                    <p className="text-xs md:text-sm font-bold tracking-[0.3em] text-orange-600 mb-8 uppercase font-syne">A Beach 101 & Pizza</p>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-dela text-stone-900 leading-tight mb-12 tracking-wider drop-shadow-sm">
                        成長不是<br className="md:hidden" />
                        沒有方向的前進
                    </h1>
                    
                    {/* Quote Carousel */}
                    <div className="h-28 md:h-24 relative max-w-2xl mx-auto mt-4">
                        {QUOTES.map((q, i) => (
                            <div 
                                key={i}
                                className={`absolute inset-0 transition-all duration-1000 flex flex-col items-center justify-center ${i === quoteIndex ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}
                            >
                                <p className="text-lg md:text-xl font-serif text-stone-600 mb-2">"{q.text}"</p>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">— {q.author}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Cards */}
                <div className={`grid gap-6 w-full max-w-4xl px-4 ${isUserRole ? 'grid-cols-1 justify-items-center' : 'grid-cols-1 md:grid-cols-2'}`}>
                    
                    {isUserRole ? (
                         <Link to={`/personnel/${user?.id}`} className="texture-grain group relative overflow-hidden rounded-full bg-white border-stone-200 border p-6 transition-all hover:bg-stone-50 hover:shadow-xl hover:shadow-orange-200/30 hover:scale-[1.02] w-full max-w-lg flex items-center justify-between px-10 shadow-md">
                            <span className="text-xl font-bold text-stone-800 tracking-wide font-sans">進入我的學習</span>
                            <span className="text-orange-500 font-bold text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                        </Link>
                    ) : (
                        <>
                            <Link to="/personnel-list" className="texture-grain group relative overflow-hidden rounded-[2rem] bg-white border border-stone-200 p-8 md:p-10 transition-all hover:bg-stone-50 hover:shadow-2xl hover:shadow-blue-200/50 hover:scale-[1.02] hover:-translate-y-1 shadow-lg">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity duration-500 group-hover:text-blue-500">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-dela text-stone-800 mb-3">夥伴名單</h3>
                                <p className="text-stone-500 text-sm md:text-base font-medium">管理團隊成員與詳細資訊</p>
                                <div className="mt-8 md:mt-12 flex items-center text-stone-900 text-xs md:text-sm font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                                    進入頁面 <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
                                </div>
                            </Link>

                            <Link to="/training-items" className="texture-grain group relative overflow-hidden rounded-[2rem] bg-white border border-stone-200 p-8 md:p-10 transition-all hover:bg-stone-50 hover:shadow-2xl hover:shadow-orange-200/50 hover:scale-[1.02] hover:-translate-y-1 shadow-lg">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity duration-500 group-hover:text-orange-500">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-dela text-stone-800 mb-3">學習進度</h3>
                                <p className="text-stone-500 text-sm md:text-base font-medium">課程標準與進度追蹤</p>
                                <div className="mt-8 md:mt-12 flex items-center text-stone-900 text-xs md:text-sm font-bold uppercase tracking-widest group-hover:text-orange-600 transition-colors">
                                    進入頁面 <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
                                </div>
                            </Link>
                            
                             {user?.role === 'admin' && (
                                <Link to="/announcement-list" className="md:col-span-2 texture-grain group relative overflow-hidden rounded-[2rem] bg-white border border-stone-200 p-6 md:p-8 transition-all hover:bg-stone-50 hover:shadow-xl hover:shadow-purple-200/50 hover:scale-[1.01] shadow-lg flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-dela text-stone-800 mb-1">公告管理</h3>
                                        <p className="text-stone-500 text-xs md:text-sm font-medium">發布重要資訊與活動通知</p>
                                    </div>
                                    <div className="text-stone-400 group-hover:text-purple-600 transition-colors">
                                        <span className="font-bold text-2xl">→</span>
                                    </div>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>

            <footer className="relative z-10 p-6 text-center">
                <p className="text-stone-400 text-xs uppercase tracking-[0.2em] font-medium">A Beach 101 & Pizza © {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};

export default HomePage;
