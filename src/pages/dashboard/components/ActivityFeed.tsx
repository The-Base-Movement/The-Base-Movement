import { format } from 'date-fns'
import type { Notification } from '@/types/admin'

interface ActivityFeedProps {
  notifications: Notification[]
}

export function ActivityFeed({ notifications }: ActivityFeedProps) {
  return (
    <div className="bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden flex flex-col">
      <div className="bg-on-surface/5 border-b border-border/10 p-4 flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-tight text-primary flex items-center gap-2 m-0">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>campaign</span>
          Movement Directives
        </h3>
        <span className="text-tiny font-bold text-on-surface/30 tracking-tight">{notifications.length} Active updates</span>
      </div>
      <div className="divide-y divide-border/10 max-h-[400px] overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-on-surface/10 text-5xl mb-6" style={{ fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0, 'opsz' 48" }}>history</span>
            <p className="text-sm font-bold text-on-surface/40 tracking-tight">All Caught Up</p>
            <p className="text-xs text-on-surface/20 font-medium mt-2 italic">Standing by for new updates and national broadcasts.</p>
          </div>
        ) : (
          notifications.map((note) => (
            <div key={note.id} className="p-6 hover:bg-muted/5 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold tracking-tighter px-2 py-0.5 rounded-none ${
                  note.type === 'Alert' ? 'bg-destructive text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {note.type.toUpperCase()}
                </span>
                <span className="text-[10px] font-bold text-on-surface/20 tracking-tight">{format(new Date(note.created_at), 'MMM dd, HH:mm')}</span>
              </div>
              <h4 className="text-sm font-bold tracking-tight text-on-surface mb-1 group-hover:text-primary transition-colors">{note.title}</h4>
              <p className="text-xs text-on-surface/50 leading-relaxed m-0">{note.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
