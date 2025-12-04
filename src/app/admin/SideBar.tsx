import Link from 'next/link'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '#/stores/auth'
import { authApi } from '@/lib/auth/authApi'

interface NavLink {
  display: string
  path: string
  icon: React.ReactNode
  category?: string
}

const navLinks: NavLink[] = [
  // Dashboard
  { display: 'Dashboard', path: '/admin/dashboard', icon: <i className="ri-home-line"></i>, category: 'main' },
  
  // Tours Management
  { display: 'Tours', path: '/admin/tours', icon: <i className="ri-bus-line"></i>, category: 'tours' },
  
  // Bookings
  { display: 'Đặt tour', path: '/admin/bookings', icon: <i className="ri-calendar-check-line"></i>, category: 'bookings' },
  
  // Users
  { display: 'Người dùng', path: '/admin/users', icon: <i className="ri-team-line"></i>, category: 'users' },
  
  // Content Management
  { display: 'Blog', path: '/admin/blog', icon: <i className="ri-newspaper-line"></i>, category: 'content' },
  { display: 'Đánh giá', path: '/admin/reviews', icon: <i className="ri-star-line"></i>, category: 'content' },
  
  // Leaders
  { display: 'Leader', path: '/admin/leaders', icon: <i className="ri-user-star-line"></i>, category: 'operations' },
  { display: 'Chat', path: '/admin/chat', icon: <i className="ri-message-3-line"></i>, category: 'operations' },
  // { display: 'Thanh toán', path: '/admin/payments', icon: <i className="ri-bank-card-line"></i>, category: 'operations' },
]

const SideBar = () => {
  const router = useRouter()
  const resetAuth = useAuthStore((state: any) => state.resetAuth)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      resetAuth()
      router.push('/auth/login')
    }
  }

  const groupedLinks = navLinks.reduce((acc, link) => {
    const cat = link.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(link)
    return acc
  }, {} as Record<string, NavLink[]>)

  const categoryLabels: Record<string, string> = {
    main: 'CHÍNH',
    tours: 'QUẢN LÝ TOUR',
    bookings: 'ĐẶT TOUR',
    users: 'NGƯỜI DÙNG',
    content: 'NỘI DUNG',
    catalog: 'DANH MỤC',
    operations: 'HOẠT ĐỘNG',
  }

  const categoryOrder = ['main', 'tours', 'bookings', 'users', 'content', 'catalog', 'operations']

  return (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="border-b border-slate-200 px-6 py-6">
        <img src="/logo.svg" alt="Logo" className='h-10 w-auto' />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {categoryOrder.map(category => {
          const links = groupedLinks[category]
          if (!links) return null
          
          return (
            <div key={category}>
              {category !== 'main' && (
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {categoryLabels[category]}
                </div>
              )}
              <div className="space-y-1">
                {links.map(({ display, path, icon }) => (
                  <Link
                    key={path}
                    href={path}
                    className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <span className="h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:text-emerald-600">
                      {icon}
                    </span>
                    <span>{display}</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
        <button 
          onClick={handleLogout}
          className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

export default SideBar
