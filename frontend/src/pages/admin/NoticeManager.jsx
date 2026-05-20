/**
 * NoticeManager.jsx - 공지사항 관리 페이지
 * 이미지, 동영상, 첨부파일 지원 (수상/포트폴리오처럼)
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../services/api'
import WriteModal from '../../components/WriteModal'

function NoticeManager() {
  const { api, user } = useAuth()
  
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadNotices() }, [])

  const loadNotices = async () => {
    try {
      const data = await api('/api/notices')
      setNotices(data.data || data)
    } catch { setNotices([]) }
    finally { setLoading(false) }
  }

  const handleOpenNew = () => {
    setEditingData({})
    setShowModal(true)
  }

  const handleEdit = (notice) => {
    setEditingData(notice)
    setShowModal(true)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('content', formData.content)
      data.append('author', user?.name || '관리자')
      if (formData.videoUrl) data.append('videoUrl', formData.videoUrl)

      // 이미지 처리
      if (formData.image) {
        data.append('image', formData.image)
      }

      // 첨부파일 처리 (다중)
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach(file => {
          data.append('attachments', file)
        })
      }

      const token = localStorage.getItem('token')
      const isEdit = editingData?.id
      
      const res = await fetch(isEdit ? `${API_BASE}/notices/${isEdit}` : `${API_BASE}/notices`, {
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
      loadNotices()
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
      await api(`/api/notices/${id}`, { method: 'DELETE' })
      loadNotices()
    } catch (err) { alert('삭제 실패: ' + err.message) }
  }

  const getAttachmentInfo = (notice) => {
    const info = []
    if (notice.imageUrl) info.push('이미지')
    if (notice.videoUrl) info.push('동영상')
    if (notice.attachments) {
      try {
        const att = typeof notice.attachments === 'string' ? JSON.parse(notice.attachments) : notice.attachments
        if (Array.isArray(att) && att.length > 0) info.push(`파일 ${att.length}개`)
      } catch { info.push('파일') }
    }
    return info.join(', ')
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-cyan-400">
        <h2 className="text-lg font-semibold m-0">공지사항 관리</h2>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600"
        >
          + 글쓰기
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8">로딩 중...</p>
      ) : notices.length === 0 ? (
        <p className="text-center py-8 text-gray-500">등록된 공지사항이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {notices.map(notice => (
            <li key={notice.id} className="border-b pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium">{notice.title}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(notice.date).toLocaleDateString('ko-KR')}
                    {getAttachmentInfo(notice) && (
                      <span className="ml-1 text-cyan-600">
                        ({getAttachmentInfo(notice)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(notice)} className="text-blue-500 text-sm">수정</button>
                  <button onClick={() => handleDelete(notice.id)} className="text-red-500 text-sm">삭제</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <WriteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        initialData={editingData || {}}
        loading={submitting}
        title="공지사항"
      />
    </div>
  )
}

export default NoticeManager