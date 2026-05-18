/**
 * CalendarManager.jsx - 학사 일정 관리 페이지 (Calendar Manager)
 * 
 * 관리자가 연간 학사 일정을 관리하는 페이지입니다.
 * 학생들이 보는 학사 일정과 동일한 데이터를 관리합니다.
 * 
 * [주요 기능]
 * - 일정 등록 (제목, 시작일, 종료일, 유형, 설명)
 * - 일정 목록 조회
 * - 일정 수정
 * - 일정 삭제
 * - ICS 파일 내보내기 (캘린더 앱 가져오기)
 * 
 * [일정 유형]
 * - general: 일반 일정
 * - event: 학교 행사
 * - exam: 시험
 * - vacation: 방학
 * 
 * [참고]
 * - 시작일과 종료일 모두 필수 (기간 일정)
 * - ICS 내보내기는 백엔드에서 /api/calendar/ics 엔드포인트로 처리
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

/**
 * CalendarManager - 학사 일정 관리 컴포넌트
 */
function CalendarManager() {
  const { api } = useAuth()
  
  // 목록 상태
  const [events, setEvents] = useState([])
  
  // 폼 상태 (제목, 시작일, 종료일, 유형, 설명)
  const [form, setForm] = useState({ title: '', start: '', end: '', type: 'general', description: '' })
  
  // 편집 상태
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  // 마운트 시 데이터 로드
  useEffect(() => {
    loadEvents()
  }, [])

  /**
   * loadEvents - 학사 일정 목록 조회
   * GET /api/calendar
   */
  const loadEvents = async () => {
    try {
      const data = await api('/api/calendar')
      setEvents(data)
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
      const data = { 
        ...form, 
        start: new Date(form.start).toISOString(), 
        end: new Date(form.end).toISOString() 
      }
      
      if (editing) {
        await api(`/api/calendar/${editing}`, { method: 'PUT', body: JSON.stringify(data) })
      } else {
        await api('/api/calendar', { method: 'POST', body: JSON.stringify(data) })
      }
      
      // 폼 초기화 및 목록 갱신
      setForm({ title: '', start: '', end: '', type: 'general', description: '' })
      setEditing(null)
      loadEvents()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    }
  }

  /**
   * handleEdit - 수정 모드 전환
   */
  const handleEdit = (item) => {
    setForm({
      title: item.title,
      start: item.start.split('T')[0],  // YYYY-MM-DD 형식
      end: item.end.split('T')[0],
      type: item.type,
      description: item.description || ''
    })
    setEditing(item.id)
  }

  /**
   * handleDelete - 삭제
   */
  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await api(`/api/calendar/${id}`, { method: 'DELETE' })
      loadEvents()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  // 유형별 이모지
  const typeColors = { event: '🏫', exam: '📝', vacation: '🏖️', general: '📅' }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-cyan-400">📅 학사 일정 관리</h2>
      
      {/* 등록/수정 폼 */}
      <form className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6" onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold mb-3">{editing ? '수정' : '새 일정'}</h3>
        <input
          type="text"
          placeholder="일정명"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          required
        />
        {/* 기간 선택 (시작일 ~ 종료일) */}
        <div className="flex items-center gap-2 mb-3">
          <input type="date" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} className="flex-1 px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]" required />
          <span>~</span>
          <input type="date" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} className="flex-1 px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]" required />
        </div>
        {/* 일정 유형 선택 */}
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]">
          <option value="general">일반</option>
          <option value="event">학교 행사</option>
          <option value="exam">시험</option>
          <option value="vacation">방학</option>
        </select>
        <textarea
          placeholder="설명 (선택)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          rows={2}
        />
        
        <div className="flex gap-2">
          <button type="submit" className="px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors">{editing ? '수정' : '등록'}</button>
          {editing && (
            <button 
              type="button" 
              onClick={() => { 
                setEditing(null); 
                setForm({ title: '', start: '', end: '', type: 'general', description: '' }) 
              }} 
              className="px-6 py-3 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 목록 */}
      <div className="mt-6">
        <h3 className="text-base font-semibold mb-3">목록</h3>
        {loading ? (
          <p>로딩 중...</p>
        ) : events.map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 border-b border-gray-100">
            <div>
              <strong>{typeColors[item.type]} {item.title}</strong>
              <div className="text-gray-500 text-xs">{new Date(item.start).toLocaleDateString('ko-KR')} ~ {new Date(item.end).toLocaleDateString('ko-KR')}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(item)} className="px-3 py-1.5 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0] transition-colors">수정</button>
              <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* ICS 내보내기 (캘린더 앱에서 가져오기) */}
      <div className="mt-6">
        <a href="/api/calendar/ics" download="gameweb-calendar.ics" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors no-underline">
          📥 달력 내려받기 (ICS)
        </a>
      </div>
    </div>
  )
}

export default CalendarManager
