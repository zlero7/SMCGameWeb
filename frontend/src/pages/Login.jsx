/**
 * Login.jsx - 일반 로그인 페이지
 * 
 * 학생/교사/관리자 모두 로그인 가능한 페이지입니다.
 * admin/teacher는 관리자 페이지로, student는 홈으로 이동합니다.
 */

import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      
      // 권한에 따라 이동
      if (data?.user?.role === 'admin' || data?.user?.role === 'teacher') {
        navigate('/admin')
      } else {
        navigate('/')
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
        <h2 className="text-xl mb-3 text-center">🔐 로그인</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">{error}</div>}
          
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
          
          <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors disabled:opacity-50">
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {/* 관리자 페이지 링크 */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <Link to="/admin/login" className="text-sm text-gray-500 hover:text-cyan-500">
              관리자 로그인 →
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login