import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import multer from 'multer'

import { PrismaClient } from '@prisma/client'
import { authMiddleware, adminOnly } from './middleware/auth.js'
import { login, register, me, importUsers, changePassword, getUsers, createUser, updateUser, deleteUser } from './routes/auth.js'
import { getNotices, getNotice, createNotice, updateNotice, deleteNotice, downloadNoticeAttachment } from './routes/notices.js'
import { getCareers, getCareer, createCareer, updateCareer, deleteCareer } from './routes/careers.js'
import { getAdmissions, getAdmission, createAdmission, updateAdmission, deleteAdmission } from './routes/admissions.js'
import { getCalendarEvents, getCalendarEvent, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, exportCalendarICS, syncFromNeis, getNeisEvents } from './routes/calendar.js'
import { getAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, getCourses } from './routes/assignments.js'
import { getLabInspections, getLabInspection, createLabInspection, updateLabInspection, deleteLabInspection, autoDeleteCompleted } from './routes/labInspections.js'
import materialsRouter from './routes/materials.js'
import { getAwards, getAward, createAward, updateAward, deleteAward, downloadAwardAttachment } from './routes/awards.js'

// uploads 디렉토리 생성
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
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,   // 100MB per file
    fieldSize: 200 * 1024 * 1024   // 200MB per field (base64 이미지 대비)
  }
})

// ESM에서 __dirname 얻기
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// 정적 파일 서빙 (업로드된 자료)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Notices (public read, auth write) - multipart 지원
// 주의: 구체적인 라우트를 먼저 등록 (Express 라우트 순서)
app.get('/api/notices', getNotices)
app.get('/api/notices/:id/download/:fileIndex', downloadNoticeAttachment)
app.get('/api/notices/:id', getNotice)
app.post('/api/notices', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, createNotice)
app.put('/api/notices/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, updateNotice)
app.delete('/api/notices/:id', authMiddleware, adminOnly, deleteNotice)

// 자료실 파일 다운로드专用 라우트 (한글 파일명 문제 해결)
app.get('/api/materials/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!material || !material.fileUrl) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다' })
    }
    
    const filePath = path.join(__dirname, '..', material.fileUrl)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일이 존재하지 않습니다' })
    }
    
    // 원본 파일명으로 다운로드
    const decodedFilename = decodeURIComponent(material.fileName)
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`)
    res.setHeader('Content-Type', material.fileType || 'application/octet-stream')
    
    fs.createReadStream(filePath).pipe(res)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: '다운로드 실패' })
  }
})

// 인라인 이미지 업로드 (에디터 내 이미지 삽입용)
app.post('/api/upload/image', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: '/uploads/' + req.file.filename })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth routes (public)
app.post('/api/auth/login', login)
app.post('/api/auth/register', register)
app.get('/api/auth/me', authMiddleware, me)
app.post('/api/auth/import', authMiddleware, adminOnly, importUsers)
app.put('/api/auth/password', authMiddleware, changePassword)

// User management (admin only)
app.get('/api/users', authMiddleware, adminOnly, getUsers)
app.post('/api/users', authMiddleware, adminOnly, createUser)
app.put('/api/users/:id', authMiddleware, adminOnly, updateUser)
app.delete('/api/users/:id', authMiddleware, adminOnly, deleteUser)

// Notices (public read, auth write) - multipart 지원
// 주의: 구체적인 라우트를 먼저 등록 (Express 라우트 순서)
app.get('/api/notices', getNotices)
app.get('/api/notices/:id/download/:fileIndex', downloadNoticeAttachment)
app.get('/api/notices/:id', getNotice)
app.post('/api/notices', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, createNotice)
app.put('/api/notices/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, updateNotice)
app.delete('/api/notices/:id', authMiddleware, adminOnly, deleteNotice)

// Careers (public read, auth write - users can create) - multipart 지원
app.get('/api/careers', getCareers)
app.get('/api/careers/:id', getCareer)
app.post('/api/careers', upload.single('image'), authMiddleware, createCareer)
app.put('/api/careers/:id', upload.single('image'), authMiddleware, adminOnly, updateCareer)
app.delete('/api/careers/:id', authMiddleware, adminOnly, deleteCareer)

// Admissions (public read, auth write - users can create) - multipart 지원
app.get('/api/admissions', getAdmissions)
app.get('/api/admissions/:id', getAdmission)
app.post('/api/admissions', upload.single('image'), authMiddleware, createAdmission)
app.put('/api/admissions/:id', upload.single('image'), authMiddleware, adminOnly, updateAdmission)
app.delete('/api/admissions/:id', authMiddleware, adminOnly, deleteAdmission)

// Calendar (public read, auth write)
app.get('/api/calendar', getCalendarEvents)
app.get('/api/calendar/neis', getNeisEvents)  // NEW: Get from NEIS API
app.get('/api/calendar/sync-neis', syncFromNeis)   // NEW: Sync from NEIS to local DB
app.get('/api/calendar/:id', getCalendarEvent)
app.get('/api/calendar/ics/export', exportCalendarICS)
app.post('/api/calendar', authMiddleware, adminOnly, createCalendarEvent)
app.put('/api/calendar/:id', authMiddleware, adminOnly, updateCalendarEvent)
app.delete('/api/calendar/:id', authMiddleware, adminOnly, deleteCalendarEvent)

// Assignments (public read/write - users can create and delete)
app.get('/api/assignments', getAssignments)
app.get('/api/assignments/courses', getCourses)
app.get('/api/assignments/:id', getAssignment)
app.post('/api/assignments', createAssignment)  // 일반 사용자도 작성 가능
app.put('/api/assignments/:id', authMiddleware, adminOnly, updateAssignment)
app.delete('/api/assignments/:id', deleteAssignment)  // 일반 사용자도 삭제 가능

// Lab Inspections (public read/write, admin write)
app.get('/api/lab-inspections', getLabInspections)
app.get('/api/lab-inspections/:id', getLabInspection)
app.post('/api/lab-inspections', createLabInspection)
app.put('/api/lab-inspections/:id', authMiddleware, adminOnly, updateLabInspection)
app.delete('/api/lab-inspections/:id', authMiddleware, adminOnly, deleteLabInspection)
app.post('/api/lab-inspections/auto-delete', autoDeleteCompleted)  // 자동 삭제 (cron용)

// Materials (public read, admin write)
app.use('/api/materials', materialsRouter)

// Awards (public read, auth write - users can create) - multipart 지원
app.get('/api/awards', getAwards)
app.get('/api/awards/:id/download/:fileIndex', downloadAwardAttachment)
app.get('/api/awards/:id', getAward)
app.post('/api/awards', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, createAward)
app.put('/api/awards/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, updateAward)
app.delete('/api/awards/:id', authMiddleware, adminOnly, deleteAward)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit()
})
