import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://osfsyyzujhejvjuupeuu.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZnN5eXp1amhlanZqdXVwZXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjEzNTQsImV4cCI6MjA5MTkzNzM1NH0.gcI1JmHt3ClawDoh8gVlMeP8iJkYbIQoda9XBOtgBGs';

// Safely initialize to prevent crash if credentials are empty/invalid during build
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
