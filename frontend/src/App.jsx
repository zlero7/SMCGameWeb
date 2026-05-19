import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom'
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

// 로그인/로그아웃 메뉴 컴포넌트
function UserMenu() {
  const { isLoggedIn, user, logout } = useAuth()
  const { isDark, toggleTheme, fontFamily, setFontFamily, fonts = [] } = useTheme()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [showFontModal, setShowFontModal] = useState(false)


  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // token만 있으면 바로 표시 (user 정보는 나중에 업데이트)
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">{user?.name || user?.username || '사용자'}</span>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors text-xl"
          title="설정"
        >
          ⚙️
        </button>
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
            <div className="bg-white rounded-xl p-6 w-80 shadow-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">설정</h3>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold text-gray-800">{user?.name || user?.username || '사용자'}</p>
                <p className="text-gray-500">@{user?.username}</p>
                <p className="text-gray-500 text-xs mt-1">역할: {user?.role === 'admin' ? '관리자' : user?.role === 'teacher' ? '교사' : '학생'}</p>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => { setShowSettings(false); navigate('/change-password'); }}
                  className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-100"
                >
                  비밀번호 변경
                </button>
                <button 
                  onClick={() => { setShowSettings(false); toggleTheme(); }}
                  className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>테마 설정</span>
                  <span>{isDark ? '🌙' : '☀️'}</span>
                </button>
                <button 
                  onClick={() => setShowFontModal(true)}
                  className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>글꼴 설정</span>
                  <span>🔤</span>
                </button>
                <button 
                  onClick={() => { setShowSettings(false); handleLogout(); }}
                  className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-100 text-red-600"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 글꼴 선택 모달 */}
        {showFontModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFontModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-[28rem] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-6 pt-6">
                <h3 className="text-xl font-bold mb-5 text-center">글꼴 선택</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-3 pb-3">
                  {fonts.map(font => (
                    <button
                      key={font.id}
                      onClick={() => { setFontFamily(font.id); setShowFontModal(false); }}
                      style={{ 
                        fontFamily: font.family,
                        borderRadius: '0.75rem'
                      }}
                      className={`w-full px-5 py-4 text-left border-2 transition-all hover:scale-[1.02] ${
                        fontFamily === font.family 
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-6">
                <button 
                  onClick={() => setShowFontModal(false)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link 
      to="/login" 
      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600 transition-colors"
    >
      로그인
    </Link>
  )
}

function App() {
  const navLinkClass = ({ isActive }) => 
    isActive ? 'text-gray-800 font-bold no-underline text-sm border-b-2 border-gray-400 pb-1' 
             : 'no-underline text-gray-800 font-semibold text-sm hover:text-gray-600 hover:border-b-2 hover:border-gray-300 pb-1 transition-all duration-200'

  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <BrowserRouter>
          <TitleUpdater />
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="로고" className="h-10 mr-3 align-middle" />
                <Link to="/" className="no-underline text-inherit">
                  <h1 className="text-sm uppercase tracking-widest m-0 text-gray-800">세명컴고 게임과 포털</h1>
                </Link>
              </div>
              <nav className="flex gap-4.5 items-center" aria-label="메인 네비게이션">
                <NavLink to="/" className={navLinkClass}>홈</NavLink>
                <NavLink to="/notices" className={navLinkClass}>공지사항</NavLink>
                <NavLink to="/careers" className={navLinkClass}>취업</NavLink>
                <NavLink to="/admissions" className={navLinkClass}>진학</NavLink>
                <NavLink to="/calendar" className={navLinkClass}>학사달력</NavLink>
                <NavLink to="/assignments" className={navLinkClass}>과제일정</NavLink>
                <NavLink to="/lab-inspections" className={navLinkClass}>실습실 점검</NavLink>
                <NavLink to="/materials" className={navLinkClass}>자료실</NavLink>
                <NavLink to="/awards" className={navLinkClass}>수상/포트폴리오</NavLink>
              </nav>
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">
                <UserMenu />
              </div>
            </header>
            <main className="w-[min(1200px,92%)] mx-auto pt-5">
              <Routes>
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
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/admin" element={
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                }>
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
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
    </AuthProvider>
  )
}

export default App
