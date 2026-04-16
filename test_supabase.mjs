import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('saved_trips').select('*').limit(1);
  if (error) {
    console.error("Error fetching saved_trips:", error);
    
    // Maybe the table is named 'trips'?
    const try2 = await supabase.from('trips').select('*').limit(1);
    if(try2.error) console.error("Error fetching trips:", try2.error);
    else console.log("trips table works!", try2.data);
  } else {
    console.log("saved_trips table exists!", data);
  }
}
test();
