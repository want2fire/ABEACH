
import { createClient } from '@supabase/supabase-js';

// 這是您提供的 Supabase URL
const supabaseUrl = 'https://hifevpmciaxhyhyowjyj.supabase.co';

// 請將您的 Supabase Anon Key (Public) 貼在下方引號中
// 如果您已設定環境變數，程式會優先讀取 process.env.SUPABASE_KEY
const supabaseKey = process.env.SUPABASE_KEY || '您的_SUPABASE_ANON_KEY_貼在這裡';

if (!supabaseKey || supabaseKey === '您的_SUPABASE_ANON_KEY_貼在這裡') {
  console.warn('Supabase Key 尚未設定。請在 lib/supabaseClient.ts 中填入 Key 以確保功能正常運作。');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
