import React, { useEffect, useState } from 'react'
import { fetchCalendarEvents } from '../services/api'

export default function CalendarNew() {
  const [events, setEvents] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalendarEvents()
      .then(data => setEvents(data?.data ?? data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">로딩 중...</div>

  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = (firstDay + 6) % 7 // Monday start
  const days = Array.from({ length: startOffset + daysInMonth }, (_, i) => i >= startOffset ? i - startOffset + 1 : null)

  const eventsForDate = (d) => {
    const date = new Date(year, month, d)
    return events.filter(e => {
      const es = new Date(e.start)
      return es.getFullYear() === date.getFullYear() && es.getMonth() === date.getMonth() && es.getDate() === date.getDate()
    })
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  return (
    <div className="page calendar">
      <h2>📅 학사달력</h2>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, marginBottom:8 }}>
        <button onClick={prevMonth}>‹</button>
        <strong>{monthNames[month]} {year}</strong>
        <button onClick={nextMonth}>›</button>
      </div>
      <div className="calendar-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} style={{ textAlign:'center', fontWeight:600 }}>{d}</div>)}
        {days.map((d, idx) => (
          <div key={idx} className="calendar-cell" style={{ minHeight:60, border:'1px solid var(--color-border)', padding:6 }}>
            {d ? <div style={{ fontWeight:700 }}>{d}</div> : <div>&nbsp;</div>}
            {d && eventsForDate(d).length > 0 && (
              <ul style={{ paddingLeft:14, margin:0, fontSize:12 }}>
                {eventsForDate(d).slice(0,2).map((ev) => (
                  <li key={ev.id}>{ev.title}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
