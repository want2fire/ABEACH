
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Personnel } from '../types';

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

const HomePage: React.FC<HomePageProps> = ({ user }) => {
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        // Random initial quote
        setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
        
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % QUOTES.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const isUserRole = user?.role === 'user';

    return (
        <div className="min-h-screen bg-transparent text-stone-900 font-sans relative flex flex-col">
            {/* Main Content */}
            <div className="relative z-10 flex-grow flex flex-col justify-center items-center px-6 py-20">
                
                <div className="max-w-5xl w-full text-center mb-20">
                    <p className="text-xs md:text-sm font-bold tracking-[0.3em] text-orange-600 mb-8 uppercase font-syne">A Beach 101 & Pizza</p>
                    
                    {/* Main Title: Dela Gothic One, Vivid Dark Text, No Italic */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-dela text-stone-900 leading-tight mb-12 tracking-wider drop-shadow-sm">
                        成長不是<br className="md:hidden" />
                        沒有方向的前進
                    </h1>
                    
                    {/* Quote Carousel - No Italic */}
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
                         // "Enter My Learning" Button
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
                                <h3 className="text-2xl md:text-3xl font-dela text-stone-800 mb-3">學習任務</h3>
                                <p className="text-stone-500 text-sm md:text-base font-medium">課程標準與進度追蹤</p>
                                <div className="mt-8 md:mt-12 flex items-center text-stone-900 text-xs md:text-sm font-bold uppercase tracking-widest group-hover:text-orange-600 transition-colors">
                                    進入頁面 <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
                                </div>
                            </Link>
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
