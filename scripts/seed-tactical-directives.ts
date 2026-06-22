/**
 * Tactical Directives Seeder (TypeScript)
 * -------------------------------------------------------------
 * Injects initial/sample active tactical and rapid response directives
 * into the Supabase database for development and testing.
 */

import 'dotenv/config'
import type { RapidResponseDirective } from '../src/types/admin'

// Mock import.meta.env for Node compatibility
const globalWithImport = globalThis as unknown as {
  import?: {
    meta: {
      env: Record<string, string | undefined>
    }
  }
}

if (typeof globalWithImport['import'] === 'undefined') {
  globalWithImport['import'] = {
    meta: {
      env: {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      },
    },
  }
}

import { intelligenceService } from '../src/services/intelligenceService'

// Asynchronously injects defined sample directives into the database
async function seedDirectives() {
  console.log('🚀 [SEED] Initializing Tactical Directive Injection...')

  const adminId = '5b7dd2c1-1307-41bb-845c-92b193220f79' // HQ System Admin

  const directives: Omit<RapidResponseDirective, 'id' | 'created_at'>[] = [
    {
      title: 'Operation "Industrial Seed"',
      description:
        'Coordinate with local artisans in Kumasi to identify space for the first youth industrial hub. Document potential for metal fabrication and woodwork.',
      priority: 'HIGH',
      target_region: 'Ashanti',
      action_type: 'FIELD_SURVEY',
      status: 'ACTIVE',
      created_by: adminId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Youth Agricultural Vanguard',
      description:
        'Mobilize 50 volunteers for the Bono East maize cooperative harvest logistics. Ensure all transport assets are geofenced.',
      priority: 'CRITICAL',
      target_region: 'Bono East',
      action_type: 'SUPPLY_RUN',
      status: 'ACTIVE',
      created_by: adminId,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Diaspora Knowledge Bridge',
      description:
        'Host a digital summit for Diaspora members to mentor local Chapter leads on project management and community organization.',
      priority: 'ELEVATED',
      target_region: 'NATIONAL',
      action_type: 'DIGITAL_STRIKE',
      status: 'ACTIVE',
      created_by: adminId,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  for (const directive of directives) {
    const success = await intelligenceService.createRapidResponseDirective(directive)
    if (success) {
      console.log(`✅ [SEED] Injected: ${directive.title}`)
    } else {
      console.error(`❌ [SEED] Failed: ${directive.title}`)
    }
  }

  console.log('🏁 [SEED] Tactical seeding complete.')
}

seedDirectives().catch(console.error)
