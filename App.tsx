
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TagData, type TagColor, type DailySchedule, type TrainingAssignment } from './types';
import Header from './components/Header';
import PersonnelListPage from './pages/PersonnelListPage';
import TrainingItemsPage from './pages/TrainingItemsPage';
import PersonnelDetailPage from './pages/PersonnelDetailPage';
import AuthPage from './pages/AuthPage';
import UserManagementPage from './pages/UserManagementPage';
import HomePage from './pages/HomePage';
import { supabase } from './lib/supabaseClient';

type TagType = 'workArea' | 'type' | 'chapter' | 'job';

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
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
          setCurrentUser(data as any); 
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
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user_id');
    localStorage.removeItem('app_login_timestamp');
    setCurrentUser(null);
    setTrainingItems([]);
    setPersonnelList([]);
  };

  // Fetch all data from Supabase
  const fetchData = async () => {
    try {
      // We don't set loading to true here to avoid flashing loading screen on background updates
      // setLoading(true); 

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
          chapter: item.chapter
        }));
        setTrainingItems(mappedItems);
      }

      // 3. Fetch Personnel, Progress, and Schedules
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
              // Only push valid item IDs (not null placeholders)
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
      if (loading) setLoading(false); // Only unset loading if it was set initially
    }
  };

  const addTag = async (type: TagType, value: string, color: TagColor | 'auto' = 'auto') => {
    if (!value || !value.trim()) return;
    const { tags } = tagStateMap[type];
    if (tags.some(t => t.value.toLowerCase() === value.toLowerCase())) return;

    let newColor: TagColor;
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
  
  const handleEditTag = async (tagType: TagType, tagId: string, newName: string, newColor: TagColor, replacementTagId?: string) => {
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
      status: updatedPersonnel.status,
      access_code: updatedPersonnel.access_code,
      role: updatedPersonnel.role
    }).eq('id', updatedPersonnel.id);

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
        // 1. Delete existing schedules
        const { error: deleteError } = await supabase.from('schedules').delete().eq('personnel_id', personnelId);
        if (deleteError) {
            console.error('Failed to delete old schedule', deleteError);
            throw deleteError;
        }

        // 2. Prepare new inserts
        const inserts: any[] = [];
        Object.entries(schedule).forEach(([date, itemIds]) => {
            // Ensure date is valid string "YYYY-MM-DD"
            if (date) {
                if (Array.isArray(itemIds) && itemIds.length > 0) {
                    // Has tasks
                    itemIds.forEach(itemId => {
                        inserts.push({ personnel_id: personnelId, item_id: itemId, work_date: date });
                    });
                } else {
                    // No tasks, but is a workday -> insert placeholder
                    inserts.push({ personnel_id: personnelId, item_id: null, work_date: date });
                }
            }
        });

        // 3. Insert new records
        if (inserts.length > 0) {
            const { error: insertError } = await supabase.from('schedules').insert(inserts);
            if (insertError) {
                console.error('Failed to insert new schedule', insertError);
            }
        }
    } catch (e) {
        console.error('Error updating schedule:', e);
    }

    // 4. Refresh local state
    fetchData();
  };

  const handleImportTrainingItems = async (rows: any[][]) => {
    const newItems: any[] = [];
    const availableColors: TagColor[] = ['sky', 'green', 'amber', 'indigo', 'pink', 'purple', 'slate', 'red'];
    const knownTags = {
        workArea: new Set(workAreaTags.map(t => t.value.toLowerCase())),
        type: new Set(typeTags.map(t => t.value.toLowerCase())),
        chapter: new Set(chapterTags.map(t => t.value.toLowerCase()))
    };
    const tagsToCreate = { workArea: new Set<string>(), type: new Set<string>(), chapter: new Set<string>() };

    for (const row of rows) {
      try {
        if (!Array.isArray(row) || row.length < 4) continue;
        const [name, workArea, typeTag, chapter] = row.map(c => String(c || '').trim());
        if (name === '項目名稱' || workArea === '工作區') continue;
        if (name && workArea && typeTag && chapter) {
           if (!knownTags.workArea.has(workArea.toLowerCase())) { tagsToCreate.workArea.add(workArea); knownTags.workArea.add(workArea.toLowerCase()); }
           if (!knownTags.type.has(typeTag.toLowerCase())) { tagsToCreate.type.add(typeTag); knownTags.type.add(typeTag.toLowerCase()); }
           if (!knownTags.chapter.has(chapter.toLowerCase())) { tagsToCreate.chapter.add(chapter); knownTags.chapter.add(chapter.toLowerCase()); }
           newItems.push({ id: crypto.randomUUID(), name, work_area: workArea, type_tag: typeTag, chapter });
        }
      } catch (e) { console.error(e); }
    }

    const insertNewTags = async (category: TagType, values: Set<string>) => {
        const newTagsPayload = [];
        for (const val of Array.from(values)) {
            newTagsPayload.push({ id: crypto.randomUUID(), category, value: val, color: availableColors[Math.floor(Math.random() * availableColors.length)] });
        }
        if (newTagsPayload.length > 0) {
             for (let i = 0; i < newTagsPayload.length; i += 50) await supabase.from('tags').insert(newTagsPayload.slice(i, i + 50));
        }
    };
    await insertNewTags('workArea', tagsToCreate.workArea);
    await insertNewTags('type', tagsToCreate.type);
    await insertNewTags('chapter', tagsToCreate.chapter);

    if (newItems.length > 0) {
        let successCount = 0, failCount = 0;
        setLoading(true);
        for (let i = 0; i < newItems.length; i += 50) {
             const chunk = newItems.slice(i, i + 50);
             const { error } = await supabase.from('training_items').insert(chunk);
             if (error) failCount += chunk.length; else successCount += chunk.length;
        }
        setLoading(false);
        fetchData();
        if (failCount > 0) alert(`匯入完成。成功: ${successCount} 筆，失敗: ${failCount} 筆。`);
        else alert(`成功匯入 ${successCount} 筆學習項目。`);
    }
  };

  const handleImportPersonnel = async (rows: any[][]) => {
    const newPeople: any[] = [];
    const allowedTitles = new Set(['外場DUTY', '內場DUTY', 'A TEAM', '管理員', '一般員工']);
    for (const row of rows) {
      try {
        if (!Array.isArray(row) || row.length < 5) continue;
        const [name, genderStr, dob, phone, rawJobTitle, accessCode] = row.map(c => String(c || '').trim());
        if (name === '姓名' && phone === '電話') continue;
        if (name && dob && phone) {
            let jobTitle = rawJobTitle;
            if (!allowedTitles.has(jobTitle)) jobTitle = '一般員工';
            await addTag('job', jobTitle, 'red');
            const defaultCode = accessCode || (phone.length >= 4 ? phone.slice(-4) : '0000');
            newPeople.push({ id: crypto.randomUUID(), name, gender: genderStr, dob, phone, job_title: jobTitle, status: '在職', access_code: defaultCode, role: 'user' });
        }
      } catch (e) { console.error(e); }
    }
    if (newPeople.length > 0) {
        let successCount = 0, failCount = 0;
        setLoading(true);
        for (let i = 0; i < newPeople.length; i += 50) {
             const chunk = newPeople.slice(i, i + 50);
             const { error } = await supabase.from('personnel').insert(chunk);
             if (error) failCount += chunk.length; else successCount += chunk.length;
        }
        setLoading(false);
        fetchData();
        if (failCount > 0) alert(`匯入完成。成功: ${successCount} 筆，失敗: ${failCount} 筆。`);
        else alert(`成功匯入 ${successCount} 筆人員資料。`);
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen relative font-sans text-stone-900 bg-white">
        {/* Global Vivid Light Aurora Background - Adjusted colors to remove "dirty" look */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Changed to Cyan, Yellow, Rose for a cleaner, brighter palette without mix-blend-multiply causing murkiness */}
            <div className="absolute top-[-10%] left-[-10%] w-[90vw] h-[90vw] bg-cyan-200/60 rounded-full blur-[120px] animate-blob"></div>
            <div className="absolute top-[10%] right-[-10%] w-[90vw] h-[90vw] bg-yellow-200/60 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] bg-rose-200/60 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Global Grain Overlay */}
        <div className="texture-grain fixed inset-0 z-0 pointer-events-none opacity-30"></div>

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
                <Route path="/personnel-list" element={
                <PersonnelListPage 
                    personnelList={personnelList} 
                    trainingItems={trainingItems}
                    jobTitleTags={jobTitleTags}
                    userRole={currentUser.role}
                    onAddPersonnel={handleAddPersonnel}
                    onUpdatePersonnel={handleUpdatePersonnel}
                    onDeletePersonnel={handleDeletePersonnel}
                    onImportPersonnel={handleImportPersonnel}
                />} 
                />
                <Route path="/training-items" element={
                <TrainingItemsPage 
                    items={trainingItems}
                    personnelList={personnelList}
                    workAreaTags={workAreaTags}
                    typeTags={typeTags}
                    chapterTags={chapterTags}
                    jobTitleTags={jobTitleTags}
                    userRole={currentUser.role}
                    onAddItem={handleAddTrainingItem} 
                    onUpdateItem={handleUpdateTrainingItem}
                    onDeleteItem={handleDeleteTrainingItem}
                    onDeleteSelected={handleDeleteSelectedTrainingItems}
                    onDeleteTag={deleteTag}
                    onEditTag={handleEditTag}
                    onImportItems={handleImportTrainingItems}
                    onAssignItemsToPersonnel={handleAssignItemsToPersonnel}
                />} 
                />
                <Route path="/personnel/:personnelId" element={
                <PersonnelDetailPage
                    personnelList={personnelList}
                    trainingItems={trainingItems}
                    jobTitleTags={jobTitleTags}
                    userRole={currentUser.role}
                    onUpdatePersonnel={handleUpdatePersonnel}
                    onUpdateSchedule={handleUpdateSchedule}
                />} 
                />
                <Route path="/user-management" element={
                currentUser.role === 'admin' ? <UserManagementPage /> : <Navigate to="/" />
                } />
            </Routes>
            </main>
        </div>
      )}
    </div>
  );
};

export default App;
