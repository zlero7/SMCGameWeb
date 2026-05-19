/**
 * Awards.jsx - 수상 및 포트폴리오 페이지 (Awards & Portfolio Page)
 * 
 * 학생들의 수상 내역과 포트폴리오를 보여주는 페이지입니다.
 * 카테고리: 전체, 수상, 포트폴리오
 * 이미지/영상 첨부 가능, 유튜브 미리보기 지원
 * 
 * [API]
 * - GET /api/awards
 */

import React, { useEffect, useState } from 'react'
import { marked } from 'marked'
import PageBanner from '../components/PageBanner'

marked.setOptions({ breaks: true, gfm: true })

const isRichHtml = (text) => !!text && /<(strong|em|b|i|span|div|p|img|iframe|ul|ol|li|blockquote|h[1-6]|a[\s>]|table|figure)\b/i.test(text)

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

const toHtml = (text) => {
  if (!text) return ''
  if (isRichHtml(text)) return mdLinks(sanitize(text))
  const clean = text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
  return marked.parse(clean)
}

const stripHtml = (html) => {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = toHtml(html)
  div.querySelectorAll('[data-delete-media],[data-filename]').forEach(el => el.remove())
  const raw = (div.textContent || div.innerText || '').trim()
  // 2차 파싱: HTML에서 추출한 텍스트에 마크다운 문법이 남아있을 경우 제거
  const div2 = document.createElement('div')
  div2.innerHTML = marked.parse(raw)
  return (div2.textContent || div2.innerText || '').trim()
}

function Awards() {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('all')
  
  // 상세보기 모달
  const [selectedAward, setSelectedAward] = useState(null)

  // 데이터 조회
  useEffect(() => {
    fetch(`/api/awards?category=${category}`)
      .then(res => res.json())
      .then(data => {
        setAwards(data.data || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [category])

  // 유튜브 ID 추출
  const getYouTubeId = (url) => {
    if (!url) return null
    // youtu.be/ID?si=... 형태에서 ID만 추출
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  // 유튜브 임베드 URL (추적 오류 방지를 위해 nocookie 사용)
  const getYouTubeEmbedUrl = (videoUrl) => {
    const id = getYouTubeId(videoUrl)
    if (!id) return null
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0`
  }

  // 이미지 URL에 도메인 추가
  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `http://${window.location.hostname}:3000${url}`
  }

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

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <>
      <PageBanner icon="🏆" title="수상 / 포트폴리오" subtitle="학생들의 수상 내역과 포트폴리오를 확인하세요" />
      <div className="bg-white rounded-2xl shadow-sm p-5">

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-5">
        {['all', 'award', 'portfolio'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? '전체' : cat === 'award' ? '수상' : '포트폴리오'}
          </button>
        ))}
      </div>

      {awards.length === 0 ? (
        <p className="text-gray-500 text-center py-8">등록된 내용이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {awards.map(award => (
            <div 
              key={award.id} 
              onClick={() => setSelectedAward(award)}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  award.category === 'award' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {award.category === 'award' ? '수상' : '포트폴리오'}
                </span>
              </div>
              <h3 className="font-bold text-gray-800">{award.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{stripHtml(award.content)}</p>
              {/* 파일/이미지/유튜브 - 모두 표시 (if로 개별 체크) */}
              {award.imageUrl && (
                <img 
                  src={getImageUrl(award.imageUrl)} 
                  alt={award.title} 
                  className="w-full h-40 object-cover rounded-lg mb-2"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              )}
              {award.videoUrl && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <iframe 
                    src={getYouTubeEmbedUrl(award.videoUrl)}
                    className="w-full h-full"
                    allowFullScreen
                    title={award.title}
                    loading="lazy"
                  />
                </div>
              )}
              {!award.imageUrl && !award.videoUrl && award.attachments && (
                <div className="w-full h-40 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-4xl">📎</span>
                  <span className="text-xs text-gray-500 mt-1">파일 첨부</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 상세보기 모달 */}
      {selectedAward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAward(null)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 rounded text-xs ${
                selectedAward.category === 'award' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedAward.category === 'award' ? '수상' : '포트폴리오'}
              </span>
              <button onClick={() => setSelectedAward(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{selectedAward.title}</h3>
            <div className="rich-content mb-4" dangerouslySetInnerHTML={{ __html: toHtml(selectedAward.content) }} />
<p className="text-sm text-gray-400 mb-4">작성자: {selectedAward.authorName || selectedAward.author}</p>
            
            {/* 유튜브/이미지/파일 */}
            {selectedAward.videoUrl && (
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <iframe 
                  src={getYouTubeEmbedUrl(selectedAward.videoUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedAward.title}
                  loading="lazy"
                />
              </div>
            )}
            {selectedAward.imageUrl && (
              <img 
                src={getImageUrl(selectedAward.imageUrl)} 
                alt={selectedAward.title} 
                className="w-full rounded-lg mb-4" 
              />
            )}
            {selectedAward.attachments && (() => {
              try {
                const files = JSON.parse(selectedAward.attachments)
                const arr = Array.isArray(files) ? files : [files]
                if (arr.length === 0) return null
                return (
                  <div className="mt-2 mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">📎 첨부파일 ({arr.length}개)</p>
                    <div className="space-y-2">
                      {arr.map((file, idx) => {
                        const name = file.filename || file.originalname || `파일 ${idx + 1}`
                        const url = `/api/awards/${selectedAward.id}/download/${idx}`
                        return (
                          <a key={idx} href={url}
                            className="flex items-center gap-2 p-2 bg-white rounded hover:bg-gray-100 transition-colors no-underline">
                            <span>📄</span>
                            <span className="text-sm text-gray-700">{name}</span>
                            {file.mimetype && <span className="text-xs text-gray-400 ml-auto">{file.mimetype}</span>}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )
              } catch { return null }
            })()}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default Awards