import AdminBlogs from '../Blogs'

/** Youth Wing article manager: the same editor as adult Editorial Command, but
 * pinned to audience="YOUTH". The two never share a list, a draft, or a URL. */
export default function AdminYouthWingArticles() {
  return <AdminBlogs audience="YOUTH" />
}
