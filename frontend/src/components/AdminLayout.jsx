/**
 * AdminLayout.jsx - 관리자 레이아웃 (Admin Layout)
 * 
 * 관리자 페이지의 좌측 사이드바와 메인 컨텐츠 영역을 제공하는 레이아웃 컴포넌트입니다.
 * 모든 관리자 페이지의 공통 구조를 담당합니다.
 * 
 * [구조]
 * - 좌측: 흰색 사이드바 (메뉴 + 로그아웃)
 * - 우측: 메인 컨텐츠 영역 (Outlet을 통한 동적 페이지 렌더링)
 * 
 * [메뉴 항목]
 * - 대시보드: 관리자 메인 화면
 * - 공지사항: 공지사항 CRUD
 * - 취업 정보: 취업 공고 CRUD
 * - 진학 정보: 진학 정보 CRUD
 * - 학사 일정: 일정 관리
 * - 과제 일정: 과제 관리
 * - 실습실 점검: 학생 참여 가능 (사용자 요청)
 * 
 * [디자인]
 * - 사이드바: 흰색 배경 (#ffffff), 깔끔한 느낌
 * - 활성 메뉴: 청록색 하이라이트 (#00d4ff)
 * - 아이콘 + 텍스트 조합
 * 
 * [참고]
 * - 이 컴포넌트는 AdminGuard에 의해 자동 감싸집니다
 * - Outlet을 통해 자식 라우트가 렌더링됩니다
 */

import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * AdminLayout - 관리자 레이아웃 컴포넌트
 * React Router의 Outlet을 통해 자식 라우트를 메인 영역에 렌더링합니다.
 * 
 * [동작]
 * 1. 좌측 사이드바: 현재 경로에 따라 메뉴 활성화 상태 변경
 * 2. 하단: 현재 사용자 정보 + 로그아웃 버튼
 * 3. 우측: Outlet이 자식 라우트로 대체됨
 */
function AdminLayout() {
  // 인증 컨텍스트에서 사용자 정보 및 로그아웃 함수 가져오기
  const { user, logout } = useAuth()
  const location = useLocation()

  // 관리자 메뉴 목록 (경로 + 라벨 + 아이콘)
  const menuItems = [
    { path: '/admin', label: '대시보드', icon: '⚙️' },
    { path: '/admin/notices', label: '공지사항', icon: '📢' },
    { path: '/admin/careers', label: '취업 정보', icon: '💼' },
    { path: '/admin/admissions', label: '진학 정보', icon: '🎓' },
    { path: '/admin/lab-inspections', label: '실습실 점검', icon: '🔧' },
    { path: '/admin/materials', label: '자료실', icon: '📚' },
    { path: '/admin/awards', label: '수상/포트폴리오', icon: '🏆' },
    { path: '/admin/users', label: '계정 관리', icon: '👤' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* 좌측 사이드바 - 흰색 배경 */}
      <aside className="w-60 bg-white text-gray-800 p-5 flex flex-col border-r border-gray-200">
        {/* 네비게이션 메뉴 */}
        <nav className="flex-1">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 rounded-lg mb-1 no-underline transition-all ${
                location.pathname === item.path 
                  ? 'text-cyan-400 bg-cyan-400/10 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-100 font-normal'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* 하단: 사용자 정보 + 로그아웃 */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500 mb-2">
            {user?.username} ({user?.role})
          </div>
          <button onClick={logout} className="w-full py-2.5 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors">
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 (자식 라우트가 렌더링됨) */}
      <main className="flex-1 p-5 bg-gray-100 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout