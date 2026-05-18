/**
 * TitleUpdater.jsx - 페이지 제목 자동 변경 (Page Title Updater)
 * 
 * 라우트 변경 시 자동으로 브라우저 탭의 제목을 업데이트하는 컴포넌트입니다.
 * 사용자가 현재 페이지를 쉽게 구분할 수 있도록 도와줍니다.
 * 
 * [동작 방식]
 * 1. React Router의 useLocation 훅으로 현재 경로 감시
 * 2. 경로가 변경될 때마다 useEffect 실행
 * 3. /admin으로 시작하면 "관리자" 제목, 아니면 일반 제목
 * 
 * [제목 규칙]
 * - /admin... → "세명컴고 게임과 포털 - 관리자"
 * - 그 외 → "세명컴고 게임과 포털"
 * 
 * [사용법]
 * - App.jsx의 Routes 외부에 배치 (모든 라우트 감시)
 * - 별도의 props 필요 없음 (useLocation으로 자동 감지)
 * 
 * [참고]
 * - 이 컴포넌트는 렌더링하지 않음 (return null)
 * - 오직 부수 효과(제목 변경)만 수행
 */

import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * TitleUpdater - 페이지 제목 자동 변경 컴포넌트
 * 
 * [로직]
 * 1. useLocation()으로 현재 경로 객체 가져오기
 * 2. useEffect에서 location.pathname 변경 시 실행
 * 3. 경로 시작 문자열 확인 (/admin 여부)
 * 4. document.title 업데이트
 */
export default function TitleUpdater() {
  const location = useLocation()
  
  // 경로 변경 시 제목 업데이트
  useEffect(() => {
    const path = location.pathname
    
    // 관리자 페이지인 경우 "관리자" 포함 제목
    if (path.startsWith('/admin')) {
      document.title = '세명컴고 게임과 포털 - 관리자'
    } else {
      // 일반 페이지
      document.title = '세명컴고 게임과 포털'
    }
  }, [location.pathname])  // 경로 변경 시마다 재실행

  // 렌더링 없음 (오직 부수 효과만 수행)
  return null
}
