import React, { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner'

function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())

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
          fetch(`/api/calendar/neis?fromYmd=${fromYmd}&toYmd=${toYmd}`),
          fetch(`/api/calendar?month=${month}&year=${year}`)
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
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, date: null })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, date: new Date(year, month, i) })
    }
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

      if (/^\d{8}$/.test(evStart)) {
        return dateStr >= evStart && dateStr <= evEnd
      }

      try {
        const isoStart = new Date(evStart).toISOString().split('T')[0].replace(/-/g, '')
        const isoEnd = new Date(evEnd).toISOString().split('T')[0].replace(/-/g, '')
        return dateStr >= isoStart && dateStr <= isoEnd
      } catch {
        return false
      }
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

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  const days = getDaysInMonth(currentDate)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <>
      <PageBanner icon="📅" title="학사 일정" subtitle="NEIS 연동 학교 행사 및 학사 일정을 확인하세요" />
      <div className="bg-white rounded-2xl shadow-sm p-5">

      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors font-bold text-gray-600">◀</button>
        <h3 className="text-lg font-bold text-gray-800">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors font-bold text-gray-600">▶</button>
      </div>

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
                        className={`text-xs p-1 rounded truncate mb-0.5 ${getEventColor(ev.type, ev.source)}`}
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

      <div className="flex gap-4 mt-4 text-sm flex-wrap text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 rounded"></span> 방학 (NEIS)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded"></span> 시험 (NEIS)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded"></span> 행사 (NEIS)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 rounded"></span> 공휴일 (NEIS)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-100 border-l-2 border-orange-400 rounded"></span> 추가 일정</span>
      </div>
      </div>
    </>
  )
}

export default Calendar
