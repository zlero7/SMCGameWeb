# GameWeb 서버 설치 가이드

새로운 PC에서 처음 서버를 실행할 때 필요한 모든 단계를 정리한 문서입니다.

---

## 사전 준비

### 1. Docker Desktop 설치

**Windows:**
1. Docker Desktop 설치 파일 다운로드
   - https://www.docker.com/products/dockerdesktop
2. 설치 파일 실행
3. 설치 완료 후 Docker Desktop 실행
4. `docker --version` 으로 확인

**Mac:**
1. Docker Desktop 다운로드 (Apple Silicon은 ARM64 버전)
2. Applications 폴더로 이동 후 실행
3. 상단 메뉴바에 고래 아이콘이 나오면 완료

### 2. 프로젝트 파일 복사

프로젝트 전체 폴더를 새 PC에 복사합니다.

```
GameWeb1/
├── .env                     # 중요: 환경변수 (반드시 포함)
├── docker-compose.yml
├── UserInfo.xlsx
├── backend/
│   ├── .env
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   └── src/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
```

**필수 포함 파일:**
- `.env` - 데이터베이스 연결, JWT 시크릿 등
- `docker-compose.yml` - 서비스 정의
- `backend/` 전체 - API 서버 소스
- `frontend/` 전체 - 프론트엔드 소스

---

## 설치 steps

### 1. 터미널(명령 프롬프트/PowerShell/Terminal) 열기

프로젝트 디렉토리로 이동:
```bash
cd /path/to/GameWeb1
```

### 2. Docker 컨테이너 실행

```bash
docker-compose up --build -d
```

**설명:**
- `--build`: 이미지 새로 빌드
- `-d`: 백그라운드 실행

### 3. 실행 확인

```bash
docker ps
```

다음과 같이 표시되면 성공:

| CONTAINER | IMAGE | PORTS |
|-----------|-------|-------|
| gameweb-db | mysql:8.0 | 3307->3306 |
| gameweb-api | gameweb1-api | 4000->4000 |
| gameweb-frontend | gameweb1-frontend | 3000->80 |

### 4. 로그 확인 (첫 실행 시)

```bash
docker logs gameweb-api
```

다음과 같은 메시지가 나오면 정상:
```
🚀 Server running on http://localhost:4000
Excel에서 N명의 사용자를 로드했습니다.
```

---

## 접속 주소

| 서비스 | 주소 |
|--------|------|
| 웹사이트 | http://localhost:3000 |
| API | http://localhost:4000 |
| phpMyAdmin (선택) | http://localhost:3307 |

---

## 일반 관리 명령어

### 서버 재시작
```bash
docker-compose restart
```

### 로그 확인
```bash
docker logs -f gameweb-api    # API 로그
docker logs -f gameweb-frontend # 프론트엔드 로그
docker logs -f gameweb-db     # DB 로그
```

### 서버 정지
```bash
docker-compose down
```

### 사용자 정보 업데이트 (UserInfo.xlsx 수정 후)
```bash
docker-compose restart api
```

### 전체 삭제 (처음부터 다시)
```bash
docker-compose down -v   # -v: 볼륨까지 삭제 (데이터 모두 삭제)
docker-compose up --build -d
```

---

## 문제 해결

### "docker: command not found"
→ Docker Desktop이 설치되지 않았거나 실행되지 않음

### "Cannot connect to db"
```bash
# 1. DB 컨테이너 상태 확인
docker ps | grep gameweb-db

# 2. healthy 상태인지 확인 ( unhealthy면 대기)
docker inspect gameweb-db | grep -A 5 Health

# 3. 다시 시도
docker-compose up -d
```

### "port is already in use"
```bash
# 사용 중인 포트 확인
netstat -ano | findstr "3000"
# 또는
lsof -i :3000
```
다른 프로그램이 포트를 사용 중이면 해당 프로그램을 끄거나 docker-compose.yml에서 포트 변경

### `.env` 파일 관련 오류
- `.env` 파일이 프로젝트 루트에 있는지 확인
- DATABASE_URL 형식 확인: `mysql://user:password@host:port/dbname`

---

## 데이터베이스 초기화 (처음부터 다시 시작할 때)

1. 데이터 모두 삭제:
```bash
docker-compose down -v
```

2. 다시 시작:
```bash
docker-compose up --build -d
```

3. (필요시) 시드 데이터 실행:
```bash
docker-compose exec api npm run db:seed
```

---

## 추가 정보

- **웹 서버**: nginx (Dockerfile로 빌드됨)
- **API 서버**: Node.js + Express
- **데이터베이스**: MySQL 8.0
- **ORM**: Prisma

자세한 코드는 `code-info.md` 참조
