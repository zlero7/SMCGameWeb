import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const prisma = new PrismaClient()

// GET /api/careers - List all careers
export async function getCareers(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [careers, total] = await Promise.all([
      prisma.career.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.career.count()
    ])

    res.json({
      data: careers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch careers' })
  }
}

// GET /api/careers/:id
export async function getCareer(req, res) {
  try {
    const career = await prisma.career.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!career) return res.status(404).json({ error: 'Not found' })
    res.json(career)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch career' })
  }
}

// POST /api/careers - 새 취업 정보 (제목/내용/작성자/이미지)
export async function createCareer(req, res) {
  try {
    const { title, content, author } = req.body
    let imageUrl = null

    // 파일 업로드 처리
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename
    }

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요' })
    }

    const career = await prisma.career.create({
      data: {
        title,
        description: content,  // content를 description으로 저장
        author: author || '관리자',
        imageUrl
      }
    })

    res.status(201).json(career)
  } catch (error) {
    console.error('createCareer error:', error)
    res.status(400).json({ error: 'Failed to create career: ' + error.message })
  }
}

// PUT /api/careers/:id
export async function updateCareer(req, res) {
  try {
    const { title, content, author } = req.body
    let imageUrl = undefined

    // 파일 업로드 처리
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename
    }

    const career = await prisma.career.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { title }),
        ...(content && { description: content }),
        ...(author && { author }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    })

    res.json(career)
  } catch (error) {
    console.error('updateCareer error:', error)
    res.status(400).json({ error: 'Failed to update career: ' + error.message })
  }
}

// DELETE /api/careers/:id
export async function deleteCareer(req, res) {
  try {
    await prisma.career.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete career' })
  }
}