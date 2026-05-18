/**
 * LabInspectionManager.jsx - 실습실 점검 관리 페이지 (Lab Inspection Manager)
 * 
 * 관리자가 실습실 점검 목록을 관리하는 페이지입니다.
 * 학생들이 제출한 점검 요청의 상태를 관리합니다.
 * 
 * [주요 기능]
 * - 점검 목록 조회 (학생이 제출한 요청)
 * - 점검 내용 수정 (제목, 내용, 상태)
 * - 상태 변경 (pending → planned → completed)
 * - 점검 삭제
 * 
 * [상태 (status)]
 * - pending: 처리 이전 (빨강) - 새로운 요청
 * - planned: 처리 예정 (주황) - 관리자가 확인 후 처리 예정
 * - completed: 처리 완료 (초록) - 문제 해결됨
 * 
 * [참고]
 * - 이 페이지는 관리자만 접근 가능 (AdminGuard로 보호)
 * - 학생들은 별도의 LabInspections 페이지에서 점검 요청 가능
 * - 상태 변경은 드롭다운으로 간단하게 가능
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

/**
 * LabInspectionManager - 실습실 점검 관리 컴포넌트
 */
function LabInspectionManager() {
  const { api } = useAuth()
  
  // 목록 상태
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 편집 상태
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', author: '', status: 'pending' })

  // 마운트 시 데이터 로드
  useEffect(() => {
    loadInspections()
  }, [])

  /**
   * loadInspections - 점검 목록 조회
   * GET /api/lab-inspections
   */
  const loadInspections = async () => {
    setLoading(true)
    try {
      const data = await api('/api/lab-inspections')
      setInspections(data.data || data)
    } catch {
      setInspections([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * handleDelete - 점검 삭제
   * DELETE /api/lab-inspections/:id
   */
  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await api(`/api/lab-inspections/${id}`, { method: 'DELETE' })
      loadInspections()
    } catch (err) {
      alert('삭제 실패: ' + err.message)
    }
  }

  /**
   * handleEdit - 수정 모드 전환
   */
  const handleEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ 
      title: item.title, 
      content: item.content, 
      author: item.author || '',
      status: item.status || 'pending'
    })
  }

  /**
   * handleUpdate - 수정 내용 저장
   * PUT /api/lab-inspections/:id
   */
  const handleUpdate = async (id) => {
    try {
      await api(`/api/lab-inspections/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(editForm) 
      })
      setEditingId(null)
      setEditForm({ title: '', content: '', author: '', status: 'pending' })
      loadInspections()
    } catch (err) {
      alert('수정 실패: ' + err.message)
    }
  }

  /**
   * handleStatusChange - 상태만 빠르게 변경
   * 드롭다운으로 상태 선택 시 호출
   */
  const handleStatusChange = async (id, newStatus) => {
    try {
      // 현재 항목 조회 후 상태만 변경
      const item = inspections.find(i => i.id === id)
      await api(`/api/lab-inspections/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...item, status: newStatus }) 
      })
      loadInspections()
    } catch (err) {
      alert('상태 변경 실패: ' + err.message)
    }
  }

  // 상태별 라벨 및 스타일
  const statusLabels = {
    pending: { label: '처리 이전', color: '#dc3545', bg: '#f8d7da' },
    planned: { label: '처리 예정', color: '#fd7e14', bg: '#fff3cd' },
    completed: { label: '처리 완료', color: '#28a745', bg: '#d4edda' }
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-cyan-400">🔧 실습실 점검 관리</h2>

      {/* 목록 (수정 모드 지원) */}
      <div className="mt-6">
        <h3 className="text-base font-semibold mb-3">등록된 점검 목록 ({inspections.length})</h3>
        {loading ? (
          <p>로딩 중...</p>
        ) : inspections.length === 0 ? (
          <p>등록된 점검 사항이 없습니다.</p>
        ) : (
          inspections.map(item => (
            // 수정 중이면 인라인 편집 UI
            editingId === item.id ? (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg mb-2">
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                />
                <textarea 
                  value={editForm.content} 
                  onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
                  rows={3}
                />
                {/* 상태 선택 (편집 모드) */}
                <div className="mb-2">
                  <label className="text-sm mr-2">상태:</label>
                  <select 
                    value={editForm.status} 
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="pending">처리 이전</option>
                    <option value="planned">처리 예정</option>
                    <option value="completed">처리 완료</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-[#4a90d9] text-white rounded-lg text-sm hover:bg-[#3561b0] transition-colors">저장</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">취소</button>
                </div>
              </div>
            ) : (
              // 일반 목록 (상태 드롭다운 포함)
              <div key={item.id} className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="mr-4 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <strong>{item.title}</strong>
                    {/* 상태 태그 */}
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: statusLabels[item.status || 'pending'].bg,
                        color: statusLabels[item.status || 'pending'].color,
                      }}>
                      {statusLabels[item.status || 'pending'].label}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs">{item.author} | {new Date(item.createdAt).toLocaleDateString('ko-KR')}</div>
                </div>
                
                {/* 우측: 상태 드롭다운 + 수정/삭제 */}
                <div className="flex flex-col gap-2 items-end">
                  {/* 상태 빠른 변경 (드롭다운) */}
                  <select 
                    value={item.status || 'pending'} 
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="pending">처리 이전</option>
                    <option value="planned">처리 예정</option>
                    <option value="completed">처리 완료</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="px-2.5 py-1 bg-[#4a90d9] text-white rounded-lg text-xs hover:bg-[#3561b0] transition-colors">수정</button>
                    <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors">삭제</button>
                  </div>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  )
}

export default LabInspectionManager