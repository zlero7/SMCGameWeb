import React, { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner'
import { API_BASE } from '../services/api'

function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('calendar')
  const [selectedDay, setSelectedDay] = useState(null) // { date, events }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    if (mq.matches) setViewMode('list')
    const handler = (e) => { if (e.matches) setViewMode('list') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetchEvents = async () => {
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const fromYmd = `${year}${month.toString().padStart(2, '0')}01`
        const toYmd = `${year}${month.toString().padStart(2, '0')}31`

        const [neisRes, dbRes] = await Promise.all([
          fetch(`${API_BASE}/calendar/neis?fromYmd=${fromYmd}&toYmd=${toYmd}`),
          fetch(`${API_BASE}/calendar?month=${month}&year=${year}`)
        ])

        const neisData = await neisRes.json()
        const dbData = await dbRes.json()

        const combined = [
          ...(Array.isArray(neisData) ? neisData : []),
          ...(Array.isArray(dbData) ? dbData : [])
        ]
        setEvents(combined)
      } catch (err) {
        setError(err.message)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [currentDate.getFullYear(), currentDate.getMonth()])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startDayOfWeek; i++) days.push({ day: null, date: null })
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, date: new Date(year, month, i) })
    return days
  }

  const getEventsForDate = (date) => {
    if (!date) return []
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const dateStr = `${year}${month}${day}`

    return events.filter(ev => {
      const evStart = ev.start || ev.date || ''
      const evEnd = ev.end || ev.date || ev.start || ''
      if (/^\d{8}$/.test(evStart)) return dateStr >= evStart && dateStr <= evEnd
      try {
        const isoStart = new Date(evStart).toISOString().split('T')[0].replace(/-/g, '')
        const isoEnd = new Date(evEnd).toISOString().split('T')[0].replace(/-/g, '')
        return dateStr >= isoStart && dateStr <= isoEnd
      } catch { return false }
    })
  }

  const getEventColor = (type, source) => {
    if (source === 'manual' || (!source && type)) {
      const manualColors = {
        vacation: 'bg-blue-200 text-blue-800 border-l-2 border-blue-500',
        exam: 'bg-red-200 text-red-800 border-l-2 border-red-500',
        event: 'bg-green-200 text-green-800 border-l-2 border-green-500',
        general: 'bg-orange-100 text-orange-700 border-l-2 border-orange-400'
      }
      return manualColors[type] || 'bg-orange-100 text-orange-700 border-l-2 border-orange-400'
    }
    const colors = {
      vacation: 'bg-blue-100 text-blue-700',
      exam: 'bg-red-100 text-red-700',
      event: 'bg-green-100 text-green-700',
      holiday: 'bg-purple-100 text-purple-700',
      'school day': 'bg-yellow-100 text-yellow-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const getBadgeColor = (type, source) => {
    if (source === 'manual' || (!source && type)) {
      const c = { vacation: 'bg-blue-100 text-blue-700', exam: 'bg-red-100 text-red-700', event: 'bg-green-100 text-green-700', general: 'bg-orange-100 text-orange-700' }
      return c[type] || 'bg-orange-100 text-orange-700'
    }
    const c = { vacation: 'bg-blue-100 text-blue-700', exam: 'bg-red-100 text-red-700', event: 'bg-green-100 text-green-700', holiday: 'bg-purple-100 text-purple-700' }
    return c[type] || 'bg-gray-100 text-gray-700'
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  const days = getDaysInMonth(currentDate)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // 리스트뷰: 이번달 일정 날짜 순 정렬
  const listEvents = events
    .map(ev => {
      const raw = ev.start || ev.date || ''
      let dateObj = null
      if (/^\d{8}$/.test(raw)) {
        dateObj = new Date(raw.slice(0, 4), parseInt(raw.slice(4, 6)) - 1, raw.slice(6, 8))
      } else {
        try { dateObj = new Date(raw) } catch { dateObj = null }
      }
      return { ...ev, _dateObj: dateObj }
    })
    .filter(ev => ev._dateObj)
    .sort((a, b) => a._dateObj - b._dateObj)

  const formatDateLabel = (ev) => {
    if (!ev._dateObj) return ''
    return ev._dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  }

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <>
      <PageBanner icon="📅" title="학사 일정" subtitle="NEIS 연동 학교 행사 및 학사 일정을 확인하세요" />
      <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5">

        {/* 헤더: 월 이동 + 뷰 전환 */}
        <div className="relative flex items-center mb-4">
          {/* 가운데 정렬: ◀ 년/월 ▶ */}
          <div className="flex items-center justify-center gap-2 flex-1">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors font-bold text-gray-600 min-w-[40px] min-h-[40px]">◀</button>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 min-w-[120px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors font-bold text-gray-600 min-w-[40px] min-h-[40px]">▶</button>
          </div>
          {/* 오른쪽 고정: 뷰 전환 버튼 */}
          <div className="absolute right-0 flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >달력</button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >목록</button>
          </div>
        </div>

        {/* 달력 뷰 */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-7 border-l border-t border-gray-100 rounded-lg overflow-hidden">
            {weekDays.map((day, i) => (
              <div key={day} className={`text-center text-xs font-bold py-2 border-r border-b border-gray-100 bg-gray-50 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
            {days.map((item, idx) => {
              const dayEvents = getEventsForDate(item.date)
              const isToday = item.date && item.date.toDateString() === new Date().toDateString()
              const isSun = item.date && item.date.getDay() === 0
              const isSat = item.date && item.date.getDay() === 6

              return (
                <div
                  key={idx}
                  onClick={() => item.day && dayEvents.length > 0 && setSelectedDay({ date: item.date, events: dayEvents })}
                  className={`min-h-[72px] sm:min-h-[110px] border-r border-b border-gray-100 p-1 sm:p-2 ${isToday ? 'bg-cyan-50' : item.day ? 'hover:bg-gray-50' : 'bg-gray-50/50'} transition-colors ${item.day && dayEvents.length > 0 ? 'cursor-pointer' : ''}`}
                >
                  {item.day && (
                    <>
                      <div className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-1.5 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-cyan-500 text-white' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-gray-700'
                      }`}>
                        {item.day}
                      </div>
                      <div className="space-y-0.5 hidden sm:block">
                        {dayEvents.slice(0, 2).map((ev, i) => (
                          <div key={i} className={`text-[10px] px-1 py-0.5 rounded truncate ${getEventColor(ev.type, ev.source)}`} title={ev.title}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 2}</div>}
                      </div>
                      {/* 모바일: 이벤트 있으면 점만 표시 */}
                      {dayEvents.length > 0 && (
                        <div className="sm:hidden flex gap-0.5 flex-wrap mt-0.5">
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <span key={i} className={`w-1.5 h-1.5 rounded-full inline-block ${ev.type === 'vacation' ? 'bg-blue-400' : ev.type === 'exam' ? 'bg-red-400' : ev.type === 'holiday' ? 'bg-purple-400' : 'bg-orange-400'}`} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 리스트 뷰 */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {listEvents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">이번 달 일정이 없습니다.</p>
            ) : listEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-cyan-50 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-cyan-500 font-bold leading-none">{ev._dateObj.getMonth() + 1}월</span>
                  <span className="text-sm text-cyan-700 font-bold leading-none">{ev._dateObj.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateLabel(ev)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${getBadgeColor(ev.type, ev.source)}`}>
                  {ev.type === 'vacation' ? '방학' : ev.type === 'exam' ? '시험' : ev.type === 'holiday' ? '공휴일' : ev.type === 'event' ? '행사' : '일정'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 날짜 클릭 모달 (모바일 일정 상세) */}
        {selectedDay && (
          <div
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4"
            onClick={() => setSelectedDay(null)}
          >
            <div
              className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[70vh] overflow-hidden flex flex-col shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* 모바일 드래그 핸들 */}
              <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
                <h3 className="font-bold text-gray-800 text-base">
                  {selectedDay.date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors text-lg leading-none"
                >✕</button>
              </div>
              {/* 일정 목록 */}
              <div className="overflow-y-auto px-4 py-3 space-y-2">
                {selectedDay.events.map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      ev.type === 'vacation' ? 'bg-blue-400' :
                      ev.type === 'exam'     ? 'bg-red-400' :
                      ev.type === 'holiday'  ? 'bg-purple-400' :
                      ev.type === 'event'    ? 'bg-green-400' :
                      'bg-orange-400'
                    }`} />
                    <span className="flex-1 text-sm text-gray-800 font-medium">{ev.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${getBadgeColor(ev.type, ev.source)}`}>
                      {ev.type === 'vacation' ? '방학' :
                       ev.type === 'exam'     ? '시험' :
                       ev.type === 'holiday'  ? '공휴일' :
                       ev.type === 'event'    ? '행사' : '일정'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 범례 */}
        <div className="flex gap-3 mt-4 text-xs flex-wrap text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-100 rounded"></span> 방학</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-100 rounded"></span> 시험</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-100 rounded"></span> 행사</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-100 rounded"></span> 공휴일</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-orange-100 border-l-2 border-orange-400 rounded"></span> 추가 일정</span>
        </div>
      </div>
    </>
  )
}

export default Calendar
