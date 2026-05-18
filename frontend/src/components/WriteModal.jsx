/**
 * WriteModal.jsx — 네이버 카페 스타일 리치 텍스트 에디터
 * 선택 영역 추적(selectionchange) → 복원 후 포맷 적용 방식으로 안정적 동작 보장
 */

import React, { useState, useRef, useEffect } from 'react'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

/* ── 상수 ── */
const FONTS = ['맑은 고딕', '굴림', '돋움', '바탕', '궁서', 'Arial', 'Times New Roman', 'Georgia', 'Verdana']
const SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '22', '24', '28', '32', '36', '48']
const TEXT_COLORS = [
  '#000000','#434343','#666666','#999999','#b7b7b7','#ffffff',
  '#ff0000','#ff4500','#ff9900','#ffff00','#00ff00','#00ffff',
  '#0000ff','#9900ff','#ff00ff','#f4cccc','#fce5cd','#fff2cc',
  '#d9ead3','#d0e4f7','#cfe2f3','#d9d2e9',
]
const HILITE_COLORS = [
  'transparent',
  '#ffff00','#ffcc00','#ff9900','#ff6600','#ff0000',
  '#00ff00','#00cc44','#00ffcc','#00ccff','#0099ff','#0000ff',
  '#cc00ff','#ff00ff','#ffcccc','#ffe5cc','#ffffcc','#ccffcc',
  '#ccffff','#cce5ff','#e5ccff','#ffccff',
]

/* ── YouTube URL → embed ── */
function toEmbed(url) {
  try {
    const u = new URL(url)
    const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v')
    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch { return null }
}

/* ── 파일 아이콘 ── */
function fileIcon(name = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  return { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', ppt:'📊', pptx:'📊', hwp:'📝', zip:'🗜', txt:'📄' }[ext] ?? '📎'
}

/* ── 툴바 버튼 ── */
function Btn({ children, onClick, active, title, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => e.preventDefault()} /* 에디터 포커스/선택 유지 */
      onClick={onClick}
      className={`flex items-center justify-center min-w-[28px] h-7 px-1 rounded text-sm transition-colors
        ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'} ${className}`}
    >
      {children}
    </button>
  )
}

function Sep() { return <span className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" /> }

/* ── 색상 팔레트 ── */
function Palette({ colors, onPick, label }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl p-3 w-[176px]"
      onMouseDown={e => e.preventDefault()}
    >
      <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-6 gap-1">
        {colors.map(c => (
          <button
            key={c}
            type="button"
            title={c === 'transparent' ? '색상 없음' : c}
            onMouseDown={e => e.preventDefault()}
            onClick={() => onPick(c)}
            style={{
              background: c === 'transparent'
                ? 'linear-gradient(135deg,#fff 45%,#f00 45%,#f00 55%,#fff 55%)'
                : c,
              border: c === '#ffffff' || c === 'transparent' ? '1px solid #d1d5db' : 'none',
            }}
            className="w-6 h-6 rounded cursor-pointer hover:scale-110 transition-transform"
          />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════════ */
export default function WriteModal({
  isOpen, onClose, onSubmit, initialData = {},
  loading = false, title: modalTitle = '글쓰기', categories = [],
}) {
  /* 폼 */
  const [form, setForm] = useState({ title: '', content: '', category: '', author: '', videoUrl: '' })
  const [attachments, setAttachments] = useState([])

  /* 에디터 */
  const editorRef    = useRef(null)
  const imgInputRef  = useRef(null)
  const fileInputRef = useRef(null)
  const savedRange   = useRef(null)  /* 선택 영역 저장소 */

  /* 에디터 모드 */
  const [editorMode, setEditorMode] = useState('rich') // 'rich' | 'markdown'
  const [mdContent, setMdContent]   = useState('')
  const [mdPreview, setMdPreview]   = useState(false)

  /* 팝업 상태 */
  const [popup, setPopup]   = useState(null) // 'font'|'size'|'textColor'|'hilite'|'video'|'link'
  const [curFont, setCurFont] = useState('맑은 고딕')
  const [curSize, setCurSize] = useState('14')
  const [curColor, setCurColor] = useState('#000000')
  const [videoUrl, setVideoUrl] = useState('')
  const [linkHref, setLinkHref] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  /* ── selectionchange: 에디터 내 선택 영역 상시 저장 ── */
  useEffect(() => {
    const save = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange()
      }
    }
    document.addEventListener('selectionchange', save)
    return () => document.removeEventListener('selectionchange', save)
  }, [])

  /* ── 팝업 외부 클릭 닫기 ── */
  useEffect(() => {
    if (!popup) return
    const close = (e) => {
      if (!e.target.closest('[data-popup]')) setPopup(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [popup])

  /* ── 모달 열기 초기화 ── */
  useEffect(() => {
    if (!isOpen) return
    const d = initialData?.id ? initialData : {}
    const isHtmlContent = d.content && /<[a-z][\s\S]*>/i.test(d.content)
    const initialMode = (d.content && !isHtmlContent) ? 'markdown' : 'rich'
    setForm({ title: d.title||'', content: d.content||'', category: d.category||categories[0]||'', author: d.author||'', videoUrl: d.videoUrl||'' })
    setAttachments([])
    setPopup(null)
    setEditorMode(initialMode)
    setMdPreview(false)
    if (initialMode === 'markdown') {
      setMdContent(d.content || '')
    } else {
      setMdContent('')
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = d.content || ''
          editorRef.current.focus()
        }
      }, 60)
    }
  }, [isOpen])

  /* ════════════════════════════════════════════════════
     선택 복원 — 에디터 포커스 후 저장된 Range 복구
  ════════════════════════════════════════════════════ */
  const restoreSelection = () => {
    editorRef.current?.focus()
    if (!savedRange.current) return
    try {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedRange.current.cloneRange())
    } catch (_) {}
  }

  /* ════════════════════════════════════════════════════
     커서 위치에 HTML 삽입 (execCommand 대신 Range API)
     — 팝업이 열려 있어도 savedRange 기준으로 정확히 삽입
  ════════════════════════════════════════════════════ */
  const insertHtmlAtCursor = (html) => {
    editorRef.current?.focus()
    const sel = window.getSelection()

    /* 저장된 range 우선 사용, 없으면 현재 selection, 없으면 맨 끝 */
    let range = null
    if (savedRange.current) {
      try {
        range = savedRange.current.cloneRange()
        sel.removeAllRanges()
        sel.addRange(range)
      } catch (_) { range = null }
    }
    if (!range) {
      if (sel.rangeCount > 0) {
        range = sel.getRangeAt(0)
      } else {
        range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
      }
    }

    range.deleteContents()

    /* HTML 문자열 → DocumentFragment */
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    const frag = document.createDocumentFragment()
    let lastNode = null
    while (tmp.firstChild) { lastNode = tmp.firstChild; frag.appendChild(lastNode) }

    range.insertNode(frag)

    /* 삽입 후 커서를 삽입 내용 바로 뒤로 이동 */
    if (lastNode) {
      const r = document.createRange()
      r.setStartAfter(lastNode)
      r.collapse(true)
      sel.removeAllRanges()
      sel.addRange(r)
      savedRange.current = r.cloneRange()
    }
    editorRef.current?.focus()
  }

  /* execCommand 래퍼 — 서식 적용 (Bold/Italic 등) */
  const exec = (cmd, val = null) => {
    restoreSelection()
    document.execCommand('styleWithCSS', false, true)
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  /* ── 폰트 패밀리 ── */
  const applyFont = (font) => {
    setCurFont(font)
    restoreSelection()
    document.execCommand('styleWithCSS', false, true)
    document.execCommand('fontName', false, font)
    editorRef.current?.focus()
    setPopup(null)
  }

  /* ── 폰트 크기 (span으로 정확한 px 적용) ── */
  const applySize = (px) => {
    setCurSize(px)
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { setPopup(null); return }
    const range = sel.getRangeAt(0)

    if (range.collapsed) {
      /* 커서만 있을 때: 빈 span 삽입 후 커서 이동 → 이후 입력에 적용 */
      const span = document.createElement('span')
      span.style.fontSize = px + 'px'
      span.style.fontFamily = curFont
      span.appendChild(document.createTextNode('​')) // zero-width space
      range.insertNode(span)
      const r = document.createRange()
      r.setStartAfter(span.firstChild)
      r.collapse(true)
      sel.removeAllRanges()
      sel.addRange(r)
      savedRange.current = r.cloneRange()
    } else {
      /* 선택된 텍스트에 적용 */
      const frag = range.extractContents()
      const span = document.createElement('span')
      span.style.fontSize = px + 'px'
      span.appendChild(frag)
      range.insertNode(span)
      const r = document.createRange()
      r.selectNodeContents(span)
      sel.removeAllRanges()
      sel.addRange(r)
      savedRange.current = r.cloneRange()
    }
    editorRef.current?.focus()
    setPopup(null)
  }

  /* ── 글자 색상 ── */
  const applyTextColor = (color) => {
    setCurColor(color)
    restoreSelection()
    document.execCommand('styleWithCSS', false, true)
    document.execCommand('foreColor', false, color)
    editorRef.current?.focus()
    setPopup(null)
  }

  /* ── 형광펜 (배경색) ── */
  const applyHilite = (color) => {
    restoreSelection()
    document.execCommand('styleWithCSS', false, true)
    const val = color === 'transparent' ? 'rgba(0,0,0,0)' : color
    document.execCommand('hiliteColor', false, val)
    editorRef.current?.focus()
    setPopup(null)
  }

  /* ── 미디어 래퍼 HTML 생성 (삭제 버튼 포함) ── */
  const mediaImgHtml = (src, alt) =>
    `<span contenteditable="false" data-media-wrapper style="display:inline-block;position:relative;margin:8px 0;max-width:100%;vertical-align:middle;">` +
    `<img src="${src}" alt="${alt}" style="max-width:100%;height:auto;display:block;border-radius:6px;"/>` +
    `<span data-delete-media title="삭제" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;user-select:none;line-height:1;">×</span>` +
    `</span>`

  const mediaVideoHtml = (embed) =>
    `<span contenteditable="false" data-media-wrapper style="display:block;position:relative;margin:12px 0;border-radius:10px;overflow:hidden;">` +
    `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">` +
    `<iframe src="${embed}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe>` +
    `</div>` +
    `<span data-delete-media title="삭제" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;user-select:none;line-height:1;z-index:10;">×</span>` +
    `</span>`

  /* ── 인라인 이미지 (서버 업로드 후 URL 삽입) ── */
  const handleImg = (e) => {
    const capturedRange = savedRange.current?.cloneRange() ?? null
    Array.from(e.target.files || []).forEach(async (file) => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const token = localStorage.getItem('token')
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd
        })
        if (!res.ok) throw new Error('upload failed')
        const { url } = await res.json()
        if (capturedRange) savedRange.current = capturedRange.cloneRange()
        insertHtmlAtCursor(mediaImgHtml(url, file.name))
      } catch {
        // 업로드 실패 시 base64 폴백
        const reader = new FileReader()
        reader.onload = ev => {
          if (capturedRange) savedRange.current = capturedRange.cloneRange()
          insertHtmlAtCursor(mediaImgHtml(ev.target.result, file.name))
        }
        reader.readAsDataURL(file)
      }
    })
    e.target.value = ''
  }

  /* ── YouTube 커서 위치 삽입 ── */
  const insertVideo = () => {
    const embed = toEmbed(videoUrl.trim())
    if (!embed) { alert('올바른 YouTube 링크를 입력해주세요.'); return }
    setPopup(null)
    setVideoUrl('')
    requestAnimationFrame(() => {
      insertHtmlAtCursor(mediaVideoHtml(embed))
    })
  }

  /* ── 파일 첨부 ── */
  const handleFile = (e) => {
    const capturedRange = savedRange.current?.cloneRange() ?? null
    Array.from(e.target.files || []).forEach(file => {
      if (file.type.startsWith('image/')) {
        ;(async () => {
          try {
            const fd = new FormData()
            fd.append('file', file)
            const token = localStorage.getItem('token')
            const res = await fetch('/api/upload/image', {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: fd
            })
            if (!res.ok) throw new Error('upload failed')
            const { url } = await res.json()
            if (capturedRange) savedRange.current = capturedRange.cloneRange()
            insertHtmlAtCursor(mediaImgHtml(url, file.name))
          } catch {
            const reader = new FileReader()
            reader.onload = ev => {
              if (capturedRange) savedRange.current = capturedRange.cloneRange()
              insertHtmlAtCursor(mediaImgHtml(ev.target.result, file.name))
            }
            reader.readAsDataURL(file)
          }
        })()
      } else {
        // 동기 처리: savedRange는 직전 칩 삽입 후 위치를 그대로 사용 (리셋 X)
        // 첫 파일은 capturedRange 위치에, 이후 파일은 이전 칩 뒤에 순서대로 삽입됨
        insertHtmlAtCursor(
          `<span contenteditable="false" data-filename="${file.name}"
            style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;border:1px solid #bfdbfe;
            border-radius:6px;padding:3px 10px;font-size:13px;cursor:default;margin:2px 0;user-select:none;"
          >${fileIcon(file.name)} ${file.name}</span>` +
          `<span style="font-size:14px;font-family:맑은 고딕,sans-serif;color:#000000;background:none;">&#8203;</span>`
        )
        setAttachments(p => [...p, file])
      }
    })
    e.target.value = ''
  }

  /* ── 링크 삽입 ── */
  const insertLink = () => {
    let url = linkHref.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    const label = linkLabel.trim() || url
    setPopup(null)
    setLinkHref('')
    setLinkLabel('')
    requestAnimationFrame(() => {
      insertHtmlAtCursor(
        `<a href="${url}" target="_blank" rel="noopener"
          style="color:#1a73e8;text-decoration:underline;">${label}</a>`
      )
    })
  }

  /* ── 에디터 모드 전환 ── */
  const switchMode = (mode) => {
    if (mode === editorMode) return
    if (mode === 'markdown') {
      // rich → markdown: HTML을 텍스트로 변환
      const text = editorRef.current?.innerText || ''
      setMdContent(text)
    } else {
      // markdown → rich: 마크다운을 HTML로 변환하여 에디터에 삽입
      const html = marked.parse(mdContent)
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html
          editorRef.current.focus()
        }
      }, 30)
    }
    setEditorMode(mode)
    setMdPreview(false)
  }

  /* ── 에디터 HTML 정리 (저장 전: 삭제버튼·에디터 속성 제거) ── */
  const cleanEditorHtml = (html) => {
    const div = document.createElement('div')
    div.innerHTML = html
    div.querySelectorAll('[data-delete-media]').forEach(el => el.remove())
    div.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable')
      el.removeAttribute('data-media-wrapper')
    })
    return div.innerHTML
  }

  /* ── 제출 ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return }
    let content
    if (editorMode === 'markdown') {
      if (!mdContent.trim()) { alert('내용을 입력해주세요.'); return }
      content = mdContent
    } else {
      const html = editorRef.current?.innerHTML || ''
      const text = editorRef.current?.innerText || ''
      if (!text.trim()) { alert('내용을 입력해주세요.'); return }
      content = cleanEditorHtml(html)
    }
    await onSubmit({ ...form, content, attachments })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="wf" onSubmit={handleSubmit}>
            <div className="px-6 pt-5 pb-3 space-y-3">

              {/* 카테고리 */}
              {categories.length > 0 && (
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* 제목 */}
              <input type="text" placeholder="제목을 입력하세요"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-medium focus:outline-none focus:border-blue-400"
                autoFocus />
            </div>

            {/* ═══ 에디터 박스 ═══ */}
            <div className="mx-6 mb-4 border border-gray-300 rounded-xl overflow-visible">

              {/* ── 모드 전환 탭 ── */}
              <div className="flex items-center gap-0 px-2 pt-2 pb-0 bg-[#f8f9fc] border-b border-gray-200 rounded-t-xl">
                <button type="button"
                  onClick={() => switchMode('rich')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors mr-1
                    ${editorMode === 'rich' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  리치 에디터
                </button>
                <button type="button"
                  onClick={() => switchMode('markdown')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors
                    ${editorMode === 'markdown' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  마크다운
                </button>
                {editorMode === 'markdown' && (
                  <button type="button"
                    onClick={() => setMdPreview(p => !p)}
                    className={`ml-auto px-3 py-1 text-xs rounded-lg mb-1 transition-colors
                      ${mdPreview ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {mdPreview ? '편집' : '미리보기'}
                  </button>
                )}
              </div>

              {/* ── 툴바 (리치 모드만) ── */}
              {editorMode === 'rich' && <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 bg-[#f8f9fc] border-b border-gray-200">

                {/* 폰트 패밀리 */}
                <div className="relative" data-popup="font">
                  <button type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setPopup(p => p === 'font' ? null : 'font')}
                    className="flex items-center gap-1 h-7 px-2 text-xs bg-white border border-gray-300 rounded hover:border-blue-400 min-w-[100px]">
                    <span style={{ fontFamily: curFont }} className="flex-1 text-left truncate">{curFont}</span>
                    <span className="text-gray-400 text-[10px]">▾</span>
                  </button>
                  {popup === 'font' && (
                    <div data-popup="font"
                      className="absolute top-full left-0 mt-1 z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 w-44">
                      {FONTS.map(f => (
                        <button key={f} type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => applyFont(f)}
                          style={{ fontFamily: f }}
                          className={`w-full text-left px-4 py-1.5 text-sm hover:bg-blue-50 transition-colors ${curFont === f ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 폰트 크기 */}
                <div className="relative" data-popup="size">
                  <button type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setPopup(p => p === 'size' ? null : 'size')}
                    className="flex items-center gap-1 h-7 px-2 text-xs bg-white border border-gray-300 rounded hover:border-blue-400 w-[60px]">
                    <span className="flex-1 text-center">{curSize}</span>
                    <span className="text-gray-400 text-[10px]">▾</span>
                  </button>
                  {popup === 'size' && (
                    <div data-popup="size"
                      className="absolute top-full left-0 mt-1 z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 w-20 max-h-52 overflow-y-auto">
                      {SIZES.map(s => (
                        <button key={s} type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => applySize(s)}
                          className={`w-full text-left px-4 py-1 text-sm hover:bg-blue-50 transition-colors ${curSize === s ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Sep />

                {/* Bold / Italic / Underline / Strike */}
                <Btn onClick={() => exec('bold')} title="굵게 (Ctrl+B)"><strong className="text-sm">B</strong></Btn>
                <Btn onClick={() => exec('italic')} title="기울임 (Ctrl+I)"><em className="text-sm">I</em></Btn>
                <Btn onClick={() => exec('underline')} title="밑줄 (Ctrl+U)"><u className="text-sm">U</u></Btn>
                <Btn onClick={() => exec('strikeThrough')} title="취소선"><s className="text-sm">S</s></Btn>

                <Sep />

                {/* 글자 색상 */}
                <div className="relative" data-popup="textColor">
                  <button type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setPopup(p => p === 'textColor' ? null : 'textColor')}
                    title="글자 색상"
                    className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-200 transition-colors">
                    <span className="font-bold text-sm leading-none" style={{ color: curColor }}>A</span>
                    <span className="w-5 h-1 rounded-full mt-0.5" style={{ background: curColor }} />
                  </button>
                  {popup === 'textColor' && (
                    <div data-popup="textColor">
                      <Palette colors={TEXT_COLORS} onPick={applyTextColor} label="글자 색상" />
                    </div>
                  )}
                </div>

                {/* 형광펜 */}
                <div className="relative" data-popup="hilite">
                  <button type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setPopup(p => p === 'hilite' ? null : 'hilite')}
                    title="형광펜"
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-200 transition-colors">
                    <span className="text-xs font-bold px-0.5 rounded" style={{ background: '#ffff00', color: '#333' }}>형</span>
                  </button>
                  {popup === 'hilite' && (
                    <div data-popup="hilite">
                      <Palette colors={HILITE_COLORS} onPick={applyHilite} label="형광펜" />
                    </div>
                  )}
                </div>

                <Sep />

                {/* 정렬 */}
                <Btn onClick={() => exec('justifyLeft')} title="왼쪽 정렬">
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
                    <rect x="0" y="0" width="14" height="2" rx="1"/><rect x="0" y="5" width="10" height="2" rx="1"/><rect x="0" y="10" width="14" height="2" rx="1"/>
                  </svg>
                </Btn>
                <Btn onClick={() => exec('justifyCenter')} title="가운데 정렬">
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
                    <rect x="0" y="0" width="14" height="2" rx="1"/><rect x="2" y="5" width="10" height="2" rx="1"/><rect x="0" y="10" width="14" height="2" rx="1"/>
                  </svg>
                </Btn>
                <Btn onClick={() => exec('justifyRight')} title="오른쪽 정렬">
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
                    <rect x="0" y="0" width="14" height="2" rx="1"/><rect x="4" y="5" width="10" height="2" rx="1"/><rect x="0" y="10" width="14" height="2" rx="1"/>
                  </svg>
                </Btn>

                <Sep />

                {/* 목록 */}
                <Btn onClick={() => exec('insertUnorderedList')} title="글머리 기호">
                  <span className="text-xs leading-none">•≡</span>
                </Btn>
                <Btn onClick={() => exec('insertOrderedList')} title="번호 목록">
                  <span className="text-xs leading-none">1≡</span>
                </Btn>

                <Sep />

                {/* 이미지 삽입 */}
                <Btn onClick={() => imgInputRef.current?.click()} title="이미지 삽입">
                  <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="1" width="14" height="12" rx="2"/>
                    <circle cx="5" cy="5" r="1.5"/>
                    <path d="M1 10 l4-4 3 3 2-2 4 4"/>
                  </svg>
                </Btn>
                <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImg} />

                {/* YouTube */}
                <div className="relative" data-popup="video">
                  <Btn onClick={() => {
                    /* 팝업 열기 전 현재 커서 위치 명시적 저장 */
                    const sel = window.getSelection()
                    if (sel?.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
                      savedRange.current = sel.getRangeAt(0).cloneRange()
                    }
                    setPopup(p => p === 'video' ? null : 'video')
                  }} title="YouTube 동영상 삽입">
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                      <rect x="0" y="0" width="16" height="12" rx="3" fill="#ff0000"/>
                      <polygon points="6,3 12,6 6,9" fill="white"/>
                    </svg>
                  </Btn>
                  {popup === 'video' && (
                    <div data-popup="video"
                      className="absolute top-full left-0 mt-1 z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-80">
                      <p className="text-xs font-semibold text-gray-600 mb-2">🎬 YouTube 동영상 삽입</p>
                      <input type="text" placeholder="https://youtube.com/watch?v=..."
                        value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertVideo() } }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 mb-3"
                        autoFocus />
                      <div className="flex justify-end gap-2">
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setPopup(null)}
                          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={insertVideo}
                          className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600">삽입</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 파일 첨부 */}
                <Btn onClick={() => fileInputRef.current?.click()} title="파일 첨부">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 4V12a4 4 0 0 0 8 0V3a2.5 2.5 0 0 0-5 0v9a1 1 0 0 0 2 0V4"/>
                  </svg>
                </Btn>
                <input ref={fileInputRef} type="file" multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.hwp,.txt"
                  className="hidden" onChange={handleFile} />

                {/* 링크 */}
                <div className="relative" data-popup="link">
                  <Btn onClick={() => {
                    const sel = window.getSelection()
                    if (sel?.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
                      savedRange.current = sel.getRangeAt(0).cloneRange()
                    }
                    setPopup(p => p === 'link' ? null : 'link')
                  }} title="링크 삽입">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 10a4 4 0 0 0 5.66 0l1.5-1.5a4 4 0 0 0-5.66-5.66L6 4.34"/>
                      <path d="M10 6a4 4 0 0 0-5.66 0L2.84 7.5a4 4 0 0 0 5.66 5.66L10 11.66"/>
                    </svg>
                  </Btn>
                  {popup === 'link' && (
                    <div data-popup="link"
                      className="absolute top-full left-0 mt-1 z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-80">
                      <p className="text-xs font-semibold text-gray-600 mb-2">🔗 링크 삽입</p>
                      <input type="text" placeholder="표시할 텍스트 (선택)"
                        value={linkLabel} onChange={e => setLinkLabel(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 mb-2"
                        autoFocus />
                      <input type="text" placeholder="https://..."
                        value={linkHref} onChange={e => setLinkHref(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertLink() } }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 mb-3" />
                      <div className="flex justify-end gap-2">
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setPopup(null)}
                          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                        <button type="button" onMouseDown={e => e.preventDefault()} onClick={insertLink}
                          className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600">삽입</button>
                      </div>
                    </div>
                  )}
                </div>

                <Sep />

                {/* 인용구 */}
                <Btn onClick={() => exec('formatBlock', 'blockquote')} title="인용구">
                  <span className="text-base leading-none font-serif text-gray-500">❝</span>
                </Btn>
                {/* 수평선 */}
                <Btn onClick={() => exec('insertHorizontalRule')} title="수평선">
                  <span className="text-xs leading-none">─</span>
                </Btn>
                {/* 서식 초기화 */}
                <Btn onClick={() => exec('removeFormat')} title="서식 지우기">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 2 L12 12 M12 2 L2 12"/>
                  </svg>
                </Btn>
              </div>}

              {/* ── 리치 에디터 본문 ── */}
              {editorMode === 'rich' && (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  data-ph="내용을 입력하세요&#10;텍스트를 선택한 뒤 툴바에서 서식을 적용하세요"
                  className="editor-body min-h-[320px] p-5 text-sm focus:outline-none"
                  style={{ fontFamily: '맑은 고딕, sans-serif', fontSize: '14px', lineHeight: '1.7' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      document.execCommand('insertLineBreak')
                      // 줄 바꿈 후 커서를 styled span 밖으로 이동해 서식 초기화
                      requestAnimationFrame(() => {
                        const sel = window.getSelection()
                        const editor = editorRef.current
                        if (!sel || !sel.rangeCount || !editor) return
                        const range = sel.getRangeAt(0)
                        let node = range.startContainer
                        // 텍스트 노드면 부모로
                        if (node.nodeType === 3) node = node.parentNode
                        // editor 직속 자식이 아닌 span/formatted 블록 안에 있으면 빠져나옴
                        while (node && node !== editor) {
                          const tag = node.nodeName.toLowerCase()
                          if (tag === 'span' || tag === 'b' || tag === 'strong' || tag === 'i' || tag === 'em' || tag === 'u' || tag === 's') {
                            // 해당 노드 뒤에 빈 텍스트 노드 삽입 후 커서 이동
                            const textNode = document.createTextNode('​')
                            if (node.nextSibling) {
                              node.parentNode.insertBefore(textNode, node.nextSibling)
                            } else {
                              node.parentNode.appendChild(textNode)
                            }
                            const r = document.createRange()
                            r.setStart(textNode, 1)
                            r.collapse(true)
                            sel.removeAllRanges()
                            sel.addRange(r)
                            savedRange.current = r.cloneRange()
                            break
                          }
                          node = node.parentNode
                        }
                        setCurColor('#000000')
                        setCurSize('14')
                        setCurFont('맑은 고딕')
                      })
                    }
                  }}
                  onClickCapture={(e) => {
                    if (e.target.dataset.deleteMedia !== undefined) {
                      e.preventDefault()
                      const wrapper = e.target.closest('[data-media-wrapper]')
                      if (wrapper) wrapper.remove()
                    }
                  }}
                />
              )}

              {/* ── 마크다운 에디터 ── */}
              {editorMode === 'markdown' && !mdPreview && (
                <div className="relative">
                  <textarea
                    value={mdContent}
                    onChange={e => setMdContent(e.target.value)}
                    placeholder={`마크다운 문법을 사용하세요\n\n# 제목 1\n## 제목 2\n\n**굵게** *기울임* ~~취소선~~\n\n- 목록 항목\n1. 번호 목록\n\n> 인용구\n\n\`\`\`\n코드 블록\n\`\`\`\n\n[링크텍스트](https://url.com)`}
                    className="w-full min-h-[320px] p-5 text-sm font-mono focus:outline-none resize-none leading-relaxed"
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                    autoFocus
                  />
                  <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 pointer-events-none">Markdown</div>
                </div>
              )}

              {/* ── 마크다운 미리보기 ── */}
              {editorMode === 'markdown' && mdPreview && (
                <div
                  className="min-h-[320px] p-5 rich-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(mdContent || '') }}
                />
              )}
            </div>

            {/* 첨부파일 목록 */}
            {attachments.length > 0 && (
              <div className="mx-6 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs font-semibold text-blue-500 mb-2">첨부파일 ({attachments.length}개)</p>
                <div className="space-y-1">
                  {attachments.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-sm text-gray-700">{fileIcon(f.name)} {f.name}</span>
                      <button type="button" onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-xs ml-2">삭제</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {initialData.imageUrl && (
              <div className="mx-6 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500">기존 이미지: {initialData.imageUrl}</p>
              </div>
            )}
          </form>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 shrink-0">
          <button type="button" onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 text-sm text-gray-700">
            취소
          </button>
          <button type="submit" form="wf" disabled={loading}
            className="px-8 py-2 bg-[#4a90d9] text-white rounded-xl hover:bg-[#3561b0] disabled:opacity-50 text-sm font-semibold">
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <style>{`
        .editor-body:empty::before,
        .editor-body br:only-child + *:empty::before {
          content: attr(data-ph);
          color: #9ca3af;
          pointer-events: none;
          white-space: pre-line;
          position: absolute;
          font-size: 14px;
        }
        .editor-body { position: relative; }
        /* 붙여넣기 등으로 생성되는 div·p 블록 마진 제거 */
        .editor-body > div, .editor-body > p {
          margin: 0; padding: 0; min-height: 1em;
        }
        .editor-body blockquote {
          border-left: 4px solid #93c5fd;
          background: #eff6ff;
          padding: 8px 16px;
          margin: 10px 0;
          border-radius: 0 8px 8px 0;
          color: #1e40af;
        }
        .editor-body img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 8px 0; }
        .editor-body a   { color: #1a73e8; text-decoration: underline; }
        .editor-body ul  { list-style: disc;    padding-left: 1.5em; margin: 6px 0; }
        .editor-body ol  { list-style: decimal; padding-left: 1.5em; margin: 6px 0; }
        .editor-body hr  { border: none; border-top: 2px solid #e5e7eb; margin: 14px 0; }
        .editor-body iframe { border-radius: 10px; }
        /* 삭제 버튼: 기본 숨김, hover 시만 표시 */
        [data-media-wrapper] [data-delete-media] {
          opacity: 0;
          transition: opacity 0.15s;
        }
        [data-media-wrapper]:hover [data-delete-media] {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
