import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/* ── 통계 카드 ── */
const StatCard = ({ label, value, trend, trendUp, color, bg, icon, to }) => (
  <Link to={to} className="no-underline">
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} group-hover:scale-110 transition-transform`}>
          <span className={color}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 mb-0.5">{value ?? <span className="text-gray-300">--</span>}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </Link>
)

/* ── 테이블 행 ── */
const TableRow = ({ left, mid, right, badge, badgeColor }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <div className="flex-1 min-w-0 pr-3">
      <p className="text-sm font-medium text-gray-800 truncate">{left}</p>
      {mid && <p className="text-xs text-gray-400">{mid}</p>}
    </div>
    {badge && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeColor}`}>{badge}</span>
    )}
    {right && !badge && <span className="text-xs text-gray-400 shrink-0">{right}</span>}
  </div>
)

export default function Dashboard() {
  const { api } = useAuth()
  const [stats, setStats] = useState({ notices: null, materials: null, awards: null, users: null, careers: null, admissions: null })
  const [recentNotices, setRecentNotices] = useState([])
  const [recentMaterials, setRecentMaterials] = useState([])
  const [recentAwards, setRecentAwards] = useState([])
  const [recentLabInspections, setRecentLabInspections] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          api('/api/notices'),
          api('/api/materials'),
          api('/api/awards'),
          api('/api/users'),
          api('/api/careers'),
          api('/api/admissions'),
          api('/api/lab-inspections'),
        ])
        const [notices, materials, awards, users, careers, admissions, labInspections] = results

        const count = (r) => {
          if (r.status !== 'fulfilled') return null
          const v = r.value
          return v?.pagination?.total ?? v?.data?.length ?? v?.length ?? null
        }

        setStats({
          notices: count(notices),
          materials: count(materials),
          awards: count(awards),
          users: count(users),
          careers: count(careers),
          admissions: count(admissions),
        })

        if (notices.status === 'fulfilled') {
          const list = notices.value?.data || notices.value || []
          setRecentNotices(list.slice(0, 6))
        }
        if (materials.status === 'fulfilled') {
          const list = materials.value?.data || materials.value || []
          setRecentMaterials(list.slice(0, 6))
        }
        if (awards.status === 'fulfilled') {
          const list = awards.value?.data || awards.value || []
          setRecentAwards(list.slice(0, 5))
        }
        if (labInspections.status === 'fulfilled') {
          const list = labInspections.value?.data || labInspections.value || []
          setRecentLabInspections(list.slice(0, 8))
        }
      } catch {}
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const menuCards = [
    { to: '/admin/notices', label: '공지사항', desc: '작성 · 수정 · 삭제', bg: 'bg-blue-50', color: 'text-blue-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
    { to: '/admin/careers', label: '취업 정보', desc: '채용 공고 관리', bg: 'bg-indigo-50', color: 'text-indigo-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { to: '/admin/admissions', label: '진학 정보', desc: '진학 안내 관리', bg: 'bg-violet-50', color: 'text-violet-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
    { to: '/admin/calendar', label: '학사 일정', desc: 'NEIS 연동 · 일정 추가', bg: 'bg-cyan-50', color: 'text-cyan-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { to: '/admin/assignments', label: '과제 일정', desc: '과제 등록 · 관리', bg: 'bg-teal-50', color: 'text-teal-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
    { to: '/admin/lab-inspections', label: '실습실 점검', desc: '점검 게시판 관리', bg: 'bg-orange-50', color: 'text-orange-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { to: '/admin/materials', label: '자료실', desc: '학습 자료 업로드', bg: 'bg-emerald-50', color: 'text-emerald-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
    { to: '/admin/awards', label: '수상/포트폴리오', desc: '수상 내역 등록', bg: 'bg-amber-50', color: 'text-amber-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
    { to: '/admin/users', label: '계정 관리', desc: '사용자 등록 · 권한', bg: 'bg-rose-50', color: 'text-rose-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  ]

  return (
    <div className="space-y-5">

      {/* ── 환영 배너 ── */}
      <div className="bg-gradient-to-r from-[#1c2438] to-[#2d3a5a] rounded-2xl px-7 py-5 flex items-center justify-between">
        <div>
          <p className="text-cyan-400 text-xs font-medium mb-1">{today}</p>
          <h1 className="text-white text-xl font-bold mb-0.5">관리자 대시보드</h1>
          <p className="text-gray-400 text-sm">세명컴고 게임과 포털 — 콘텐츠를 관리하세요.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Link to="/admin/notices" className="no-underline px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors">+ 공지 작성</Link>
          <Link to="/" className="no-underline px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors">사이트 보기</Link>
        </div>
      </div>

      {/* ── 통계 카드 6종 ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="공지사항" value={stats.notices} to="/admin/notices" trendUp trend="등록됨"
          bg="bg-blue-50" color="text-blue-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
        <StatCard label="취업 정보" value={stats.careers} to="/admin/careers" trendUp trend="등록됨"
          bg="bg-indigo-50" color="text-indigo-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
        <StatCard label="진학 정보" value={stats.admissions} to="/admin/admissions" trendUp trend="등록됨"
          bg="bg-violet-50" color="text-violet-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
        />
        <StatCard label="자료실" value={stats.materials} to="/admin/materials" trendUp trend="업로드됨"
          bg="bg-emerald-50" color="text-emerald-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
        />
        <StatCard label="수상 내역" value={stats.awards} to="/admin/awards" trendUp trend="등록됨"
          bg="bg-amber-50" color="text-amber-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
        <StatCard label="사용자" value={stats.users} to="/admin/users" trendUp trend="가입됨"
          bg="bg-rose-50" color="text-rose-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
      </div>

      {/* ── 실습실 점검 + 최근 콘텐츠 좌우 배치 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">

        {/* 왼쪽: 실습실 점검 목록 */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col self-stretch">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">최근 접수 현황</p>
              <h3 className="font-bold text-gray-800 text-sm">실습실 점검 목록</h3>
            </div>
            <Link to="/admin/lab-inspections" className="text-xs text-cyan-500 no-underline hover:underline">전체 보기</Link>
          </div>
          <div className="px-5 py-1 flex-1">
            {recentLabInspections.length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">접수된 점검 요청이 없습니다</p>
              : recentLabInspections.map((item, i) => (
                <div key={item.id ?? i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.author} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                    {item.status === 'completed' ? '처리완료' : '대기중'}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* 오른쪽: 최근 공지·자료·수상 세로 스택 */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* 최근 공지사항 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">최근 공지사항</h2>
              <Link to="/admin/notices" className="text-xs text-cyan-500 no-underline hover:underline">전체 보기</Link>
            </div>
            <div className="px-5 py-1">
              {recentNotices.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">등록된 공지가 없습니다</p>
                : recentNotices.slice(0, 4).map((n, i) => (
                  <TableRow
                    key={n.id ?? i}
                    left={n.title}
                    mid={n.createdAt ? new Date(n.createdAt).toLocaleDateString('ko-KR') : ''}
                    badge="공지"
                    badgeColor="bg-blue-50 text-blue-500"
                  />
                ))
              }
            </div>
          </div>

          {/* 최근 자료실 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">최근 자료실</h2>
              <Link to="/admin/materials" className="text-xs text-cyan-500 no-underline hover:underline">전체 보기</Link>
            </div>
            <div className="px-5 py-1">
              {recentMaterials.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">등록된 자료가 없습니다</p>
                : recentMaterials.slice(0, 3).map((m, i) => (
                  <TableRow
                    key={m.id ?? i}
                    left={m.title}
                    mid={m.category}
                    badge={m.fileSize ? `${(m.fileSize / 1024).toFixed(0)}KB` : '파일'}
                    badgeColor="bg-emerald-50 text-emerald-600"
                  />
                ))
              }
            </div>
          </div>

          {/* 수상/포트폴리오 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">수상/포트폴리오</h2>
              <Link to="/admin/awards" className="text-xs text-cyan-500 no-underline hover:underline">전체 보기</Link>
            </div>
            <div className="px-5 py-1">
              {recentAwards.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">등록된 수상 내역이 없습니다</p>
                : recentAwards.slice(0, 3).map((a, i) => (
                  <TableRow
                    key={a.id ?? i}
                    left={a.title}
                    mid={a.author}
                    badge="수상"
                    badgeColor="bg-amber-50 text-amber-600"
                  />
                ))
              }
            </div>
          </div>

        </div>
      </div>

      {/* ── 관리 메뉴 전체 ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4 text-sm">전체 관리 메뉴</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-3">
          {menuCards.map(({ to, label, desc, bg, color, icon }) => (
            <Link key={to} to={to} className="no-underline">
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
