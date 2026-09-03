import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProtectedRoute from '@/components/admin/ProtectedRoute'
import AssistantWidget from '@/components/chat/AssistantWidget'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SiteSettingsProvider, useSiteSettings } from '@/lib/siteData.tsx'

// Public pages — lazy to keep initial bundle small; Home is most visited but still split
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage'))
const IndustriesPage = lazy(() => import('@/pages/public/IndustriesPage'))
const ProductsPage = lazy(() => import('@/pages/public/ProductsPage'))
const ProcessPage = lazy(() => import('@/pages/public/ProcessPage'))
const WhyUsPage = lazy(() => import('@/pages/public/WhyUsPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
const QuotePage = lazy(() => import('@/pages/public/QuotePage'))
const SupplierRegistrationPage = lazy(() => import('@/pages/public/SupplierRegistrationPage'))
const TestimonialsPage = lazy(() => import('@/pages/public/TestimonialsPage'))

const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const ResetPasswordPage = lazy(() => import('@/pages/admin/ResetPasswordPage'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const HomeAdminPage = lazy(() => import('@/pages/admin/HomeAdminPage'))
const PagesAdminPage = lazy(() => import('@/pages/admin/PagesAdminPage'))
const FooterAdminPage = lazy(() => import('@/pages/admin/FooterAdminPage'))
const UploadsAdminPage = lazy(() => import('@/pages/admin/UploadsAdminPage'))
const ReceiptsAdminPage = lazy(() => import('@/pages/admin/ReceiptsAdminPage'))
const PdfTemplatesAdminPage = lazy(() => import('@/pages/admin/PdfTemplatesAdminPage'))
const QuotesAdminPage = lazy(() => import('@/pages/admin/QuotesAdminPage'))
const MessagesAdminPage = lazy(() => import('@/pages/admin/MessagesAdminPage'))
const SuppliersAdminPage = lazy(() => import('@/pages/admin/SuppliersAdminPage'))
const TestimonialsAdminPage = lazy(() => import('@/pages/admin/TestimonialsAdminPage'))
const ProductsAdminPage = lazy(() => import('@/pages/admin/ProductsAdminPage'))
const ServicesAdminPage = lazy(() => import('@/pages/admin/ServicesAdminPage'))
const IndustriesAdminPage = lazy(() => import('@/pages/admin/IndustriesAdminPage'))
const WhyUsAdminPage = lazy(() => import('@/pages/admin/WhyUsAdminPage'))
const ProcessAdminPage = lazy(() => import('@/pages/admin/ProcessAdminPage'))
const MediaAdminPage = lazy(() => import('@/pages/admin/MediaAdminPage'))
const LocationsAdminPage = lazy(() => import('@/pages/admin/LocationsAdminPage'))
const AssistantAdminPage = lazy(() => import('@/pages/admin/AssistantAdminPage'))
const BlogAdminPage = lazy(() => import('@/pages/admin/BlogAdminPage'))
const DownloadsAdminPage = lazy(() => import('@/pages/admin/DownloadsAdminPage'))
const SettingsAdminPage = lazy(() => import('@/pages/admin/SettingsAdminPage'))

const BlogListPage = lazy(() => import('@/pages/public/BlogListPage'))
const BlogPostPage = lazy(() => import('@/pages/public/BlogPostPage'))

function useAutoHideScrollbar() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      document.documentElement.classList.add('is-scrolling')
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 800)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer) clearTimeout(timer)
    }
  }, [])
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-100 border-t-navy" />
    </div>
  )
}

function FloatingWhatsApp() {
  const s = useSiteSettings()
  const raw = (s.whatsapp || '').replace(/\D/g, '')
  const href = raw ? `https://wa.me/${raw}` : null
  if (!href) return null
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}
      style={{ bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))' }}
      className="fixed right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-600/30 transition-transform duration-300 hover:scale-110"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="h-7 w-7">
        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
      </svg>
    </motion.a>
  )
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-[120px] font-extrabold leading-none text-navy/10">404</p>
      <h1 className="-mt-8 font-display text-3xl font-bold text-navy">Page Not Found</h1>
      <p className="mt-4 max-w-md text-ink-light">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-9 inline-flex items-center gap-2 rounded-full bg-brand-green-500 px-8 py-3.5 font-semibold text-white transition-all hover:bg-brand-green-600"
      >
        Back to Homepage
      </Link>
    </div>
  )
}

export default function App() {
  useAutoHideScrollbar()

  return (
    <ErrorBoundary>
      <SiteSettingsProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Public website — Header/Footer live only here */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/industries" element={<IndustriesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/process" element={<ProcessPage />} />
              <Route path="/why-us" element={<WhyUsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="/supplier-registration" element={<SupplierRegistrationPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/blog" element={<BlogListPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin portal — own chrome, no public Header/Footer */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/home" element={<HomeAdminPage />} />
              <Route path="/admin/pages" element={<PagesAdminPage />} />
              <Route path="/admin/footer" element={<FooterAdminPage />} />
              <Route path="/admin/uploads" element={<UploadsAdminPage />} />
              <Route path="/admin/receipts" element={<ReceiptsAdminPage />} />
              <Route path="/admin/pdf-templates" element={<PdfTemplatesAdminPage />} />
              <Route path="/admin/quotes" element={<QuotesAdminPage />} />
              <Route path="/admin/messages" element={<MessagesAdminPage />} />
              <Route path="/admin/suppliers" element={<SuppliersAdminPage />} />
              <Route path="/admin/products" element={<ProductsAdminPage />} />
              <Route path="/admin/services" element={<ServicesAdminPage />} />
              <Route path="/admin/industries" element={<IndustriesAdminPage />} />
              <Route path="/admin/why-us" element={<WhyUsAdminPage />} />
              <Route path="/admin/process" element={<ProcessAdminPage />} />
              <Route path="/admin/media" element={<MediaAdminPage />} />
              <Route path="/admin/locations" element={<LocationsAdminPage />} />
              <Route path="/admin/assistant" element={<AssistantAdminPage />} />
              <Route path="/admin/blog" element={<BlogAdminPage />} />
              <Route path="/admin/testimonials" element={<TestimonialsAdminPage />} />
              <Route path="/admin/downloads" element={<DownloadsAdminPage />} />
              <Route path="/admin/settings" element={<SettingsAdminPage />} />
            </Route>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
          <AssistantWidget />
        </Suspense>
      </BrowserRouter>
    </SiteSettingsProvider>
    </ErrorBoundary>
  )
}
