/**
 * Notices.jsx - 공지사항 페이지 (Notice Page)
 * 
 * 전체 공지사항 목록을 보여주는 페이지입니다.
 * 관리자가 작성한 공지사항을 학생들이 확인합니다.
 * 클릭 시 상세 내용을 모달로 표시합니다.
 * 이미지, 동영상, 첨부파일을 지원합니다 (수상/포트폴리오처럼).
 */

import React, { useEffect, useState } from 'react'
import { fetchNotices } from '../services/api'
import AccordionCard from '../components/AccordionCard'
import PageBanner from '../components/PageBanner'

function Notices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchNotices()
      .then(data => setNotices(data.data || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <>
      <PageBanner icon="📢" title="공지사항" subtitle="관리자가 작성한 공지사항을 확인하세요" />
      <div className="bg-white rounded-2xl shadow-sm p-5">
        {notices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">등록된 공지사항이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {notices.map(notice => (
              <AccordionCard
                key={notice.id}
                id={notice.id}
                title={notice.title}
                content={notice.content}
                date={notice.date}
                author={notice.author}
                imageUrl={notice.imageUrl}
                videoUrl={notice.videoUrl}
                attachments={notice.attachments}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Notices
