import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admissions - List all admissions
export async function getAdmissions(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.admission.count()
    ])

    res.json({
      data: admissions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admissions' })
  }
}

// GET /api/admissions/:id
export async function getAdmission(req, res) {
  try {
    const admission = await prisma.admission.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!admission) return res.status(404).json({ error: 'Not found' })
    res.json(admission)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admission' })
  }
}

// POST /api/admissions - 새 진학 정보 (제목/내용/작성자/이미지)
export async function createAdmission(req, res) {
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

    const admission = await prisma.admission.create({
      data: {
        program: title,  // title을 program으로 저장
        requirements: content,  // content를 requirements로 저장
        author: author || '관리자',
        imageUrl
      }
    })

    res.status(201).json(admission)
  } catch (error) {
    console.error('createAdmission error:', error)
    res.status(400).json({ error: 'Failed to create admission: ' + error.message })
  }
}

// PUT /api/admissions/:id
export async function updateAdmission(req, res) {
  try {
    const { title, content, author } = req.body
    let imageUrl = undefined

    // 파일 업로드 처리
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename
    }

    const admission = await prisma.admission.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { program: title }),
        ...(content && { requirements: content }),
        ...(author && { author }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    })

    res.json(admission)
  } catch (error) {
    console.error('updateAdmission error:', error)
    res.status(400).json({ error: 'Failed to update admission: ' + error.message })
  }
}

// DELETE /api/admissions/:id
export async function deleteAdmission(req, res) {
  try {
    await prisma.admission.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete admission' })
  }
}