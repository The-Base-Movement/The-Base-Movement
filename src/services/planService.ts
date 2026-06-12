import { supabase } from '@/lib/supabase'
import { auditService } from './auditService'
import { agendaPillars, type AgendaPillar, type AgendaObjective } from '@/pages/ouragenda/agendaData'

class PlanService {
  private static instance: PlanService

  private constructor() {}

  public static getInstance(): PlanService {
    if (!PlanService.instance) {
      PlanService.instance = new PlanService()
    }
    return PlanService.instance
  }

  /**
   * Fetches all plan pillars from the database, sorted by sort_order.
   * If the table is empty, it automatically attempts to seed it with the default pillars.
   * If there is an error or connectivity issue, it gracefully returns the static local defaults.
   */
  async getPlanPillars(): Promise<AgendaPillar[]> {
    try {
      const { data, error } = await supabase
        .from('plan_pillars')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        // Fall back if table doesn't exist yet or other query error
        console.warn('[PLAN_SERVICE] DB fetch failed, falling back to static defaults:', error.message)
        return agendaPillars
      }

      if (!data || data.length === 0) {
        // Table is empty, attempt to seed it automatically
        console.warn('[PLAN_SERVICE] Database table is empty. Performing automatic seeding…')
        const seeded = await this.seedDefaultPillars()
        if (seeded) {
          return this.getPlanPillars()
        }
        return agendaPillars
      }

      // Map DB schema keys to the frontend AgendaPillar model keys
      return data.map((row: { id: string; pillar_number: string; title: string; icon: string; color: string; summary: string; objectives: unknown }) => ({
        id: row.id,
        number: row.pillar_number,
        title: row.title,
        icon: row.icon,
        color: row.color,
        summary: row.summary,
        objectives: Array.isArray(row.objectives) ? (row.objectives as unknown as AgendaObjective[]) : [],
      }))
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[PLAN_SERVICE] Unexpected error during getPlanPillars:', errMsg)
      return agendaPillars
    }
  }

  /**
   * Saves (inserts or updates) a single plan pillar in the database.
   * Automatically logs an audit log entry for the action.
   */
  async savePlanPillar(pillar: AgendaPillar, sortOrder?: number): Promise<boolean> {
    try {
      const dbRow: Record<string, unknown> = {
        id: pillar.id,
        pillar_number: pillar.number,
        title: pillar.title,
        icon: pillar.icon,
        color: pillar.color,
        summary: pillar.summary,
        objectives: pillar.objectives,
        updated_at: new Date().toISOString(),
      }

      if (sortOrder !== undefined) {
        dbRow.sort_order = sortOrder
      }

      const { error } = await supabase
        .from('plan_pillars')
        .upsert(dbRow, { onConflict: 'id' })

      if (error) throw error

      await auditService.logAction(
        `Saved Plan Pillar: ${pillar.title}`,
        'MISSION_PLAN',
        'Success',
        { pillar_id: pillar.id }
      )
      return true
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[PLAN_SERVICE] Failed to save plan pillar:', errMsg)
      await auditService.logAction(
        `Failed to Save Plan Pillar: ${pillar.title}`,
        'MISSION_PLAN',
        'Failure',
        { error: errMsg, pillar_id: pillar.id }
      )
      return false
    }
  }

  /**
   * Updates the sorting order of all pillars in bulk.
   */
  async updatePillarsOrder(orderedPillars: { id: string; sort_order: number }[]): Promise<boolean> {
    try {
      // Execute upsert updates for each pillar sort_order
      const promises = orderedPillars.map(item =>
        supabase
          .from('plan_pillars')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      )

      const results = await Promise.all(promises)
      const failed = results.find(r => r.error)
      if (failed) throw failed.error

      await auditService.logAction(
        'Updated Plan Pillars Order',
        'MISSION_PLAN',
        'Success',
        { order: orderedPillars }
      )
      return true
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[PLAN_SERVICE] Failed to update pillars order:', errMsg)
      await auditService.logAction(
        'Failed to Update Plan Pillars Order',
        'MISSION_PLAN',
        'Failure',
        { error: errMsg }
      )
      return false
    }
  }

  /**
   * Deletes a plan pillar from the database.
   */
  async deletePlanPillar(id: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('plan_pillars')
        .delete()
        .eq('id', id)

      if (error) throw error

      await auditService.logAction(
        `Deleted Plan Pillar: ${title}`,
        'MISSION_PLAN',
        'Success',
        { pillar_id: id }
      )
      return true
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[PLAN_SERVICE] Failed to delete plan pillar:', errMsg)
      await auditService.logAction(
        `Failed to Delete Plan Pillar: ${title}`,
        'MISSION_PLAN',
        'Failure',
        { error: errMsg, pillar_id: id }
      )
      return false
    }
  }

  /**
   * Seeds the database with the default pillars from agendaData.ts.
   */
  async seedDefaultPillars(): Promise<boolean> {
    try {
      const rows = agendaPillars.map((p, index) => ({
        id: p.id,
        pillar_number: p.number,
        title: p.title,
        icon: p.icon,
        color: p.color,
        summary: p.summary,
        objectives: p.objectives,
        sort_order: index + 1,
      }))

      const { error } = await supabase
        .from('plan_pillars')
        .upsert(rows, { onConflict: 'id' })

      if (error) {
        console.error('[PLAN_SERVICE] Failed to seed default pillars in DB:', error.message)
        return false
      }

      console.warn('[PLAN_SERVICE] Default pillars successfully seeded into database!')
      await auditService.logAction(
        'Seeded Default Plan Pillars',
        'MISSION_PLAN',
        'Success',
        { count: rows.length }
      )
      return true
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[PLAN_SERVICE] Unexpected error seeding default pillars:', errMsg)
      return false
    }
  }
}

export const planService = PlanService.getInstance()

