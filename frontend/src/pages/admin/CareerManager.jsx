/**
 * CareerManager.jsx - 취업 정보 관리 페이지
 * 네이버 카페 스타일 글쓰기 모달 적용
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import WriteModal from '../../components/WriteModal'

function CareerManager() {
  const { api, user } = useAuth()
  
  const [careers, setCareers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadCareers() }, [])

  const loadCareers = async () => {
    try {
      const data = await api('/api/careers')
      setCareers(data.data || data)
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    setEditingData({})
    setShowModal(true)
  }

  const handleEdit = (career) => {
    setEditingData(career)
    setShowModal(true)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('content', formData.content)
      data.append('author', user?.name || '관리자')
      if (formData.image) data.append('image', formData.image)

      const token = localStorage.getItem('token')
      const isEdit = editingData?.id
      
      const res = await fetch(isEdit ? `/api/careers/${isEdit}` : '/api/careers', {
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
      loadCareers()
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
      await api(`/api/careers/${id}`, { method: 'DELETE' })
      loadCareers()
      alert('삭제되었습니다!')
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-cyan-400">
        <h2 className="text-lg font-semibold m-0">💼 취업 정보 관리</h2>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0]"
        >
          + 글쓰기
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8">로딩 중...</p>
      ) : careers.length === 0 ? (
        <p className="text-center py-8 text-gray-500">등록된 취업 정보가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {careers.map(career => (
            <div key={career.id} className="border-b pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{career.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {career.author} • {new Date(career.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(career)}
                    className="text-blue-500 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(career.id)}
                    className="text-red-500 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <WriteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        initialData={editingData || {}}
        loading={submitting}
        title="취업 정보"
      />
    </div>
  )
}

export default CareerManager