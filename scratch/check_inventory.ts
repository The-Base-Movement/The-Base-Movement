
import { supabase } from '../src/lib/supabase';

async function checkInventory() {
  const { data, error } = await supabase
    .from('store_inventory')
    .select('id, name, deleted_at')
    .is('deleted_at', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total active items: ${data.length}`);
  
  const counts: Record<string, number> = {};
  data.forEach(item => {
    counts[item.name] = (counts[item.name] || 0) + 1;
  });

  const duplicates = Object.entries(counts).filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log('Duplicates found:');
    duplicates.forEach(([name, count]) => {
      console.log(`- ${name}: ${count} times`);
      const itemIds = data.filter(i => i.name === name).map(i => i.id);
      console.log(`  IDs: ${itemIds.join(', ')}`);
    });
  } else {
    console.log('No duplicates found.');
  }
}

checkInventory();
