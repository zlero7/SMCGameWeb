/**
 * AssignmentManager.jsx - 과제 일정 관리 페이지 (Assignment Manager)
 * 
 * 관리자가 과제 일정을 관리하는 페이지입니다.
 * 학생들이 보는 과제 일정과 동일한 데이터를 관리합니다.
 * 
 * [주요 기능]
 * - 과제 등록 (과목명, 과제명, 마감일, 설명)
 * - 과제 목록 조회 (마감일순 정렬)
 * - 과제 수정
 * - 과제 삭제
 * - 과목 자동완성 (datalist)
 * 
 * [데이터 필드]
 * - courseId: 과목명 (텍스트 입력 + datalist로 자동완성)
 * - title: 과제명
 * - dueDate: 마감일
 * - description: 설명
 * 
 * [참고]
 * -Courses 목록은 별도 API(/api/assignments/courses)로 조회
 * - Past 과제는 스타일로 구분 (회색 배경)
 * - form-input, form-button CSS 클래스 사용
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

/**
 * AssignmentManager - 과제 일정 관리 컴포넌트
 */
function AssignmentManager() {
  const { api } = useAuth()
  
  // 목록 상태
  const [assignments, setAssignments] = useState([])
  
  // 과목 목록 (자동완성용)
  const [courses, setCourses] = useState([])
  
  // 폼 상태
  const [form, setForm] = useState({ courseId: '', title: '', dueDate: '', content: '' })
  
  // 편집 상태
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  // 마운트 시 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  /**
   * loadData - 과제 및 과목 데이터 로드
   * 두 API를 병렬로 호출하여 병합
   */
  const loadData = async () => {
    try {
      const [assignmentsData, coursesData] = await Promise.all([
        api('/api/assignments'),
        api('/api/assignments/courses')
      ])
      setAssignments(assignmentsData.data || assignmentsData)
      setCourses(coursesData)
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * handleSubmit - 신규 등록 또는 수정
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // 날짜를 ISO 형식으로 변환
      const data = { ...form, dueDate: new Date(form.dueDate).toISOString() }
      
      if (editing) {
        await api(`/api/assignments/${editing}`, { method: 'PUT', body: JSON.stringify(data) })
      } else {
        await api('/api/assignments', { method: 'POST', body: JSON.stringify(data) })
      }
      
      // 폼 초기화 및 목록 갱신
      setForm({ courseId: '', title: '', dueDate: '', content: '' })
      setEditing(null)
      loadData()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    }
  }

  /**
   * handleEdit - 수정 모드 전환
   */
  const handleEdit = (item) => {
    setForm({ 
      courseId: item.courseId, 
      title: item.title, 
      dueDate: item.dueDate.split('T')[0],  // YYYY-MM-DD
      content: item.description || ''
    })
    setEditing(item.id)
  }

  /**
   * handleDelete - 삭제
   */
  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await api(`/api/assignments/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  // 오늘 날짜 (마감일 비교용)
  const today = new Date()

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-cyan-400">📝 과제 일정 관리</h2>
      
      {/* 등록/수정 폼 */}
      <form className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6" onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold mb-3">{editing ? '수정' : '새 과제'}</h3>
        
        {/* 과목명 (자동완성 지원) */}
        <input
          type="text"
          placeholder="과목명"
          list="courses"
          value={form.courseId}
          onChange={e => setForm({ ...form, courseId: e.target.value })}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          required
        />
        <datalist id="courses">
          {courses.map(c => <option key={c} value={c} />)}
        </datalist>
        
        <input
          type="text"
          placeholder="과제명"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          required
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={e => setForm({ ...form, dueDate: e.target.value })}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          required
        />
        <textarea
          placeholder="설명 (선택)"
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          rows={3}
        />
        
        <div className="flex gap-2">
          <button type="submit" className="px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors">{editing ? '수정' : '등록'}</button>
          {editing && (
            <button 
              type="button" 
              onClick={() => { 
                setEditing(null); 
                setForm({ courseId: '', title: '', dueDate: '', content: '' }) 
              }} 
              className="px-6 py-3 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 목록 (마감일 지난 것은 스타일로 구분) */}
      <div className="mt-6">
        <h3 className="text-base font-semibold mb-3">목록</h3>
        {loading ? (
          <p>로딩 중...</p>
        ) : assignments.map(item => {
          const isPast = new Date(item.dueDate) < today  // 마감일 지남
          return (
            <div key={item.id} className={`flex justify-between items-center p-3 border-b border-gray-100 ${isPast ? 'opacity-50' : ''}`}>
              <div>
                <strong>{item.title}</strong>
                <span className="text-gray-500 text-sm ml-1">[{item.courseId}]</span>
                <div className="text-gray-500 text-xs">마감: {new Date(item.dueDate).toLocaleDateString('ko-KR')}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="px-3 py-1.5 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0] transition-colors">수정</button>
                <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors">삭제</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AssignmentManager
