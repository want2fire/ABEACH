import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { type Personnel, type TrainingItem, type TagData, type TagColor, type DailySchedule, type TrainingAssignment } from './types';
import Header from './components/Header';
import PersonnelListPage from './pages/PersonnelListPage';
import TrainingItemsPage from './pages/TrainingItemsPage';
import PersonnelDetailPage from './pages/PersonnelDetailPage';

// Mock Tag Data
const initialWorkAreaTags: TagData[] = [
  { id: 'wa1', value: '通用', color: 'slate' },
  { id: 'wa2', value: '外場', color: 'sky' },
  { id: 'wa3', value: '內場', color: 'red' },
  { id: 'wa4', value: '吧台', color: 'amber' },
];
const initialTypeTags: TagData[] = [
    { id: 'tt1', value: '工作流程', color: 'indigo'},
    { id: 'tt2', value: '設備操作', color: 'purple'},
];
const initialChapterTags: TagData[] = [
    { id: 'ch1', value: 'CH1', color: 'green'},
    { id: 'ch2', value: 'CH2', color: 'green'},
    { id: 'ch3', value: 'CH3', color: 'green'},
];
const initialJobTitleTags: TagData[] = [
    { id: 'jt1', value: '內場正職', color: 'sky' },
    { id: 'jt2', value: '假日PT', color: 'pink' },
];

// Mock Data
const initialTrainingItems: TrainingItem[] = [
  { id: 't1', name: '基礎清潔與衛生', workArea: '通用', typeTag: '工作流程', chapter: 'CH1', section: '1' },
  { id: 't2', name: '菜單介紹與點餐', workArea: '外場', typeTag: '工作流程', chapter: 'CH1', section: '2' },
  { id: 't3', name: 'POS機操作', workArea: '外場', typeTag: '設備操作', chapter: 'CH1', section: '3' },
  { id: 't4', name: '食材前置處理', workArea: '內場', typeTag: '工作流程', chapter: 'CH2', section: '1' },
  { id: 't5', name: '基本刀工', workArea: '內場', typeTag: '工作流程', chapter: 'CH2', section: '2' },
  { id: 't6', name: '義式咖啡機操作', workArea: '吧台', typeTag: '設備操作', chapter: 'CH3', section: '1' },
  { id: 't7', name: '拉花技巧', workArea: '吧台', typeTag: '設備操作', chapter: 'CH3', section: '2' },
];

const initialPersonnel: Personnel[] = [
  {
    id: 'p1', name: '陳小明', gender: '男性', dob: '2000-05-15', phone: '0912-345-678', jobTitle: '內場正職',
    trainingPlan: [ { itemId: 't1', completed: true }, { itemId: 't4', completed: true }, { itemId: 't5', completed: false } ],
    status: '在職',
    schedule: { '2024-07-25': ['t5'] }
  },
  {
    id: 'p2', name: '林美麗', gender: '女性', dob: '2002-11-20', phone: '0987-654-321', jobTitle: '假日PT',
    trainingPlan: [ { itemId: 't1', completed: true }, { itemId: 't2', completed: false }, { itemId: 't3', completed: false }, { itemId: 't6', completed: false } ],
    status: '在職',
    schedule: {}
  },
];

type TagType = 'workArea' | 'type' | 'chapter' | 'job';

const App: React.FC = () => {
  const [trainingItems, setTrainingItems] = useState<TrainingItem[]>(initialTrainingItems);
  const [personnelList, setPersonnelList] = useState<Personnel[]>(initialPersonnel);

  // Centralized Tag State with colors
  const [workAreaTags, setWorkAreaTags] = useState<TagData[]>(initialWorkAreaTags);
  const [typeTags, setTypeTags] = useState<TagData[]>(initialTypeTags);
  const [chapterTags, setChapterTags] = useState<TagData[]>(initialChapterTags);
  const [jobTitleTags, setJobTitleTags] = useState<TagData[]>(initialJobTitleTags);
  
  const tagStateMap = {
    workArea: { tags: workAreaTags, setTags: setWorkAreaTags },
    type: { tags: typeTags, setTags: setTypeTags },
    chapter: { tags: chapterTags, setTags: setChapterTags },
    job: { tags: jobTitleTags, setTags: setJobTitleTags },
  };

  const addTag = (type: TagType, value: string, color: TagColor | 'auto' = 'auto') => {
    if (!value.trim()) return;
    const { tags, setTags } = tagStateMap[type];
    if (!tags.some(t => t.value.toLowerCase() === value.toLowerCase())) {
        let newColor: TagColor;
        if (color !== 'auto') {
            newColor = color;
        } else {
            const availableColors: TagColor[] = ['sky', 'green', 'amber', 'indigo', 'pink', 'purple', 'slate'];
            newColor = availableColors[tags.length % availableColors.length];
        }
        const newTag: TagData = { id: `${type}-${Date.now()}`, value, color: newColor };
        setTags(prev => [...prev, newTag].sort((a,b) => a.value.localeCompare(b.value)));
    }
  };

  const deleteTag = (type: TagType, value: string) => {
    const { setTags } = tagStateMap[type];
    setTags(prev => prev.filter(t => t.value !== value));
  };
  
  const handleEditTag = (
    tagType: TagType,
    tagId: string,
    newName: string,
    newColor: TagColor,
    replacementTagId?: string
  ) => {
    const { tags, setTags } = tagStateMap[tagType];
    const oldTag = tags.find(t => t.id === tagId);
    if (!oldTag) return;

    // Handle Replacement/Merge
    if (replacementTagId) {
        const replacementTag = tags.find(t => t.id === replacementTagId);
        if (!replacementTag) return;

        if (tagType === 'workArea' || tagType === 'type' || tagType === 'chapter') {
            const field = tagType === 'workArea' ? 'workArea' : tagType === 'type' ? 'typeTag' : 'chapter';
            setTrainingItems(prev => prev.map(item => item[field] === oldTag.value ? {...item, [field]: replacementTag.value} : item));
        } else if (tagType === 'job') {
            setPersonnelList(prev => prev.map(p => p.jobTitle === oldTag.value ? {...p, jobTitle: replacementTag.value} : p));
        }
        setTags(prev => prev.filter(t => t.id !== tagId)); // Delete old tag
        return;
    }

    // Handle Rename & Recolor
    if (oldTag.value !== newName) { // If name changed, update all items
        if (tagType === 'workArea' || tagType === 'type' || tagType === 'chapter') {
            const field = tagType === 'workArea' ? 'workArea' : tagType === 'type' ? 'typeTag' : 'chapter';
            setTrainingItems(prev => prev.map(item => item[field] === oldTag.value ? {...item, [field]: newName} : item));
        } else if (tagType === 'job') {
             setPersonnelList(prev => prev.map(p => p.jobTitle === oldTag.value ? {...p, jobTitle: newName} : p));
        }
    }
    setTags(prev => prev.map(t => t.id === tagId ? {...t, value: newName, color: newColor} : t));
  };


  const handleAddTrainingItem = (item: Omit<TrainingItem, 'id'>) => {
    addTag('workArea', item.workArea);
    addTag('type', item.typeTag);
    addTag('chapter', item.chapter);
    const newItem: TrainingItem = { ...item, id: `t${Date.now()}` };
    setTrainingItems(prev => [...prev, newItem]);
  };

  const handleUpdateTrainingItem = (updatedItem: TrainingItem) => {
    addTag('workArea', updatedItem.workArea);
    addTag('type', updatedItem.typeTag);
    addTag('chapter', updatedItem.chapter);
    setTrainingItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
  };
  
  const handleDeleteTrainingItem = (id: string) => {
    setTrainingItems(prev => prev.filter(item => item.id !== id));
    setPersonnelList(prev => prev.map(person => ({ ...person, trainingPlan: person.trainingPlan.filter(plan => plan.itemId !== id) })));
  };

  const handleDeleteSelectedTrainingItems = (idsToDelete: Set<string>) => {
    setTrainingItems(prev => prev.filter(item => !idsToDelete.has(item.id)));
    setPersonnelList(prev => prev.map(person => ({ ...person, trainingPlan: person.trainingPlan.filter(plan => !idsToDelete.has(plan.itemId)) })));
  };

  const handleAddPersonnel = (person: Omit<Personnel, 'id' | 'trainingPlan' | 'status' | 'schedule'>) => {
    addTag('job', person.jobTitle);
    const newPerson: Personnel = { ...person, id: `p${Date.now()}`, trainingPlan: [], status: '在職', schedule: {} };
    setPersonnelList(prev => [...prev, newPerson]);
  };

  const handleUpdatePersonnel = (updatedPersonnel: Personnel) => {
    addTag('job', updatedPersonnel.jobTitle);
    setPersonnelList(prev => prev.map(p => p.id === updatedPersonnel.id ? updatedPersonnel : p));
  };

  const handleDeletePersonnel = (id: string) => {
    setPersonnelList(prev => prev.filter(person => person.id !== id));
  };

  const handleAssignItemsToPersonnel = (itemIds: Set<string>, personnelIds: Set<string>) => {
    setPersonnelList(prevList =>
      prevList.map(person => {
        if (personnelIds.has(person.id)) {
          const newItems = Array.from(itemIds)
            .filter(itemId => !person.trainingPlan.some(p => p.itemId === itemId))
            .map(itemId => ({ itemId, completed: false } as TrainingAssignment));
          
          if (newItems.length > 0) {
            return { ...person, trainingPlan: [...person.trainingPlan, ...newItems] };
          }
        }
        return person;
      })
    );
  };
  
  const handleUpdateSchedule = (personnelId: string, schedule: DailySchedule) => {
    setPersonnelList(prev => prev.map(p => p.id === personnelId ? { ...p, schedule } : p));
  };

  const handleImportTrainingItems = (pastedData: string) => {
    const rows = pastedData.trim().replace(/\r/g, "").split('\n');
    const newItems: TrainingItem[] = [];
    rows.forEach((rowStr, index) => {
      try {
        const row = rowStr.split('\t').map(cell => cell.trim());
        if (row.length < 5) throw new Error("Incorrect number of columns.");

        const [name, workArea, typeTag, chapter, section] = row;
        if (name && workArea && typeTag && chapter && section) {
            const newItem: TrainingItem = { 
                id: `t${Date.now()}-${index}`, 
                name, 
                workArea, 
                typeTag, 
                chapter, 
                section 
            };
            newItems.push(newItem);
            addTag('workArea', workArea, 'red');
            addTag('type', typeTag, 'red');
            addTag('chapter', chapter, 'red');
        } else {
           throw new Error("One or more required fields are empty.");
        }
      } catch (error) {
        console.error(`Skipping invalid row ${index + 1} during training item import:`, rowStr, error);
      }
    });
    setTrainingItems(prev => [...prev, ...newItems]);
  };

  const handleImportPersonnel = (pastedData: string) => {
    const rows = pastedData.trim().replace(/\r/g, "").split('\n');
    const newPersonnelList: Personnel[] = [];
    rows.forEach((rowStr, index) => {
      try {
        const row = rowStr.split('\t').map(cell => cell.trim());
        if (row.length < 5) throw new Error("Incorrect number of columns.");
        
        const [name, genderStr, dob, phone, jobTitle] = row;
        const gender: Personnel['gender'] = genderStr === '女性' ? '女性' : genderStr === '其他' ? '其他' : '男性';
        if (name && dob && phone && jobTitle) {
            const newPerson: Personnel = {
                id: `p${Date.now()}-${index}`,
                name,
                gender,
                dob,
                phone,
                jobTitle,
                trainingPlan: [],
                status: '在職',
                schedule: {}
            };
            newPersonnelList.push(newPerson);
            addTag('job', jobTitle, 'red');
        } else {
            throw new Error("One or more required fields are empty.");
        }
      } catch (error) {
         console.error(`Skipping invalid row ${index + 1} during personnel import:`, rowStr, error);
      }
    });
    setPersonnelList(prev => [...prev, ...newPersonnelList]);
  };

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