/**
 * AdmissionManager.jsx - 진학 정보 관리 페이지
 * 네이버 카페 스타일 글쓰기 모달 적용
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import WriteModal from '../../components/WriteModal'

function AdmissionManager() {
  const { api, user } = useAuth()
  
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingData, setEditingData] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadAdmissions() }, [])

  const loadAdmissions = async () => {
    try {
      const data = await api('/api/admissions')
      setAdmissions(data.data || data)
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

  const handleEdit = (admission) => {
    setEditingData({ ...admission, title: admission.program, content: admission.requirements })
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
      
      const res = await fetch(isEdit ? `/api/admissions/${isEdit}` : '/api/admissions', {
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
      loadAdmissions()
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
      await api(`/api/admissions/${id}`, { method: 'DELETE' })
      loadAdmissions()
      alert('삭제되었습니다!')
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-cyan-400">
        <h2 className="text-lg font-semibold m-0">🎓 진학 정보 관리</h2>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0]"
        >
          + 글쓰기
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8">로딩 중...</p>
      ) : admissions.length === 0 ? (
        <p className="text-center py-8 text-gray-500">등록된 진학 정보가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {admissions.map(admission => (
            <div key={admission.id} className="border-b pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{admission.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {admission.author} • {new Date(admission.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(admission)}
                    className="text-blue-500 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(admission.id)}
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
        title="진학 정보"
      />
    </div>
  )
}

export default AdmissionManager