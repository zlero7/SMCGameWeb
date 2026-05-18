/**
 * NEIS Calendar API Service
 * 교육부 NEIS 학사정보 open API
 * 
 * 사용법:
 * - NEIS_API_KEY, NEIS_SCHOOL_CODE, NEIS_ATPT_CODE 환경변수 설정
 * - getNeisCalendar(fromYmd, toYmd) 호출
 *   예: getNeisCalendar('20250401', '20250430')
 */

// NEIS API 설정
const NEIS_BASE_URL = 'https://open.neis.go.kr/hub/SchoolSchedule'

/**
 * NEIS 학사 일정 조회
 * @param {string} fromYmd - 시작일 (YYYYMMDD)
 * @param {string} toYmd - 종료일 (YYYYMMDD)
 * @returns {Promise<Array>} 일정 배열
 */
export async function getNeisCalendar(fromYmd, toYmd) {
  const apiKey = process.env.NEIS_API_KEY
  const schoolCode = process.env.NEIS_SCHOOL_CODE
  const atptCode = process.env.NEIS_ATPT_CODE
  
  if (!apiKey) {
    throw new Error('NEIS API 키가 설정되지 않았습니다. .env 파일을 확인하세요.')
  }
  
  if (!schoolCode || !atptCode) {
    throw new Error('학교 코드가 없습니다. .env 파일을 확인하세요.')
  }

  const params = new URLSearchParams({
    KEY: apiKey,
    Type: 'json',
    pIndex: 1,
    pSize: 200,
    ATPT_OFCDC_SC_CODE: atptCode,
    SD_SCHUL_CODE: schoolCode,
    AA_FROM_YMD: fromYmd,
    AA_TO_YMD: toYmd
  })

  try {
    const response = await fetch(`${NEIS_BASE_URL}?${params}`)
    const data = await response.json()

    if (!data.SchoolSchedule) {
      return []
    }

    const schedule = data.SchoolSchedule[1]?.row || []
    return schedule.map(item => {
      // NEIS 날짜 형식: YYYYMMDD → JavaScript Date
      const dateStr = item.AA_YMD
      const date = new Date(dateStr.substring(0, 4), parseInt(dateStr.substring(4, 6)) - 1, dateStr.substring(6, 8))
      
      return {
        title: item.EVENT_NM || item.SCHUL_NM,
        start: dateStr,  // 문자열로 저장 (YYYYMMDD)
        end: dateStr,
        date: dateStr,   // 호환성
        type: mapNeisEventType(item.EVENT_NM, item.SBTR_DD_SC_NM),
        description: item.EVENT_CNTNT || '',
        source: 'neis',
        gradeEvent: {
          one: item.ONE_GRADE_EVENT_YN,
          two: item.TW_GRADE_EVENT_YN,
          three: item.THREE_GRADE_EVENT_YN
        }
      }
    })
  } catch (error) {
    console.error('NEIS API Error:', error)
    throw error
  }
}

/**
 * NEIS 이벤트 타입 매핑 (이벤트명 + 휴무일 유형)
 */
function mapNeisEventType(eventNm, sbtrType) {
  if (!eventNm) return 'general'
  
  const name = eventNm.toLowerCase()
  
  // 1. 시험/고사/평가 → 빨강
  if (name.includes('고사') || name.includes('시험') || name.includes('평가') || name.includes('middle') || name.includes('final')) {
    return 'exam'
  }
  
  // 2. 방학 → 파랑
  if (name.includes('방학') || name.includes('winter') || name.includes('summer')) {
    return 'vacation'
  }
  
  // 3. 학교 행사/축제/개학/수능/면접 → 초록
  if (name.includes('행사') || name.includes('축제') || name.includes('개학') || name.includes('수능') || name.includes('면접') || name.includes('입학') || name.includes('체육') || name.includes('대체') || name.includes('개교')) {
    return 'event'
  }
  
  // 4. 휴무일 유형 확인
  if (sbtrType) {
    if (sbtrType.includes('공휴일')) return 'holiday'
    if (sbtrType.includes('휴업일')) return 'vacation'
  }
  
  // 5.기본: 일반
  return 'general'
}

/**
 * NEIS에서 가져온 일정을 로컬 DB에 저장 (관리자용)
 * @param {string} fromYmd - 시작일 (YYYYMMDD)
 * @param {string} toYmd - 종료일 (YYYYMMDD)
 */
export async function syncNeisToLocal(fromYmd, toYmd) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    const events = await getNeisCalendar(fromYmd, toYmd)
    
    for (const event of events) {
      // 제목 + 날짜로 중복 체크
      const existing = await prisma.calendarEvent.findFirst({
        where: {
          title: event.title,
          start: event.start
        }
      })
      
      if (!existing) {
        await prisma.calendarEvent.create({
          data: event
        })
      }
    }
    
    return { success: true, count: events.length }
  } finally {
    await prisma.$disconnect()
  }
}