/**
 * Dashboard.jsx - 관리자 대시보드 페이지 (Admin Dashboard)
 * 
 * 관리자가 로그인 후 보이는 메인 페이지입니다.
 * 각 관리 메뉴로 이동할 수 있는 링크 카드를 제공합니다.
 * 
 * [구성]
 * - 인트로 텍스트
 * - 7개의 메뉴 카드 (그리드 레이아웃)
 *   1. 공지사항 관리
 *   2. 취업 정보 관리
 *   3. 진학 정보 관리
 *   4. 학사 일정 관리
 *   5. 과제 일정 관리
 *   6. 실습실 점검 관리
 *   7. 자료실 관리
 * 
 * [디자인]
 * - grid-template-columns: 반응형 그리드 (최소 250px)
 * - 카드 클릭 시 해당 페이지로 이동 (React Router Link)
 * 
 * [참고]
 * - 이 페이지는 AdminGuard에 의해 보호됨
 * - 실제 데이터 조회는 각 관리자 페이지에서 수행
 */

import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Dashboard - 관리자 대시보드 컴포넌트
 */
function Dashboard() {
  return (
    <div className="p-2">
      <h1 className="text-2xl mb-1">⚙️ 관리자 패널</h1>
      <p className="text-gray-600 mb-5">좌측 메뉴를 선택하여 관리하세요.</p>

      <section>
        <h2 className="text-lg font-semibold mb-3">관리 메뉴</h2>
        {/* 메뉴 카드 그리드 (반응형) */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
          
          {/* 공지사항 관리 */}
          <Link to="/admin/notices" className="block p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 no-underline text-inherit">
            <h3 className="m-0 mb-2 text-base">📢 공지사항 관리</h3>
            <p className="m-0 text-sm text-gray-500">공지사항 작성, 수정, 삭제</p>
          </Link>
          
          {/* 취업 정보 관리 */}
          <Link to="/admin/careers" className="block p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 no-underline text-inherit">
            <h3 className="m-0 mb-2 text-base">💼 취업 정보 관리</h3>
            <p className="m-0 text-sm text-gray-500">취업 공고 작성, 수정, 삭제</p>
          </Link>
          
          {/* 진학 정보 관리 */}
          <Link to="/admin/admissions" className="block p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 no-underline text-inherit">
            <h3 className="m-0 mb-2 text-base">🎓 진학 정보 관리</h3>
            <p className="m-0 text-sm text-gray-500">진학 안내 작성, 수정, 삭제</p>
          </Link>
          
          {/* 실습실 점검 관리 */}
          <Link to="/admin/lab-inspections" className="block p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 no-underline text-inherit">
            <h3 className="m-0 mb-2 text-base">🔧 실습실 점검 관리</h3>
            <p className="m-0 text-sm text-gray-500">실습실 점검 게시판 관리</p>
          </Link>
          
          {/* 자료실 관리 */}
          <Link to="/admin/materials" className="block p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 no-underline text-inherit">
            <h3 className="m-0 mb-2 text-base">📚 자료실 관리</h3>
            <p className="m-0 text-sm text-gray-500">학습 자료 업로드, 수정, 삭제</p>
          </Link>

          {/* 수상/포트폴리오 관리 */}
          <Link to="/admin/awards" className="block p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 no-underline text-inherit">
            <h3 className="m-0 mb-2 text-base">🏆 수상/포트폴리오 관리</h3>
            <p className="m-0 text-sm text-gray-500">수상 내역, 포트폴리오 관리</p>
          </Link>

          {/* 계정 관리 */}
          <Link to="/admin/users" className="block p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 no-underline text-inherit">
            <h3 className="m-0 mb-2 text-base">👤 계정 관리</h3>
            <p className="m-0 text-sm text-gray-500">사용자 계정 생성, 수정, 삭제</p>
          </Link>

        </div>
      </section>
    </div>
  )
}

export default Dashboard