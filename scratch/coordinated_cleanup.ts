
import 'dotenv/config';
import { supabase } from '../src/lib/supabase';

async function performCleanup() {
  console.log('--- STARTING FINAL AUDITED CLEANUP ---');
  
  // Specific duplicate IDs verified via direct API GET
  const targetIds = [
    '9d4a9154-7f1b-4b40-bfc9-d414a0bbe6cb', // Official TBM Cap duplicate
    '3bf75824-c15f-4a9c-b03d-1909156b5d3b'  // Movement Polo Shirt duplicate
  ];

  for (const id of targetIds) {
    console.log(`Auditing ID: ${id}`);
    
    // Check if it exists and is not deleted
    const { data: existing } = await supabase
      .from('store_inventory')
      .select('name')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      console.log(`Found active duplicate: ${existing.name}. Trashing...`);
      const { error } = await supabase
        .from('store_inventory')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) console.error(`Failed to trash ${id}:`, error);
      else console.log(`Successfully trashed ${id}`);
    } else {
      console.log(`ID ${id} is already trashed or does not exist.`);
    }
  }
  
  console.log('--- CLEANUP COMPLETE ---');
}

performCleanup();
