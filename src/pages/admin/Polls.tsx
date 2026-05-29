/**
 * Polls.tsx (PollsManagement)
 * ─────────────────────────────────────────────────────────────────
 * Main orchestrator for the Engagement Hub / Polls admin page.
 *
 * Responsibilities:
 *  - Fetches polls, poll stats, Ghana regions, and countries on mount
 *  - Manages controlled state for search, modals, and form
 *  - Handles poll creation and deletion
 *  - Passes data down to focused sub-components (polls/ folder)
 *
 * Sub-components (src/pages/admin/polls/):
 *  PollsHeader        — Page title, breadcrumb, and "Create Campaign" button
 *  PollsKPIs          — 4 top KPI stat cards (engagements, sentiment, response time, feedback)
 *  PollsTable         — Desktop data table with search, skeletons, and row actions
 *  PollsMobileCards   — Mobile card list with search and same actions
 *  EngagementBanner   — Bottom two-col section (dark promo + feedback highlight)
 *  CreatePollModal    — Portal modal: create a new poll with options builder
 *  PollDetailModal    — Portal modal: view vote breakdown and manage a poll
 *  FeedbackVaultModal — Portal modal: read member feedback quotes
 *  AnalyticsGuideModal— Portal modal: engagement analytics tips
 *
 * Shared:
 *  polls/styles.ts    — Shared inline CSS constants (inputSt, thSt, modalBox, etc.)
 *  polls/statusPill   — Helper that returns a styled status badge element
 */

import { useState, useEffect, useCallback } from 'react'
import { adminService, type Poll, type PollStats } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useDeleteModal } from '@/hooks/useDeleteModal'

import { PollsHeader } from './polls/PollsHeader'
import { PollsKPIs } from './polls/PollsKPIs'
import { PollsTable } from './polls/PollsTable'
import { PollsMobileCards } from './polls/PollsMobileCards'
import { EngagementBanner } from './polls/EngagementBanner'
import { CreatePollModal } from './polls/CreatePollModal'
import { PollDetailModal } from './polls/PollDetailModal'
import { FeedbackVaultModal } from './polls/FeedbackVaultModal'
import { AnalyticsGuideModal } from './polls/AnalyticsGuideModal'

/** Default new poll form state — exported for reuse in CreatePollModal reset */
const DEFAULT_POLL = {
  question: '',
  targetBase: 'GHANA',
  region: 'National',
  country: 'International',
  status: 'Active',
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  options: ['', ''],
}

export default function PollsManagement() {
  // ── Core data ──────────────────────────────────────────────────
  const [polls, setPolls] = useState<Poll[]>([])
  const [stats, setStats] = useState<PollStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ── Reference data ─────────────────────────────────────────────
  const [availableRegions, setAvailableRegions] = useState<{ id: string; name: string }[]>([])
  const [availableCountries, setAvailableCountries] = useState<
    { name: string; dialing_code: string; is_diaspora: boolean }[]
  >([])

  // ── UI state ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)
  const [viewPoll, setViewPoll] = useState<Poll | null>(null)

  // ── Form state ─────────────────────────────────────────────────
  const [newPoll, setNewPoll] = useState(DEFAULT_POLL)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { openDelete, modal: deleteModal } = useDeleteModal()

  // ── Data fetching ──────────────────────────────────────────────

  /**
   * Loads all page data in parallel:
   *  - polls          → public.polls
   *  - stats          → public.poll_stats (aggregated view)
   *  - regions        → public.ghana_regions
   *  - countries      → public.countries
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pollData, statData, regionsData, countriesData] = await Promise.all([
        adminService.getPolls(),
        adminService.getPollStats(),
        adminService.getGhanaRegions(),
        adminService.getCountries(),
      ])
      setPolls(pollData)
      setStats(statData)
      setAvailableRegions(regionsData)
      setAvailableCountries(countriesData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Handlers ───────────────────────────────────────────────────

  /**
   * Submits the new poll form.
   * Validates: at least 2 non-empty options required.
   * On success: closes modal, resets form, refreshes poll list.
   * Source: adminService.createPoll → inserts into public.polls + public.poll_options
   */
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPoll.options.filter((o) => o.trim()).length < 2) {
      toast.error('Please provide at least 2 options.')
      return
    }
    setIsSubmitting(true)
    try {
      const targetRegion = newPoll.targetBase === 'GHANA' ? newPoll.region : newPoll.country
      const success = await adminService.createPoll({
        ...newPoll,
        region: targetRegion,
        options: newPoll.options.filter((o) => o.trim()),
      })
      if (success) {
        toast.success('Poll created successfully!')
        setShowCreateModal(false)
        setNewPoll(DEFAULT_POLL)
        fetchData()
        supabase.functions
          .invoke('send-push-notification', {
            body: {
              userIds: 'all',
              title: 'New poll — your voice matters',
              body: newPoll.question.slice(0, 100),
              url: '/dashboard/polls',
            },
          })
          .catch(console.error)
      } else {
        toast.error('Failed to create poll.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Opens the delete confirmation modal for a poll.
   * On confirmation: deletes from DB and refreshes the list.
   * Source: adminService.deletePoll → deletes from public.polls (cascades to options)
   */
  const handleDeletePoll = (poll: Poll) => {
    openDelete({
      itemName: poll.question,
      title: 'Delete poll',
      description: 'This poll and all its responses will be permanently deleted.',
      isPermanent: true,
      successMessage: 'Poll deleted successfully.',
      errorMessage: 'Failed to delete poll.',
      onConfirm: async () => {
        const success = await adminService.deletePoll(poll.id)
        if (success) fetchData()
        return success
      },
    })
  }

  // ── Derived state ──────────────────────────────────────────────

  /** Polls filtered by current search query (case-insensitive) */
  const filteredPolls = polls.filter((p) =>
    p.question.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page title, breadcrumb, and "Create Campaign" button */}
      <PollsHeader onCreateClick={() => setShowCreateModal(true)} />

      {/* 4 KPI stat cards: engagements, sentiment, response time, feedback rate */}
      <PollsKPIs stats={stats} />

      {/* Desktop: full data table with search, skeletons, row actions */}
      <PollsTable
        polls={filteredPolls}
        isLoading={isLoading}
        onDelete={handleDeletePoll}
        onView={setViewPoll}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Mobile: card list with same actions */}
      <PollsMobileCards
        polls={filteredPolls}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onView={setViewPoll}
        onDelete={handleDeletePoll}
      />

      {/* Bottom section: dark promo panel + feedback highlight */}
      <EngagementBanner
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
      />

      {/* Create poll portal modal */}
      {showCreateModal && (
        <CreatePollModal
          newPoll={newPoll}
          setNewPoll={setNewPoll}
          availableRegions={availableRegions}
          availableCountries={availableCountries}
          isSubmitting={isSubmitting}
          onSubmit={handleCreatePoll}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* View / manage poll detail portal modal */}
      {viewPoll && (
        <PollDetailModal
          poll={viewPoll}
          onClose={() => setViewPoll(null)}
          onDelete={handleDeletePoll}
        />
      )}

      {/* Feedback vault portal modal */}
      {isFeedbackModalOpen && <FeedbackVaultModal onClose={() => setIsFeedbackModalOpen(false)} />}

      {/* Analytics guide portal modal */}
      {isAnalyticsModalOpen && (
        <AnalyticsGuideModal onClose={() => setIsAnalyticsModalOpen(false)} />
      )}

      {/* Global delete confirmation modal (from useDeleteModal hook) */}
      {deleteModal}
    </div>
  )
}
