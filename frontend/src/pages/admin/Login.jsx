/**
 * Login.jsx - 관리자 로그인 페이지 (Admin Login Page)
 * 
 * 관리자 계정으로 로그인하는 페이지입니다.
 * 일반 사용자는 접근 불가하며, admin role만 허용됩니다.
 * 
 * [동작 방식]
 * 1. 사용자가 아이디/비밀번호 입력
 * 2. AuthContext.login() 호출
 * 3. 성공 시 role 확인 → admin이면 /admin으로 이동
 * 4. 실패 시 에러 메시지 표시
 * 
 * [로그인 정보]
 * - 아이디: admin
 * - 비밀번호: admin1234
 * 
 * [참고]
 * - form-input, form-button CSS 클래스 사용
 * - 에러 발생 시 error-message 클래스 사용
 * - 로딩 중 버튼 비활성화
 */

import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

/**
 * Login - 관리자 로그인 컴포넌트
 */
function Login() {
  // AuthContext에서 login 함수 가져오기
  const { login } = useAuth()
  const navigate = useNavigate()
  
  // 폼 상태
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  // 상태 메시지
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

/**
    * handleSubmit - 로그인 처리
    * 
    * [동작]
    * 1. 기본 에러 초기화
    * 2. 로딩 상태 설정
    * 3. login() 호출하여 인증
    * 4. 성공 시 role 확인 후 페이지 이동
    * 5. 실패 시 에러 메시지 표시
    */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      
      console.log('Login result:', data)  // 디버그용
      
      // 관리자/교사 권한 확인
      if (data?.user?.role === 'admin' || data?.user?.role === 'teacher') {
        // 즉시 이동 (setTimeout 제거)
        navigate('/admin')
      } else {
        setError('관리자 권한이 필요합니다.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[420px] w-full">
        <h2 className="text-xl mb-3 text-center">🔐 관리자 로그인</h2>
        <form onSubmit={handleSubmit}>
          {/* 에러 메시지 */}
          {error && <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">{error}</div>}
          
          {/* 아이디 입력 */}
          <div className="mb-3">
            <label htmlFor="username" className="block text-sm font-medium mb-1">아이디</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
              required
              autoFocus
            />
          </div>
          
          {/* 비밀번호 입력 */}
          <div className="mb-3">
            <label htmlFor="password" className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
              required
            />
          </div>
          
          {/* 제출 버튼 */}
          <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors disabled:opacity-50">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
