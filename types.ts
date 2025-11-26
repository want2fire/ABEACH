
export type TagColor = 'slate' | 'sky' | 'green' | 'amber' | 'red' | 'indigo' | 'pink' | 'purple';

export interface TagData {
  id: string;
  value: string;
  color: TagColor | string; // Support custom color strings
  category?: string; // To distinguish between different tag types in DB
}

// SOP Block Types - Added 'richtext' for Word-like editor
export type BlockType = 'text' | 'heading-1' | 'heading-2' | 'heading-3' | 'bullet-list' | 'number-list' | 'image' | 'video' | 'callout' | 'divider' | 'table' | 'pdf' | 'toggle' | 'richtext';

export interface SOPBlock {
  id: string;
  type: BlockType;
  content: string; // Text content or URL, or JSON string for table
  props?: {
    color?: string; // Text color or background color for callouts
    align?: 'left' | 'center' | 'right';
    caption?: string;
    details?: string; // For toggle block hidden content
    fontFamily?: string; // Font family for the block
  };
}

export interface TrainingItem {
  id: string;
  name: string;
  workArea: string; 
  typeTag: string;  
  chapter: string;
  content?: SOPBlock[]; // JSONB content for SOP
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
export type Station = '全體' | '內場' | '吧台' | '外場';
export type CycleType = string; // Changed to string to support "weekly:1,2,3" format

export interface Personnel {
  id:string;
  name: string;
  gender: '男性' | '女性' | '其他';
  dob: string; // "YYYY-MM-DD"
  phone: string;
  jobTitle: JobTitle | string;
  station: Station | string; // New field for Work Station
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

export interface Announcement {
  id: string;
  title: string;
  content: SOPBlock[];
  cycle_type: CycleType;
  category: string; // Activity type (Wedding, etc.)
  target_roles: string[];
  target_stations: string[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AnnouncementRead {
    announcement_id: string;
    personnel_id: string;
    read_at: string;
    personnel_name?: string; // For display
    is_confirmed?: boolean;
    confirmed_by?: string;
    confirmed_at?: string;
}