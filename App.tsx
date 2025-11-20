
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TagData, type TagColor, type DailySchedule, type TrainingAssignment } from './types';
import Header from './components/Header';
import PersonnelListPage from './pages/PersonnelListPage';
import TrainingItemsPage from './pages/TrainingItemsPage';
import PersonnelDetailPage from './pages/PersonnelDetailPage';
import { supabase } from './lib/supabaseClient';

type TagType = 'workArea' | 'type' | 'chapter' | 'job';

const App: React.FC = () => {
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

  // Fetch all data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

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
      alert('讀取資料失敗，請檢查連線設定');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Tag Management ---

  const addTag = async (type: TagType, value: string, color: TagColor | 'auto' = 'auto') => {
    if (!value.trim()) return;
    const { tags } = tagStateMap[type];
    
    // Avoid duplicate call if exists locally, but best to rely on DB unique constraint or check
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

    if (!error) fetchData();
  };

  const deleteTag = async (type: TagType, value: string) => {
    // Find tag ID by value (since we pass value from UI)
    const tag = tagStateMap[type].tags.find(t => t.value === value);
    if (tag) {
      await supabase.from('tags').delete().eq('id', tag.id);
      fetchData();
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
      // 1. Update references in other tables
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

      // 2. Delete the old tag
      await supabase.from('tags').delete().eq('id', tagId);
    } else {
      // Just update the tag
      await supabase.from('tags').update({ value: newName, color: newColor }).eq('id', tagId);
      
      // Also update denormalized references if name changed
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
    fetchData();
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

    if (!error) fetchData();
  };

  const handleUpdateTrainingItem = async (updatedItem: TrainingItem) => {
    // Tags might need updating if changed, simplified here to just update item
    // (In a real app, we'd check if new tags need creation)
    await supabase.from('training_items').update({
      name: updatedItem.name,
      work_area: updatedItem.workArea,
      type_tag: updatedItem.typeTag,
      chapter: updatedItem.chapter,
      section: updatedItem.section
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
    
    if (!error) fetchData();
  };

  const handleUpdatePersonnel = async (updatedPersonnel: Personnel) => {
    // 1. Update Basic Info
    await supabase.from('personnel').update({
      name: updatedPersonnel.name,
      gender: updatedPersonnel.gender,
      dob: updatedPersonnel.dob,
      phone: updatedPersonnel.phone,
      job_title: updatedPersonnel.jobTitle,
      status: updatedPersonnel.status
    }).eq('id', updatedPersonnel.id);

    // 2. Update Training Plan (Progress)
    // This is tricky because the UI passes the entire object. 
    // We need to upsert the assignments.
    const progressUpdates = updatedPersonnel.trainingPlan.map(plan => ({
        personnel_id: updatedPersonnel.id,
        item_id: plan.itemId,
        completed: plan.completed
    }));
    
    if (progressUpdates.length > 0) {
        await supabase.from('training_progress').upsert(progressUpdates);
    }

    // Note: Schedule is handled separately or implicitly if passed here, 
    // but typically onUpdatePersonnel is called for status/info/progress.
    // We will refactor onUpdateSchedule separately.

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
            // Check if already exists? Supabase insert can "ignore" on conflict if we set it up, 
            // OR we can just rely on the fact that we only select unassigned ones in UI logic (but UI logic is client side).
            // Let's insert with ON CONFLICT DO NOTHING logic via upsert or checking first.
            // Simple approach: insert, if error (duplicate), ignore.
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
    fetchData();
  };
  
  const handleUpdateSchedule = async (personnelId: string, schedule: DailySchedule) => {
    // Full replacement strategy for schedule is easiest:
    // 1. Delete all future schedules for this person? Or just delete all and re-insert?
    // To be safe, let's delete all schedules for this person and re-insert based on the new object.
    // This matches the "Save" behavior of the component.
    
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
    fetchData();
  };

  const handleImportTrainingItems = async (pastedData: string) => {
    const rows = pastedData.trim().replace(/\r/g, "").split('\n');
    const newItems = [];
    
    for (const rowStr of rows) {
      try {
        const row = rowStr.split('\t').map(cell => cell.trim());
        if (row.length < 5) continue;
        const [name, workArea, typeTag, chapter, section] = row;
        
        if (name && workArea && typeTag && chapter && section) {
           // Ensure tags exist
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
        fetchData();
    }
  };

  const handleImportPersonnel = async (pastedData: string) => {
    const rows = pastedData.trim().replace(/\r/g, "").split('\n');
    const newPeople = [];

    for (const rowStr of rows) {
      try {
        const row = rowStr.split('\t').map(cell => cell.trim());
        if (row.length < 5) continue;
        const [name, genderStr, dob, phone, jobTitle] = row;
        
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
        fetchData();
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

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
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
        </Routes>
      </main>
    </div>
  );
};

export default App;
