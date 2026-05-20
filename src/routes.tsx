import { lazy } from 'react'
import { type RouteObject, Navigate } from 'react-router-dom'
import WithChapters from './components/WithChapters'
import Home from './pages/Home'
import PublicLayout from './components/PublicLayout'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminLogin = lazy(() => import('./pages/admin/Login'))

// Lazy loaded components
const Blog = lazy(() => import('./pages/Blog'))
const OurAgenda = lazy(() => import('./pages/OurAgenda'))
const Contact = lazy(() => import('./pages/Contact'))
const Donate = lazy(() => import('./pages/Donate'))
const Members = lazy(() => import('./pages/Members'))
const Store = lazy(() => import('./pages/Store'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSummary = lazy(() => import('./pages/OrderSummary'))
const Impact = lazy(() => import('./pages/Impact'))
const Chapters = lazy(() => import('./pages/Chapters'))
const ChapterDetails = lazy(() => import('./pages/ChapterDetails'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const VerifyID = lazy(() => import('./pages/VerifyID'))
const Press = lazy(() => import('./pages/Press'))
const NotFound = lazy(() => import('./pages/NotFound'))
const RegistrationFormPreview = lazy(() => import('./pages/RegistrationFormPreview'))
const PreviewOfficer = lazy(() => import('./pages/PreviewOfficer'))
const Officers = lazy(() => import('./pages/Officers'))

// Dashboard components
const ChapterHub = lazy(() => import('./pages/ChapterHub'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const Polls = lazy(() => import('./pages/Polls'))
const FeedbackHub = lazy(() => import('./pages/FeedbackHub'))
const CanvasserClipboard = lazy(() => import('./pages/CanvasserClipboard'))

// Admin components
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminMembers = lazy(() => import('./pages/admin/Members'))
const AdminChapters = lazy(() => import('./pages/admin/Chapters'))
const AdminPolls = lazy(() => import('./pages/admin/Polls'))
const AdminStore = lazy(() => import('./pages/admin/Store'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminMemberVerification = lazy(() => import('./pages/admin/MemberVerification'))
const AdminRegions = lazy(() => import('./pages/admin/Regions'))
const AdminBlogs = lazy(() => import('./pages/admin/Blogs'))
const AdminAuthors = lazy(() => import('./pages/admin/authors'))
const AdminMediaLibrary = lazy(() => import('./pages/admin/MediaLibrary'))
const AdminLeadershipHub = lazy(() => import('./pages/admin/LeadershipHub'))
const AdminDonations = lazy(() => import('./pages/admin/DonationVerification'))
const AdminSpendingLedger = lazy(() => import('./pages/admin/SpendingLedger'))
const AdminAdministrators = lazy(() => import('./pages/admin/Administrators'))
const AdminPartyOfficials = lazy(() => import('./pages/admin/PartyOfficials'))
const AdminBroadcasts = lazy(() => import('./pages/admin/Broadcasts'))
const AdminNewBroadcast = lazy(() => import('./pages/admin/NewBroadcast'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminChapterHub = lazy(() => import('./pages/admin/ChapterLeadHub'))
const AdminFieldDirectives = lazy(() => import('./pages/admin/FieldDirectives'))
const AdminMobilizationMetrics = lazy(() => import('./pages/admin/MobilizationMetrics'))
const AdminLogisticsIntelligence = lazy(() => import('./pages/admin/LogisticsIntelligence'))
const AdminRallyCommand = lazy(() => import('./pages/admin/RallyCommand'))
const AdminSentimentIntelligence = lazy(() => import('./pages/admin/SentimentIntelligence'))
const AdminWarRoomCommand = lazy(() => import('./pages/admin/WarRoomCommand'))
const AdminGroundGameCommand = lazy(() => import('./pages/admin/GroundGameCommand'))
const AdminDeployMission = lazy(() => import('./pages/admin/DeployMission'))
const AdminPollingStations = lazy(() => import('./pages/admin/PollingStations'))
const AdminTrash = lazy(() => import('./pages/admin/Trash'))
const AdminRoadmap = lazy(() => import('./pages/admin/Roadmap'))
const AdminStrategicPriorities = lazy(() => import('./pages/admin/StrategicPriorities'))

export const routes: RouteObject[] = [
  {
    path: '/admin',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '/checkout',
    element: <Navigate to="/store/checkout" replace />,
  },
  {
    path: '/dashboard/checkout',
    element: <Navigate to="/dashboard/store/checkout" replace />,
  },
  {
    path: '/members',
    element: <Navigate to="/dashboard/members" replace />,
  },
  {
    path: '/settings',
    element: <Navigate to="/dashboard/settings" replace />,
  },
  {
    path: '/register/preview',
    element: <RegistrationFormPreview />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/dashboard/blog', element: <Blog /> },
          { path: '/dashboard/blog/:id', element: <BlogPost /> },
          { path: '/dashboard/agenda', element: <OurAgenda /> },
          { path: '/dashboard/impact', element: <Impact /> },
          { path: '/dashboard/polls', element: <Polls /> },
          {
            element: <WithChapters />,
            children: [
              { path: '/dashboard/chapters', element: <Chapters /> },
              { path: '/dashboard/chapters/:slug', element: <ChapterDetails /> },
            ],
          },
          { path: '/dashboard/store', element: <Store /> },
          { path: '/dashboard/store/product/:slug', element: <ProductDetails /> },
          { path: '/dashboard/store/cart', element: <Cart /> },
          { path: '/dashboard/store/wishlist', element: <Wishlist /> },
          { path: '/dashboard/store/checkout', element: <Checkout /> },
          { path: '/dashboard/store/summary', element: <OrderSummary /> },
          { path: '/dashboard/feedback', element: <FeedbackHub /> },
          { path: '/dashboard/canvass', element: <CanvasserClipboard /> },
          { path: '/dashboard/chapter-hub', element: <ChapterHub /> },
          { path: '/dashboard/chapter-hub/:chapterId', element: <ChapterHub /> },
          { path: '/dashboard/donate', element: <Donate /> },
          { path: '/dashboard/contact', element: <Contact /> },
          { path: '/dashboard/members', element: <Members /> },
          { path: '/dashboard/privacy', element: <Privacy /> },
          { path: '/dashboard/terms', element: <Terms /> },
          { path: '/dashboard/settings', element: <ProfileSettings /> },
        ],
      },
    ],
  },
  {
    element: <AdminLayout />,
    children: [
      { path: '/admin/dashboard', element: <AdminDashboard /> },
      { path: '/admin/leadership', element: <AdminLeadershipHub /> },
      { path: '/admin/chapter-hub', element: <AdminChapterHub /> },
      { path: '/admin/chapter-hub/:chapterId', element: <AdminChapterHub /> },
      { path: '/admin/directives', element: <AdminFieldDirectives /> },
      { path: '/admin/mobilization-metrics', element: <AdminMobilizationMetrics /> },
      { path: '/admin/logistics-intelligence', element: <AdminLogisticsIntelligence /> },
      { path: '/admin/rally-command', element: <AdminRallyCommand /> },
      { path: '/admin/sentiment-intelligence', element: <AdminSentimentIntelligence /> },
      { path: '/admin/war-room', element: <AdminWarRoomCommand /> },
      { path: '/admin/ground-game', element: <AdminGroundGameCommand /> },
      { path: '/admin/ground-game/deploy', element: <AdminDeployMission /> },
      { path: '/admin/deploy', element: <AdminDeployMission /> },
      { path: '/admin/polling-stations', element: <AdminPollingStations /> },
      { path: '/admin/donations', element: <AdminDonations /> },
      { path: '/admin/spending-ledger', element: <AdminSpendingLedger /> },
      { path: '/admin/priorities', element: <AdminStrategicPriorities /> },
      { path: '/admin/members', element: <AdminMembers /> },
      { path: '/admin/verification', element: <AdminMemberVerification /> },
      {
        element: <WithChapters />,
        children: [{ path: '/admin/chapters', element: <AdminChapters /> }],
      },
      { path: '/admin/polls', element: <AdminPolls /> },
      { path: '/admin/store', element: <AdminStore /> },
      { path: '/admin/settings', element: <AdminSettings /> },
      { path: '/admin/regions', element: <AdminRegions /> },
      { path: '/admin/blogs', element: <AdminBlogs /> },
      { path: '/admin/authors', element: <AdminAuthors /> },
      { path: '/admin/media', element: <AdminMediaLibrary /> },
      { path: '/admin/broadcasts', element: <AdminBroadcasts /> },
      { path: '/admin/broadcasts/new', element: <AdminNewBroadcast /> },
      { path: '/admin/administrators', element: <AdminAdministrators /> },
      { path: '/admin/party-officials', element: <AdminPartyOfficials /> },
      { path: '/admin/orders', element: <AdminOrders /> },
      { path: '/admin/roadmap', element: <AdminRoadmap /> },
      { path: '/admin/trash', element: <AdminTrash /> },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/blog', element: <Blog /> },
      { path: '/blog/:id', element: <BlogPost /> },
      { path: '/our-agenda', element: <OurAgenda /> },
      { path: '/register', element: <Register /> },
      { path: '/contact', element: <Contact /> },
      { path: '/donate', element: <Donate /> },
      { path: '/login', element: <Login /> },
      { path: '/store', element: <Store /> },
      { path: '/store/product/:slug', element: <ProductDetails /> },
      { path: '/store/cart', element: <Cart /> },
      { path: '/store/wishlist', element: <Wishlist /> },
      { path: '/store/checkout', element: <Checkout /> },
      { path: '/store/summary', element: <OrderSummary /> },
      { path: '/impact', element: <Impact /> },
      { path: '/polls', element: <Polls /> },
      { element: <WithChapters />, children: [{ path: '/chapters', element: <Chapters /> }] },
      { path: '/privacy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '/press', element: <Press /> },
      { path: '/verify/:id', element: <VerifyID /> },
      { path: '/admin-login', element: <AdminLogin /> },
      { path: '/preview-officer', element: <PreviewOfficer /> },
      { path: '/officers', element: <Officers /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
