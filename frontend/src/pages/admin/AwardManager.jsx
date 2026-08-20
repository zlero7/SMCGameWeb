/**
 * AwardManager.jsx - 수상/포트폴리오 관리 페이지
 * 네이버 카페 스타일 글쓰기 모달 적용
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../services/api'
import WriteModal from '../../components/WriteModal'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

function AwardManager() {
  const { api } = useAuth()
  
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAwards()
  }, [])

  const loadAwards = async () => {
    try {
      const data = await api('/api/awards')
      setAwards(data.data || data)
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['수상', '포트폴리오']

  const handleOpenNew = () => {
    setEditingData({})
    setShowModal(true)
  }

  const handleEdit = (award) => {
    setEditingData(award)
    setShowModal(true)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('content', formData.content)
      data.append('category', formData.category === '수상' ? 'award' : 'portfolio')
      if (formData.image) data.append('image', formData.image)
      data.append('videoUrl', formData.videoUrl || '')
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach(file => data.append('attachments', file))
      }

      const token = localStorage.getItem('token')
      const isEdit = editingData?.id
      
      const res = await fetch(isEdit ? `${API_BASE}/awards/${isEdit}` : `${API_BASE}/awards`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || '저장 실패')
      }

      setShowModal(false)
      setEditingData(null)
      loadAwards()
      alert(isEdit ? '수정되었습니다!' : '등록되었습니다!')
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await api(`/api/awards/${id}`, { method: 'DELETE' })
      loadAwards()
      alert('삭제되었습니다!')
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  // 유튜브 ID 추출
  const getYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  // 이미지 URL에 도메인 추가
  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `http://${window.location.hostname}:3000${url}`
  }

  // 링크 변환
  const renderContent = (content) => {
    if (!content) return null
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)
    return parts.map((part, i) => 
      urlRegex.test(part) 
        ? <a key={i} href={part} target="_blank" rel="noreferrer" className="text-cyan-500 hover:underline">{part}</a>
        : part
    )
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-cyan-400">
        <h2 className="text-lg font-semibold m-0">🏆 수상/포트폴리오 관리</h2>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0]"
        >
          + 글쓰기
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8">로딩 중...</p>
      ) : awards.length === 0 ? (
        <p className="text-center py-8 text-gray-500">등록된 항목이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {awards.map(award => (
            <div key={award.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="mb-3">
                {award.imageUrl && (
                  <img src={getImageUrl(award.imageUrl)} alt={award.title} className="w-full h-40 object-cover rounded-lg" />
                )}
                {award.videoUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(award.videoUrl)}?rel=0`}
                      className="w-full h-full"
                      allowFullScreen
                      title={award.title}
                    />
                  </div>
                )}
                {!award.imageUrl && !award.videoUrl && award.attachments && (
                  <div className="w-full h-40 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-4xl">📎</span>
                    <span className="text-xs text-gray-500 mt-1">파일 첨부</span>
                  </div>
                )}
                {!award.imageUrl && !award.videoUrl && !award.attachments && (
                  <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">{award.category === 'award' ? '🏆' : '📁'}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  award.category === 'award' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {award.category === 'award' ? '🏆 수상' : '📁 포트폴리오'}
                </span>
              </div>
              <h4 className="font-bold mb-2">{award.title}</h4>
              {/<[a-z][\s\S]*>/i.test(award.content || '') ? (
                <div className="rich-content text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(award.content) }} />
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{renderContent(award.content)}</p>
              )}
              {award.author && <p className="text-xs text-gray-400 mt-2">작성자: {award.author}</p>}

              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => handleEdit(award)}
                  className="flex-1 px-3 py-1.5 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0] transition-colors"
                >
                  수정
                </button>
                <button 
                  onClick={() => handleDelete(award.id)}
                  className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <WriteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        initialData={editingData ? { ...editingData, category: editingData.category === 'award' ? '수상' : '포트폴리오' } : {}}
        loading={submitting}
        categories={categories}
        title="수상/포트폴리오"
      />
    </div>
  )
}

export default AwardManager