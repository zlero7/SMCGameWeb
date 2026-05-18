import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Notices from '../src/pages/Notices'

const renderNotices = () => {
  return render(
    <BrowserRouter>
      <Notices />
    </BrowserRouter>
  )
}

describe('Notices Page', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders loading state initially', () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })
    
    renderNotices()
    expect(screen.getByText(/로딩 중.../)).toBeInTheDocument()
  })

  it('renders notices list when loaded', async () => {
    const mockNotices = [
      { id: 1, title: '테스트 공지', content: '테스트 내용', date: '2026-04-01T00:00:00Z' }
    ]
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockNotices)
    })

    renderNotices()
    
    const notice = await screen.findByText('테스트 공지')
    expect(notice).toBeInTheDocument()
  })

  it('shows message when no notices exist', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    renderNotices()
    
    const message = await screen.findByText('등록된 공지사항이 없습니다.')
    expect(message).toBeInTheDocument()
  })

  it('shows error message on fetch failure', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    renderNotices()
    
    const error = await screen.findByText(/오류/)
    expect(error).toBeInTheDocument()
  })
})
