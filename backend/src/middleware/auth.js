import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET === 'REDACTED_JWT_SECRET') {
  console.warn('⚠️  JWT_SECRET이 기본값이거나 설정되지 않았습니다. .env 파일을 확인하세요.')
}

const SECRET = JWT_SECRET || 'REDACTED_JWT_SECRET'

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' })
  }
}

// admin 또는 teacher 모두 허용 (프론트엔드 AuthContext와 일치)
export function adminOnly(req, res, next) {
  if (!['admin', 'teacher'].includes(req.user?.role)) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' })
  }
  next()
}

// 순수 admin만 허용 (계정 관리 등 민감 작업용)
export function superAdminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin 전용 기능입니다' })
  }
  next()
}

export { SECRET as JWT_SECRET }
