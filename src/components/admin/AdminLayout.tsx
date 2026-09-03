import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  Building2,
  ClipboardList,
  FileDown,
  FileText,
  HardDrive,
  Home as HomeIcon,
  Image as ImageIcon,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Newspaper,
  Package,
  Receipt,
  Rows3,
  Settings as SettingsIcon,
  Sparkles,
  Star,
  Truck,
  LayoutTemplate,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COMPANY, cn } from '@/lib/utils'
import { useSiteSettings } from '@/lib/siteData'
import AdminSearch from '@/components/admin/AdminSearch'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/home', label: 'Home Page', icon: HomeIcon },
  { to: '/admin/pages', label: 'Site Pages', icon: LayoutTemplate },
  { to: '/admin/footer', label: 'Footer', icon: Rows3 },
  { to: '/admin/uploads', label: 'Storage Manager', icon: HardDrive },
  { to: '/admin/quotes', label: 'Quote Requests', icon: ClipboardList },
  { to: '/admin/receipts', label: 'Receipts', icon: Receipt },
  { to: '/admin/pdf-templates', label: 'PDF Templates', icon: FileText },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/suppliers', label: 'Supplier Registrations', icon: Truck },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/services', label: 'Services', icon: Sparkles },
  { to: '/admin/industries', label: 'Industries', icon: Building2 },
  { to: '/admin/why-us', label: 'Why Choose Us', icon: Sparkles },
  { to: '/admin/process', label: 'Process Steps', icon: ListOrdered },
  { to: '/admin/media', label: 'Media Library', icon: ImageIcon },
  { to: '/admin/locations', label: 'Locations', icon: MapPin },
  { to: '/admin/assistant', label: 'Assistant Q&A', icon: Bot },
  { to: '/admin/blog', label: 'Blog & Insights', icon: Newspaper },
  { to: '/admin/testimonials', label: 'Testimonials', icon: Star },
  { to: '/admin/downloads', label: 'Downloads', icon: FileDown },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logo_url } = useSiteSettings()

  const current = NAV.find((n) => location.pathname.startsWith(n.to))

  const logout = async () => {
    await supabase.auth.signOut()
    void navigate('/admin/login', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-navy-800 via-navy-700 to-navy-900">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg overflow-hidden">
          <img src={logo_url || 'https://dkbzvndtolkvuuxeaooh.supabase.co/storage/v1/object/public/media/branding/1788397307996-wb35sl.jpg'} alt={COMPANY.name} className="h-full w-auto object-contain" />
        </span>
        <div>
          <p className="font-display text-sm font-bold text-white">GNAB Admin</p>
          <p className="text-[11px] text-navy-100/60">Business Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-navy-100/70 hover:bg-white/5 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gold-400"
                  />
                )}
                <item.icon size={17} className={isActive ? 'text-gold-400' : ''} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-navy-100/70 transition-all hover:bg-red-500/15 hover:text-red-300"
        >
          <LogOut size={17} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-mist">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-navy-900/50 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-gray-100 glass">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="rounded-xl p-2 text-navy transition-colors hover:bg-navy-50 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <h1 className="font-display text-base font-bold text-navy">{current?.label ?? 'Admin'}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <AdminSearch />
              <a
                href="/"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-ink-light transition-colors hover:bg-navy-50 hover:text-navy sm:block"
              >
                View Site
              </a>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-500 font-display text-sm font-bold text-white">
                G
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PageIntro({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-ink-light">{description}</p>}
      </div>
      {action}
    </div>
  )
}
