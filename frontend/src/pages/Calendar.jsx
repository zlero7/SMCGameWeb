/**
 * Calendar.jsx - 학사 일정 페이지 (Academic Calendar Page)
 * 
 * 전체 학사 일정 목록을 달력 형태로 보여주는 페이지입니다.
 * NEIS API 연동 지원 (학교 코드 설정 시 자동 조회)
 * 
 * [데이터]
 * - 제목, 설명, 시작일, 종료일, 일정 유형
 * - 유형: general(일반), event(학교 행사), exam(시험), vacation(방학)
 * 
 * [기능]
 * - 달력 뷰 (월별)
 * - NEIS API 연동 (설정 시)
 * - 관리자 수동 입력
 * 
 * [API]
 * - GET /api/calendar - 로컬 일정
 * - GET /api/calendar/neis - NEIS API (NEIS_API_KEY 설정 필요)
 */

import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  
  // 글쓰기 모달
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [writeForm, setWriteForm] = useState({ title: '', start: '', end: '', type: 'general', description: '' })
  const [submitting, setSubmitting] = useState(false)

  // 페이지 로드 시 학사 일정 조회 (로컬 + NEIS 자동 연동)
  // NEIS 일정만 자동 불러오기
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const fromYmd = `${year}${month.toString().padStart(2, '0')}01`
        const toYmd = `${year}${month.toString().padStart(2, '0')}31`
        
        const neisRes = await fetch(`/api/calendar/neis?fromYmd=${fromYmd}&toYmd=${toYmd}`)
        const neisData = await neisRes.json()
        
        if (Array.isArray(neisData)) {
          setEvents(neisData)
        } else {
          setEvents([])
        }
      } catch (err) {
        setError(err.message)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [currentDate.getMonth()])

  // 달력 생성
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // 이전 달 공백
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, date: null })
    }
    
    // 현재 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, date: new Date(year, month, i) })
    }
    
    return days
  }

  // 해당 날짜의 일정 찾기
  const getEventsForDate = (date) => {
    if (!date) return []
    
    // 달력 날짜를 YYYYMMDD로 변환
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    
    return events.filter(ev => {
      // NEIS 형식 (YYYYMMDD) 또는 ISO 형식 (YYYY-MM-DD) 처리
      const evStart = ev.start || ev.date || ''
      const evEnd = ev.end || ev.date || ev.start || ''
      
      // YYYYMMDD 형식
      if (/^\d{8}$/.test(evStart)) {
        return dateStr >= evStart && dateStr <= evEnd
      }
      
      // ISO 날짜 형식
      const isoStart = new Date(evStart).toISOString().split('T')[0].replace(/-/g, '')
      const isoEnd = new Date(evEnd).toISOString().split('T')[0].replace(/-/g, '')
      return dateStr >= isoStart && dateStr <= isoEnd
    })
  }

  // 일정 유형별 색상
  const getEventColor = (type) => {
    const colors = {
      vacation: 'bg-blue-100 text-blue-700',   // 방학
      exam: 'bg-red-100 text-red-700',        // 시험/고사
      event: 'bg-green-100 text-green-700',  // 행사
      holiday: 'bg-purple-100 text-purple-700',  // 공휴일
      'school day': 'bg-yellow-100 text-yellow-700'  // 수업일
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  // 이전/다음 달 이동
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  // 글쓰기 제출
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(writeForm)
      })
      if (!res.ok) throw new Error('글쓰기 실패')
      setShowWriteModal(false)
      setWriteForm({ title: '', start: '', end: '', type: 'general', description: '' })
      fetchCalendarEvents().then(data => setEvents(data.data || data))
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <div className="border-b-2 border-cyan-400 pb-2 mb-4">
        <h2 className="text-xl uppercase tracking-widest">📅 학사일정</h2>
      </div>

      {/* 달력 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">◀</button>
        <h3 className="text-lg font-bold">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">▶</button>
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center font-bold text-gray-500 py-2 bg-gray-50">
            {day}
          </div>
        ))}
        {days.map((item, idx) => {
          const dayEvents = getEventsForDate(item.date)
          const isToday = item.date && item.date.toDateString() === new Date().toDateString()
          
          return (
            <div 
              key={idx} 
              className={`min-h-[80px] border p-1 ${isToday ? 'bg-cyan-50' : ''}`}
            >
              {item.day && (
                <div className="space-y-1">
                  <div className={`text-sm font-bold ${isToday ? 'text-cyan-600' : 'text-gray-700'}`}>
                    {item.day}
                  </div>
                  <div>
                    {dayEvents.slice(0, 2).map((ev, i) => (
                      <div 
                        key={i}
                        className={`text-xs p-1 rounded truncate ${getEventColor(ev.type)}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2}개</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 일정 유형.legend */}
      <div className="flex gap-4 mt-4 text-sm flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 rounded"></span> 방학</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded"></span> 시험/고사</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded"></span> 행사</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 rounded"></span> 공휴일</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded"></span> 일반</span>
      </div>

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">학사 일정 글쓰기</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="제목"
                value={writeForm.title}
                onChange={e => setWriteForm({...writeForm, title: e.target.value})}
                className="w-full p-3 border rounded-lg mb-3"
                required
              />
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={writeForm.start}
                  onChange={e => setWriteForm({...writeForm, start: e.target.value})}
                  className="flex-1 p-3 border rounded-lg"
                  required
                />
                <input
                  type="date"
                  value={writeForm.end}
                  onChange={e => setWriteForm({...writeForm, end: e.target.value})}
                  className="flex-1 p-3 border rounded-lg"
                  required
                />
              </div>
              <select
                value={writeForm.type}
                onChange={e => setWriteForm({...writeForm, type: e.target.value})}
                className="w-full p-3 border rounded-lg mb-3"
              >
                <option value="general">일반</option>
                <option value="event">학교 행사</option>
                <option value="exam">시험</option>
                <option value="vacation">방학</option>
              </select>
              <textarea
                placeholder="설명 (선택)"
                value={writeForm.description}
                onChange={e => setWriteForm({...writeForm, description: e.target.value})}
                className="w-full p-3 border rounded-lg mb-4 h-24"
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '등록'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowWriteModal(false)}
                  className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar