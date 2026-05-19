import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const StatCard = ({ label, value, sub, color, icon, to }) => (
  <Link to={to} className="no-underline">
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value ?? <span className="text-gray-300 text-xl">--</span>}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  </Link>
)

const QuickLink = ({ to, icon, label, desc, color }) => (
  <Link to={to} className="no-underline">
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="font-semibold text-gray-800 text-sm">{label}</div>
        <div className="text-xs text-gray-400">{desc}</div>
      </div>
      <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </Link>
)

export default function Dashboard() {
  const { api } = useAuth()
  const [stats, setStats] = useState({ notices: null, materials: null, awards: null, users: null })
  const [recentNotices, setRecentNotices] = useState([])
  const [recentMaterials, setRecentMaterials] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [notices, materials, awards, users] = await Promise.allSettled([
          api('/api/notices'),
          api('/api/materials'),
          api('/api/awards'),
          api('/api/users'),
        ])
        setStats({
          notices: notices.status === 'fulfilled' ? (notices.value?.pagination?.total ?? notices.value?.length ?? notices.value?.data?.length) : null,
          materials: materials.status === 'fulfilled' ? (materials.value?.data?.length ?? materials.value?.length) : null,
          awards: awards.status === 'fulfilled' ? (awards.value?.data?.length ?? awards.value?.length) : null,
          users: users.status === 'fulfilled' ? (users.value?.length) : null,
        })
        if (notices.status === 'fulfilled') {
          const list = notices.value?.data || notices.value || []
          setRecentNotices(list.slice(0, 5))
        }
        if (materials.status === 'fulfilled') {
          const list = materials.value?.data || materials.value || []
          setRecentMaterials(list.slice(0, 5))
        }
      } catch {}
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="space-y-6">

      {/* 환영 배너 */}
      <div className="bg-gradient-to-r from-[#1c2438] to-[#2d3a5a] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-cyan-400 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-white text-2xl font-bold mb-1">관리자 대시보드</h1>
          <p className="text-gray-400 text-sm">세명컴고 게임과 포털 — 콘텐츠를 관리하세요.</p>
        </div>
        <div className="hidden md:flex gap-3">
          <Link to="/admin/notices" className="no-underline px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors">
            + 공지사항 작성
          </Link>
          <Link to="/" className="no-underline px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors">
            사이트 보기
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="공지사항"
          value={stats.notices}
          sub="등록된 공지"
          to="/admin/notices"
          color="bg-blue-50 text-blue-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
        />
        <StatCard
          label="자료실"
          value={stats.materials}
          sub="업로드된 자료"
          to="/admin/materials"
          color="bg-emerald-50 text-emerald-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
        />
        <StatCard
          label="수상/포트폴리오"
          value={stats.awards}
          sub="등록된 수상 내역"
          to="/admin/awards"
          color="bg-amber-50 text-amber-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
        <StatCard
          label="사용자"
          value={stats.users}
          sub="등록된 계정"
          to="/admin/users"
          color="bg-purple-50 text-purple-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
      </div>

      {/* 최근 콘텐츠 + 빠른 메뉴 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* 최근 공지사항 */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">최근 공지사항</h2>
            <Link to="/admin/notices" className="text-xs text-cyan-500 hover:underline no-underline">전체 보기</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentNotices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">등록된 공지사항이 없습니다</p>
            ) : recentNotices.map((n, i) => (
              <div key={n.id ?? i} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                  <p className="text-xs text-gray-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString('ko-KR') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 자료 */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">최근 자료실</h2>
            <Link to="/admin/materials" className="text-xs text-cyan-500 hover:underline no-underline">전체 보기</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentMaterials.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">등록된 자료가 없습니다</p>
            ) : recentMaterials.map((m, i) => (
              <div key={m.id ?? i} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                  <p className="text-xs text-gray-400">{m.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="font-bold text-gray-800 px-1">빠른 메뉴</h2>
          <QuickLink to="/admin/notices" label="공지사항 관리" desc="공지사항 작성 및 수정" color="bg-blue-50 text-blue-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
          />
          <QuickLink to="/admin/calendar" label="학사 일정 관리" desc="NEIS 연동 및 일정 추가" color="bg-cyan-50 text-cyan-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <QuickLink to="/admin/materials" label="자료실 관리" desc="학습 자료 업로드" color="bg-emerald-50 text-emerald-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
          />
          <QuickLink to="/admin/users" label="계정 관리" desc="사용자 등록 및 권한 설정" color="bg-purple-50 text-purple-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <QuickLink to="/admin/awards" label="수상/포트폴리오" desc="수상 내역 등록" color="bg-amber-50 text-amber-500"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
          />
        </div>
      </div>
    </div>
  )
}
