const { loadEnv } = require('vite');
const path = require('path');

async function testFetch() {
  const env = loadEnv('production', process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'PRESENT' : 'MISSING');

  if (supabaseUrl && supabaseKey) {
    // Fetch Product Slugs
    const productResponse = await fetch(`${supabaseUrl}/rest/v1/store_products?select=slug`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const products = await productResponse.json();
    console.log('Products:', products);
  }
}

testFetch();
