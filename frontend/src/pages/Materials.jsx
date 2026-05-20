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
import { fetchMaterials, fetchMaterialCategories, API_BASE } from '../services/api'
import PageBanner from '../components/PageBanner'

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
      await fetch(`${API_BASE}/materials/${material.id}/download`, { method: 'POST' })

      // 파일명을 UTF-8로 인코딩하여 다운로드
      const encodedFilename = encodeURIComponent(material.fileName)
      const fullUrl = `${API_BASE}/materials/${material.id}/file?filename=${encodedFilename}`
      
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
    <>
      <PageBanner icon="📚" title="자료실" subtitle="학습 자료를 다운로드하세요" />
      <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5">

        {/* 카테고리 필터 */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => setSelectedCategory('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              전체
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 자료 목록 */}
        {filteredMaterials.length === 0 ? (
          <p className="text-gray-500 text-center py-8">등록된 자료가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMaterials.map(material => (
              <div key={material.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl shrink-0">{getFileIcon(material.fileType, material.fileName)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 mb-1 text-sm font-bold text-gray-800 truncate">{material.title}</h3>
                    {material.description && (
                      <p className="text-gray-500 text-xs m-0 mb-1 line-clamp-2">{material.description.slice(0, 80)}{material.description.length > 80 ? '...' : ''}</p>
                    )}
                    <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                      <span>📂 {material.category}</span>
                      <span>💾 {formatFileSize(material.fileSize)}</span>
                      <span>⬇️ {material.downloadCount || 0}회</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDownload(material)}
                  className="w-full py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-400 transition-colors">
                  ⬇️ 다운로드
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Materials