/**
 * ChangePassword.jsx - 비밀번호 변경 페이지
 * 
 * 로그인한 사용자가 자신의 비밀번호를 변경합니다.
 * 현재 비밀번호를 검증한 후 새 비밀번호로 변경합니다.
 */

import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function ChangePassword() {
  const { api, user } = useAuth()
  const navigate = useNavigate()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // 비밀번호 일치 확인
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다')
      return
    }
    
    // 비밀번호 최소 길이
    if (newPassword.length < 4) {
      setError('새 비밀번호는 4자 이상이어야 합니다')
      return
    }
    
    setLoading(true)
    try {
      await api('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      setSuccess('비밀번호가 성공적으로 변경되었습니다')
      // 비밀번호 변경 후 로그아웃
      setTimeout(() => {
        // 성공 메시지 보이고 페이지 이동
        navigate('/')
      }, 1500)
    } catch (err) {
      setError(err.message || '비밀번호 변경에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[420px] w-full">
        <h2 className="text-xl mb-3 text-center">🔑 비밀번호 변경</h2>
        <p className="text-sm text-gray-500 mb-4 text-center">
          [{user?.username}]님
        </p>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">{error}</div>
          )}
          {success && (
            <div className="text-green-600 text-sm mb-3 p-2 bg-green-50 rounded">{success}</div>
          )}
          
          <div className="mb-3">
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
              현재 비밀번호
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
              required
              autoFocus
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
              새 비밀번호
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
              required
              placeholder="4자 이상"
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              새 비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
              required
              placeholder="비밀번호 다시 입력"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors disabled:opacity-50"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-cyan-500">
              ← 홈으로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword