# GameWeb 서버 실행 가이드 (내부망 접속 가능)

---

## Quick Start (PC 재부팅 후 이거만 입력)

```bash
# WSL에서 실행
wsl

# 프로젝트 디렉토리 이동 후 Docker 시작
cd /mnt/c/Users/Administrator/Desktop/GameWeb1
docker-compose up -d
```

**접속 주소:** `http://10.26.138.120:3000`

---

## 개요
Docker Engine (WSL 기반)만 사용하여 내부망에서 접속 가능한 게임동아리 웹사이트 서버 실행 방법

---

## 디렉토리 구조

```
GameWeb1/
├── backend/           # Express API 서버
│   ├── src/
│   │   ├── index.js           # 메인 서버
│   │   └── routes/           # API 라우트
│   └── .env                 # 환경변수
├── frontend/          # React 프론트엔드
│   └── src/
├── docker-compose.yml
└── UserInfo.xlsx     # 사용자 정보
```

---

## 핵심 설정

### 1. docker-compose.yml 핵심 설정

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: gameweb-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: REDACTED_ROOT_PASSWORD
      MYSQL_DATABASE: gameweb
      MYSQL_USER: gameweb
      MYSQL_PASSWORD: REDACTED_DB_PASSWORD
    ports:
      - "3307:3306"          # MySQL 포트
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gameweb-api
    restart: unless-stopped
    ports:
      - "0.0.0.0:4000:4000"   # 중요: 0.0.0.0으로 바인딩
    environment:
      DATABASE_URL: mysql://gameweb:REDACTED_DB_PASSWORD@db:3306/gameweb
      PORT: 4000
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
      - ./UserInfo.xlsx:/app/UserInfo.xlsx

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gameweb-frontend
    restart: unless-stopped
    ports:
      - "0.0.0.0:3000:80"     # 중요: 0.0.0.0으로 바인딩
    depends_on:
      - api

volumes:
  mysql_data:
```

### 2. backend/.env 설정

```env
# Database
DATABASE_URL="mysql://gameweb:REDACTED_DB_PASSWORD@db:3306/gameweb"

# Server
PORT=4000

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# NEIS API
NEIS_API_KEY=REDACTED_NEIS_API_KEY
NEIS_SCHOOL_CODE=7010537
NEIS_ATPT_CODE=B10
```

---

## 실행 명령어

### 항상 하는 방법

```bash
# 1. WSL 접속
wsl

# 2. 프로젝트 디렉토리로 이동
cd /mnt/c/Users/Administrator/Desktop/GameWeb1

# 3. Docker 컨테이너 시작
docker-compose up -d

# 4. 상태 확인
docker ps
```

### 컨테이너 상태 확인

```bash
docker ps
# 출력 예:
# CONTAINER ID   IMAGE           COMMAND            STATUS     PORTS                     NAMES
# 81adeb9924ad   gameweb1_frontend  "/docker-entry..."  Up 11min  0.0.0.0:3000->80/tcp    gameweb-frontend
# 7cf6b67582fc  gameweb1_api       "docker-entry..."  Up 11min  0.0.0.0:4000->4000/tcp    gameweb-api
# 72d0f6cfe731  mysql:8.0        "docker-entry..."  Up 11min  0.0.0.0:3307->3306/tcp    gameweb-db
```

---

## 내부망 접속

### 접속 주소
- **프론트엔드**: `http://10.26.138.120:3000`
- **API**: `http://10.26.138.120:4000`

### 내 IP 주소 확인 (Windows)

```powershell
ipconfig
```

---

## 문제 해결

### 1. 방화벽 허용 (Windows管理员.PowerShell)

```powershell
netsh advfirewall firewall add rule name="GameWeb3000" dir=in action=allow protocol=tcp localport=3000,4000
```

### 2. 포트가 Listen 않는 경우

```bash
# Docker logs 확인
docker logs gameweb-api
docker logs gameweb-frontend
docker logs gameweb-db
```

### 3. DB 연결 오류

```bash
# DB 컨테이너 상태 확인
docker ps | grep gameweb-db

# MySQL 연결 테스트
docker exec gameweb-db mysql -uroot -pREDACTED_ROOT_PASSWORD -e "SELECT 1"
```

### 4. nginx-proxy-manager 문제

nginx-proxy-manager가 MySQL 연결 문제로 실행 실패하면:

```bash
# 중지
docker stop gameweb-proxy

# 또는 제거
docker rm gameweb-proxy
```

---

## 주요 포트

| 포트 | 서비스 | 설명 |
|------|--------|------|
| 3000 | Frontend | 웹사이트 |
| 4000 | Backend | API 서버 |
| 3307 | MySQL | 데이터베이스 |
| 3306 | MySQL | Docker 내부 |

---

## 확인된 사항

- Docker Desktop 아님 - Docker Engine (WSL)만 사용
- `0.0.0.0` 바인딩으로 내부망 접속 가능
- Docker 내부 네트워크 (`gameweb1_default`) 사용
- MySQL 연결: `gameweb-db` (Docker DNS)

---

## 사용자 관리 (Excel)

### Excel 파일 형식

`UserInfo.xlsx` 파일의 첫 번째 시트에 다음 헤더로 입력:

| username | password | name | role |
|----------|----------|------|------|
| admin | 1234 | 관리자 | admin |
| teacher1 | 1234 | 김선생 | teacher |
| student1 | 1234 | 이학생 | student |
| student2 | 1234 | 박학생 | student |

**role 종류:**
- `admin` - 관리자 (전체 권한)
- `teacher` - 교사 (일부 관리 권한)
- `student` - 학생 (기본 권한)

### Excel 수정 후 동기화

서버 재시작 시 자동으로 Excel에서 사용자 로드됨

 manuel로 동기화하려면 (관리자 로그인 후):

```bash
# 관리자 권한으로 API 호출
curl -X POST http://localhost:4000/api/auth/sync \
  -H "Authorization: Bearer [토큰]"
```

또는 브라우저에서:
```
http://10.26.138.120:4000/api/auth/sync
```

### 주의사항

- 이미 존재하는 사용자의 **비밀번호는 유지**됨 (Excel 수정해도 무시됨)
- 역할(role)만 업데이트됨
- 새 사용자를 추가하려면 Excel에 새 행 추가
- Excel 수정 후에는 서버 재시작 필요

---

## 비밀번호 변경

사용자가 자신의 비밀번호를 변경하려면:

1. 로그인 후
2. `/mypage` 또는 설정 메뉴에서 변경

또는 관리자가 변경:
- 관리자 로그인 후 사용자 관리에서 변경