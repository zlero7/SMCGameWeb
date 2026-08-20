/**
 * 자료실 라우터 (Materials Router)
 * 
 * 관리자가 학습 자료를 업로드하고 학생들이 다운로드할 수 있습니다.
 * 파일 업로드 및 파일 서빙 기능을 포함합니다.
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authMiddleware, adminOnly } from '../middleware/auth.js'
import { blockExecutableFiles } from '../utils/uploadSecurity.js'

const prisma = new PrismaClient()
const router = express.Router()

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/materials'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // 원본 파일명을 UTF-8로 디코딩하여 저장
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    cb(null, uniqueSuffix + path.extname(originalName))
  }
})

const upload = multer({
  storage,
  fileFilter: blockExecutableFiles,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
})

/**
 * GET /api/materials - 자료 목록 조회 (공개)
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const where = { isPublic: true }
    if (category) where.category = category
    
    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    res.json({ data: materials })
  } catch (error) {
    console.error('Error fetching materials:', error)
    res.status(500).json({ error: '자료 목록 조회 실패' })
  }
})

/**
 * GET /api/materials/categories - 카테고리 목록
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.material.findMany({
      where: { isPublic: true },
      select: { category: true },
      distinct: ['category']
    })
    res.json(categories.map(c => c.category))
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: '카테고리 조회 실패' })
  }
})

/**
 * GET /api/materials/:id - 단일 자료 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!material) {
      return res.status(404).json({ error: '자료를 찾을 수 없습니다' })
    }
    
    res.json(material)
  } catch (error) {
    console.error('Error fetching material:', error)
    res.status(500).json({ error: '자료 조회 실패' })
  }
})

/**
 * POST /api/materials - 자료 업로드 (관리자만)
 *multipart/form-data 사용
 */
router.post('/', authMiddleware, adminOnly, upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, isPublic } = req.body
    
    if (!req.file) {
      return res.status(400).json({ error: '파일을 업로드해주세요' })
    }
    
    if (!title || !category) {
      return res.status(400).json({ error: '제목과 카테고리는 필수입니다' })
    }

    const material = await prisma.material.create({
      data: {
        title,
        description,
        category,
        // 원본 파일명을 UTF-8로 디코딩하여 저장
        fileName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        fileUrl: `/uploads/materials/${req.file.filename}`,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        isPublic: isPublic !== 'false',
        author: '관리자'
      }
    })
    
    res.json(material)
  } catch (error) {
    console.error('Error creating material:', error)
    res.status(500).json({ error: '자료 업로드 실패' })
  }
})

/**
 * PUT /api/materials/:id - 자료 수정 (관리자만)
 */
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, category, isPublic } = req.body
    
    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(isPublic !== undefined && { isPublic: isPublic === 'true' || isPublic === true })
      }
    })
    
    res.json(material)
  } catch (error) {
    console.error('Error updating material:', error)
    res.status(500).json({ error: '자료 수정 실패' })
  }
})

/**
 * DELETE /api/materials/:id - 자료 삭제 (관리자만)
 */
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    
    // 먼저 파일 정보 조회
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (material) {
      // 실제 파일 삭제
      const filePath = path.join(process.cwd(), material.fileUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    
    await prisma.material.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    res.status(500).json({ error: '자료 삭제 실패' })
  }
})

/**
 * POST /api/materials/:id/download - 다운로드 횟수 증가
 */
router.post('/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    
    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: { downloadCount: { increment: 1 } }
    })
    
    res.json({ success: true, downloadCount: material.downloadCount })
  } catch (error) {
    console.error('Error incrementing download count:', error)
    res.status(500).json({ error: '다운로드 실패' })
  }
})

// 파일 다운로드 라우트 (한글 파일명 문제 해결)
router.get('/:id/file', async (req, res) => {
  try {
    const { id } = req.params
    const { filename } = req.query
    
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!material || !material.fileUrl) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다' })
    }
    
    const filePath = path.join(process.cwd(), material.fileUrl)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일이 존재하지 않습니다' })
    }
    
    // 원본 파일명으로 다운로드 (UTF-8 인코딩)
    const decodedFilename = filename ? decodeURIComponent(filename) : material.fileName
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`)
    res.setHeader('Content-Type', material.fileType || 'application/octet-stream')
    
    fs.createReadStream(filePath).pipe(res)
  } catch (error) {
    console.error('File download error:', error)
    res.status(500).json({ error: '다운로드 실패' })
  }
})

export default router