/**
 * AdminGuard.jsx - 관리자 접근 가드 (Admin Access Guard)
 * 
 * 관리자 페이지에 접근할 때 권한을 확인하는 컴포넌트입니다.
 * 관리자가 아닌 사용자는 로그인 페이지로 리다이렉트됩니다.
 * 
 * [동작 방식]
 * 1. AuthContext에서 isAdmin, loading 상태 확인
 * 2. 로딩 중이면 "관리자 권한 확인 중..." 표시
 * 3. 관리자가 아니면 /admin/login 로 리다이렉트
 * 4. 관리자면 자식 컴포넌트 렌더링 (AdminLayout 포함)
 * 
 * [사용법]
 * <AdminGuard>
 *   <AdminPageComponent />
 * </AdminGuard>
 * 
 * [참고]
 * - AdminLayout도 이 컴포넌트 안에 포함되어 있습니다
 * - useAuth() 훅을 통해 인증 상태 확인
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLayout from './AdminLayout'

/**
 * AdminGuard - 관리자 권한 확인 컴포넌트
 * @param {ReactNode} children - 자식 컴포넌트 (관리자 페이지)
 * 
 * [주요 로직]
 * - loading: 로딩 중에는 AdminLayout + 로딩 메시지 표시
 * - !isAdmin: 관리자가 아니면 로그인 페이지로 리다이렉트
 * - isAdmin: 관리자면 AdminLayout으로 감싸서 자식 렌더링
 */
export default function AdminGuard({ children }) {
  // AuthContext에서 상태 가져오기
  const { isAdmin, loading } = useAuth()
  const location = useLocation()

  // 로딩 중: 관리자 권한 확인 중
  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-admin" style={{ padding: 20, textAlign: 'center' }}>관리자 권한 확인 중...</div>
      </AdminLayout>
    )
  }
  
  // 관리자 아닌 경우: 로그인 페이지로 리다이렉트
  // state.from에 현재 경로를 저장해 로그인 후 원래 페이지로 복귀 가능
  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  
  // 관리자: AdminLayout으로 감싸서 자식 렌더링
  return <AdminLayout>{children}</AdminLayout>
}
