import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TagData, type TagColor, type DailySchedule, type TrainingAssignment } from './types';
import Header from './components/Header';
import PersonnelListPage from './pages/PersonnelListPage';
import TrainingItemsPage from './pages/TrainingItemsPage';
import PersonnelDetailPage from './pages/PersonnelDetailPage';
import AuthPage from './pages/AuthPage';
import UserManagementPage from './pages/UserManagementPage';
import { supabase } from './lib/supabaseClient';

type TagType = 'workArea' | 'type' | 'chapter' | 'job';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Auth Listener
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
      } else {
        setTrainingItems([]);
        setPersonnelList([]);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all data from Supabase
  const fetchData = async (userId: string) => {
    try {
      setLoading(true);

      // 0. Fetch User Role
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setUserRole(profileData.role);
      } else {
        setUserRole('user'); // Default fallback
      }

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
          section: item.section
        }));
        setTrainingItems(mappedItems);
      }

      // 3. Fetch Personnel, Progress, and Schedules
      const { data: peopleData } = await supabase.from('personnel').select('*');
      const { data: progressData } = await supabase.from('training_progress').select('*');
      const { data: scheduleData } = await supabase.from('schedules').select('*');

      if (peopleData) {
        const mappedPersonnel: Personnel[] = peopleData.map((p: any) => {
          // Map Progress
          const myProgress = progressData
            ?.filter((prog: any) => prog.personnel_id === p.id)
            .map((prog: any) => ({
              itemId: prog.item_id,
              completed: prog.completed
            })) || [];

          // Map Schedule: Convert flat rows to { date: [itemIds] }
          const mySchedule: DailySchedule = {};
          scheduleData
            ?.filter((s: any) => s.personnel_id === p.id)
            .forEach((s: any) => {
              if (!mySchedule[s.work_date]) {
                mySchedule[s.work_date] = [];
              }
              mySchedule[s.work_date].push(s.item_id);
            });

          return {
            id: p.id,
            name: p.name,
            gender: p.gender as any,
            dob: p.dob,
            phone: p.phone,
            jobTitle: p.job_title,
            status: p.status as any,
            trainingPlan: myProgress,
            schedule: mySchedule
          };
        });
        setPersonnelList(mappedPersonnel);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Tag Management ---

  const addTag = async (type: TagType, value: string, color: TagColor | 'auto' = 'auto') => {
    if (!value || !value.trim()) return;
    const { tags } = tagStateMap[type];
    
    // Avoid duplicate call if exists locally
    if (tags.some(t => t.value.toLowerCase() === value.toLowerCase())) return;

    let newColor: TagColor;
    if (color !== 'auto') {
        newColor = color;
    } else {
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

    if (!error && session) fetchData(session.user.id);
  };

  const deleteTag = async (type: TagType, value: string) => {
    const tag = tagStateMap[type].tags.find(t => t.value === value);
    if (tag && session) {
      await supabase.from('tags').delete().eq('id', tag.id);
      fetchData(session.user.id);
    }
  };
  
  const handleEditTag = async (
    tagType: TagType,
    tagId: string,
    newName: string,
    newColor: TagColor,
    replacementTagId?: string
  ) => {
    const oldTag = tagStateMap[tagType].tags.find(t => t.id === tagId);
    if (!oldTag) return;

    if (replacementTagId) {
      const replacementTag = tagStateMap[tagType].tags.find(t => t.id === replacementTagId);
      if (!replacementTag) return;

      if (tagType === 'workArea') {
        await supabase.from('training_items').update({ work_area: replacementTag.value }).eq('work_area', oldTag.value);
      } else if (tagType === 'type') {
        await supabase.from('training_items').update({ type_tag: replacementTag.value }).eq('type_tag', oldTag.value);
      } else if (tagType === 'chapter') {
        await supabase.from('training_items').update({ chapter: replacementTag.value }).eq('chapter', oldTag.value);
      } else if (tagType === 'job') {
        await supabase.from('personnel').update({ job_title: replacementTag.value }).eq('job_title', oldTag.value);
      }

      await supabase.from('tags').delete().eq('id', tagId);
    } else {
      await supabase.from('tags').update({ value: newName, color: newColor }).eq('id', tagId);
      
      if (oldTag.value !== newName) {
         if (tagType === 'workArea') {
            await supabase.from('training_items').update({ work_area: newName }).eq('work_area', oldTag.value);
          } else if (tagType === 'type') {
            await supabase.from('training_items').update({ type_tag: newName }).eq('type_tag', oldTag.value);
          } else if (tagType === 'chapter') {
            await supabase.from('training_items').update({ chapter: newName }).eq('chapter', oldTag.value);
          } else if (tagType === 'job') {
            await supabase.from('personnel').update({ job_title: newName }).eq('job_title', oldTag.value);
          }
      }
    }
    if(session) fetchData(session.user.id);
  };

  // --- Training Items Management ---

  const handleAddTrainingItem = async (item: Omit<TrainingItem, 'id'>) => {
    await addTag('workArea', item.workArea);
    await addTag('type', item.typeTag);
    await addTag('chapter', item.chapter);

    const { error } = await supabase.from('training_items').insert({
      id: crypto.randomUUID(),
      name: item.name,
      work_area: item.workArea,
      type_tag: item.typeTag,
      chapter: item.chapter,
      section: item.section
    });

    if (!error && session) fetchData(session.user.id);
  };

  const handleUpdateTrainingItem = async (updatedItem: TrainingItem) => {
    await supabase.from('training_items').update({
      name: updatedItem.name,
      work_area: updatedItem.workArea,
      type_tag: updatedItem.typeTag,
      chapter: updatedItem.chapter,
      section: updatedItem.section
    }).eq('id', updatedItem.id);

    if(session) fetchData(session.user.id);
  };
  
  const handleDeleteTrainingItem = async (id: string) => {
    await supabase.from('training_items').delete().eq('id', id);
    if(session) fetchData(session.user.id);
  };

  const handleDeleteSelectedTrainingItems = async (idsToDelete: Set<string>) => {
    await supabase.from('training_items').delete().in('id', Array.from(idsToDelete));
    if(session) fetchData(session.user.id);
  };

  // --- Personnel Management ---

  const handleAddPersonnel = async (person: Omit<Personnel, 'id' | 'trainingPlan' | 'status' | 'schedule'>) => {
    await addTag('job', person.jobTitle);
    
    const { error } = await supabase.from('personnel').insert({
      id: crypto.randomUUID(),
      name: person.name,
      gender: person.gender,
      dob: person.dob,
      phone: person.phone,
      job_title: person.jobTitle,
      status: '在職'
    });
    
    if (!error && session) fetchData(session.user.id);
  };

  const handleUpdatePersonnel = async (updatedPersonnel: Personnel) => {
    await supabase.from('personnel').update({
      name: updatedPersonnel.name,
      gender: updatedPersonnel.gender,
      dob: updatedPersonnel.dob,
      phone: updatedPersonnel.phone,
      job_title: updatedPersonnel.jobTitle,
      status: updatedPersonnel.status
    }).eq('id', updatedPersonnel.id);

    const progressUpdates = updatedPersonnel.trainingPlan.map(plan => ({
        personnel_id: updatedPersonnel.id,
        item_id: plan.itemId,
        completed: plan.completed
    }));
    
    if (progressUpdates.length > 0) {
        await supabase.from('training_progress').upsert(progressUpdates);
    }

    if(session) fetchData(session.user.id);
  };

  const handleDeletePersonnel = async (id: string) => {
    await supabase.from('personnel').delete().eq('id', id);
    if(session) fetchData(session.user.id);
  };

  const handleAssignItemsToPersonnel = async (itemIds: Set<string>, personnelIds: Set<string>) => {
    const inserts: any[] = [];
    personnelIds.forEach(pId => {
        itemIds.forEach(itemId => {
            inserts.push({
                personnel_id: pId,
                item_id: itemId,
                completed: false
            });
        });
    });

    if (inserts.length > 0) {
        await supabase.from('training_progress').upsert(inserts, { onConflict: 'personnel_id, item_id', ignoreDuplicates: true });
    }
    if(session) fetchData(session.user.id);
  };
  
  const handleUpdateSchedule = async (personnelId: string, schedule: DailySchedule) => {
    await supabase.from('schedules').delete().eq('personnel_id', personnelId);

    const inserts: any[] = [];
    Object.entries(schedule).forEach(([date, itemIds]) => {
        itemIds.forEach(itemId => {
            inserts.push({
                personnel_id: personnelId,
                item_id: itemId,
                work_date: date
            });
        });
    });

    if (inserts.length > 0) {
        await supabase.from('schedules').insert(inserts);
    }
    if(session) fetchData(session.user.id);
  };

  // Updated to accept 2D array from Importer
  const handleImportTrainingItems = async (rows: any[][]) => {
    const newItems = [];
    
    for (const row of rows) {
      try {
        if (!Array.isArray(row) || row.length < 5) continue;
        const [name, workArea, typeTag, chapter, section] = row.map(c => String(c || '').trim());
        
        if (name && workArea && typeTag && chapter && section) {
           await addTag('workArea', workArea, 'red');
           await addTag('type', typeTag, 'red');
           await addTag('chapter', chapter, 'red');
           
           newItems.push({
             id: crypto.randomUUID(),
             name,
             work_area: workArea,
             type_tag: typeTag,
             chapter,
             section
           });
        }
      } catch (e) { console.error(e); }
    }

    if (newItems.length > 0) {
        await supabase.from('training_items').insert(newItems);
        if(session) fetchData(session.user.id);
    }
  };

  // Updated to accept 2D array from Importer
  const handleImportPersonnel = async (rows: any[][]) => {
    const newPeople = [];

    for (const row of rows) {
      try {
        if (!Array.isArray(row) || row.length < 5) continue;
        const [name, genderStr, dob, phone, jobTitle] = row.map(c => String(c || '').trim());
        
        if (name && dob && phone && jobTitle) {
            await addTag('job', jobTitle, 'red');
            newPeople.push({
                id: crypto.randomUUID(),
                name,
                gender: genderStr,
                dob,
                phone,
                job_title: jobTitle,
                status: '在職'
            });
        }
      } catch (e) { console.error(e); }
    }
    
    if (newPeople.length > 0) {
        await supabase.from('personnel').insert(newPeople);
        if(session) fetchData(session.user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-center">
        <div className="text-sky-600 text-xl font-semibold flex items-center gap-2">
           <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            資料讀取中...
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header userEmail={session.user.email} userRole={userRole} />
      <main>
        <Routes>
          <Route path="/" element={
            <PersonnelListPage 
              personnelList={personnelList} 
              trainingItems={trainingItems}
              jobTitleTags={jobTitleTags}
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
              onUpdatePersonnel={handleUpdatePersonnel}
              onUpdateSchedule={handleUpdateSchedule}
            />} 
          />
          <Route path="/user-management" element={
             userRole === 'admin' ? <UserManagementPage /> : <Navigate to="/" />
          } />
        </Routes>
      </main>
    </div>
  );
};

export default App;