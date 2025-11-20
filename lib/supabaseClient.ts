
import { createClient } from '@supabase/supabase-js';

// 這是您提供的 Supabase URL
const supabaseUrl = 'https://hifevpmciaxhyhyowjyj.supabase.co';

// 這是您提供的正確 Supabase Anon Key (JWT)
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZmV2cG1jaWF4aHloeW93anlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODk4MzcsImV4cCI6MjA3ODA2NTgzN30.yaTPV6r7CYBHEsojRmLkkFzu4AM2mF4qWR3pkY6GAZU';

export const supabase = createClient(supabaseUrl, supabaseKey);
