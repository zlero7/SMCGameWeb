import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../services/api'

function CalendarManager() {
  const { api } = useAuth()

  // 수동 추가 일정 (DB)
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ title: '', start: '', end: '', type: 'general', description: '' })
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  // NEIS 학사일정
  const [neisEvents, setNeisEvents] = useState([])
  const [neisMonth, setNeisMonth] = useState(new Date())
  const [neisLoading, setNeisLoading] = useState(false)
  const [neisError, setNeisError] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    loadNeisEvents()
  }, [neisMonth])

  const loadNeisEvents = async () => {
    setNeisLoading(true)
    setNeisError(null)
    try {
      const year = neisMonth.getFullYear()
      const month = neisMonth.getMonth() + 1
      const fromYmd = `${year}${month.toString().padStart(2, '0')}01`
      const toYmd = `${year}${month.toString().padStart(2, '0')}31`
      const data = await api(`/api/calendar/neis?fromYmd=${fromYmd}&toYmd=${toYmd}`)
      setNeisEvents(Array.isArray(data) ? data : [])
    } catch (err) {
      setNeisError('NEIS 일정을 불러오지 못했습니다.')
      setNeisEvents([])
    } finally {
      setNeisLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const data = await api('/api/calendar')
      setEvents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
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

      setForm({ title: '', start: '', end: '', type: 'general', description: '' })
      setEditing(null)
      loadEvents()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    }
  }

  const handleEdit = (item) => {
    setForm({
      title: item.title,
      start: item.start.split('T')[0],
      end: item.end.split('T')[0],
      type: item.type,
      description: item.description || ''
    })
    setEditing(item.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await api(`/api/calendar/${id}`, { method: 'DELETE' })
      loadEvents()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  const formatNeisDate = (dateStr) => {
    if (!dateStr || dateStr.length < 8) return dateStr
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`
  }

  const neisTypeInfo = {
    exam: { label: '시험', color: 'bg-red-100 text-red-700' },
    vacation: { label: '방학', color: 'bg-blue-100 text-blue-700' },
    event: { label: '행사', color: 'bg-green-100 text-green-700' },
    holiday: { label: '공휴일', color: 'bg-purple-100 text-purple-700' },
    'school day': { label: '수업일', color: 'bg-yellow-100 text-yellow-700' },
    general: { label: '일반', color: 'bg-gray-100 text-gray-700' }
  }

  const manualTypeColors = { event: '🏫', exam: '📝', vacation: '🏖️', general: '📅' }

  const prevNeisMonth = () => setNeisMonth(new Date(neisMonth.getFullYear(), neisMonth.getMonth() - 1))
  const nextNeisMonth = () => setNeisMonth(new Date(neisMonth.getFullYear(), neisMonth.getMonth() + 1))

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-cyan-400">📅 학사 일정 관리</h2>

      {/* NEIS 학사일정 섹션 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold text-blue-800">📡 NEIS 학사일정 (API)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={prevNeisMonth}
              className="px-2 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 text-sm"
            >◀</button>
            <span className="text-sm font-medium text-blue-800 min-w-[80px] text-center">
              {neisMonth.getFullYear()}년 {neisMonth.getMonth() + 1}월
            </span>
            <button
              onClick={nextNeisMonth}
              className="px-2 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 text-sm"
            >▶</button>
          </div>
        </div>

        {neisLoading ? (
          <p className="text-sm text-blue-600">불러오는 중...</p>
        ) : neisError ? (
          <p className="text-sm text-red-500">{neisError}</p>
        ) : neisEvents.length === 0 ? (
          <p className="text-sm text-gray-500">이 달의 NEIS 학사일정이 없습니다.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {neisEvents.map((ev, i) => {
              const info = neisTypeInfo[ev.type] || neisTypeInfo.general
              return (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm border border-blue-100">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${info.color}`}>
                      {info.label}
                    </span>
                    <span className="truncate font-medium">{ev.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{formatNeisDate(ev.start)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 추가 일정 등록/수정 폼 */}
      <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6 border border-gray-100">
        <h3 className="text-base font-semibold mb-3">➕ {editing ? '추가 일정 수정' : '추가 일정 등록'}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="일정명"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
            required
          />
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={form.start}
              onChange={e => setForm({ ...form, start: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
              required
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={form.end}
              onChange={e => setForm({ ...form, end: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
              required
            />
          </div>
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          >
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
            <button
              type="submit"
              className="px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors"
            >
              {editing ? '수정' : '등록'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setForm({ title: '', start: '', end: '', type: 'general', description: '' })
                }}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 추가 일정 목록 */}
      <div>
        <h3 className="text-base font-semibold mb-3">추가 일정 목록</h3>
        {loading ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 추가 일정이 없습니다.</p>
        ) : (
          events.map(item => (
            <div key={item.id} className="flex justify-between items-center p-3 border-b border-gray-100">
              <div>
                <strong>{manualTypeColors[item.type]} {item.title}</strong>
                <div className="text-gray-500 text-xs">
                  {new Date(item.start).toLocaleDateString('ko-KR')} ~ {new Date(item.end).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="px-3 py-1.5 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0] transition-colors"
                >수정</button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >삭제</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <a
          href={`${API_BASE}/calendar/ics`}
          download="gameweb-calendar.ics"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors no-underline"
        >
          📥 달력 내려받기 (ICS)
        </a>
      </div>
    </div>
  )
}

export default CalendarManager
