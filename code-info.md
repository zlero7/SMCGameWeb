# GameWeb 코드 정보

프로젝트 구조와 각 파일의 역할을 정리한 문서입니다.

---

## 프로젝트 개요

| 구분 | 설명 |
|------|------|
| **프론트엔드** | React + Vite (포트 3000) |
| **백엔드** | Express + Prisma (포트 4000) |
| **데이터베이스** | MySQL 8.0 (포트 3307) |
| **배포** | Docker Compose (nginx로 서빙) |

---

## 디렉토리 구조

```
GameWeb1/
├── backend/                 # Express API 서버
│   ├── src/
│   │   ├── index.js         # 서버 진입점, 라우트 등록
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT 인증 미들웨어
│   │   ├── routes/         # API 엔드포인트
│   │   │   ├── auth.js     # 로그인, 회원가입, 비밀번호 변경
│   │   │   ├── notices.js # 공지사항 CRUD
│   │   │   ├── careers.js  # 취업정보 CRUD
│   │   │   ├── admissions.js # 진학정보 CRUD
│   │   │   ├── calendar.js # 학사달력 (NEIS 연동)
│   │   │   ├── assignments.js # 과제일정
│   │   │   ├── labInspections.js # 실습실 점검
│   │   │   ├── materials.js # 자료실 (파일 업로드)
│   │   │   └── awards.js   # 수상/포트폴리오
│   │   └── services/
│   │       └── neisCalendar.js # NEIS API 서비스
│   ├── prisma/
│   │   └── schema.prisma   # 데이터베이스 스키마
│   ├── uploads/            # 업로드된 파일 저장
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── App.jsx         # 메인 라우터 설정
│   │   ├── main.jsx        # ReactMount
│   │   ├── context/
│   │   │   └── AuthContext.jsx # 인증 상태 관리
│   │   ├── components/     # 공통 컴포넌트
│   │   │   ├── AdminLayout.jsx    # 관리자 페이지 레이아웃
│   │   │   ├── AdminGuard.jsx    # 관리자 페이지 가드
│   │   │   ├── ErrorBoundary.jsx  # 에러 처리
│   │   │   ├── TitleUpdater.jsx    # 페이지 제목 업데이트
│   │   │   ├── FormElements.jsx   # 폼 컴포넌트
│   │   │   └── AccordionCard.jsx  # 아코디언 카드
│   │   ├── pages/          # 사용자 페이지
│   │   │   ├── MainDashboard.jsx  # 메인 대시보드
│   │   │   ├── Login.jsx          # 학생 로그인
│   │   │   ├── ChangePassword.jsx # 비밀번호 변경
│   │   │   ├── Notices.jsx         # 공지사항
│   │   │   ├── Careers.jsx         # 취업정보
│   │   │   ├── Admissions.jsx     # 진학정보
│   │   │   ├── Calendar.jsx       # 학사달력
│   │   │   ├── CalendarNew.jsx    # 학사달력 (신버전)
│   │   │   ├── Assignments.jsx    # 과제일정
│   │   │   ├── LabInspections.jsx # 실습실 점검
│   │   │   ├── Materials.jsx       # 자료실
│   │   │   └── Awards.jsx          # 수상/포트폴리오
│   │   ├── pages/admin/    # 관리자 페이지
│   │   │   ├── Login.jsx    # 관리자 로그인
│   │   │   ├── Dashboard.jsx      # 관리자 대시보드
│   │   │   ├── NoticeManager.jsx  # 공지사항 관리
│   │   │   ├── CareerManager.jsx  # 취업정보 관리
│   │   │   ├── AdmissionManager.jsx # 진학정보 관리
│   │   │   ├── CalendarManager.jsx # 학사달력 관리
│   │   │   ├── AssignmentManager.jsx # 과제관리
│   │   │   ├── LabInspectionManager.jsx # 실습실 점검 관리
│   │   │   ├── MaterialsManager.jsx # 자료실 관리
│   │   │   └── AwardManager.jsx    # 수상/포트폴리오 관리
│   │   ├── services/
│   │   │   └── api.js       # API 호출 유틸리티
│   │   └── index.css        # 글로벌 스타일
│   ├── public/
│   │   └── logo.svg         # 로고
│   ├── nginx.conf           # nginx 설정
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml       # Docker 서비스 정의
├── UserInfo.xlsx           # 학생 정보 Excel 파일
└── code-info.md            # 이 문서
```

---

## 데이터베이스 스키마 (Prisma)

| 테이블 | 설명 | 주요 필드 |
|--------|------|-----------|
| `User` | 사용자 (학생/관리자) | username, passwordHash, name, studentId, role |
| `Notice` | 공지사항 | title, content, author, attachments, expiresAt |
| `Career` | 취업정보 | title, description, requirements, location, deadline, applyLink, imageUrl |
| `Admission` | 진학정보 | program, requirements, deadline, imageUrl |
| `CalendarEvent` | 학사달력 이벤트 | title, start, end, type, description |
| `Assignment` | 과제 | courseId, title, dueDate, description, attachments |
| `LabInspection` | 실습실 점검 | title, content, author, status, isPublic, completedAt |
| `Material` | 자료실 자료 | title, description, category, fileUrl, fileName, fileSize, downloadCount |
| `Award` | 수상/포트폴리오 | title, content, category, imageUrl, videoUrl, isPublic |

---

## API 엔드포인트 요약

### 인증 (Auth)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| POST | `/api/auth/login` | Public | 로그인 |
| POST | `/api/auth/register` | Public | 회원가입 |
| GET | `/api/auth/me` | Auth | 내 정보 조회 |
| PUT | `/api/auth/password` | Auth | 비밀번호 변경 |
| POST | `/api/auth/import` | Admin | Excel에서 사용자 가져오기 |

### 공지사항 (Notices)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/notices` | Public | 목록 조회 |
| GET | `/api/notices/:id` | Public | 상세 조회 |
| POST | `/api/notices` | Admin | 생성 |
| PUT | `/api/notices/:id` | Admin | 수정 |
| DELETE | `/api/notices/:id` | Admin | 삭제 |

### 취업정보 (Careers)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/careers` | Public | 목록 조회 |
| POST | `/api/careers` | Auth | 생성 (이미지 업로드) |
| PUT | `/api/careers/:id` | Admin | 수정 |
| DELETE | `/api/careers/:id` | Admin | 삭제 |

### 진학정보 (Admissions)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/admissions` | Public | 목록 조회 |
| POST | `/api/admissions` | Auth | 생성 (이미지 업로드) |
| PUT | `/api/admissions/:id` | Admin | 수정 |
| DELETE | `/api/admissions/:id` | Admin | 삭제 |

### 학사달력 (Calendar)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/calendar` | Public | 이벤트 목록 |
| GET | `/api/calendar/neis` | Public | NEIS에서 가져온 이벤트 |
| GET | `/api/calendar/sync-neis` | Auth | NEIS → DB 동기화 |
| GET | `/api/calendar/ics/export` | Public | ICS 파일 내보내기 |
| POST | `/api/calendar` | Admin | 이벤트 생성 |
| PUT | `/api/calendar/:id` | Admin | 수정 |
| DELETE | `/api/calendar/:id` | Admin | 삭제 |

### 과제일정 (Assignments)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/assignments` | Public | 목록 조회 |
| GET | `/api/assignments/courses` | Public | 과목 목록 |
| POST | `/api/assignments` | Public | 생성 (학생도 가능) |
| PUT | `/api/assignments/:id` | Admin | 수정 |
| DELETE | `/api/assignments/:id` | Public | 삭제 (학생도 가능) |

### 실습실 점검 (Lab Inspections)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/lab-inspections` | Public | 목록 조회 |
| POST | `/api/lab-inspections` | Public | 점검 요청 생성 |
| PUT | `/api/lab-inspections/:id` | Admin | 상태 변경 |
| DELETE | `/api/lab-inspections/:id` | Admin | 삭제 |

### 자료실 (Materials)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/materials` | Public | 목록 조회 |
| GET | `/api/materials/:id` | Public | 상세 조회 |
| POST | `/api/materials` | Admin | 파일 업로드 |
| PUT | `/api/materials/:id` | Admin | 수정 |
| DELETE | `/api/materials/:id` | Admin | 삭제 |
| GET | `/api/materials/:id/download` | Public | 파일 다운로드 |

### 수상/포트폴리오 (Awards)
| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/awards` | Public | 목록 조회 |
| POST | `/api/awards` | Auth | 생성 (이미지/비디오 업로드) |
| PUT | `/api/awards/:id` | Admin | 수정 |
| DELETE | `/api/awards/:id` | Admin | 삭제 |

---

## 백엔드 핵심 파일 설명

### `backend/src/index.js`
- Express 서버 메인 파일
- 모든 라우트 등록 및 미들웨어 설정
- Multer 파일 업로드 설정
- 정적 파일 서빙 (`/uploads`)

### `backend/src/middleware/auth.js`
- `authMiddleware`: JWT 토큰 검증
- `adminOnly`: 관리자 권한 검사

### `backend/src/routes/auth.js`
- `login`: 아이디/비밀번호 검증, JWT 발급
- `register`: 회원가입
- `me`: 현재 사용자 정보 조회
- `importUsers`: UserInfo.xlsx에서 사용자 일괄 가져오기
- `changePassword`: 비밀번호 변경

### `backend/src/services/neisCalendar.js`
- NEIS (교육행정정보시스템) API 연동
- 학교 학사 일정 가져오기

---

## 프론트엔드 핵심 파일 설명

### `frontend/src/App.jsx`
- React Router 설정
- 모든 페이지 라우트 정의
- 네비게이션 바 렌더링

### `frontend/src/context/AuthContext.jsx`
- 인증 상태 전역 관리
- `login()`, `logout()`, `api()` 함수 제공
- JWT 토큰 localStorage 관리

### `frontend/src/services/api.js`
- API 호출 유틸리티 (필요시 사용)
- 일반적으로 AuthContext의 `api()` 사용

---

## 유지보수 시 참조

### 사용자 추가/수정
1. `UserInfo.xlsx` 파일 수정 (학번, 이름, 비밀번호)
2. API 컨테이너 재시작: `docker-compose restart api`

### 새 페이지 추가
1. 백엔드: `backend/src/routes/`에 라우트 파일 생성
2. 프론트엔드: `frontend/src/pages/`에 컴포넌트 생성
3. `frontend/src/App.jsx`에 라우트 추가

### 파일 업로드 관련 수정
- 백엔드: `backend/src/index.js`의 Multer 설정
- 프론트엔드: 해당 페이지 컴포넌트의 FormData 처리

### 데이터베이스 스키마 변경
1. `backend/prisma/schema.prisma` 수정
2. `docker-compose exec api npx prisma db push`
3. 필요시 시드 데이터 실행

---

## Docker 명령어

```bash
# 전체 서비스 시작
docker-compose up -d

# 로그 확인
docker logs -f gameweb-api
docker logs -f gameweb-frontend

# 특정 서비스 재시작
docker-compose restart api

# 컨테이너 정지
docker-compose down

# 빌드 후 시작
docker-compose up --build -d
```
