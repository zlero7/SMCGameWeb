import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import MainDashboard from './pages/MainDashboard'
import Notices from './pages/Notices'
import Careers from './pages/Careers'
import Admissions from './pages/Admissions'
import Calendar from './pages/Calendar'
import Assignments from './pages/Assignments'
import LabInspections from './pages/LabInspections'
import Materials from './pages/Materials'
import Awards from './pages/Awards'
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import NoticeManager from './pages/admin/NoticeManager'
import CareerManager from './pages/admin/CareerManager'
import AdmissionManager from './pages/admin/AdmissionManager'
import AssignmentManager from './pages/admin/AssignmentManager'
import LabInspectionManager from './pages/admin/LabInspectionManager'
import MaterialsManager from './pages/admin/MaterialsManager'
import AwardManager from './pages/admin/AwardManager'
import CalendarManager from './pages/admin/CalendarManager'
import UserManager from './pages/admin/UserManager'
import NotFound from './pages/NotFound'
import AdminGuard from './components/AdminGuard'
import AdminLayout from './components/AdminLayout'
import ErrorBoundary from './components/ErrorBoundary'
import TitleUpdater from './components/TitleUpdater'

/* ── 설정/사용자 메뉴 ── */
function UserMenu() {
  const { isLoggedIn, user, logout } = useAuth()
  const { isDark, toggleTheme, fontFamily, setFontFamily, fonts = [] } = useTheme()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [showFontModal, setShowFontModal] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-sm font-medium text-white/90 truncate max-w-[80px]">{user?.name || user?.username || '사용자'}</span>
        <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors text-xl min-w-[40px] min-h-[40px] flex items-center justify-center" title="설정">⚙️</button>

        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
            <div className="bg-white rounded-xl p-5 w-full max-w-xs shadow-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">설정</h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold text-gray-800">{user?.name || user?.username || '사용자'}</p>
                <p className="text-gray-500">@{user?.username}</p>
                <p className="text-gray-500 text-xs mt-1">역할: {user?.role === 'admin' ? '관리자' : user?.role === 'teacher' ? '교사' : '학생'}</p>
              </div>
              <div className="space-y-1">
                <button onClick={() => { setShowSettings(false); navigate('/change-password') }} className="w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 text-sm">비밀번호 변경</button>
                <button onClick={() => { setShowSettings(false); toggleTheme() }} className="w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 flex items-center justify-between text-sm">
                  <span>테마 설정</span><span>{isDark ? '🌙' : '☀️'}</span>
                </button>
                <button onClick={() => setShowFontModal(true)} className="w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 flex items-center justify-between text-sm">
                  <span>글꼴 설정</span><span>🔤</span>
                </button>
                {(user?.role === 'admin' || user?.role === 'teacher') && (
                  <button onClick={() => { setShowSettings(false); navigate('/admin') }} className="w-full px-4 py-3 text-left rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-between text-sm">
                    <span>관리자 페이지</span><span>🛠️</span>
                  </button>
                )}
                <button onClick={() => { setShowSettings(false); handleLogout() }} className="w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 text-red-600 text-sm">로그아웃</button>
              </div>
            </div>
          </div>
        )}

        {showFontModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFontModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-5 pt-5"><h3 className="text-xl font-bold mb-4 text-center">글꼴 선택</h3></div>
              <div className="flex-1 overflow-y-auto px-5">
                <div className="space-y-2 pb-3">
                  {fonts.map(font => (
                    <button key={font.id} onClick={() => { setFontFamily(font.id); setShowFontModal(false) }}
                      style={{ fontFamily: font.family, borderRadius: '0.75rem' }}
                      className={`w-full px-4 py-3 text-left border-2 transition-all ${fontFamily === font.family ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <span className="text-base">{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-5">
                <button onClick={() => setShowFontModal(false)} className="w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium">취소</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link to="/login" className="px-3 py-2 rounded-lg bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-400 transition-colors no-underline min-h-[40px] flex items-center">로그인</Link>
  )
}

/* ── 일반(퍼블릭) 레이아웃 ── */
function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'nav-link-active text-cyan-400 font-bold no-underline text-sm border-b-2 border-cyan-400 pb-1'
      : 'nav-link no-underline text-white/70 font-medium text-sm hover:text-cyan-400 pb-1 transition-all duration-200'

  const mobileNavLinkClass = ({ isActive }) =>
    isActive
      ? 'block px-4 py-3 text-cyan-400 font-bold no-underline text-sm bg-white/10 rounded-lg'
      : 'block px-4 py-3 text-white/80 font-medium no-underline text-sm hover:bg-white/10 rounded-lg transition-colors'

  const navItems = [
    { to: '/', label: '홈', exact: true },
    { to: '/notices', label: '공지사항' },
    { to: '/careers', label: '취업' },
    { to: '/admissions', label: '진학' },
    { to: '/calendar', label: '학사달력' },
    { to: '/assignments', label: '과제일정' },
    { to: '/lab-inspections', label: '실습실 점검' },
    { to: '/materials', label: '자료실' },
    { to: '/awards', label: '수상/포트폴리오' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1c2438]">
        {/* 메인 헤더 바 */}
        <div className="flex items-center px-4 py-3 gap-3">
          {/* 로고 */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="로고" className="h-8 align-middle" />
            <Link to="/" className="no-underline" onClick={() => setMobileMenuOpen(false)}>
              <h1 className="text-xs uppercase tracking-widest m-0 text-white font-bold hidden sm:block">세명컴고 게임과 포털</h1>
              <h1 className="text-xs uppercase tracking-widest m-0 text-white font-bold sm:hidden">세명컴고</h1>
            </Link>
          </div>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden lg:flex flex-1 justify-center gap-4 items-center" aria-label="메인 네비게이션">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>{label}</NavLink>
            ))}
          </nav>

          {/* 오른쪽: 유저메뉴 + 햄버거 */}
          <div className="ml-auto flex items-center gap-2">
            <UserMenu />
            {/* 햄버거 버튼 (모바일/태블릿) */}
            <button
              className="lg:hidden p-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="메뉴"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-white/10 px-3 py-2 grid grid-cols-2 gap-1" aria-label="모바일 네비게이션">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 px-3 sm:px-6 pt-4 pb-8 bg-[#f0f2f8]">
        <Outlet />
      </main>
    </div>
  )
}

/* ── 앱 루트 ── */
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <TitleUpdater />
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<Dashboard />} />
                <Route path="notices" element={<NoticeManager />} />
                <Route path="careers" element={<CareerManager />} />
                <Route path="admissions" element={<AdmissionManager />} />
                <Route path="calendar" element={<CalendarManager />} />
                <Route path="assignments" element={<AssignmentManager />} />
                <Route path="lab-inspections" element={<LabInspectionManager />} />
                <Route path="materials" element={<MaterialsManager />} />
                <Route path="awards" element={<AwardManager />} />
                <Route path="users" element={<UserManager />} />
              </Route>

              <Route element={<PublicLayout />}>
                <Route path="/" element={<MainDashboard />} />
                <Route path="/notices" element={<Notices />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/admissions" element={<Admissions />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/lab-inspections" element={<LabInspections />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/awards" element={<Awards />} />
                <Route path="/login" element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
