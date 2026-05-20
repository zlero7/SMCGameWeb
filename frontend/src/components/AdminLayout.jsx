import React, { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menuGroups = [
  {
    label: '메인',
    items: [
      { path: '/admin', label: '대시보드', exact: true, icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )},
    ]
  },
  {
    label: '콘텐츠',
    items: [
      { path: '/admin/notices', label: '공지사항', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )},
      { path: '/admin/careers', label: '취업 정보', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )},
      { path: '/admin/admissions', label: '진학 정보', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      )},
      { path: '/admin/awards', label: '수상/포트폴리오', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )},
    ]
  },
  {
    label: '학사',
    items: [
      { path: '/admin/calendar', label: '학사 일정', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )},
      { path: '/admin/assignments', label: '과제 일정', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )},
      { path: '/admin/lab-inspections', label: '실습실 점검', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )},
      { path: '/admin/materials', label: '자료실', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )},
    ]
  },
  {
    label: '관리',
    items: [
      { path: '/admin/users', label: '계정 관리', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )},
    ]
  },
]

function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  }

  const handleLogout = () => { logout(); navigate('/') }

  const handleNavClick = () => {
    setSidebarOpen(false)
  }

  const pageTitle = (() => {
    const flat = menuGroups.flatMap(g => g.items)
    return flat.find(i => isActive(i))?.label || '관리자 패널'
  })()

  const SidebarContent = ({ onLinkClick }) => (
    <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">세명컴고</div>
          <div className="text-cyan-400 text-xs">게임과 포털</div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto lg:hidden p-1 rounded text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {menuGroups.map(group => (
          <div key={group.label} className="mb-3">
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              {group.label}
            </div>
            {group.items.map(item => {
              const active = isActive(item)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 no-underline transition-all
                    ${active ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(user?.name || user?.username || 'A')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name || user?.username}</div>
            <div className="text-gray-400 text-xs">{user?.role === 'admin' ? '관리자' : user?.role === 'teacher' ? '교사' : '학생'}</div>
          </div>
          <button onClick={handleLogout} title="로그아웃" className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#f0f2f8] overflow-hidden">

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 모바일 드로어 사이드바 */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1c2438] flex flex-col transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onLinkClick={handleNavClick} />
      </aside>

      {/* 데스크탑 사이드바 */}
      <aside className={`hidden lg:flex flex-col bg-[#1c2438] transition-all duration-300 shrink-0 ${desktopCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          {!desktopCollapsed && (
            <div>
              <div className="text-white font-bold text-sm leading-tight">세명컴고</div>
              <div className="text-cyan-400 text-xs">게임과 포털</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuGroups.map(group => (
            <div key={group.label} className="mb-4">
              {!desktopCollapsed && (
                <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">{group.label}</div>
              )}
              {group.items.map(item => {
                const active = isActive(item)
                return (
                  <Link key={item.path} to={item.path} title={desktopCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 no-underline transition-all
                      ${active ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
                      ${desktopCollapsed ? 'justify-center' : ''}`}>
                    <span className="shrink-0">{item.icon}</span>
                    {!desktopCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                    {active && !desktopCollapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className={`flex items-center gap-3 ${desktopCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(user?.name || user?.username || 'A')[0].toUpperCase()}
            </div>
            {!desktopCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{user?.name || user?.username}</div>
                  <div className="text-gray-400 text-xs">{user?.role === 'admin' ? '관리자' : user?.role === 'teacher' ? '교사' : '학생'}</div>
                </div>
                <button onClick={handleLogout} title="로그아웃" className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* 모바일: 햄버거, 데스크탑: 토글 */}
            <button
              onClick={() => { if (window.innerWidth >= 1024) setDesktopCollapsed(v => !v); else setSidebarOpen(v => !v) }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 hidden sm:block">관리자</span>
              <svg className="w-4 h-4 text-gray-300 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-semibold text-gray-700 text-sm">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 no-underline transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              사이트
            </Link>
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              {(user?.name || user?.username || 'A')[0].toUpperCase()}
            </div>
            <div className="hidden md:block text-sm">
              <div className="font-semibold text-gray-700 leading-tight">{user?.name || user?.username}</div>
              <div className="text-xs text-gray-400">{user?.role === 'admin' ? 'Administrator' : user?.role}</div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="로그아웃">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
