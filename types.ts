
export type TagColor = string;

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
}

export interface TrainingAssignment {
  itemId: string;
  completed: boolean;
}

export interface DailySchedule {
  [date: string]: string[]; // Key is "YYYY-MM-DD", value is array of TrainingItem IDs
}

export type JobTitle = '外場DUTY' | '內場DUTY' | 'A TEAM' | '管理員' | '一般員工';
export type UserRole = 'admin' | 'duty' | 'user';

export interface Personnel {
  id:string;
  name: string;
  gender: '男性' | '女性' | '其他';
  dob: string; // "YYYY-MM-DD"
  phone: string;
  jobTitle: JobTitle | string;
  trainingPlan: TrainingAssignment[];
  status: '在職' | '支援' | '離職';
  schedule: DailySchedule;
  access_code: string; // Login password (ID last 4 digits)
  role: UserRole; // Permission level
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}
