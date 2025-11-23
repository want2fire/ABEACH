
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TagData, type TagColor, type DailySchedule, type TrainingAssignment } from './types';
import Header from './components/Header';
import PersonnelListPage from './pages/PersonnelListPage';
import TrainingItemsPage from './pages/TrainingItemsPage';
import PersonnelDetailPage from './pages/PersonnelDetailPage';
import TrainingItemDetailPage from './pages/TrainingItemDetailPage';
import AuthPage from './pages/AuthPage';
import UserManagementPage from './pages/UserManagementPage';
import HomePage from './pages/HomePage';
import AnnouncementListPage from './pages/AnnouncementListPage';
import AnnouncementDetailPage from './pages/AnnouncementDetailPage';
import { supabase } from './lib/supabaseClient';

type TagType = 'workArea' | 'type' | 'chapter' | 'job';

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [trainingItems, setTrainingItems] = useState<TrainingItem[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);

  // Centralized Tag State
  const [workAreaTags, setWorkAreaTags] = useState<TagData[]>([]);
  const [typeTags, setTypeTags] = useState<TagData[]>([]);
  const [chapterTags, setChapterTags] = useState<TagData[]>([]);
  const [jobTitleTags, setJobTitleTags] = useState<TagData[]>([]);
  
  const tagStateMap = {
    workArea: { tags: workAreaTags, setTags: setWorkAreaTags },
    type: { tags: typeTags, setTags: setTypeTags },
    chapter: { tags: chapterTags, setTags: setChapterTags },
    job: { tags: jobTitleTags, setTags: setJobTitleTags },
  };

  // Initial Load & Session Check
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      
      // Check for stored session
      const storedUserId = localStorage.getItem('app_user_id');
      const storedTimestamp = localStorage.getItem('app_login_timestamp');

      if (storedUserId && storedTimestamp) {
        const now = Date.now();
        const loginTime = parseInt(storedTimestamp, 10);

        // Check if session expired
        if (now - loginTime > SESSION_DURATION) {
            // Session expired
            localStorage.removeItem('app_user_id');
            localStorage.removeItem('app_login_timestamp');
            setLoading(false);
            return;
        }

        // Session valid, fetch user
        const { data, error } = await supabase
          .from('personnel')
          .select('*')
          .eq('id', storedUserId)
          .single();
          
        if (data && !error) {
          setCurrentUser({
              ...data,
              station: data.station || '全體' // Ensure station has default
          } as any); 
          fetchData();
        } else {
          localStorage.removeItem('app_user_id');
          localStorage.removeItem('app_login_timestamp');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  const handleLogin = (user: Personnel) => {
    localStorage.setItem('app_user_id', user.id);
    localStorage.setItem('app_login_timestamp', Date.now().toString());
    setCurrentUser(user);
    fetchData();
    navigate('/'); // Force redirect to home page
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user_id');
    localStorage.removeItem('app_login_timestamp');
    setCurrentUser(null);
    setTrainingItems([]);
    setPersonnelList([]);
    navigate('/');
  };

  // Fetch all data from Supabase
  const fetchData = async () => {
    try {
      // 1. Fetch Tags
      const { data: tagsData } = await supabase.from('tags').select('*');
      if (tagsData) {
        setWorkAreaTags(tagsData.filter((t: any) => t.category === 'workArea'));
        setTypeTags(tagsData.filter((t: any) => t.category === 'type'));
        setChapterTags(tagsData.filter((t: any) => t.category === 'chapter'));
        setJobTitleTags(tagsData.filter((t: any) => t.category === 'job'));
      }

      // 2. Fetch Training Items
      const { data: itemsData } = await supabase.from('training_items').select('*');
      if (itemsData) {
        const mappedItems: TrainingItem[] = itemsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          workArea: item.work_area,
          typeTag: item.type_tag,
          chapter: item.chapter,
          content: item.content
        }));
        setTrainingItems(mappedItems);
      }

      // 3. Fetch Personnel
      const { data: peopleData } = await supabase.from('personnel').select('*');
      const { data: progressData } = await supabase.from('training_progress').select('*');
      const { data: scheduleData } = await supabase.from('schedules').select('*');

      if (peopleData) {
        const mappedPersonnel: Personnel[] = peopleData.map((p: any) => {
          const myProgress = progressData
            ?.filter((prog: any) => prog.personnel_id === p.id)
            .map((prog: any) => ({
              itemId: prog.item_id,
              completed: prog.completed
            })) || [];

          const mySchedule: DailySchedule = {};
          scheduleData
            ?.filter((s: any) => s.personnel_id === p.id)
            .forEach((s: any) => {
              if (!mySchedule[s.work_date]) {
                mySchedule[s.work_date] = [];
              }
              if (s.item_id) {
                  mySchedule[s.work_date].push(s.item_id);
              }
            });

          return {
            id: p.id,
            name: p.name,
            gender: p.gender as any,
            dob: p.dob,
            phone: p.phone,
            jobTitle: p.job_title,
            station: p.station || '全體', // New Field
            status: p.status as any,
            access_code: p.access_code || '0000',
            role: p.role || 'user',
            trainingPlan: myProgress,
            schedule: mySchedule
          };
        });
        setPersonnelList(mappedPersonnel);
        
        if (currentUser) {
            const updatedSelf = mappedPersonnel.find(p => p.id === currentUser.id);
            if (updatedSelf) setCurrentUser(updatedSelf);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const addTag = async (type: TagType, value: string, color: string | 'auto' = 'auto') => {
    if (!value || !value.trim()) return;
    const { tags } = tagStateMap[type];
    if (tags.some(t => t.value.toLowerCase() === value.toLowerCase())) return;

    let newColor: string;
    if (color !== 'auto') newColor = color;
    else {
        const availableColors: TagColor[] = ['sky', 'green', 'amber', 'indigo', 'pink', 'purple', 'slate'];
        newColor = availableColors[tags.length % availableColors.length];
    }

    const newId = crypto.randomUUID();
    const { error } = await supabase.from('tags').insert({
      id: newId,
      category: type,
      value: value,
      color: newColor
    });
    if (!error) fetchData();
  };

  const deleteTag = async (type: TagType, value: string) => {
    const tag = tagStateMap[type].tags.find(t => t.value === value);
    if (tag) {
      await supabase.from('tags').delete().eq('id', tag.id);
      fetchData();
    }
  };
  
  const handleEditTag = async (tagType: TagType, tagId: string, newName: string, newColor: string, replacementTagId?: string) => {
    const oldTag = tagStateMap[tagType].tags.find(t => t.id === tagId);
    if (!oldTag) return;

    if (replacementTagId) {
      const replacementTag = tagStateMap[tagType].tags.find(t => t.id === replacementTagId);
      if (!replacementTag) return;

      if (tagType === 'workArea') await supabase.from('training_items').update({ work_area: replacementTag.value }).eq('work_area', oldTag.value);
      else if (tagType === 'type') await supabase.from('training_items').update({ type_tag: replacementTag.value }).eq('type_tag', oldTag.value);
      else if (tagType === 'chapter') await supabase.from('training_items').update({ chapter: replacementTag.value }).eq('chapter', oldTag.value);
      else if (tagType === 'job') await supabase.from('personnel').update({ job_title: replacementTag.value }).eq('job_title', oldTag.value);

      await supabase.from('tags').delete().eq('id', tagId);
    } else {
      await supabase.from('tags').update({ value: newName, color: newColor }).eq('id', tagId);
      if (oldTag.value !== newName) {
         if (tagType === 'workArea') await supabase.from('training_items').update({ work_area: newName }).eq('work_area', oldTag.value);
         else if (tagType === 'type') await supabase.from('training_items').update({ type_tag: newName }).eq('type_tag', oldTag.value);
         else if (tagType === 'chapter') await supabase.from('training_items').update({ chapter: newName }).eq('chapter', oldTag.value);
         else if (tagType === 'job') await supabase.from('personnel').update({ job_title: newName }).eq('job_title', oldTag.value);
      }
    }
    fetchData();
  };

  const handleAddTrainingItem = async (item: Omit<TrainingItem, 'id'>) => {
    await addTag('workArea', item.workArea);
    await addTag('type', item.typeTag);
    await addTag('chapter', item.chapter);
    const { error } = await supabase.from('training_items').insert({
      id: crypto.randomUUID(),
      name: item.name,
      work_area: item.workArea,
      type_tag: item.typeTag,
      chapter: item.chapter
    });
    if (!error) fetchData();
  };

  const handleUpdateTrainingItem = async (updatedItem: TrainingItem) => {
    await supabase.from('training_items').update({
      name: updatedItem.name,
      work_area: updatedItem.workArea,
      type_tag: updatedItem.typeTag,
      chapter: updatedItem.chapter
    }).eq('id', updatedItem.id);
    fetchData();
  };
  
  const handleDeleteTrainingItem = async (id: string) => {
    await supabase.from('training_items').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteSelectedTrainingItems = async (idsToDelete: Set<string>) => {
    await supabase.from('training_items').delete().in('id', Array.from(idsToDelete));
    fetchData();
  };

  const handleAddPersonnel = async (person: Omit<Personnel, 'id' | 'trainingPlan' | 'status' | 'schedule' | 'role'>) => {
    await addTag('job', person.jobTitle);
    const { error } = await supabase.from('personnel').insert({
      id: crypto.randomUUID(),
      name: person.name,
      gender: person.gender,
      dob: person.dob,
      phone: person.phone,
      job_title: person.jobTitle,
      station: person.station,
      status: '在職',
      access_code: person.access_code,
      role: 'user'
    });
    if (!error) fetchData();
  };

  const handleUpdatePersonnel = async (updatedPersonnel: Personnel) => {
    await supabase.from('personnel').update({
      name: updatedPersonnel.name,
      gender: updatedPersonnel.gender,
      dob: updatedPersonnel.dob,
      phone: updatedPersonnel.phone,
      job_title: updatedPersonnel.jobTitle,
      station: updatedPersonnel.station,
      status: updatedPersonnel.status,
      access_code: updatedPersonnel.access_code,
      role: updatedPersonnel.role
    }).eq('id', updatedPersonnel.id);
    
    // ... training progress logic remains same
    const progressUpdates = updatedPersonnel.trainingPlan.map(plan => ({
        personnel_id: updatedPersonnel.id,
        item_id: plan.itemId,
        completed: plan.completed
    }));
    if (progressUpdates.length > 0) {
        await supabase.from('training_progress').upsert(progressUpdates);
    }
    fetchData();
  };

  const handleDeletePersonnel = async (id: string) => {
    await supabase.from('personnel').delete().eq('id', id);
    fetchData();
  };
  
  const handleAssignItemsToPersonnel = async (itemIds: Set<string>, personnelIds: Set<string>) => {
    const inserts: any[] = [];
    personnelIds.forEach(pId => {
        itemIds.forEach(itemId => {
            inserts.push({ personnel_id: pId, item_id: itemId, completed: false });
        });
    });
    if (inserts.length > 0) await supabase.from('training_progress').upsert(inserts, { onConflict: 'personnel_id, item_id', ignoreDuplicates: true });
    fetchData();
  };
  
  const handleUpdateSchedule = async (personnelId: string, schedule: DailySchedule) => {
      if (!personnelId) return;
      try {
        const { error: deleteError } = await supabase.from('schedules').delete().eq('personnel_id', personnelId);
        if (deleteError) throw deleteError;
        const inserts: any[] = [];
        Object.entries(schedule).forEach(([date, itemIds]) => {
            if (date) {
                if (Array.isArray(itemIds) && itemIds.length > 0) {
                    itemIds.forEach(itemId => inserts.push({ personnel_id: personnelId, item_id: itemId, work_date: date }));
                } else {
                    inserts.push({ personnel_id: personnelId, item_id: null, work_date: date });
                }
            }
        });
        if (inserts.length > 0) await supabase.from('schedules').insert(inserts);
      } catch (e) { console.error('Error updating schedule:', e); }
      fetchData();
  };
  
  const handleImportTrainingItems = async (rows: any[][]) => { /* ... */ fetchData(); };
  const handleImportPersonnel = async (rows: any[][]) => { /* ... */ fetchData(); };
  const deleteTagFunc = deleteTag;
  const editTagFunc = handleEditTag;

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen relative font-sans text-stone-900 bg-transparent">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[90vw] h-[90vw] bg-sky-200/40 rounded-full blur-[120px] animate-blob"></div>
            <div className="absolute top-[10%] right-[-10%] w-[90vw] h-[90vw] bg-orange-200/40 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] bg-pink-200/40 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        </div>
        <div className="texture-grain fixed inset-0 z-0 pointer-events-none opacity-20"></div>

      {loading ? (
        <div className="min-h-screen flex justify-center items-center relative z-20">
            <div className="text-pizza-500 text-xl font-syne font-bold tracking-widest flex items-center gap-4">
            <div className="w-3 h-3 bg-pizza-500 rounded-full animate-ping"></div>
            載入中...
            </div>
        </div>
      ) : !currentUser ? (
        <AuthPage onLogin={handleLogin} />
      ) : (
        <div className="relative z-10 flex flex-col min-h-screen">
            <Header userName={currentUser.name} userRole={currentUser.role} onSignOut={handleLogout} isHomePage={isHomePage} />
            <main className="flex-grow">
            <Routes>
                <Route path="/" element={<HomePage user={currentUser} />} />
                
                {/* Personnel Routes */}
                <Route path="/personnel-list" element={<PersonnelListPage personnelList={personnelList} trainingItems={trainingItems} jobTitleTags={jobTitleTags} userRole={currentUser.role} onAddPersonnel={handleAddPersonnel} onUpdatePersonnel={handleUpdatePersonnel} onDeletePersonnel={handleDeletePersonnel} onImportPersonnel={handleImportPersonnel} />} />
                <Route path="/personnel/:personnelId" element={<PersonnelDetailPage personnelList={personnelList} trainingItems={trainingItems} jobTitleTags={jobTitleTags} userRole={currentUser.role} onUpdatePersonnel={handleUpdatePersonnel} onUpdateSchedule={handleUpdateSchedule} />} />
                
                {/* Training Routes */}
                <Route path="/training-items" element={<TrainingItemsPage items={trainingItems} personnelList={personnelList} workAreaTags={workAreaTags} typeTags={typeTags} chapterTags={chapterTags} jobTitleTags={jobTitleTags} userRole={currentUser.role} onAddItem={handleAddTrainingItem} onUpdateItem={handleUpdateTrainingItem} onDeleteItem={handleDeleteTrainingItem} onDeleteSelected={handleDeleteSelectedTrainingItems} onDeleteTag={deleteTagFunc} onEditTag={editTagFunc} onImportItems={handleImportTrainingItems} onAssignItemsToPersonnel={handleAssignItemsToPersonnel} />} />
                <Route path="/training-items/:itemId" element={<TrainingItemDetailPage userRole={currentUser.role} />} />
                
                {/* Admin Routes */}
                <Route path="/user-management" element={currentUser.role === 'admin' ? <UserManagementPage /> : <Navigate to="/" />} />
                
                {/* Announcement Routes */}
                <Route path="/announcement-list" element={currentUser.role === 'admin' ? <AnnouncementListPage /> : <Navigate to="/" />} />
                <Route path="/announcement/:id" element={<AnnouncementDetailPage userRole={currentUser.role} userId={currentUser.id} userName={currentUser.name} />} />
            </Routes>
            </main>
        </div>
      )}
    </div>
  );
};

export default App;