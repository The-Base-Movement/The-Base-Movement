import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import DashboardLayout from './components/DashboardLayout'
import { StoreProvider } from './types/StoreProvider'
import ScrollToTop from './components/ScrollToTop'
import ReadingProgressBar from './components/ReadingProgressBar'

// Public pages
import Home from './pages/Home'
import Blog from './pages/Blog'
import OurAgenda from './pages/OurAgenda'
import Register from './pages/Register'
import Contact from './pages/Contact'
import Donate from './pages/Donate'
import Login from './pages/Login'
import Members from './pages/Members'
import Store from './pages/Store'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSummary from './pages/OrderSummary'
import Impact from './pages/Impact'
import Chapters from './pages/Chapters'
import ChapterDetails from './pages/ChapterDetails'
import BlogPost from './pages/BlogPost'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Wishlist from './pages/Wishlist'
import VerifyID from './pages/VerifyID'

// Dashboard pages
import Dashboard from './pages/Dashboard'
import ProfileSettings from './pages/ProfileSettings'
import Polls from './pages/Polls'
import FeedbackHub from './pages/FeedbackHub'

// Admin pages
import AdminLayout from './components/layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLogin from './pages/admin/Login'
import AdminMembers from './pages/admin/Members'
import AdminChapters from './pages/admin/Chapters'
import AdminPolls from './pages/admin/Polls'
import AdminStore from './pages/admin/Store'
import AdminSettings from './pages/admin/Settings'
import AdminMemberVerification from './pages/admin/MemberVerification'
import AdminRegions from './pages/admin/Regions'
import AdminBlogs from './pages/admin/Blogs'
import AdminLeadershipHub from './pages/admin/LeadershipHub'
import AdminDonations from './pages/admin/DonationVerification'
import AdminAdministrators from './pages/admin/Administrators'
import AdminBroadcasts from './pages/admin/Broadcasts'
import AdminOrders from './pages/admin/Orders'
import AdminChapterHub from './pages/admin/ChapterLeadHub'
import AdminFieldDirectives from './pages/admin/FieldDirectives'
import AdminMobilizationMetrics from './pages/admin/MobilizationMetrics'
import AdminLogisticsIntelligence from './pages/admin/LogisticsIntelligence'
import AdminRallyCommand from './pages/admin/RallyCommand'
import AdminSentimentIntelligence from './pages/admin/SentimentIntelligence'
import AdminWarRoomCommand from './pages/admin/WarRoomCommand'

import { Toaster as SonnerToaster } from 'sonner'
import { Toaster } from './components/ui/toaster'

export default function App() {
  return (
    <StoreProvider>
      <ScrollToTop />
      <ReadingProgressBar />
      <Toaster />
      <SonnerToaster position="top-right" richColors />
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
          <Route path="/verify/:id" element={<VerifyID />} />
          <Route path="/admin-login" element={<AdminLogin />} />
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
          <Route path="leadership" element={<AdminLeadershipHub />} />
          <Route path="chapter-hub" element={<AdminChapterHub />} />
          <Route path="directives" element={<AdminFieldDirectives />} />
          <Route path="mobilization-metrics" element={<AdminMobilizationMetrics />} />
          <Route path="logistics-intelligence" element={<AdminLogisticsIntelligence />} />
          <Route path="rally-command" element={<AdminRallyCommand />} />
          <Route path="sentiment-intelligence" element={<AdminSentimentIntelligence />} />
          <Route path="war-room" element={<AdminWarRoomCommand />} />
          <Route path="donations" element={<AdminDonations />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/verification" element={<AdminMemberVerification />} />
          <Route path="/admin/chapters" element={<AdminChapters />} />
          <Route path="/admin/polls" element={<AdminPolls />} />
          <Route path="/admin/store" element={<AdminStore />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/regions" element={<AdminRegions />} />
          <Route path="/admin/blogs" element={<AdminBlogs />} />
          <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />
          <Route path="/admin/administrators" element={<AdminAdministrators />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}
