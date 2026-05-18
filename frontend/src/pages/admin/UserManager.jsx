/**
 * UserManager.jsx - 계정 관리 페이지
 * 관리자가 사용자 계정을 CRUD로 관리
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FormInput, FormButton } from '../../components/FormElements'

function UserManager() {
  const { api } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Form state
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'student'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api('/api/users')
      setUsers(data.data || data)
    } catch (err) {
      console.error('사용자 로드 실패:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 생성 모드에서는 username, password, name 필수
    // 수정 모드에서는 username, name만 필수 (password은 선택)
    if (!form.username.trim() || !form.name.trim() || (!editingId && !form.password.trim())) {
      alert('username, password, name은 필수입니다')
      return
    }

    try {
      if (editingId) {
        // 수정 (username 제외)
        const updateData = { username: form.username, name: form.name, role: form.role }
        if (form.password) updateData.password = form.password

        await api(`/api/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      } else {
        // 생성
        await api('/api/users', {
          method: 'POST',
          body: JSON.stringify(form)
        })
      }

      resetForm()
      loadUsers()
    } catch (err) {
      alert('저장 실패: ' + (err.message || '오류가 발생했습니다'))
    }
  }

  const handleEdit = (user) => {
    setEditingId(user.id)
    setForm({
      username: user.username,
      password: '',
      name: user.name || '',
      role: user.role
    })
    setShowForm(true)
  }

  const handleDelete = async (id, username) => {
    if (!confirm(`사용자 "${username}"을(를) 삭제하시겠습니까?`)) return
    try {
      await api(`/api/users/${id}`, { method: 'DELETE' })
      loadUsers()
    } catch (err) {
      alert('삭제 실패: ' + (err.message || '오류가 발생했습니다'))
    }
  }

  const resetForm = () => {
    setForm({ username: '', password: '', name: '', role: 'student' })
    setEditingId(null)
    setShowForm(false)
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return '관리자'
      case 'teacher': return '교사'
      default: return '학생'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700'
      case 'teacher': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-cyan-400">
        <h2 className="text-lg font-semibold m-0">👤 계정 관리</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600"
          >
            + 새 계정 추가
          </button>
        )}
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <form className="bg-gray-50 p-4 rounded-xl mb-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">username *</label>
              <FormInput
                placeholder="username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                password {editingId ? '(변경시 입력)' : '*'}
              </label>
              <FormInput
                type="password"
                placeholder={editingId ? '변경시 입력' : '비밀번호'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">이름 *</label>
              <FormInput
                placeholder="이름"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">권한</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">학생</option>
                <option value="teacher">교사</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <FormButton type="submit">
              {editingId ? '수정하기' : '계정 생성'}
            </FormButton>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 사용자 목록 */}
      <div>
        <h3 className="text-base font-semibold mb-3">등록된 계정 ({users.length})</h3>
        {loading ? (
          <p>로딩 중...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">등록된 계정이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left">username</th>
                  <th className="px-3 py-2 text-left">이름</th>
                  <th className="px-3 py-2 text-left">권한</th>
                  <th className="px-3 py-2 text-left">생성일</th>
                  <th className="px-3 py-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{user.username}</td>
                    <td className="px-3 py-2">{user.name || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-2 py-1 mr-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManager
