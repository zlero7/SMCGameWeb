import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Assignments from '../src/pages/Assignments'

const renderAssignments = () => {
  return render(
    <BrowserRouter>
      <Assignments />
    </BrowserRouter>
  )
}

describe('Assignments Page', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders loading state initially', () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })
    
    renderAssignments()
    expect(screen.getByText(/로딩 중.../)).toBeInTheDocument()
  })

  it('separates upcoming and past assignments', async () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const mockAssignments = [
      { id: 1, title: '미래 과제', courseId: '게임프로그래밍', dueDate: tomorrow.toISOString() },
      { id: 2, title: '지나간 과제', courseId: '그래픽디자인', dueDate: yesterday.toISOString() }
    ]
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAssignments)
    })

    renderAssignments()
    
    const upcoming = await screen.findByText('제출 예정')
    const past = await screen.findByText('마감된 과제')
    expect(upcoming).toBeInTheDocument()
    expect(past).toBeInTheDocument()
  })
})
