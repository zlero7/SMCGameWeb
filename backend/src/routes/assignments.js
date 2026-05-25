import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/assignments - List all assignments (with filters)
export async function getAssignments(req, res) {
  try {
    const { courseId, status, search, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = {}

    if (courseId) where.courseId = courseId

    if (status === 'upcoming') {
      where.dueDate = { gte: new Date() }
    } else if (status === 'past') {
      where.dueDate = { lt: new Date() }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { courseId: { contains: search } }
      ]
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.assignment.count({ where })
    ])

    res.json({
      data: assignments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' })
  }
}

// GET /api/assignments/:id
export async function getAssignment(req, res) {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!assignment) return res.status(404).json({ error: 'Not found' })
    res.json(assignment)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment' })
  }
}

// POST /api/assignments
export async function createAssignment(req, res) {
  try {
    // 일반 사용자도 작성 가능: title, content, author만 필수
    const { title, content, author, courseId, dueDate } = req.body

    console.log('createAssignment received:', { title, content, author, courseId, dueDate })

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요' })
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: courseId || '일반',
        title,
        description: content,  // content를 description으로 저장
        dueDate: dueDate ? new Date(dueDate) : new Date(),  // 기본값은 현재 시간
        author: req.user.name || req.user.username || '익명',
        userId: req.user.id
      }
    })

    res.status(201).json(assignment)
  } catch (error) {
    console.error('createAssignment error:', error)
    res.status(400).json({ error: 'Failed to create assignment: ' + error.message })
  }
}

// PUT /api/assignments/:id
export async function updateAssignment(req, res) {
  try {
    const { title, content, author, courseId, dueDate } = req.body

    const assignment = await prisma.assignment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title && { title }),
        ...(content && { description: content }),
        ...(courseId && { courseId }),
        ...(dueDate && { dueDate: new Date(dueDate) })
      }
    })

    res.json(assignment)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update assignment' })
  }
}

// DELETE /api/assignments/:id — 작성자 본인 또는 admin/teacher만 삭제 가능
export async function deleteAssignment(req, res) {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(req.params.id) }
    })

    if (!assignment) {
      return res.status(404).json({ error: '과제를 찾을 수 없습니다' })
    }

    // 작성자 본인이거나 admin/teacher 권한이면 삭제 허용
    const isOwner = assignment.userId === req.user.id
    const isPrivileged = ['admin', 'teacher'].includes(req.user.role)

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: '본인이 작성한 과제만 삭제할 수 있습니다' })
    }

    await prisma.assignment.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete assignment' })
  }
}

// GET /api/assignments/courses - Get unique course list
export async function getCourses(req, res) {
  try {
    const courses = await prisma.assignment.findMany({
      select: { courseId: true },
      distinct: ['courseId']
    })
    res.json(courses.map(c => c.courseId))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
}
