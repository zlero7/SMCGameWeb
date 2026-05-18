/**
 * ThemeContext.jsx - 테마 컨텍스트 (Dark/Light Mode + Font)
 * 
 * 전체 앱의 테마와 글꼴 상태를 관리합니다.
 * 사용법: const { isDark, toggleTheme, fontFamily, setFontFamily } = useTheme()
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const FONTS = [
  { id: 'noto', name: 'Noto Sans KR', family: "'Noto Sans KR', sans-serif" },
  { id: 'jua', name: '주아 (Jua)', family: "'Jua', sans-serif" },
  { id: 'dohyeon', name: '도현 (Do Hyeon)', family: "'Do Hyeon', sans-serif" },
  { id: 'gothic-a1', name: 'Gothic A1', family: "'Gothic A1', sans-serif" },
  { id: 'nanum-myeongjo', name: '나눔명조', family: "'Nanum Myeongjo', serif" },
  { id: 'noto-serif', name: 'Noto Serif KR', family: "'Noto Serif KR', serif" },
  { id: 'black-han', name: '검은고딕', family: "'Black Han Sans', sans-serif" },
  { id: 'yeon-sung', name: '연성 (Yeon Sung)', family: "'Yeon Sung', cursive" },
  { id: 'gaegu', name: '개구쟁이 (Gaegu)', family: "'Gaegu', cursive" },
  { id: 'sunflower', name: '해바라기 (Sunflower)', family: "'Sunflower', sans-serif" },
  { id: 'default', name: '기본', family: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
]

export function ThemeProvider({ children }) {
  // localStorage에서 테마 설정 로드 (기본값: light)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  // localStorage에서 글꼴 설정 로드 (기본값: noto)
  const [fontFamily, setFontFamilyState] = useState(() => {
    const saved = localStorage.getItem('fontFamily')
    const font = FONTS.find(f => f.id === saved)
    return font ? font.family : FONTS[0].family
  })

  // 테마 변경 시 localStorage에 저장 및 body 클래스 업데이트
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    if (isDark) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [isDark])

  // 글꼴 변경 시 localStorage에 저장 및 body 스타일 업데이트
  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily)
    document.body.style.fontFamily = fontFamily
  }, [fontFamily])

  const toggleTheme = () => setIsDark(!isDark)

  const setFontFamily = (fontId) => {
    const font = FONTS.find(f => f.id === fontId)
    if (font) {
      setFontFamilyState(font.family)
    }
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, fontFamily, setFontFamily, fonts: FONTS }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
