import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const prisma = new PrismaClient()

// multer가 multipart 헤더 파일명을 latin1로 디코딩하는 문제 수정
const fixName = (s) => {
  if (!s) return s
  try { return Buffer.from(s, 'latin1').toString('utf8') } catch { return s }
}

// GET /api/notices - List all notices (with search)
export async function getNotices(req, res) {
  try {
    const { search, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = search ? {
      OR: [
        { title: { contains: search } },
        { content: { contains: search } }
      ]
    } : {}

    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notice.count({ where })
    ])

    res.json({
      data: notices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notices' })
  }
}

// GET /api/notices/:id - Get single notice
export async function getNotice(req, res) {
  try {
    const notice = await prisma.notice.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!notice) return res.status(404).json({ error: 'Not found' })
    res.json(notice)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notice' })
  }
}

// POST /api/notices - Create notice (auth required) - multipart 지원
export async function createNotice(req, res) {
  try {
    const { title, content, author, videoUrl, expiresAt } = req.body
    let imageUrl = null
    let attachments = null

    // 이미지 업로드 처리 (단일)
    if (req.files?.image?.[0]) {
      imageUrl = '/uploads/' + req.files.image[0].filename
    }

    // 일반 파일 첨부 처리 (다중)
    if (req.files?.attachments) {
      const attachmentData = req.files.attachments.map(f => ({
        url: '/uploads/' + f.filename,
        filename: fixName(f.originalname),
        mimetype: f.mimetype,
        size: f.size
      }))
      attachments = JSON.stringify(attachmentData)
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' })
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        author: author || '관리자',
        imageUrl,
        videoUrl: videoUrl || null,
        attachments,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    res.status(201).json(notice)
  } catch (error) {
    console.error('createNotice error:', error)
    res.status(400).json({ error: 'Failed to create notice: ' + error.message })
  }
}

// PUT /api/notices/:id - Update notice (auth required) - multipart 지원
export async function updateNotice(req, res) {
  try {
    const { title, content, author, videoUrl, expiresAt } = req.body
    let imageUrl = undefined
    let attachments = undefined

    // 이미지 업로드 처리
    if (req.files?.image?.[0]) {
      imageUrl = '/uploads/' + req.files.image[0].filename
    }

    // 일반 파일 첨부 처리
    if (req.files?.attachments) {
      const attachmentData = req.files.attachments.map(f => ({
        url: '/uploads/' + f.filename,
        filename: fixName(f.originalname),
        mimetype: f.mimetype,
        size: f.size
      }))
      attachments = JSON.stringify(attachmentData)
    }

    const notice = await prisma.notice.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(author && { author }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(attachments !== undefined && { attachments }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      }
    })

    res.json(notice)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update notice' })
  }
}

// DELETE /api/notices/:id - Delete notice (auth required)
export async function deleteNotice(req, res) {
  try {
    await prisma.notice.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete notice' })
  }
}

// GET /api/notices/:id/download/:fileIndex - Download attachment file
export async function downloadNoticeAttachment(req, res) {
  try {
    const { id, fileIndex } = req.params
    const idx = parseInt(fileIndex)

    const notice = await prisma.notice.findUnique({
      where: { id: parseInt(id) }
    })

    if (!notice || !notice.attachments) {
      return res.status(404).json({ error: 'Notice or attachments not found' })
    }

    const attachmentData = JSON.parse(notice.attachments)

    // Handle both array format (new) and single object format (old)
    let file
    if (Array.isArray(attachmentData)) {
      if (idx >= attachmentData.length) {
        return res.status(404).json({ error: 'File index out of range' })
      }
      file = attachmentData[idx]
    } else {
      // Single object format - only support index 0
      if (idx !== 0) {
        return res.status(404).json({ error: 'File not found' })
      }
      file = attachmentData
    }

    if (!file || !file.url) {
      return res.status(404).json({ error: 'File URL not found' })
    }

    // file.url is like '/uploads/xxx.jpg'
    const relativePath = file.url.startsWith('/') ? file.url.substring(1) : file.url
    const filePath = path.join(process.cwd(), relativePath)

    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath)
      return res.status(404).json({ error: 'File not found on disk' })
    }

    const safeFilename = file.filename || 'download'
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`)
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream')
    fs.createReadStream(filePath).pipe(res)
  } catch (error) {
    console.error('downloadNoticeAttachment error:', error)
    res.status(500).json({ error: 'Download failed' })
  }
}
