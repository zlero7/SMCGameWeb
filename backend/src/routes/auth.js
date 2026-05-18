import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { JWT_SECRET } from '../middleware/auth.js'
import fs from 'fs'
import path from 'path'
import xlsx from 'xlsx'

const prisma = new PrismaClient()

// UserInfo.xlsx 파일에서 사용자 로드 및 동기화 (새 계정만 등록, 기존 계정은 업데이트)
async function syncUsersFromExcel() {
  const excelPath = path.join(process.cwd(), 'UserInfo.xlsx')
  
  if (!fs.existsSync(excelPath)) {
    console.log('UserInfo.xlsx 파일이 없습니다.')
    return
  }
  
  try {
    const workbook = xlsx.readFile(excelPath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    // raw 배열로 읽어서 첫 번째 행(헤더) 확인
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 })
    
    if (!rawData || rawData.length === 0) {
      console.log('Excel에 데이터가 없습니다.')
      return
    }
    
    // 첫 번째 행이 헤더인지 확인
    const headerRow = rawData[0] || []
    const isHeaderRow = headerRow.some(h => 
      ['username', 'userid', 'userid', 'password', 'name', 'role', 'studentid']
        .includes(String(h).toLowerCase().trim())
    )
    
    // 헤더 행 다음부터 데이터
    const dataRows = isHeaderRow ? rawData.slice(1) : rawData
    
    if (dataRows.length === 0 || dataRows.every(r => !r.some(cell => cell))) {
      console.log('Excel에 사용자가 없습니다.')
      return
    }
    
    console.log(`Excel에서 ${dataRows.length}명의 사용자를 로드했습니다.`)
    
    const headerMap = isHeaderRow ? rawData[0].map(h => String(h).toLowerCase().trim()) : ['username', 'password', 'name', 'role']
    
    const remainingUsers = []
    let createdCount = 0
    let updatedCount = 0
    
    for (const row of dataRows) {
      // 빈 행 건너뛰기
      if (!row || !row.some(cell => cell && String(cell).trim())) {
        continue
      }
      
      // 헤더 맵핑
      const getValue = (idx) => row[idx] !== undefined ? String(row[idx]).trim() : ''
      const getValueByHeader = (header) => {
        const idx = headerMap.indexOf(header)
        return idx >= 0 && row[idx] !== undefined ? String(row[idx]).trim() : ''
      }
      
      const username = getValueByHeader('username') || getValueByHeader('userid') || getValueByHeader('userid')
      const password = getValueByHeader('password')
      const name = getValueByHeader('name') || username
      const role = getValueByHeader('role') || 'student'
      
      // username, password, name 모두 있어야 DB에 저장
      if (!username || !password || !name) {
        remainingUsers.push(row)
        continue
      }
      
      // 유효한 역할 확인 (student, admin, teacher)
      const validRole = ['student', 'admin', 'teacher'].includes(role) ? role : 'student'
      
      const existing = await prisma.user.findUnique({ where: { username } })
      
      if (existing) {
        // 기존 사용자: username으로 식별, 제공된 필드만 업데이트 후 Excel 행 삭제
        const updateData = {}
        
        // name이 있으면 업데이트
        if (name) {
          updateData.name = name
        }
        
        // role이 있으면 업데이트
        if (role && ['student', 'admin', 'teacher'].includes(role)) {
          updateData.role = validRole
        }
        
        // password가 있으면 업데이트
        if (password) {
          updateData.passwordHash = await bcrypt.hash(password, 10)
        }
        
        // 업데이트할 데이터가 있으면
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { username },
            data: updateData
          })
        }
        
        updatedCount++
        console.log(`사용자 업데이트: ${username}`)
        // 기존 사용자도 Excel 행 삭제
      } else {
        // 새 사용자: 생성 후 Excel 행 삭제
        await prisma.user.create({
          data: {
            username,
            passwordHash: await bcrypt.hash(password, 10),
            name,
            role: validRole
          }
        })
        createdCount++
        console.log(`사용자 생성: ${username} (role: ${validRole})`)
        // 새 사용자는 remainingUsers에 추가하지 않음 → Excel에서 삭제됨
      }
    }
    
    // Excel 파일 업데이트 (헤더 + 데이터 행)
    if (remainingUsers.length > 0 || isHeaderRow) {
      const rowsToWrite = isHeaderRow ? [headerRow, ...remainingUsers] : remainingUsers
      const newSheet = xlsx.utils.aoa_to_sheet(rowsToWrite)
      workbook.Sheets[sheetName] = newSheet
      xlsx.writeFile(workbook, excelPath)
      console.log(`Excel 업데이트 완료: ${remainingUsers.length}명 남음`)
    }
    
    console.log(`사용자 동기화 완료! (신규: ${createdCount}, 업데이트: ${updatedCount})`)
  } catch (error) {
    console.error('Excel 로드 오류:', error.message)
  }
}

// 서버 시작 시 동기화
syncUsersFromExcel()

// 수동 동기화 엔드포인트 (관리자만)
export async function syncUsers(req, res) {
  try {
    await syncUsersFromExcel()
    res.json({ success: true, message: '사용자 동기화 완료' })
  } catch (error) {
    res.status(500).json({ error: '동기화 실패: ' + error.message })
  }
}

// Login
export async function login(req, res) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return res.status(401).send('아이디 또는 비밀번호가 일치하지 않습니다')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      return res.status(401).send('아이디 또는 비밀번호가 일치하지 않습니다')
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
}

// Register (initial admin setup)
export async function register(req, res) {
  try {
const { username, password, role = 'student', name } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }
    
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: { username, passwordHash, role, name }
    })

    res.json({ id: user.id, username: user.username, role: user.role })
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' })
  }
}

// Get current user
export async function me(req, res) {
  try {
    console.log('me() called, req.user:', req.user)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, role: true, name: true }
    })
    res.json(user)
  } catch (error) {
    console.error('me() error:', error)
    res.status(500).json({ error: 'Failed to get user', message: error.message })
  }
}

// Import users from Excel/CSV (admin only)
export async function importUsers(req, res) {
  try {
    // Excel 파일 파싱 (xlsx 라이브러리 사용)
    // 형식: username, password, name
    const users = req.body.users
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'No users to import' })
    }

    const results = []
    for (const u of users) {
      if (!u.username || !u.password) continue
      
      const existing = await prisma.user.findUnique({ where: { username: u.username } })
      
      if (existing) {
        // 기존 사용자 업데이트
        await prisma.user.update({
          where: { username: u.username },
          data: { 
            name: u.name,
            passwordHash: u.password ? await bcrypt.hash(u.password, 10) : undefined
          }
        })
        results.push({ username: u.username, action: 'updated' })
      } else {
        // 새 사용자 생성
        await prisma.user.create({
          data: {
            username: u.username,
            passwordHash: await bcrypt.hash(u.password || 'password123', 10),
            name: u.name || u.username,
            role: 'student'
          }
        })
        results.push({ username: u.username, action: 'created' })
      }
    }

    res.json({ success: true, results })
  } catch (error) {
    res.status(500).json({ error: 'Failed to import users: ' + error.message })
  }
}

// Excel 파일에서 비밀번호 업데이트
async function updatePasswordInExcel(username, newPassword) {
  const excelPath = path.join(process.cwd(), 'UserInfo.xlsx')
  
  if (!fs.existsSync(excelPath)) {
    console.log('UserInfo.xlsx 파일이 없습니다. Excel 업데이트를 건너뜁니다.')
    return false
  }
  
  try {
    const workbook = xlsx.readFile(excelPath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(sheet)
    
    // 사용자 찾기 (username 필드 찾기) - 문자열로 비교
    let userFound = false
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowUsername = String(row.username || row.UserName || row.UserID || row.userID || '')
      if (rowUsername === String(username)) {
        data[i].password = newPassword
        userFound = true
        console.log(`Excel 비밀번호 업데이트: ${username}`)
        break
      }
    }
    
    if (!userFound) {
      console.log(`Excel에서 사용자를 찾을 수 없습니다: ${username}`)
      return false
    }
    
    // 새 시트 생성
    const newSheet = xlsx.utils.json_to_sheet(data)
    workbook.Sheets[sheetName] = newSheet
    xlsx.writeFile(workbook, excelPath)
    console.log(`Excel 저장 완료: ${username}`)
    return true
  } catch (error) {
    console.error('Excel 업데이트 오류:', error.message)
    return false
  }
}

// 비밀번호 변경 (로그인한 사용자만)
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 모두 입력하세요' })
    }
    
    // 새 비밀번호 최소 길이 검증
    if (newPassword.length < 4) {
      return res.status(400).json({ error: '새 비밀번호는 4자 이상이어야 합니다' })
    }
    
    // 현재 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' })
    }
    
    // 현재 비밀번호 검증
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다' })
    }
    
    // 새 비밀번호 해시 생성
    const newHash = await bcrypt.hash(newPassword, 10)
    
    // 1. DB 비밀번호 업데이트
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash }
    })
    
    // 2. Excel 파일도 함께 업데이트
    const excelUpdated = await updatePasswordInExcel(user.username, newPassword)
    
    console.log(`비밀번호 변경 완료: ${user.username} (Excel: ${excelUpdated ? '성공' : '실패/파일없음'})`)
    
    res.json({ success: true, message: '비밀번호가 변경되었습니다' })
  } catch (error) {
    console.error('changePassword 오류:', error)
    res.status(500).json({ error: '비밀번호 변경 실패' })
  }
}

// ===== 계정 관리 API (관리자용) =====

// 사용자 목록 조회
export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (error) {
    console.error('getUsers 오류:', error)
    res.status(500).json({ error: '사용자 목록 조회 실패' })
  }
}

// 사용자 생성
export async function createUser(req, res) {
  try {
    const { username, password, name, role = 'student' } = req.body
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'username, password, name은 필수입니다' })
    }
    
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return res.status(400).json({ error: '이미 존재하는 username입니다' })
    }
    
    const validRole = ['student', 'admin', 'teacher'].includes(role) ? role : 'student'
    
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 10),
        name,
        role: validRole
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true
      }
    })
    
    res.json({ success: true, user })
  } catch (error) {
    console.error('createUser 오류:', error)
    res.status(500).json({ error: '사용자 생성 실패' })
  }
}

// 사용자 수정
export async function updateUser(req, res) {
  try {
    const { id } = req.params
    const { username, password, name, role } = req.body

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' })
    }

    const updateData = {}

    if (username && username !== user.username) {
      const duplicate = await prisma.user.findUnique({ where: { username } })
      if (duplicate) {
        return res.status(400).json({ error: '이미 사용 중인 username입니다' })
      }
      updateData.username = username
    }
    if (name) updateData.name = name
    if (role && ['student', 'admin', 'teacher'].includes(role)) {
      updateData.role = role
    }
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }
    
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true
      }
    })
    
    res.json({ success: true, user: updated })
  } catch (error) {
    console.error('updateUser 오류:', error)
    res.status(500).json({ error: '사용자 수정 실패' })
  }
}

// 사용자 삭제
export async function deleteUser(req, res) {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' })
    }
    
    // 자기 자신은 삭제 불가
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: '자기 자신은 삭제할 수 없습니다' })
    }
    
    await prisma.user.delete({ where: { id: parseInt(id) } })
    
    res.json({ success: true, message: '사용자가 삭제되었습니다' })
  } catch (error) {
    console.error('deleteUser 오류:', error)
    res.status(500).json({ error: '사용자 삭제 실패' })
  }
}
