import { useState } from 'react'
import { User, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'

interface Comment {
  id: string
  author: string
  date: string
  content: string
  avatar?: string
}


export function CommentSection() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Kwame Asante',
      date: '2 hours ago',
      content: 'This industrialization roadmap is exactly what we need. Focusing on regional hubs will ensure that development is not just centered in Accra.',
    },
    {
      id: '2',
      author: 'Efua Mansah',
      date: '5 hours ago',
      content: 'I particularly like the emphasis on vocational training. We need skilled hands to run these factories.',
    }
  ])
  const [newComment, setNewComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Current Member', // This would come from auth
      date: 'Just now',
      content: newComment,
    }
    
    setComments([comment, ...comments])
    setNewComment('')
  }

  return (
    <div className="mt-24 pt-12 border-t border-stone-100">
      <div className="flex items-center gap-3 mb-10">
        <MessageSquare className="w-6 h-6 text-[var(--brand-green)]" />
        <h2 className="text-xl font-bold text-stone-900 tracking-tight mb-0">Community Discussion</h2>
        <span className="bg-stone-100 text-stone-500 text-micro font-bold px-2 py-0.5 tracking-tight">
          {comments.length} comments
        </span>
      </div>

      {/* Comment Form */}
      <div className="mb-12 bg-stone-50 p-8 border border-stone-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-stone-200 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-stone-400" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Join the conversation..."
                className="w-full bg-white border border-stone-200 p-4 text-sm font-medium focus:ring-1 focus:ring-brand-green outline-none min-h-[100px] transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={!newComment.trim()}
              className="bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-bold tracking-tight text-micro h-10 px-8 rounded-none"
            >
              Post comment <Send className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-8">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 group">
            <div className="w-12 h-12 bg-[var(--brand-green)]/5 border border-[var(--brand-green)]/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-[var(--brand-green)]" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 mb-0 tracking-tight">{comment.author}</h4>
                <span className="text-micro font-bold text-stone-400 tracking-tight">{comment.date}</span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed mb-0">
                {comment.content}
              </p>
              <div className="flex gap-4 pt-2">
                <button className="text-micro font-bold text-stone-400 tracking-tight hover:text-[var(--brand-green)] transition-colors">Reply</button>
                <button className="text-micro font-bold text-stone-400 tracking-tight hover:text-[var(--brand-red)] transition-colors">Flag</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
