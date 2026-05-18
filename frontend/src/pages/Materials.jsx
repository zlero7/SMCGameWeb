/**
 * Materials.jsx - 자료실 페이지 (Materials Page)
 * 
 * 학교에서 제공하는 학습 자료들을 다운로드할 수 있는 페이지입니다.
 * 파일 유형(문서, 이미지, 동영상 등)에 따라 아이콘을 표시합니다.
 * 
 * [데이터]
 * - 제목, 설명, 카테고리, 파일명, 파일 크기, 다운로드 횟수
 * 
 * [기능]
 * - 카테고리별 필터링
 * - 파일 다운로드 (다운로드 횟수 증가)
 * - 파일 크기 표시 (바이트 → KB/MB 변환)
 * 
 * [API]
 * - GET /api/materials
 * - GET /api/materials/categories
 * - POST /api/materials/:id/download
 */

import React, { useEffect, useState } from 'react'
import { fetchMaterials, fetchMaterialCategories } from '../services/api'

/**
 * Materials - 자료실 페이지 컴포넌트
 */
function Materials() {
  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 페이지 로드 시 데이터 조회
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [materialsData, categoriesData] = await Promise.all([
        fetchMaterials(),
        fetchMaterialCategories()
      ])
      setMaterials(materialsData.data || materialsData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 파일 크기 변환 (바이트 → KB/MB)
  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // 파일 유형별 아이콘
  const getFileIcon = (fileType, fileName) => {
    if (!fileType) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('video') || fileType.includes('mp4')) return '🎬'
    if (fileType.includes('audio')) return '🎵'
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦'
    return '📄'
  }

  // 다운로드 처리
  const handleDownload = async (material) => {
    try {
      // 다운로드 횟수 증가 요청
      await fetch(`/api/materials/${material.id}/download`, { method: 'POST' })
      
      // 파일명을 UTF-8로 인코딩하여 다운로드
      const encodedFilename = encodeURIComponent(material.fileName)
      const fullUrl = `${window.location.origin}/api/materials/${material.id}/file?filename=${encodedFilename}`
      
      const link = document.createElement('a')
      link.href = fullUrl
      link.download = material.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 화면 업데이트
      setMaterials(prev => prev.map(m => 
        m.id === material.id ? { ...m, downloadCount: m.downloadCount + 1 } : m
      ))
    } catch (err) {
      alert('다운로드 실패: ' + err.message)
    }
  }

  // 카테고리별 필터링
  const filteredMaterials = selectedCategory 
    ? materials.filter(m => m.category === selectedCategory)
    : materials

  if (loading) return <div className="text-gray-500 p-4 text-center">로딩 중...</div>
  if (error) return <div className="text-red-500 p-4">오류: {error}</div>

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <h2 className="text-xl uppercase tracking-widest border-b-2 border-cyan-400 pb-2 mb-4">📚 자료실</h2>
      
      {/* 카테고리 필터 */}
      {categories.length > 0 && (
        <div className="mb-5">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full max-w-[300px] px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
          >
            <option value="">전체 카테고리</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* 자료 목록 */}
      {filteredMaterials.length === 0 ? (
        <p>등록된 자료가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-[2fr_1fr] gap-4">
          {filteredMaterials.map(material => (
            <div key={material.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
              <div className="flex items-start gap-3">
                <span className="text-3xl">
                  {getFileIcon(material.fileType, material.fileName)}
                </span>
                <div className="flex-1">
                  <h3 className="m-0 mb-2 text-base">{material.title}</h3>
                  {material.description && (
                    <p className="text-gray-500 text-sm m-0 mb-2">
                      {material.description.slice(0, 100)}
                      {material.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    <span>📂 {material.category}</span> • 
                    <span> 📄 {material.fileName}</span> • 
                    <span> 💾 {formatFileSize(material.fileSize)}</span> • 
                    <span> ⬇️ {material.downloadCount || 0}회</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(material)}
                className="w-full mt-3 px-6 py-3 bg-[#4a90d9] text-white rounded-lg text-sm font-semibold hover:bg-[#3561b0] transition-colors"
              >
                ⬇️ 다운로드
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Materials