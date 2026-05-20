# 세명컴고 게임과 포털 - 모바일 앱 빌드 가이드

## 구조

```
frontend/
├── android/          ← Android 네이티브 프로젝트 (Android Studio)
├── ios/              ← iOS 네이티브 프로젝트 (Xcode, macOS 필요)
├── dist/             ← 웹 빌드 결과물 (cap sync 시 앱에 복사됨)
├── .env              ← 웹 개발용 환경 변수
├── .env.mobile       ← 모바일 앱 빌드용 환경 변수
└── capacitor.config.json
```

## 사전 요구사항

| 플랫폼  | 필요한 도구                         |
|---------|-------------------------------------|
| Android | Android Studio + JDK 17+            |
| iOS     | Xcode 14+ (macOS 전용)              |
| 공통    | Node.js 18+, npm                    |

## 환경 변수 설정

`.env.mobile` 파일에서 백엔드 서버 주소를 설정하세요:

```env
VITE_API_BASE_URL=http://10.26.138.120:4000/api
```

> **주의:** 실제 배포 서버 IP/도메인으로 변경해야 합니다.

## 빌드 방법

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 모바일 앱 빌드 (한 번에)

```bash
npm run build:mobile
```

이 명령어는 다음을 순서대로 실행합니다:
1. `.env.mobile` 환경 변수로 Vite 웹 빌드
2. `cap sync` — 빌드 결과를 Android/iOS 프로젝트에 동기화

### 3. Android Studio에서 열기

```bash
npm run cap:android
```

Android Studio가 열리면:
1. **Build > Generate Signed Bundle / APK** 선택
2. APK 또는 App Bundle 생성
3. 기기에 설치

### 4. Xcode에서 열기 (macOS만 가능)

```bash
npm run cap:ios
```

## 개발 워크플로우

웹 코드를 수정할 때마다:

```bash
cd frontend
npm run build        # 웹 빌드
npx cap sync         # Android/iOS에 동기화
```

또는 모바일 빌드 한 번에:

```bash
npm run build:mobile
```

## 백엔드 CORS 설정

모바일 앱은 `capacitor://localhost`에서 요청을 보냅니다.
백엔드의 `CORS_ORIGINS` 환경 변수에 다음이 포함되어야 합니다:

```
capacitor://localhost,https://localhost,http://localhost
```

현재 기본값에 이미 포함되어 있습니다.

## 앱 아이디

- **App ID**: `com.semyeong.gameweb`
- **App Name**: `세명컴고 게임과 포털`
