/**
 * LabInspections.jsx - 실습실 점검 페이지 (Lab Inspection Page)
 * 
 * 학생들이 실습실의 문제점을 보고하는 페이지입니다.
 * 모든 사용자가 글을 작성할 수 있고, 관리자가 상태를 관리합니다.
 * 
 * [주요 기능]
 * - 점검 목록 조회 (모든 사용자가 가능)
 * - 글 작성 (모든 사용자가 가능)
 * - 상태 표시 (pending/planned/completed)
 * 
 * [상태 (status)]
 * - pending: 처리 이전 (빨강) - 새로운 보고
 * - planned: 처리 예정 (주황) - 관리자가 확인
 * - completed: 처리 완료 (초록) - 문제 해결
 * 
 * [사용 컴포넌트]
 * - AccordionCard: 상세 내용을 모달로 표시
 * - 모달 폼: 글 작성용
 * 
 * [API]
 * - GET /api/lab-inspections (목록 조회)
 * - POST /api/lab-inspections (글 작성 - 인증 불필요)
 * 
 * [참고]
 * - 이 페이지는 일반 사용자도 접근 가능 (인증 불필요)
 * - 관리자는 별도의 LabInspectionManager에서 상태 관리
 */

import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchLabInspections, API_BASE } from '../services/api'
import AccordionCard from '../components/AccordionCard'
import PageBanner from '../components/PageBanner'

/**
 * LabInspections - 실습실 점검 페이지 컴포넌트
 */
function LabInspections() {
  const { isLoggedIn, user, token } = useAuth()
  // 목록 상태
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 폼 상태 (모달용)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', author: '' })
  const [submitting, setSubmitting] = useState(false)

  // 페이지 로드 시 목록 조회
  useEffect(() => {
    loadInspections()
  }, [])

  /**
   * loadInspections - 목록 조회
   */
  const loadInspections = () => {
    fetchLabInspections()
      .then(data => setInspections(data.data || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  /**
   * handleSubmit - 글 작성 (로그인 필수)
   */
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
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/lab-inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, author: user?.name || user?.username || '학생' })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }
      // 폼 초기화 및 목록 갱신
      setForm({ title: '', content: '', author: '' })
      setShowForm(false)
      loadInspections()
      alert('작성되었습니다!')
    } catch (err) {
      alert('작성 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * handleCloseForm - 폼 닫기 (모달)
   */
  const handleCloseForm = () => {
    setShowForm(false)
    setForm({ title: '', content: '', author: '' })
  }

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <>
      <PageBanner
        icon="🔧"
        title="실습실 점검"
        subtitle="실습실 점검 현황을 확인하고 문제를 보고하세요"
        right={
          <button onClick={() => { if (!isLoggedIn) { alert('로그인이 필요한 작업입니다.'); return; } setShowForm(true) }}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-400 transition-colors">
            글 작성
          </button>
        }
      />
      <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5">

      {/* 목록 */}
      {inspections.length === 0 ? (
        <p>등록된 점검 사항이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {inspections.map(item => (
            <AccordionCard
              key={item.id}
              title={item.title}
              content={item.content}
              date={item.createdAt}
              status={item.status}
              author={item.author}
            />
          ))}
        </div>
      )}

      {/* 글 작성 모달 폼 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={handleCloseForm}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-[600px] max-h-[90vh] overflow-auto shadow-[0_4px_20px_rgba(0,0,0,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h2 className="m-0 text-lg font-bold">실습실 점검 작성</h2>
              <button onClick={handleCloseForm} className="p-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="제목"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9]"
                required
              />
              <textarea
                placeholder="내용"
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9]"
                rows={5}
                required
              />
              <button type="submit" disabled={submitting} className="w-full py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors disabled:opacity-50">
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

export default LabInspections