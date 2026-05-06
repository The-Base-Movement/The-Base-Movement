import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import DashboardLayout from './components/DashboardLayout'
import { StoreProvider } from './types/StoreProvider'
import ScrollToTop from './components/ScrollToTop'
import ReadingProgressBar from './components/ReadingProgressBar'
import { LoadingScreen } from './components/LoadingScreen'
import { PerformanceProvider } from './context/PerformanceContext'
import { BrandingProvider } from './context/BrandingContext'

// Core pages (Eagerly loaded)

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/admin/Login'

// Secondary pages (Lazy loaded)
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

// Dashboard secondary pages
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const Polls = lazy(() => import('./pages/Polls'))
const FeedbackHub = lazy(() => import('./pages/FeedbackHub'))
const CanvasserClipboard = lazy(() => import('./pages/CanvasserClipboard'))

// Admin pages
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
const AdminAuthors = lazy(() => import('./pages/admin/Authors'))
const AdminEditAuthor = lazy(() => import('./pages/admin/EditAuthor'))
const AdminMediaLibrary = lazy(() => import('./pages/admin/MediaLibrary'))
const AdminLeadershipHub = lazy(() => import('./pages/admin/LeadershipHub'))
const AdminDonations = lazy(() => import('./pages/admin/DonationVerification'))
const AdminAdministrators = lazy(() => import('./pages/admin/Administrators'))
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
const AdminTrash = lazy(() => import('./pages/admin/Trash'))

import { Toaster as SonnerToaster } from 'sonner'
import { Toaster } from './components/ui/toaster'

export default function App() {
  return (
    <PerformanceProvider>
      <BrandingProvider>
        <StoreProvider>
          <ScrollToTop />
          <ReadingProgressBar />
          <Toaster />
          <SonnerToaster position="top-right" richColors />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Redirects */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/checkout" element={<Navigate to="/store/checkout" replace />} />
              <Route path="/dashboard/checkout" element={<Navigate to="/dashboard/store/checkout" replace />} />
              <Route path="/members" element={<Navigate to="/dashboard/members" replace />} />
              <Route path="/polls" element={<Navigate to="/dashboard/polls" replace />} />

              {/* ── Public routes (Navbar + Footer) ── */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/our-agenda" element={<OurAgenda />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/login" element={<Login />} />
                <Route path="/store" element={<Store />} />
                <Route path="/store/product/:slug" element={<ProductDetails />} />
                <Route path="/store/cart" element={<Cart />} />
                <Route path="/store/wishlist" element={<Wishlist />} />
                <Route path="/store/checkout" element={<Checkout />} />
                <Route path="/store/summary" element={<OrderSummary />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/chapters" element={<Navigate to="/dashboard/chapters" replace />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/press" element={<Press />} />
                <Route path="/verify/:id" element={<VerifyID />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* ── Dashboard routes (Sidebar + Topbar) ── */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/blog" element={<Blog />} />
                <Route path="/dashboard/blog/:id" element={<BlogPost />} />
                <Route path="/dashboard/agenda" element={<OurAgenda />} />
                <Route path="/dashboard/impact" element={<Impact />} />
                <Route path="/dashboard/polls" element={<Polls />} />
                <Route path="/dashboard/store" element={<Store />} />
                <Route path="/dashboard/store/product/:slug" element={<ProductDetails />} />
                <Route path="/dashboard/store/cart" element={<Cart />} />
                <Route path="/dashboard/store/wishlist" element={<Wishlist />} />
                <Route path="/dashboard/store/checkout" element={<Checkout />} />
                <Route path="/dashboard/store/summary" element={<OrderSummary />} />
                <Route path="/dashboard/feedback" element={<FeedbackHub />} />
                <Route path="/dashboard/canvass" element={<CanvasserClipboard />} />
                <Route path="/dashboard/donate" element={<Donate />} />
                <Route path="/dashboard/contact" element={<Contact />} />
                <Route path="/dashboard/members" element={<Members />} />
                <Route path="/dashboard/chapters" element={<Chapters />} />
                <Route path="/dashboard/chapters/:id" element={<ChapterDetails />} />
                <Route path="/dashboard/privacy" element={<Privacy />} />
                <Route path="/dashboard/terms" element={<Terms />} />
                <Route path="/settings" element={<ProfileSettings />} />
              </Route>

              {/* ── Admin routes (Admin Sidebar + Topbar) ── */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/leadership" element={<AdminLeadershipHub />} />
                <Route path="/admin/chapter-hub" element={<AdminChapterHub />} />
                <Route path="/admin/directives" element={<AdminFieldDirectives />} />
                <Route path="/admin/mobilization-metrics" element={<AdminMobilizationMetrics />} />
                <Route path="/admin/logistics-intelligence" element={<AdminLogisticsIntelligence />} />
                <Route path="/admin/rally-command" element={<AdminRallyCommand />} />
                <Route path="/admin/sentiment-intelligence" element={<AdminSentimentIntelligence />} />
                <Route path="/admin/war-room" element={<AdminWarRoomCommand />} />
                <Route path="/admin/ground-game" element={<AdminGroundGameCommand />} />
                <Route path="/admin/donations" element={<AdminDonations />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/verification" element={<AdminMemberVerification />} />
                <Route path="/admin/chapters" element={<AdminChapters />} />
                <Route path="/admin/polls" element={<AdminPolls />} />
                <Route path="/admin/store" element={<AdminStore />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/regions" element={<AdminRegions />} />
                <Route path="/admin/blogs" element={<AdminBlogs />} />
                <Route path="/admin/authors" element={<AdminAuthors />} />
                <Route path="/admin/authors/new" element={<AdminEditAuthor />} />
                <Route path="/admin/authors/edit/:id" element={<AdminEditAuthor />} />
                <Route path="/admin/media" element={<AdminMediaLibrary />} />
                <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />
                <Route path="/admin/broadcasts/new" element={<AdminNewBroadcast />} />
                <Route path="/admin/administrators" element={<AdminAdministrators />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/trash" element={<AdminTrash />} />
              </Route>
            </Routes>
          </Suspense>
        </StoreProvider>
      </BrandingProvider>
    </PerformanceProvider>
  )
}
