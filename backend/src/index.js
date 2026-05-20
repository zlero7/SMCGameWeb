import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { PrismaClient } from '@prisma/client'
import { authMiddleware, adminOnly, superAdminOnly } from './middleware/auth.js'
import { login, register, me, importUsers, changePassword, getUsers, createUser, updateUser, deleteUser } from './routes/auth.js'
import { getNotices, getNotice, createNotice, updateNotice, deleteNotice, downloadNoticeAttachment } from './routes/notices.js'
import { getCareers, getCareer, createCareer, updateCareer, deleteCareer } from './routes/careers.js'
import { getAdmissions, getAdmission, createAdmission, updateAdmission, deleteAdmission } from './routes/admissions.js'
import { getCalendarEvents, getCalendarEvent, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, exportCalendarICS, syncFromNeis, getNeisEvents } from './routes/calendar.js'
import { getAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, getCourses } from './routes/assignments.js'
import { getLabInspections, getLabInspection, createLabInspection, updateLabInspection, deleteLabInspection, autoDeleteCompleted } from './routes/labInspections.js'
import materialsRouter from './routes/materials.js'
import { getAwards, getAward, createAward, updateAward, deleteAward, downloadAwardAttachment } from './routes/awards.js'

dotenv.config()

// ESM에서 __dirname 얻기
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// uploads 디렉토리 생성
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// [2-6] 허용 파일 형식 및 차단 확장자
const BLOCKED_EXT = /\.(exe|bat|cmd|sh|ps1|vbs|jar|app|msi|dll|php|py|rb|pl)$/i
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip', 'application/x-zip-compressed',
  'video/mp4', 'video/webm',
  'application/octet-stream',
])

const fileFilter = (req, file, cb) => {
  if (BLOCKED_EXT.test(file.originalname)) {
    return cb(new Error('실행 파일은 업로드할 수 없습니다'))
  }
  cb(null, true)
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
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    fieldSize: 200 * 1024 * 1024
  }
})

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 4000

// [2-5] CORS — 허용 출처 명시
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://10.26.138.120:3000,http://localhost:5173,capacitor://localhost,https://localhost,http://localhost')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true) // 서버 간 호출
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS 차단: ${origin}`))
  },
  credentials: true
}))

// [4-7] 보안 헤더
app.use(helmet({
  contentSecurityPolicy: false, // nginx에서 별도 설정 가능
  crossOriginEmbedderPolicy: false
}))

app.use(express.json())

// [2-6] 정적 파일 서빙 — HTML/JS는 다운로드 강제
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    if (/\.(html?|js|php)$/i.test(filePath)) {
      res.setHeader('Content-Disposition', 'attachment')
      res.setHeader('Content-Type', 'application/octet-stream')
    }
  }
}))

// [2-8] Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: '너무 많은 로그인 시도입니다. 15분 후 다시 시도하세요.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', apiLimiter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth routes
app.post('/api/auth/login', loginLimiter, login)
// [2-1] 회원가입 — 관리자만 가능 (학교 포털이므로 공개 가입 차단)
app.post('/api/auth/register', authMiddleware, superAdminOnly, register)
app.get('/api/auth/me', authMiddleware, me)
app.post('/api/auth/import', authMiddleware, superAdminOnly, importUsers)
app.put('/api/auth/password', authMiddleware, changePassword)

// User management (admin only)
app.get('/api/users', authMiddleware, superAdminOnly, getUsers)
app.post('/api/users', authMiddleware, superAdminOnly, createUser)
app.put('/api/users/:id', authMiddleware, superAdminOnly, updateUser)
app.delete('/api/users/:id', authMiddleware, superAdminOnly, deleteUser)

// 자료실 파일 다운로드 전용 라우트
app.get('/api/materials/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const material = await prisma.material.findUnique({ where: { id: parseInt(id) } })

    if (!material || !material.fileUrl) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다' })
    }

    const filePath = path.join(__dirname, '..', material.fileUrl)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일이 존재하지 않습니다' })
    }

    const decodedFilename = decodeURIComponent(material.fileName)
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`)
    res.setHeader('Content-Type', material.fileType || 'application/octet-stream')
    fs.createReadStream(filePath).pipe(res)
  } catch (error) {
    res.status(500).json({ error: '다운로드 실패' })
  }
})

// 인라인 이미지 업로드 (에디터 내 이미지 삽입용)
app.post('/api/upload/image', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: '/uploads/' + req.file.filename })
})

// Notices (public read, admin write)
app.get('/api/notices', getNotices)
app.get('/api/notices/:id/download/:fileIndex', downloadNoticeAttachment)
app.get('/api/notices/:id', getNotice)
app.post('/api/notices', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, createNotice)
app.put('/api/notices/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, updateNotice)
app.delete('/api/notices/:id', authMiddleware, adminOnly, deleteNotice)

// Careers (public read, auth write)
app.get('/api/careers', getCareers)
app.get('/api/careers/:id', getCareer)
app.post('/api/careers', upload.single('image'), authMiddleware, createCareer)
app.put('/api/careers/:id', upload.single('image'), authMiddleware, adminOnly, updateCareer)
app.delete('/api/careers/:id', authMiddleware, adminOnly, deleteCareer)

// Admissions (public read, auth write)
app.get('/api/admissions', getAdmissions)
app.get('/api/admissions/:id', getAdmission)
app.post('/api/admissions', upload.single('image'), authMiddleware, createAdmission)
app.put('/api/admissions/:id', upload.single('image'), authMiddleware, adminOnly, updateAdmission)
app.delete('/api/admissions/:id', authMiddleware, adminOnly, deleteAdmission)

// Calendar (public read, admin write)
app.get('/api/calendar', getCalendarEvents)
app.get('/api/calendar/neis', getNeisEvents)
app.get('/api/calendar/ics/export', exportCalendarICS)
app.get('/api/calendar/:id', getCalendarEvent)
app.post('/api/calendar', authMiddleware, adminOnly, createCalendarEvent)
app.post('/api/calendar/sync-neis', authMiddleware, adminOnly, syncFromNeis)
app.put('/api/calendar/:id', authMiddleware, adminOnly, updateCalendarEvent)
app.delete('/api/calendar/:id', authMiddleware, adminOnly, deleteCalendarEvent)

// [2-4] Assignments — 로그인 필요
app.get('/api/assignments', getAssignments)
app.get('/api/assignments/courses', getCourses)
app.get('/api/assignments/:id', getAssignment)
app.post('/api/assignments', authMiddleware, createAssignment)
app.put('/api/assignments/:id', authMiddleware, adminOnly, updateAssignment)
app.delete('/api/assignments/:id', authMiddleware, deleteAssignment)

// [2-4] Lab Inspections — 작성은 로그인 필요
app.get('/api/lab-inspections', getLabInspections)
app.get('/api/lab-inspections/:id', getLabInspection)
app.post('/api/lab-inspections', authMiddleware, createLabInspection)
app.put('/api/lab-inspections/:id', authMiddleware, adminOnly, updateLabInspection)
app.delete('/api/lab-inspections/:id', authMiddleware, adminOnly, deleteLabInspection)
app.post('/api/lab-inspections/auto-delete', (req, res, next) => {
  const cronKey = req.headers['x-cron-key']
  if (!cronKey || cronKey !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}, autoDeleteCompleted)

// Materials (public read, admin write)
app.use('/api/materials', materialsRouter)

// Awards (public read, auth write)
app.get('/api/awards', getAwards)
app.get('/api/awards/:id/download/:fileIndex', downloadAwardAttachment)
app.get('/api/awards/:id', getAward)
app.post('/api/awards', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, createAward)
app.put('/api/awards/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), authMiddleware, adminOnly, updateAward)
app.delete('/api/awards/:id', authMiddleware, adminOnly, deleteAward)

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message)
  if (err.message?.includes('업로드할 수 없습니다')) {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: '서버 오류가 발생했습니다' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit()
})
