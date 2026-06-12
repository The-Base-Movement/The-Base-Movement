import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration in .env')
  process.exit(1)
}

async function updateCampaign(title, imageUrl) {
  const url = `${supabaseUrl}/rest/v1/donation_campaigns?title=eq.${encodeURIComponent(title)}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ image_url: imageUrl })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Failed to update campaign "${title}":`, errorText)
  } else {
    const data = await response.json()
    console.log(`Successfully updated campaign "${title}" with image "${imageUrl}".`, data)
  }
}

async function run() {
  console.log('Updating legacy Unsplash images in the database with local priorities illustration paths...')
  await updateCampaign('2026 Election Mobilization', '/priorities/ghana_network_map.png')
  await updateCampaign('Digital Infrastructure Fund', '/priorities/digital_economy_illustration.png')
  await updateCampaign('National Headquarters Renovation', '/priorities/agro_processing_illustration.png')
  await updateCampaign('2025 Regional Youth Outreach', '/priorities/ghana_network_map.png')
  console.log('Database updates finished.')
}

run().catch(console.error)
