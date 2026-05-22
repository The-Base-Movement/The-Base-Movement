# Dashboard Achievements & Regional Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the missing Achievements & Regional Leaderboard section in the user dashboard to resolve unused variable warnings and complete the UI.

**Architecture:** Create a new modular React component `AchievementsAndLeaderboard.tsx` and integrate it into `Dashboard.tsx`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React icons.

---

### Task 1: Create AchievementsAndLeaderboard Component

**Files:**
- Create: `src/pages/dashboard/components/AchievementsAndLeaderboard.tsx`

- [ ] **Step 1: Create the component file with basic structure**

```tsx
import { Trophy, Medal, Star, Shield, Zap } from 'lucide-react'
import type { LeaderboardEntry, Achievement } from '@/types/admin'
import { cn } from '@/lib/utils'

interface AchievementsAndLeaderboardProps {
  leaderboard: LeaderboardEntry[]
  achievements: Achievement[]
  region: string
}

export function AchievementsAndLeaderboard({ leaderboard, achievements, region }: AchievementsAndLeaderboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Regional Leaderboard */}
      <div className="bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-on-surface/5 border-b border-border/10 p-4 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-tight text-primary flex items-center gap-2 m-0">
            <Trophy className="w-4 h-4" />
            Regional Members - {region || 'National'}
          </h3>
          <span className="text-micro font-bold text-on-surface/30 tracking-tight">Top 5 Members</span>
        </div>
        <div className="divide-y divide-border/10">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-on-surface/30 italic text-xs">
              No regional data available yet.
            </div>
          ) : (
            leaderboard.slice(0, 5).map((entry, index) => (
              <div key={entry.name} className="p-4 flex items-center justify-between hover:bg-on-surface/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    index === 0 ? "bg-accent text-accent-foreground" : "bg-on-surface/5 text-on-surface/40"
                  )}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold text-on-surface tracking-tight">{entry.name}</span>
                </div>
                <span className="text-xs font-bold italic text-primary">{entry.points.toLocaleString()} pts</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Unlocked Achievements */}
      <div className="bg-surface-warm border border-border/40 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-on-surface/5 border-b border-border/10 p-4 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-tight text-accent flex items-center gap-2 m-0">
            <Medal className="w-4 h-4" />
            Unlocked Achievements
          </h3>
          <span className="text-micro font-bold text-on-surface/30 tracking-tight">{achievements.length} Unlocked</span>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {achievements.length === 0 ? (
            <div className="col-span-full p-4 text-center text-on-surface/30 italic text-xs">
              No achievements unlocked yet.
            </div>
          ) : (
            achievements.map((achievement) => (
              <div key={achievement.id} className="flex flex-col items-center text-center p-3 bg-white/50 border border-border/10 rounded-sm hover:border-accent/40 transition-all group">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-bold text-on-surface tracking-tight leading-tight">{achievement.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit new component**

```bash
git add src/pages/dashboard/components/AchievementsAndLeaderboard.tsx
git commit -m "feat: add AchievementsAndLeaderboard component to dashboard"
```

---

### Task 2: Integrate Component into Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Import the new component**

```tsx
// Around line 20
import { ActivityFeed } from './dashboard/components/ActivityFeed'
import { AchievementsAndLeaderboard } from './dashboard/components/AchievementsAndLeaderboard'
```

- [ ] **Step 2: Add component to the layout**

Replace the placeholder comment `{/* Section 4: Achievements & Regional Leaderboard */}` (around line 506) with the component.

```tsx
      {/* Section 4: Achievements & Regional Leaderboard */}
      <section className="mb-12">
        <AchievementsAndLeaderboard 
          leaderboard={leaderboard}
          achievements={achievements}
          region={member?.region || ''}
        />
      </section>
```

- [ ] **Step 3: Cleanup unused state variable (if any remaining)**
Verify if `allAvailableAchievements` is still needed. Since it was fetched but not used, and the new component only needs `achievements`, we can remove it if it causes a warning.

- [ ] **Step 4: Commit integration**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: integrate AchievementsAndLeaderboard into dashboard"
```

---

### Task 3: Verification

- [ ] **Step 1: Check for linting errors**

Run: `npm run lint` or check IDE for "leaderboard is assigned a value but never used" warning in `Dashboard.tsx`.
Expected: Warning should be GONE.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build successful without unused variable errors.
