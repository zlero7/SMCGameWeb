/**
 * Assignments.jsx - 과제 일정 페이지 (Assignment Schedule Page)
 * 
 * 학생들이 과제를 확인하고 작성하는 페이지입니다.
 * 모든 사용자가 글을 작성하고 삭제할 수 있습니다.
 * 
 * [주요 기능]
 * - 과제 목록 조회 (모든 사용자가 가능)
 * - 글 작성 (모든 사용자가 가능)
 * - 글 삭제 (모든 사용자가 가능)
 * 
 * [사용 컴포넌트]
 * - AccordionCard: 상세 내용을 모달로 표시
 * - 모달 폼: 글 작성용
 * 
 * [API]
 * - GET /api/assignments (목록 조회)
 * - POST /api/assignments (글 작성 - 인증 불필요)
 * - DELETE /api/assignments/:id (글 삭제 - 인증 불필요)
 */

import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAssignments } from '../services/api'
import AccordionCard from '../components/AccordionCard'
import PageBanner from '../components/PageBanner'

/**
 * Assignments - 과제 일정 페이지 컴포넌트
 */
function Assignments() {
  const { isLoggedIn, user, token } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 폼 상태 (모달용)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', dueDate: '', author: '' })
  const [submitting, setSubmitting] = useState(false)

  // 페이지 로드 시 목록 조회
  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = () => {
    fetchAssignments()
      .then(data => setAssignments(data.data || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  // 글 작성 (로그인 필수)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      alert('로그인 후 글 작성 가능합니다.')
      return
    }
    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    if (!form.dueDate) {
      alert('마감일을 선택해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, dueDate: new Date(form.dueDate).toISOString(), author: user?.name || user?.username || '학생' })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }
      setForm({ title: '', content: '', dueDate: '', author: '' })
      setShowForm(false)
      loadAssignments()
      alert('작성되었습니다!')
    } catch (err) {
      alert('작성 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 글 삭제 (로그인 필수)
  const handleDelete = async (id) => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 작업입니다.')
      return
    }
    if (!confirm('삭제하시겠습니까?')) return
    try {
      const response = await fetch(`/api/assignments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }
      loadAssignments()
      alert('삭제되었습니다!')
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setForm({ title: '', content: '', dueDate: '', author: '' })
  }

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <>
      <PageBanner
        icon="📝"
        title="과제 일정"
        subtitle="과제 마감일과 일정을 확인하세요"
        right={
          <button onClick={() => { if (!isLoggedIn) { alert('로그인이 필요한 작업입니다.'); return; } setShowForm(true) }}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-400 transition-colors">
            글 작성
          </button>
        }
      />
      <div className="bg-white rounded-2xl shadow-sm p-5">
      
      {assignments.length === 0 ? (
        <p>등록된 과제가 없습니다.</p>
      ) : (
        <div className="mt-4">
          {assignments.map(a => (
            <div key={a.id} className="border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => {/* AccordionCard 대신 직접 렌더링 */}}>
                  <AccordionCard 
                    title={a.title}
                    content={a.description}
                    date={a.dueDate}
                    author={a.author}
                  />
                </div>
                <button 
                  onClick={() => handleDelete(a.id)}
                  className="ml-2 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
              {a.author && <div className="text-gray-500 text-xs mt-1">작성자: {a.author}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 글 작성 모달 폼 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseForm}>
          <div className="bg-white rounded-xl p-6 max-w-[600px] w-[90%] max-h-[90vh] overflow-auto shadow-[0_4px_20px_rgba(0,0,0,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="m-0 text-xl">과제 작성</h2>
              <button onClick={handleCloseForm} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">취소</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="제목"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                required
              />
              <textarea
                placeholder="내용"
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                rows={5}
                required
              />
              <label className="block text-xs text-gray-500 mb-1 ml-1">마감일</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                required
              />
              <button type="submit" disabled={submitting} className="w-full mt-2 px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors disabled:opacity-50">
                {submitting ? '작성 중...' : '등록하기'}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default Assignments