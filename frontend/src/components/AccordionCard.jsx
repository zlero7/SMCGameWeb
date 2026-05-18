/**
 * AccordionCard.jsx - 목록 카드 및 상세 모달 컴포넌트
 * 
 * 목록에서 클릭 시 상세 내용을 모달로 보여주는 카드 컴포넌트입니다.
 * 공지사항, 실습실 점검 등 다양한 데이터에 재사용 가능합니다.
 * 이미지, 동영상, 첨부파일을 지원합니다 (수상/포트폴리오처럼).
 */

import React, { useState } from 'react'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

// 유튜브 ID 추출
const getYouTubeId = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// 유튜브 임베드 URL
const getYouTubeEmbedUrl = (videoUrl) => {
  const id = getYouTubeId(videoUrl)
  if (!id) return null
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`
}

// 첨부파일 파싱 (JSON 문자열 또는 객체) - 항상 배열로 반환
const parseAttachments = (attachments) => {
  if (!attachments) return null
  try {
    let parsed = typeof attachments === 'string' ? JSON.parse(attachments) : attachments
    // 단일 객체면 배열로 감싸기 (이전 형식 호환)
    if (parsed && !Array.isArray(parsed)) {
      parsed = [parsed]
    }
    return parsed
  } catch (e) { return null }
}

/**
 * AccordionCard - 카드 + 모달 컴포넌트
 */
export default function AccordionCard({ id, title, content, date, status, author, imageUrl, videoUrl, attachments }) {
  const [showModal, setShowModal] = useState(false)
  
  const handleOpen = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  const handleClose = () => setShowModal(false)
  
  // 실제 서식 HTML 여부 감지 (<br>만 있는 건 HTML로 취급하지 않음)
  const isRichHtml = (text) => !!text && /<(strong|em|b|i|span|div|p|img|iframe|ul|ol|li|blockquote|h[1-6]|a[\s>]|table|figure)\b/i.test(text)

  // 에디터 잔재(× 버튼, 파일칩) 제거 후 innerHTML 반환
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

  // 콘텐츠 → HTML 변환 (rich HTML이면 정리 후 반환, 아니면 마크다운 파싱)
  const toHtml = (text) => {
    if (!text) return ''
    if (isRichHtml(text)) return mdLinks(sanitize(text))
    const clean = text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
    return marked.parse(clean)
  }

  // 미리보기 텍스트: 태그/마크다운 제거 후 첫 80자
  const getPreviewText = (text) => {
    if (!text) return ''
    const div = document.createElement('div')
    div.innerHTML = toHtml(text)
    div.querySelectorAll('[data-delete-media],[data-filename]').forEach(el => el.remove())
    const raw = (div.textContent || div.innerText || '').trim()
    // 2차 파싱: rich HTML 내 마크다운 문법 잔재 제거
    const div2 = document.createElement('div')
    div2.innerHTML = marked.parse(raw)
    const plain = (div2.textContent || div2.innerText || '').trim()
    return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
  }
  const preview = getPreviewText(content)
  
  // 상태별 라벨 및 스타일
  const statusLabels = {
    pending: { label: '처리 이전', color: '#dc3545', bg: '#f8d7da' },
    planned: { label: '처리 예정', color: '#fd7e14', bg: '#fff3cd' },
    completed: { label: '처리 완료', color: '#28a745', bg: '#d4edda' }
  }
  const statusStyle = statusLabels[status] || statusLabels.pending

  // 첨부파일 데이터
  const attachmentData = parseAttachments(attachments)
  const videoEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null
  const noticeId = id
  
  return (
    <>
      {/* 목록 표시용 카드 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200" onClick={handleOpen} style={{ cursor: 'pointer' }}>
        <div className="flex">
          {/* 이미지 썸네일 (있을 때만) */}
          {imageUrl && (
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img 
                src={imageUrl.startsWith('http') ? imageUrl : window.location.origin + imageUrl} 
                alt="썸네일" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}
          <div className="flex-1 p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{title}</span>
                  {status && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </span>
                  )}
                  {/* 첨부파일 표시 */}
                  {!imageUrl && (videoUrl || attachmentData) && (
                    <span className="text-xs text-cyan-600">
                      {(videoUrl ? '🎬' : '')}{(attachmentData ? '📎' : '')}
                    </span>
                  )}
                </div>
                {preview && (
                  <p className="text-gray-500 text-sm m-0">{preview.slice(0, 60)}{preview.length > 60 ? '...' : ''}</p>
                )}
              </div>
              {date && <span className="text-gray-500 text-xs whitespace-nowrap ml-2">{new Date(date).toLocaleDateString('ko-KR')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 내용 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={handleClose}>
          <div 
            className="bg-white rounded-xl p-8 w-[min(800px,90%)] max-h-[85vh] overflow-auto shadow-[0_8px_40px_rgba(0,0,0,0.3)]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
              <div className="flex-1 pr-4">
                <h2 className="m-0 text-2xl font-bold text-gray-800">{title}</h2>
                {date && <p className="text-gray-500 text-sm mt-2">날짜: {new Date(date).toLocaleDateString('ko-KR')}</p>}
                {author && <p className="text-gray-500 text-sm">작성자: {author}</p>}
              </div>
              {status && (
                <span className="text-sm px-3 py-1.5 rounded-full font-semibold shrink-0"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                  {statusStyle.label}
                </span>
              )}
              <button 
                onClick={handleClose} 
                className="ml-3 px-5 py-2 bg-[#4a90d9] text-white rounded-lg text-base font-semibold hover:bg-[#3561b0] transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
            
            {/* 본문 내용 */}
            <div
              className="leading-relaxed text-gray-700 mb-4 rich-content"
              dangerouslySetInnerHTML={{ __html: toHtml(content) }}
            />

            {/* 이미지 */}
            {imageUrl && (
              <div className="mb-4">
                <img 
                  src={imageUrl.startsWith('http') ? imageUrl : window.location.origin + imageUrl} 
                  alt="이미지" 
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}

            {/* 유튜브 동영상 */}
            {videoEmbedUrl && (
              <div className="mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <iframe 
                  src={videoEmbedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={title}
                  loading="lazy"
                />
              </div>
            )}
            
            {/* 첨부파일 목록 (다중) */}
            {attachmentData && Array.isArray(attachmentData) && attachmentData.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">📎 첨부파일 ({attachmentData.length}개)</p>
                <div className="space-y-2">
                  {attachmentData.map((file, idx) => {
                    const displayName = file.filename || file.originalname || `파일 ${idx + 1}`
                    // API 다운로드 엔드포인트 사용
                    const downloadUrl = `/api/notices/${noticeId}/download/${idx}`
                    
                    return (
                      <a
                        key={idx}
                        href={downloadUrl}
                        download={displayName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white rounded hover:bg-gray-100 transition-colors"
                      >
                        <span>📄</span>
                        <span className="text-sm text-gray-700">{displayName}</span>
                        {file.mimetype && <span className="text-xs text-gray-400 ml-auto">{file.mimetype}</span>}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* 단일 첨부파일 (이전 형식 호환) */}
            {attachments && !Array.isArray(attachmentData) && (
              <div className="mt-4">
                <a 
                  href={attachments.startsWith('http') ? attachments : `${window.location.origin}${attachments}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 no-underline"
                >
                  <span>📎</span>
                  <span>첨부파일 다운로드</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
