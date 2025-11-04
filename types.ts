export type TagColor = 'slate' | 'sky' | 'green' | 'amber' | 'red' | 'indigo' | 'pink' | 'purple';

export interface TagData {
  id: string;
  value: string;
  color: TagColor;
}

export interface TrainingItem {
  id: string;
  name: string;
  workArea: string; // Renamed from typeTag
  typeTag: string;  // New field
  chapter: string;
  section: string;
}

export interface TrainingAssignment {
  itemId: string;
  completed: boolean;
}

export interface DailySchedule {
  [date: string]: string[]; // Key is "YYYY-MM-DD", value is array of TrainingItem IDs
}

export interface Personnel {
  id:string;
  name: string;
  gender: '男性' | '女性' | '其他';
  dob: string; // "YYYY-MM-DD"
  phone: string;
  jobTitle: string;
  trainingPlan: TrainingAssignment[];
  status: '在職' | '支援' | '離職';
  schedule: DailySchedule;
}