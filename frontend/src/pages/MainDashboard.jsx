/**
 * MainDashboard.jsx - 메인 대시보드 (Home Page)
 * 
 * 웹사이트 첫 화면(홈)에서 보여주는 대시보드입니다.
 * 각 섹션의 최신 3개 항목을 미리 보여줍니다.
 * 
 * [구성]
 * - 공지사항: 최신 3개
 * - 취업 정보: 최신 3개
 * - 진학 정보: 최신 3개
 * - 학사 일정: 최신 3개
 * - 과제 일정: 최신 3개
 * - 실습실 점검: 바로가기 링크
 * 
 * [데이터 로드]
 * - 페이지 로드 시 모든 데이터 타입을 한 번에 병렬로 조회
 * - 각 타입마다 최신 3개만 추출하여 표시
 * - 에러 발생 시 console.error로 로깅 (UI에는 표시 안 함)
 * 
 * [참고]
 * - 실제 상세 조회는 각 해당 페이지에서 수행
 * - "더보기" 링크로 상세 페이지 이동
 * - 선택된 항목은 전체 화면 중앙의 모달로 표시
 */

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { marked } from 'marked'
import { fetchNotices, fetchCareers, fetchAdmissions, fetchCalendarEvents, fetchAssignments, fetchLabInspections, fetchMaterials } from '../services/api'
import AccordionCard from '../components/AccordionCard'

marked.setOptions({ breaks: true, gfm: true })

// 실제 서식 HTML 여부 감지 (<br>만 있는 건 HTML로 취급 안 함)
const isRichHtml = (text) => !!text && /<(strong|em|b|i|span|div|p|img|iframe|ul|ol|li|blockquote|h[1-6]|a[\s>]|table|figure)\b/i.test(text)

// 에디터 잔재(× 버튼, 파일칩) 제거
const sanitize = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  div.querySelectorAll('[data-delete-media]').forEach(el => el.remove())
  div.querySelectorAll('[data-filename]').forEach(el => el.remove())
  div.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'))
  return div.innerHTML
}

// rich HTML 내 마크다운 링크 [text](url) → <a> 변환
const mdLinks = (html) =>
  html.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:underline;">$1</a>')

// 콘텐츠 → HTML 변환
const toHtml = (text) => {
  if (!text) return ''
  if (isRichHtml(text)) return mdLinks(sanitize(text))
  const clean = text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
  return marked.parse(clean)
}

// 순수 텍스트 미리보기 추출
const stripHtml = (text) => {
  if (!text) return ''
  const div = document.createElement('div')
  div.innerHTML = toHtml(text)
  div.querySelectorAll('[data-delete-media],[data-filename]').forEach(el => el.remove())
  const raw = (div.textContent || div.innerText || '').trim()
  // 2차 파싱: rich HTML 내 마크다운 문법 잔재 제거
  const div2 = document.createElement('div')
  div2.innerHTML = marked.parse(raw)
  return (div2.textContent || div2.innerText || '').trim()
}

// isHtml 별칭 (getItemDisplay 등 기존 코드 호환)
const isHtml = isRichHtml

// URL을 링크로 변환하는 함수
const renderContentWithLinks = (text) => {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline hover:text-cyan-600">{part}</a>
    }
    return part
  })
}

/**
 * MainDashboard - 메인 대시보드 컴포넌트
 */
export default function MainDashboard() {
  // 각 데이터 타입별 상태
  const [notices, setNotices] = useState([])
  const [careers, setCareers] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [calendar, setCalendar] = useState([])
  const [assignments, setAssignments] = useState([])
  const [labInspections, setLabInspections] = useState([])
  const [materials, setMaterials] = useState([])

  // 선택된 항목 상태 (전체 화면 모달용)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedType, setSelectedType] = useState(null)

  // 페이지 로드 시 모든 데이터 병렬 조회
  useEffect(() => {
    // 현재 월의 NEIS 일정 범위
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const fromYmd = `${year}${month.toString().padStart(2, '0')}01`
    const toYmd = `${year}${month.toString().padStart(2, '0')}31`

    Promise.all([
      fetchNotices().then(d => d?.data || d || []),
      fetchCareers().then(d => d?.data || d || []),
      fetchAdmissions().then(d => d?.data || d || []),
      fetch(`/api/calendar/neis?fromYmd=${fromYmd}&toYmd=${toYmd}`).then(r => r.json()).catch(() => []),
      fetchAssignments().then(d => d?.data || d || []),
      fetchLabInspections().then(d => d?.data || d || []),
      fetchMaterials().then(d => d?.data || d || [])
    ]).then(([n, c, a, cal, as, li, m]) => {
      // 학사달력은 현재 날짜 이후의 일정만
      // NEIS는 배열을 직접 반환
      const calArray = Array.isArray(cal) ? cal : (cal?.data || [])
      
      // YYYYMMDD 형식을 Date로 변환하여 비교
      const upcomingCal = calArray.filter(e => {
        if (!e.start) return false
        const eventDate = new Date(e.start.substring(0, 4), parseInt(e.start.substring(4, 6)) - 1, e.start.substring(6, 8))
        return eventDate >= now
      }).slice(0, 3)
      
      setNotices(n.slice(0, 3))
      setCareers(c.slice(0, 3))
      setAdmissions(a.slice(0, 3))
      setCalendar(upcomingCal)
      setAssignments(as.slice(0, 3))
      setLabInspections(li.slice(0, 3))
      setMaterials(m.slice(0, 3))
    }).catch(console.error)
  }, [])

  // 항목 선택 시 전체 화면 모달로 표시
  const handleItemClick = (item, type) => {
    setSelectedItem(item)
    setSelectedType(type)
  }

  // 모달 닫기
  const handleCloseModal = () => {
    // 자료실 모달을 닫을 때 다운로드 횟수 업데이트를 위해 데이터 재조회
    if (selectedType === 'material') {
      fetchMaterials().then(d => {
        const m = d?.data || d || []
        setMaterials(m.slice(0, 3))
      }).catch(console.error)
    }
    setSelectedItem(null)
    setSelectedType(null)
  }

  // 타입별 표시 텍스트
  const getItemDisplay = (item, type) => {
    switch (type) {
      case 'notice':
        return { title: item.title, content: item.content, date: item.date, author: item.author }
      case 'career': {
        const descHtml = isHtml(item.description)
        const careerExtra = `${item.location ? `\n\n위치: ${item.location}` : ''}${item.deadline ? `\n마감: ${new Date(item.deadline).toLocaleDateString('ko-KR')}` : ''}`
        return {
          title: item.title,
          content: descHtml ? item.description : `${item.description || ''}${careerExtra}`,
          date: item.createdAt,
          author: item.author,
          imageUrl: item.imageUrl
        }
      }
      case 'admission': {
        const reqHtml = isHtml(item.requirements)
        const admExtra = item.deadline ? `\n마감: ${new Date(item.deadline).toLocaleDateString('ko-KR')}` : ''
        return {
          title: item.program,
          content: reqHtml ? item.requirements : `${item.requirements || ''}${admExtra}`,
          date: item.createdAt,
          author: item.author,
          imageUrl: item.imageUrl
        }
      }
      case 'calendar':
        return { title: item.title, content: item.description || '', date: item.start }
      case 'assignment':
        return { 
          title: `[${item.courseId}] ${item.title}`, 
          content: item.description || '',
          date: item.dueDate,
          author: item.author 
        }
      case 'labInspection':
        return { 
          title: item.title, 
          content: item.content || '',
          date: item.createdAt,
          author: item.author,
          status: item.status
        }
      case 'material':
        return { 
          title: item.title, 
          content: item.description || '설명 없음',
          date: item.createdAt,
          author: item.author,
          category: item.category,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          downloadCount: item.downloadCount
        }
      default:
        return { title: item.title || '', content: '', date: null }
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
        <h2 className="text-xl uppercase tracking-widest border-b-2 border-cyan-400 pb-2 mb-4">홈</h2>
        
        {/* 섹션별 카드 그리드 (반응형) */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          
          {/* 공지사항 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
            <h3 className="border-b-2 border-cyan-400 pb-2 mb-3 m-0 text-base">📢 공지사항</h3>
            {notices.length === 0 ? (
              <p className="text-gray-500 m-0 text-sm">등록된 공지사항이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {notices.map(n => (
                  <div key={n.id} className="py-1" onClick={() => handleItemClick(n, 'notice')}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{n.title}</span>
                          </div>
                          <p className="text-gray-500 text-sm m-0">{(() => { const t = stripHtml(n.content); return t.slice(0, 60) + (t.length > 60 ? '...' : '') })()}</p>
                        </div>
                        <span className="text-gray-500 text-xs whitespace-nowrap">{new Date(n.date).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/notices" className="block mt-3 text-cyan-400 no-underline">더보기 →</Link>
          </div>

          {/* 취업 정보 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
            <h3 className="border-b-2 border-cyan-400 pb-2 mb-3 m-0 text-base">💼 취업 정보</h3>
            {careers.length === 0 ? (
              <p className="text-gray-500 m-0 text-sm">등록된 취업 정보가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {careers.map(c => (
                  <div key={c.id} className="py-1" onClick={() => handleItemClick(c, 'career')}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-semibold">{c.title}</span>
                          <p className="text-gray-500 text-sm m-0">{(() => { const t = stripHtml(c.description); return t.slice(0, 60) + (t.length > 60 ? '...' : '') })()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/careers" className="block mt-3 text-cyan-400 no-underline">더보기 →</Link>
          </div>

          {/* 진학 정보 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
            <h3 className="border-b-2 border-cyan-400 pb-2 mb-3 m-0 text-base">🎓 진학 정보</h3>
            {admissions.length === 0 ? (
              <p className="text-gray-500 m-0 text-sm">등록된 진학 정보가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {admissions.map(a => (
                  <div key={a.id} className="py-1" onClick={() => handleItemClick(a, 'admission')}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-semibold">{a.program}</span>
                          <p className="text-gray-500 text-sm m-0">{(() => { const t = stripHtml(a.requirements); return t.slice(0, 60) + (t.length > 60 ? '...' : '') })()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/admissions" className="block mt-3 text-cyan-400 no-underline">더보기 →</Link>
          </div>

          {/* 학사 일정 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
            <h3 className="border-b-2 border-cyan-400 pb-2 mb-3 m-0 text-base">📅 학사 일정</h3>
            {calendar.length === 0 ? (
              <p className="text-gray-500 m-0 text-sm">등록된 일정이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {calendar.map((c, idx) => (
                  <div key={idx} className="py-1" onClick={() => handleItemClick(c, 'calendar')}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-semibold">{c.title}</span>
                          <p className="text-gray-500 text-sm m-0">{(() => { const t = stripHtml(c.description); return t.slice(0, 60) + (t.length > 60 ? '...' : '') })()}</p>
                        </div>
                        <span className="text-gray-500 text-xs whitespace-nowrap">
                          {c.start ? `${c.start.substring(0,4)}/${c.start.substring(4,6)}/${c.start.substring(6,8)}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/calendar" className="block mt-3 text-cyan-400 no-underline">더보기 →</Link>
          </div>

          {/* 과제 일정 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
            <h3 className="border-b-2 border-cyan-400 pb-2 mb-3 m-0 text-base">📝 과제 일정</h3>
            {assignments.length === 0 ? (
              <p className="text-gray-500 m-0 text-sm">등록된 과제가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {assignments.map(a => (
                  <div key={a.id} className="py-1" onClick={() => handleItemClick(a, 'assignment')}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-semibold">[{a.courseId}] {a.title}</span>
                          <p className="text-gray-500 text-sm m-0">{(() => { const t = stripHtml(a.description); return t.slice(0, 60) + (t.length > 60 ? '...' : '') })()}</p>
                        </div>
                        <span className="text-gray-500 text-xs whitespace-nowrap">{new Date(a.dueDate).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/assignments" className="block mt-3 text-cyan-400 no-underline">더보기 →</Link>
          </div>

          {/* 실습실 점검 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
            <h3 className="border-b-2 border-cyan-400 pb-2 mb-3 m-0 text-base">🔧 실습실 점검</h3>
            {labInspections.length === 0 ? (
              <p className="text-gray-500 m-0 text-sm">등록된 점검 사항이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {labInspections.map(item => (
                  <div key={item.id} className="py-1" onClick={() => handleItemClick(item, 'labInspection')}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{item.title}</span>
                            {item.status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                item.status === 'planned' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.status === 'completed' ? '완료' : item.status === 'planned' ? '예정' : '대기'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm m-0">{(() => { const t = stripHtml(item.content); return t.slice(0, 60) + (t.length > 60 ? '...' : '') })()}</p>
                        </div>
                        <span className="text-gray-500 text-xs whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/lab-inspections" className="block mt-3 text-cyan-400 no-underline">더보기 →</Link>
          </div>

          {/* 자료실 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
            <h3 className="border-b-2 border-cyan-400 pb-2 mb-3 m-0 text-base">📚 자료실</h3>
            {materials.length === 0 ? (
              <p className="text-gray-500 m-0 text-sm">등록된 자료가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {materials.map(m => (
                  <div key={m.id} className="py-1" onClick={() => handleItemClick(m, 'material')}>
                    <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{m.title}</span>
                            {m.category && <span className="text-xs text-gray-400">[{m.category}]</span>}
                          </div>
                          <p className="text-gray-500 text-sm m-0">{(() => { const t = stripHtml(m.description); return t.slice(0, 60) + (t.length > 60 ? '...' : '') })()}</p>
                        </div>
                        <span className="text-gray-500 text-xs whitespace-nowrap">{m.downloadCount || 0}down</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/materials" className="block mt-3 text-cyan-400 no-underline">더보기 →</Link>
          </div>
        </div>
      </div>

      {/* 전체 화면 중앙 모달 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={handleCloseModal}>
          <div 
            className="bg-white rounded-xl p-8 w-[min(800px,90%)] max-h-[85vh] overflow-auto shadow-[0_8px_40px_rgba(0,0,0,0.3)]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
              <div className="flex-1 pr-4">
                <h2 className="m-0 text-2xl font-bold text-gray-800">{getItemDisplay(selectedItem, selectedType).title}</h2>
                {getItemDisplay(selectedItem, selectedType).author && (
                  <p className="text-gray-500 text-sm mt-1">작성자: {getItemDisplay(selectedItem, selectedType).author}</p>
                )}
                {getItemDisplay(selectedItem, selectedType).date && (
                  <p className="text-gray-500 text-sm mt-1">
                    날짜: {selectedType === 'calendar' && typeof getItemDisplay(selectedItem, selectedType).date === 'string' && getItemDisplay(selectedItem, selectedType).date.length === 8
                      ? `${getItemDisplay(selectedItem, selectedType).date.substring(0,4)}/${getItemDisplay(selectedItem, selectedType).date.substring(4,6)}/${getItemDisplay(selectedItem, selectedType).date.substring(6,8)}`
                      : new Date(getItemDisplay(selectedItem, selectedType).date).toLocaleDateString('ko-KR')
                    }
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* 실습실 점검 상태 표시 */}
                {selectedType === 'labInspection' && getItemDisplay(selectedItem, selectedType).status && (
                  <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${
                    getItemDisplay(selectedItem, selectedType).status === 'completed' ? 'bg-green-100 text-green-700' :
                    getItemDisplay(selectedItem, selectedType).status === 'planned' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {getItemDisplay(selectedItem, selectedType).status === 'completed' ? '완료' : getItemDisplay(selectedItem, selectedType).status === 'planned' ? '예정' : '대기'}
                  </span>
                )}
                <button 
                  onClick={handleCloseModal} 
                  className="px-4 py-2 bg-[#4a90d9] text-white rounded-lg text-base font-semibold hover:bg-[#3561b0] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            {(() => {
              const c = getItemDisplay(selectedItem, selectedType).content
              return (
                <div
                  className="leading-relaxed text-gray-700 rich-content"
                  dangerouslySetInnerHTML={{ __html: toHtml(c) }}
                />
              )
            })()}
            {/* 이미지 (career 또는 admission인 경우 imageUrl 표시) */}
            {(selectedType === 'career' || selectedType === 'admission') && selectedItem.imageUrl && (
              <div className="mt-4">
                <img 
                  src={selectedItem.imageUrl.startsWith('http') ? selectedItem.imageUrl : window.location.origin + selectedItem.imageUrl} 
                  alt="이미지" 
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            )}
            {/* 자료실 다운로드 정보 */}
            {selectedType === 'material' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">카테고리:</span> {getItemDisplay(selectedItem, selectedType).category || '없음'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">다운로드 횟수:</span> {getItemDisplay(selectedItem, selectedType).downloadCount || 0}회
                </p>
                <button 
                  onClick={async () => {
                    try {
                      // 파일만 다운로드 (횟수 증가는 자료실 탭에서만)
                      const filename = encodeURIComponent(selectedItem.fileName)
                      window.location.href = `/api/materials/${selectedItem.id}/file?filename=${filename}`
                    } catch (err) {
                      alert('다운로드 실패')
                    }
                  }}
                  className="mt-2 px-6 py-2 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors"
                >
                  다운로드
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}