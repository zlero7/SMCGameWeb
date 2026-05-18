import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import noticesRouter from '../../src/routes/notices.js'

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    notice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    }
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

const createApp = () => {
  const app = express()
  app.use(express.json())
  app.get('/api/notices', noticesRouter.getNotices)
  app.get('/api/notices/:id', noticesRouter.getNotice)
  return app
}

describe('Notices API', () => {
  let app
  
  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('GET /api/notices', () => {
    it('returns list of notices', async () => {
      const mockNotices = [
        { id: 1, title: '테스트', content: '내용', date: new Date() }
      ]
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      prisma.notice.findMany.mockResolvedValue(mockNotices)
      prisma.notice.count.mockResolvedValue(1)

      const response = await request(app).get('/api/notices')
      
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
    })
  })

  describe('GET /api/notices/:id', () => {
    it('returns single notice', async () => {
      const mockNotice = { id: 1, title: '테스트', content: '내용' }
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      prisma.notice.findUnique.mockResolvedValue(mockNotice)

      const response = await request(app).get('/api/notices/1')
      
      expect(response.status).toBe(200)
      expect(response.body.title).toBe('테스트')
    })

    it('returns 404 for non-existent notice', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      prisma.notice.findUnique.mockResolvedValue(null)

      const response = await request(app).get('/api/notices/999')
      
      expect(response.status).toBe(404)
    })
  })
})
