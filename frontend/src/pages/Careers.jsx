/**
 * Careers.jsx - 취업 정보 페이지 (Career Information Page)
 * 
 * 전체 취업 공고 목록을 보여주는 페이지입니다.
 * AccordionCard 컴포넌트를 사용하여 클릭 시 상세 내용을 모달로 표시합니다.
 * 
 * [데이터]
 * - 제목, 상세 설명, 요구사항, 근무지, 마감일, 지원 링크
 * - 마감일 없으면 "상시"로 표시
 * 
 * [사용 컴포넌트]
 * - AccordionCard: 카드 클릭 시 상세 내용을 모달로 표시
 * - notice-list: 목록 레이아웃
 * 
 * [API]
 * - GET /api/careers
 */

import React, { useEffect, useState } from 'react'
import { fetchCareers } from '../services/api'
import AccordionCard from '../components/AccordionCard'
import PageBanner from '../components/PageBanner'

/**
 * Careers - 취업 정보 페이지 컴포넌트
 */
function Careers() {
  const [careers, setCareers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 페이지 로드 시 취업 정보 조회
  useEffect(() => {
    fetchCareers()
      .then(data => setCareers(data.data || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <>
      <PageBanner icon="💼" title="취업 정보" subtitle="채용 공고와 취업 정보를 확인하세요" />
      <div className="bg-white rounded-2xl shadow-sm p-5">
        {careers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">등록된 취업 정보가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {careers.map(career => {
              let content = career.description || ''
              if (career.requirements) content += `\n\n요구사항: ${career.requirements}`
              if (career.location && career.location.trim()) content += `\n위치: ${career.location}`
              if (career.deadline) content += `\n마감: ${new Date(career.deadline).toLocaleDateString('ko-KR')}`
              return (
                <AccordionCard
                  key={career.id}
                  title={career.title}
                  content={content}
                  imageUrl={career.imageUrl}
                  author={career.author}
                />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

export default Careers