import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin'
    }
  })
  console.log('✅ Admin user created: admin / admin123')

  // Notices
  await prisma.notice.createMany({
    data: [
      {
        title: '2026학년도 학사 일정 안내',
        content: '신학기 학사 일정이 공지되었습니다. 자세한 내용은 학사 일정 페이지를 확인해주세요.',
        author: '교무팀',
        date: new Date('2026-03-01')
      },
      {
        title: '게임프로그래밍 경진대회 참가 모집',
        content: '오는 4월에 개최되는 게임프로그래밍 경진대회에 참가할 학생을 모집합니다.',
        author: '담임교사',
        date: new Date('2026-03-15')
      }
    ]
  })

  // Careers
  await prisma.career.createMany({
    data: [
      {
        title: '게임개발자 채용',
        description: '모바일 게임 개발사에서 신입 게임개발자를 채용합니다.',
        requirements: 'Unity 또는 Unreal Engine 사용 가능자, JavaScript/Python 이해',
        location: '서울 강남구',
        deadline: new Date('2026-04-30')
      },
      {
        title: '그래픽디자이너 채용',
        description: '게임 캐릭터 및 UI 디자인 경력자 채용',
        requirements: 'Photoshop, Illustrator 사용 가능, 游戏 디자인 경험 우대',
        location: '서울 마포구',
        deadline: new Date('2026-05-15')
      }
    ]
  })

  // Admissions
  await prisma.admission.createMany({
    data: [
      {
        program: '한국게임과학고등학교 진학',
        requirements: '게임에 관심 있는 학생, 기초 프로그래밍 능력 보유자 우대',
        deadline: new Date('2026-05-01')
      },
      {
        program: '서울대학교 게임학부',
        requirements: '교과 성적 상위 30%, 자기소개서, 면접',
        deadline: new Date('2026-06-15')
      }
    ]
  })

  // Calendar Events
  await prisma.calendarEvent.createMany({
    data: [
      {
        title: '신학기 입학식',
        start: new Date('2026-03-02'),
        end: new Date('2026-03-02'),
        type: 'event',
        description: '신학기 입학식 및 오리엔테이션'
      },
      {
        title: '중간고사',
        start: new Date('2026-05-20'),
        end: new Date('2026-05-25'),
        type: 'exam',
        description: '1학기 중간고사 기간'
      },
      {
        title: '방학',
        start: new Date('2026-07-20'),
        end: new Date('2026-08-31'),
        type: 'vacation',
        description: '여름방학'
      }
    ]
  })

  // Assignments
  await prisma.assignment.createMany({
    data: [
      {
        courseId: '게임프로그래밍',
        title: 'Unity 2D 게임 프로젝트',
        dueDate: new Date('2026-04-15'),
        description: 'Unity를利用한 2D 플랫폼 게임 개발'
      },
      {
        courseId: '그래픽디자인',
        title: '게임 캐릭터 디자인',
        dueDate: new Date('2026-04-10'),
        description: 'Original 캐릭터를 디자인하고 설명서 작성'
      }
    ]
  })

  console.log('✅ Seeding complete!')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
