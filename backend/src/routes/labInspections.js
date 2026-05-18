import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all lab inspections (public)
export async function getLabInspections(req, res) {
  try {
    const inspections = await prisma.labInspection.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ data: inspections })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get single lab inspection (public)
export async function getLabInspection(req, res) {
  try {
    const inspection = await prisma.labInspection.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!inspection) return res.status(404).json({ error: 'Not found' })
    res.json(inspection)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Create lab inspection (public - anyone can post)
export async function createLabInspection(req, res) {
  try {
    const { title, content, author } = req.body
    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요.' })
    }
    const inspection = await prisma.labInspection.create({
      data: {
        title,
        content,
        author: author || '익명',
        status: 'pending',
        isPublic: true
      }
    })
    res.json(inspection)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Update lab inspection (admin only)
export async function updateLabInspection(req, res) {
  try {
    const { title, content, author, status } = req.body
    
    // 상태를 completed로 변경할 때 completedAt 설정
    const updateData = { title, content, author, status }
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }
    
    const inspection = await prisma.labInspection.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    })
    res.json(inspection)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Delete lab inspection (admin only)
export async function deleteLabInspection(req, res) {
  try {
    await prisma.labInspection.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Auto-delete completed inspections older than 3 days (public - can be called by cron)
export async function autoDeleteCompleted(req, res) {
  try {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    const result = await prisma.labInspection.deleteMany({
      where: {
        status: 'completed',
        completedAt: {
          lt: threeDaysAgo
        }
      }
    })
    
    res.json({ success: true, deletedCount: result.count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}