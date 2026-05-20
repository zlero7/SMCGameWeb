/**
 * API 서비스 모듈
 * 
 * 프로젝트: 세명컴고 게임과 포털 웹사이트
 * 설명: 백엔드 API 호출을 담당하는 서비스 레이어
 * 
 * 사용 방법:
 * import { fetchNotices, fetchCareers, ... } from './services/api'
 * 
 * 주요 함수:
 * - fetchXXX(): 데이터 목록 조회 (개별 페이지에서 useEffect와 함께 사용)
 * - getXXX(id): 단일 데이터 조회
 * - createXXX(data): 데이터 생성 (관리자만)
 * 
 * 유지보수 시 참고:
 * - 새로운 API 엔드포인트 추가 시 이 파일에 함수 추가
 * - 에러 처리는 각 페이지 컴포넌트에서 수행
 * - 인증이 필요한 API는 AuthContext의 api() 함수 사용 (자동 토큰 포함)
 */

// API 기본 URL - 웹: Nginx 프록시(/api), 모바일: 환경 변수로 실제 서버 URL 지정
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 공통 API 호출 함수
 * 
 * @param {string} endpoint - API 엔드포인트 (예: '/notices', '/careers')
 * @param {object} options - fetch 옵션 (method, body, headers 등)
 * @returns {Promise<object>} - JSON 응답 데이터
 * @throws {Error} - HTTP 에러 또는 네트워크 에러
 * 
 * 에러 처리:
 * - HTTP 에러 시 서버 응답의 error 메시지 추출
 * - 네트워크 에러 시 console.error로 로깅
 * - 호출하는 함수에서 catch하여 에러 처리 필요
 */
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 
        'Content-Type': 'application/json', 
        ...options.headers 
      },
      ...options
    })
    
    // HTTP 상태 코드 확인
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch ${endpoint}`)
    }
    
    return await res.json()
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message)
    throw err
  }
}

// ===== 공지사항 API =====
export const fetchNotices = () => apiFetch('/notices')
export const getNotice = (id) => apiFetch(`/notices/${id}`)

// ===== 취업 정보 API =====
export const fetchCareers = () => apiFetch('/careers')
export const getCareer = (id) => apiFetch(`/careers/${id}`)

// ===== 진학 정보 API =====
export const fetchAdmissions = () => apiFetch('/admissions')
export const getAdmission = (id) => apiFetch(`/admissions/${id}`)

// ===== 학사 일정 API =====
export const fetchCalendarEvents = () => apiFetch('/calendar').catch(() => ({ data: [] }))
export const fetchCalendarEventsNeis = () => apiFetch('/calendar/neis').catch(() => ({ data: [] }))
export const getCalendarEvent = (id) => apiFetch(`/calendar/${id}`)

// ===== 과제 일정 API =====
export const fetchAssignments = () => apiFetch('/assignments').catch(() => ({ data: [] }))
export const getAssignment = (id) => apiFetch(`/assignments/${id}`)
export const fetchCourses = () => apiFetch('/assignments/courses')

// ===== 실습실 점검 API (일반 사용자도 작성 가능) =====

/**
 * 실습실 점검 목록 조회
 * - 모든 사용자가 조회 가능 (인증 불필요)
 * - 기본값으로 { data: [] } 반환하여 에러 시 빈 배열 처리
 */
export const fetchLabInspections = () => apiFetch('/lab-inspections').catch(() => ({ data: [] }))

export const getLabInspection = (id) => apiFetch(`/lab-inspections/${id}`)

/**
 * 실습실 점검 작성
 * - 모든 사용자가 작성 가능 (인증 불필요)
 * - 관리자만 수정/삭제 가능
 */
export const createLabInspection = (data) => apiFetch('/lab-inspections', { 
  method: 'POST', 
  body: JSON.stringify(data) 
})

// ===== 자료실 API =====

/**
 * 자료실 목록 조회
 * - 모든 사용자가 조회 가능
 * - 기본값으로 { data: [] } 반환하여 에러 시 빈 배열 처리
 */
export const fetchMaterials = () => apiFetch('/materials').catch(() => ({ data: [] }))

/**
 * 자료실 카테고리 목록 조회
 */
export const fetchMaterialCategories = () => apiFetch('/materials/categories')

/**
 * 단일 자료 조회
 */
export const getMaterial = (id) => apiFetch(`/materials/${id}`)

/**
 * 자료 업로드 (관리자만)
 * - multipart/form-data 형식 필요
 * - 파일과 함께 제목, 카테고리 등 전송
 */
export const uploadMaterial = async (formData) => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/materials`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData  // multipart/form-data (json이 아님)
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to upload material')
    }
    
    return await res.json()
  } catch (err) {
    console.error(`API Error [/materials]:`, err.message)
    throw err
  }
}