import DOMPurify from 'dompurify'

/**
 * 사용자 입력 리치 텍스트를 안전하게 정제합니다.
 * script/on*핸들러/javascript: URL 등 실행 가능한 벡터를 제거하고,
 * 에디터가 남기는 잔재(삭제 버튼, 파일칩, contenteditable 속성)도 함께 정리합니다.
 */
export function sanitizeHtml(html) {
  if (!html) return ''

  const clean = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target'],
    FORBID_ATTR: ['data-delete-media', 'data-filename', 'contenteditable'],
  })

  const div = document.createElement('div')
  div.innerHTML = clean
  div.querySelectorAll('[data-delete-media]').forEach(el => el.remove())
  div.querySelectorAll('[data-filename]').forEach(el => el.remove())
  return div.innerHTML
}
