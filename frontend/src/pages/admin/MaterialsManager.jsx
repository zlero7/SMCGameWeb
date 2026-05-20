/**
 * MaterialsManager.jsx - 자료 관리 페이지 (Materials Manager)
 * 
 * 관리자가 학습 자료를 업로드하고 관리하는 페이지입니다.
 * 파일 업로드, 수정, 삭제 기능을 제공합니다.
 * 
 * [주요 기능]
 * - 자료 업로드 (파일 선택, 제목, 카테고리, 설명)
 * - 자료 목록 조회
 * - 자료 수정 (제목, 카테고리, 설명, 공개 여부)
 * - 자료 삭제 (파일도 함께 삭제)
 * 
 * [파일 제한]
 * - 최대 크기: 50MB
 * - 지원 형식: 모든 파일 형식
 * 
 * [카테고리]
 * - 과목별, 유형별로 분류 가능
 * - 신규 카테고리 직접 입력 가능
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../services/api'

/**
 * MaterialsManager - 자료 관리 컴포넌트
 */
function MaterialsManager() {
  const { api } = useAuth()
  
  // 목록 상태
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 폼 상태 (업로드용)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // 편집 상태
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', category: '', description: '', isPublic: true })
  
  // 기존 카테고리 (자동완성용)
  const [existingCategories, setExistingCategories] = useState([])

  // 마운트 시 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  /**
   * loadData - 자료 목록 및 카테고리 로드
   */
  const loadData = async () => {
    setLoading(true)
    try {
      const [materialsData, categoriesData] = await Promise.all([
        api('/api/materials'),
        api('/api/materials/categories')
      ])
      setMaterials(materialsData.data || materialsData)
      setExistingCategories(categoriesData)
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * handleUpload - 파일 업로드
   */
  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!title.trim() || !category.trim()) {
      alert('제목과 카테고리를 입력해주세요.')
      return
    }
    
    if (!selectedFile) {
      alert('파일을 선택해주세요.')
      return
    }
    
    setUploading(true)
    try {
      // FormData 생성 (파일 업로드용)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', title)
      formData.append('category', category)
      formData.append('description', description)
      
      // 인증 토큰 추가
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/materials`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      // 폼 초기화
      setTitle('')
      setCategory('')
      setDescription('')
      setSelectedFile(null)
      
      // 파일 입력 초기화
      document.getElementById('file-input').value = ''
      
      loadData()
      alert('업로드 완료!')
    } catch (err) {
      alert('업로드 실패: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  /**
   * handleDelete - 자료 삭제
   */
  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까? (파일도 함께 삭제됩니다)')) return
    try {
      await api(`/api/materials/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  /**
   * handleEdit - 편집 모드로 전환
   */
  const handleEdit = (material) => {
    setEditingId(material.id)
    setEditForm({
      title: material.title,
      category: material.category,
      description: material.description || '',
      isPublic: material.isPublic
    })
  }

  /**
   * handleUpdate - 편집 내용 저장
   */
  const handleUpdate = async (id) => {
    try {
      await api(`/api/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      })
      setEditingId(null)
      loadData()
    } catch (err) {
      alert('수정 실패: ' + err.message)
    }
  }

  // 파일 크기 표시
  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-cyan-400">📚 자료실 관리</h2>
      
      {/* 업로드 폼 */}
      <form className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6" onSubmit={handleUpload}>
        <h3 className="text-base font-semibold mb-3">자료 업로드</h3>
        
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          required
        />
        
        <input
          type="text"
          placeholder="카테고리 (예: 게임프로그래밍, 자료구조)"
          list="categories"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          required
        />
        <datalist id="categories">
          {existingCategories.map(cat => <option key={cat} value={cat} />)}
        </datalist>
        
        <textarea
          placeholder="설명 (선택)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          rows={2}
        />
        
        <div className="mb-2">
          <input
            id="file-input"
            type="file"
            onChange={e => setSelectedFile(e.target.files[0])}
            className="hidden"
          />
          <label htmlFor="file-input" className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
            {selectedFile ? selectedFile.name : '파일 선택'}
          </label>
          {selectedFile && (
            <div className="text-gray-500 text-xs mt-1">
              선택됨: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>
        
        <button type="submit" disabled={uploading} className="px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors disabled:opacity-50">
          {uploading ? '업로드 중...' : '업로드'}
        </button>
      </form>

      {/* 자료 목록 */}
      <div className="mt-6">
        <h3 className="text-base font-semibold mb-3">등록된 자료 ({materials.length})</h3>
        {loading ? (
          <p>로딩 중...</p>
        ) : materials.length === 0 ? (
          <p>등록된 자료가 없습니다.</p>
        ) : (
          materials.map(material => (
            editingId === material.id ? (
              <div key={material.id} className="p-3 border border-gray-200 rounded-lg mb-2">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                />
                <input
                  type="text"
                  value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                />
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                  rows={2}
                />
                <div className="mb-2">
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.isPublic}
                      onChange={e => setEditForm({ ...editForm, isPublic: e.target.checked })}
                      className="mr-1"
                    /> 공개
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(material.id)} className="px-3 py-1.5 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0] transition-colors">저장</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">취소</button>
                </div>
              </div>
            ) : (
              <div key={material.id} className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="flex-1">
                  <strong>{material.title}</strong>
                  <div className="text-gray-500 text-xs mt-1">
                    📂 {material.category} | 📄 {material.fileName} | 💾 {formatFileSize(material.fileSize)} | ⬇️ {material.downloadCount || 0}회
                    {!material.isPublic && <span className="text-red-500 ml-2">[비공개]</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(material)} className="px-3 py-1.5 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0] transition-colors">수정</button>
                  <button onClick={() => handleDelete(material.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors">삭제</button>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  )
}

export default MaterialsManager