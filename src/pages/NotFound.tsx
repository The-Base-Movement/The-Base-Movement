import { useNavigate } from 'react-router-dom'
import { FullPageState } from '@/components/states'
import SEO from '@/components/SEO'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: 'hsl(var(--background))',
      }}
    >
      <SEO title="Page Not Found" noindex />
      <div style={{ width: '100%', maxWidth: 560 }}>
        <FullPageState variant="404" primaryLabel="Return home" onPrimary={() => navigate('/')} />
      </div>
    </main>
  )
}
