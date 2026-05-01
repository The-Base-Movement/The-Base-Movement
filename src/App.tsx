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
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import AdminLogin from './pages/AdminLogin'
import Wishlist from './pages/Wishlist'

// Dashboard pages
import Dashboard from './pages/Dashboard'
import ProfileSettings from './pages/ProfileSettings'
import Polls from './pages/Polls'

export default function App() {
  return (
    <StoreProvider>
      <ScrollToTop />
      <ReadingProgressBar />
      <Routes>
        {/* Redirects */}
        <Route path="/checkout" element={<Navigate to="/store/checkout" replace />} />
        <Route path="/dashboard/checkout" element={<Navigate to="/dashboard/store/checkout" replace />} />
        <Route path="/members" element={<Navigate to="/dashboard/members" replace />} />
        <Route path="/polls" element={<Navigate to="/dashboard/polls" replace />} />

        {/* ── Public routes (Navbar + Footer) ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/our-agenda" element={<OurAgenda />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/product/:id" element={<ProductDetails />} />
          <Route path="/store/cart" element={<Cart />} />
          <Route path="/store/wishlist" element={<Wishlist />} />
          <Route path="/store/checkout" element={<Checkout />} />
          <Route path="/store/summary" element={<OrderSummary />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/chapters" element={<Navigate to="/dashboard/chapters" replace />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Route>

        {/* ── Dashboard routes (Sidebar + Topbar) ── */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/agenda" element={<OurAgenda />} />
          <Route path="/dashboard/impact" element={<Impact />} />
          <Route path="/dashboard/polls" element={<Polls />} />
          <Route path="/dashboard/store" element={<Store />} />
          <Route path="/dashboard/store/product/:id" element={<ProductDetails />} />
          <Route path="/dashboard/store/cart" element={<Cart />} />
          <Route path="/dashboard/store/wishlist" element={<Wishlist />} />
          <Route path="/dashboard/store/checkout" element={<Checkout />} />
          <Route path="/dashboard/store/summary" element={<OrderSummary />} />
          <Route path="/dashboard/donate" element={<Donate />} />
          <Route path="/dashboard/contact" element={<Contact />} />
          <Route path="/dashboard/members" element={<Members />} />
          <Route path="/dashboard/chapters" element={<Chapters />} />
          <Route path="/dashboard/chapters/:id" element={<ChapterDetails />} />
          <Route path="/dashboard/privacy" element={<Privacy />} />
          <Route path="/dashboard/terms" element={<Terms />} />
          <Route path="/settings" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}
