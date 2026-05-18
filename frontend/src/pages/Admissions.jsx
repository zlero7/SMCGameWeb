/**
 * Admissions.jsx - 진학 정보 페이지 (Admission Information Page)
 * 
 * 전체 진학 정보 목록을 보여주는 페이지입니다.
 * 대학교, 전문대, 취업 관련 진학 정보를 확인합니다.
 * 
 * [데이터]
 * - 프로그램명, 지원 요건, 마감일
 * - 마감일 없으면 "상시"로 표시
 * 
 * [사용 컴포넌트]
 * - AccordionCard: 카드 클릭 시 상세 내용을 모달로 표시
 * - notice-list: 목록 레이아웃
 * 
 * [API]
 * - GET /api/admissions
 */

import React, { useEffect, useState } from 'react'
import { fetchAdmissions } from '../services/api'
import AccordionCard from '../components/AccordionCard'

/**
 * Admissions - 진학 정보 페이지 컴포넌트
 */
function Admissions() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 페이지 로드 시 진학 정보 조회
  useEffect(() => {
    fetchAdmissions()
      .then(data => setAdmissions(data.data || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <div className="border-b-2 border-cyan-400 pb-2 mb-4">
        <h2 className="text-xl uppercase tracking-widest">🎓 진학 정보</h2>
      </div>
      
      {admissions.length === 0 ? (
        <p>등록된 진학 정보가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {admissions.map(admission => {
            let content = admission.requirements || '요구사항 없음'
            if (admission.deadline) content += `\n마감: ${new Date(admission.deadline).toLocaleDateString('ko-KR')}`
            return (
              <AccordionCard 
                key={admission.id}
                title={admission.program} 
                content={content}
                imageUrl={admission.imageUrl}
                author={admission.author}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Admissions