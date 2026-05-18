/**
 * AuthContext.jsx - 인증 컨텍스트 (Authentication Context)
 * 
 * 이 파일은 전체 앱의 인증 상태를 관리합니다.
 * 로그인/로그아웃, 사용자 정보, API 호출 시 토큰 자동 포함 등을 담당합니다.
 * 
 * 사용법: const { user, token, login, logout, api, isAdmin } = useAuth()
 * 
 * [주요 기능]
 * - 사용자 로그인/로그아웃 처리
 * - JWT 토큰 localStorage 관리
 * - 인증된 API 호출 래퍼 (토큰 자동 포함)
 * - 관리자 권한 확인 (isAdmin)
 * 
 * [참고] 현재는 단일 관리자 계정(admin)으로 운영됩니다.
 * 추후 학생별 계정 추가 시 roleBased Access Control을 확장할 수 있습니다.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

// 인증 컨텍스트 생성 (provider 없이 사용 불가)
const AuthContext = createContext(null)

/**
 * AuthProvider - 인증 상태를 제공하는 React 컴포넌트
 * App.jsx에서 전체 앱을 감싸서 사용합니다.
 * 
 * [	state ]
 * - user: 로그인한 사용자 정보 (null = 미로그인)
 * - token: JWT 토큰 (localStorage에서 자동 로드)
 * - loading: 초기 로딩 상태 (토큰 검증 완료 전)
 * 
 * [	methods ]
 * - login(username, password): 로그인 수행
 * - logout(): 로그아웃 수행
 * - api(url, options): 인증된 API 호출 (토큰 자동 포함)
 * - isAdmin: 관리자 여부 (user.role === 'admin')
 */
export function AuthProvider({ children }) {
  // JWT 토큰 상태 (localStorage에서 초기 로드)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  
  // 사용자 정보 상태 - token 있으면 즉시 설정 (JWT 디코딩)
  const [user, setUser] = useState(() => {
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return { id: payload.id, username: payload.username, role: payload.role, name: payload.name }
    } catch {
      return null
    }
  })
  
  // 초기 로딩 상태 (토큰 검증 완료 전까지 true)
  const [loading, setLoading] = useState(() => !token ? false : true)

  // 토큰 변경 시 사용자 정보 검증 (백그라운드)
  useEffect(() => {
    if (token) {
      // 토큰이 있으면 /api/auth/me 로 사용자 정보 조회 후 업데이트
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setUser(data)
          else logout()
        })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  /**
   * login - 로그인 함수
   * @param {string} username - 사용자명
   * @param {string} password - 비밀번호
   * @returns {Promise} 로그인 결과 데이터
   * 
   * [동작]
   * 1. /api/auth/login 으로 credentials 전송
   * 2. 성공 시 localStorage에 토큰 저장
   * 3. 사용자 정보 설정
   * 4. 실패 시 에러throw
   */
  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) {
        const text = await res.text()
        try {
          const errData = JSON.parse(text)
          throw new Error(errData.message || errData.error || text)
        } catch {
          throw new Error(text || '로그인 실패')
        }
      }
      const text = await res.text()
      if (!text) throw new Error('서버 응답이 없습니다')
      const data = JSON.parse(text)
      if (!data.token) throw new Error('토큰 없음')
      
      localStorage.setItem('token', data.token)
      setToken(data.token)
      if (data.user) setUser(data.user)
      return data
    } catch (err) {
      throw new Error(err.message || '로그인 실패')
    }
  }

  /**
   * logout - 로그아웃 함수
   * localStorage의 토큰 제거 및 상태 초기화
   */
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  /**
   * api - 인증된 API 호출 래퍼
   * @param {string} url - API 엔드포인트
   * @param {object} options - fetch 옵션
   * @returns {Promise} API 응답 데이터
   * 
   * [장점]
   * - 매번 Authorization 헤더를 수동으로 추가할 필요 없음
   * - 에러 응답 시 자동으로 예외throw
   * 
   * [사용 예]
   * const data = await api('/api/notices')           // GET
   * const data = await api('/api/notices', { method: 'POST', body: JSON.stringify(...) })
   */
  const api = async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (token) headers.Authorization = `Bearer ${token}`
    
    const res = await fetch(url, { ...options, headers })
    const text = await res.text()
    if (!text) throw new Error('서버 응답이 없습니다')
    const data = JSON.parse(text)
    if (!res.ok) throw new Error(data.error || 'API 오류')
    return data
  }

  // 컨텍스트 값 제공 (children에게 인증 상태 노출)
  // isAdmin: admin 또는 teacher 역할만 관리자 페이지 접근 가능
  const isAdmin = user?.role === 'admin' || user?.role === 'teacher'
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, api, isAdmin, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth - 인증 컨텍스트 사용 훅
 * 함수형 컴포넌트에서 인증 상태를 사용하려면 이 훅을 호출하세요.
 * 
 * [사용 예]
 * const { user, login, logout } = useAuth()
 * 
 * @returns {object} { user, token, loading, login, logout, api, isAdmin }
 */
export const useAuth = () => useContext(AuthContext)
