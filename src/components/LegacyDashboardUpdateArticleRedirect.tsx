import { Navigate, useParams } from 'react-router-dom'

export default function LegacyDashboardUpdateArticleRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/dashboard/blog/${id}` : '/dashboard/blog'} replace />
}
