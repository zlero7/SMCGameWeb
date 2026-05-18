import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import multer from 'multer'

const prisma = new PrismaClient()

const fixName = (s) => {
  if (!s) return s
  try { return Buffer.from(s, 'latin1').toString('utf8') } catch { return s }
}

// Multer 설정 (이미지 업로드용)
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, unique + path.extname(file.originalname))
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB 제한

// GET /api/awards - List all awards (with category filter)
export async function getAwards(req, res) {
  try {
    const { category, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = { isPublic: true }
    if (category && category !== 'all') {
      where.category = category
    }

    console.log('getAwards query:', { category, where })

    const [awards, total] = await Promise.all([
      prisma.award.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.award.count({ where })
    ])

    // user.name을 authorName으로 매핑
    const awardsWithAuthor = awards.map(award => ({
      ...award,
      authorName: award.author
    }))

    res.json({
      data: awardsWithAuthor,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    console.error('getAwards error:', error)
    res.status(500).json({ error: 'Failed to fetch awards: ' + error.message })
  }
}

// GET /api/awards/:id
export async function getAward(req, res) {
  try {
    const award = await prisma.award.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!award) return res.status(404).json({ error: 'Not found' })
    res.json(award)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch award' })
  }
}

// POST /api/awards (auth required - users can create) - multipart 지원
export async function createAward(req, res) {
  try {
    const { title, content, category, videoUrl, author } = req.body
    let imageUrl = null
    let attachments = null

    // 이미지 업로드 처리
    if (req.files?.image?.[0]) {
      imageUrl = '/uploads/' + req.files.image[0].filename
    }

    // 일반 파일 업로드 처리 (attachments)
    if (req.files?.attachments) {
      const attachmentData = req.files.attachments.map(f => ({
        url: '/uploads/' + f.filename,
        filename: fixName(f.originalname),
        mimetype: f.mimetype,
        size: f.size
      }))
      attachments = JSON.stringify(attachmentData)
    }

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category required' })
    }

    if (!['award', 'portfolio'].includes(category)) {
      return res.status(400).json({ error: 'Category must be award or portfolio' })
    }

    const award = await prisma.award.create({
      data: {
        title,
        content,
        category,
        imageUrl,
        videoUrl,
        attachments,
        author: req.user?.name || req.user?.username || '익명',
        isPublic: true
      }
    })

    res.status(201).json(award)
  } catch (error) {
    console.error('createAward error:', error)
    res.status(400).json({ error: 'Failed to create award: ' + error.message })
  }
}

// PUT /api/awards/:id (admin only) - multipart 지원
export async function updateAward(req, res) {
  try {
    const { title, content, category, videoUrl, isPublic } = req.body
    let imageUrl = undefined
    let attachments = undefined

    // 이미지 업로드 처리
    if (req.files?.image?.[0]) {
      imageUrl = '/uploads/' + req.files.image[0].filename
    }

    // 일반 파일 업로드 처리 (attachments)
    if (req.files?.attachments) {
      const attachmentData = req.files.attachments.map(f => ({
        url: '/uploads/' + f.filename,
        filename: fixName(f.originalname),
        mimetype: f.mimetype,
        size: f.size
      }))
      attachments = JSON.stringify(attachmentData)
    }

    const award = await prisma.award.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(attachments !== undefined && { attachments }),
        ...(isPublic !== undefined && { isPublic })
      }
    })

    res.json(award)
  } catch (error) {
    console.error('updateAward error:', error)
    res.status(400).json({ error: 'Failed to update award: ' + error.message })
  }
}

// GET /api/awards/:id/download/:fileIndex - Download attachment file
export async function downloadAwardAttachment(req, res) {
  try {
    const { id, fileIndex } = req.params
    const idx = parseInt(fileIndex)
    const award = await prisma.award.findUnique({ where: { id: parseInt(id) } })
    if (!award || !award.attachments) {
      return res.status(404).json({ error: 'Award or attachments not found' })
    }
    const attachmentData = JSON.parse(award.attachments)
    const arr = Array.isArray(attachmentData) ? attachmentData : [attachmentData]
    if (idx >= arr.length) return res.status(404).json({ error: 'File index out of range' })
    const file = arr[idx]
    if (!file || !file.url) return res.status(404).json({ error: 'File URL not found' })
    const relativePath = file.url.startsWith('/') ? file.url.substring(1) : file.url
    const filePath = path.join(process.cwd(), relativePath)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' })
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.filename || 'download')}`)
    fs.createReadStream(filePath).pipe(res)
  } catch (error) {
    console.error('downloadAwardAttachment error:', error)
    res.status(500).json({ error: 'Download failed' })
  }
}

// DELETE /api/awards/:id (admin only)
export async function deleteAward(req, res) {
  try {
    await prisma.award.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete award' })
  }
}