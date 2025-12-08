# Walk with Mung - 프로젝트 구조

유기견 보호센터 산책 예약 시스템

## 📁 프로젝트 구조

```
src/
├── App.tsx                    # 메인 앱 컴포넌트 (라우팅 설정)
├── App.css                    # 전역 스타일
├── main.tsx                   # 앱 진입점
├── index.css                  # 글로벌 CSS 리셋
│
├── components/                # 재사용 가능한 컴포넌트
│   ├── Header.tsx            # 헤더 컴포넌트
│   ├── Header.css
│   ├── DogCard.tsx           # 유기견 카드 컴포넌트
│   ├── DogCard.css
│   ├── ReservationModal.tsx  # 예약 모달 컴포넌트
│   ├── ReservationModal.css
│   └── index.ts              # 컴포넌트 export
│
├── pages/                     # 페이지 컴포넌트
│   ├── HomePage.tsx          # 메인 홈페이지
│   ├── HomePage.css
│   ├── RoomPage.tsx          # Room 페이지
│   ├── AdminPage.tsx         # 관리자 페이지
│   ├── MapPage.tsx           # 지도 페이지
│   ├── ExcelMapPage.tsx      # Excel 지도 페이지
│   ├── MemberXlsPage.tsx     # 회원 Excel 페이지
│   ├── MemberListPage.tsx    # 회원 목록 페이지
│   ├── LocationListPage.tsx  # 위치 목록 페이지
│   └── index.ts              # 페이지 export
│
├── layouts/                   # 레이아웃 컴포넌트
│   ├── MainLayout.tsx        # 메인 레이아웃 (Header + Outlet)
│   └── MainLayout.css
│
├── context/                   # Context API
│   └── SocketProvider.tsx    # Socket Context (준비 중)
│
└── types/                     # TypeScript 타입 정의
    └── index.ts              # Dog, WalkStatus 타입
```

## 🚀 라우팅 구조

```tsx
/ (MainLayout)
├── / (HomePage)                          # 메인 홈페이지
├── /rooms (RoomPage)                     # Room 목록
├── /rooms/:roomUid (RoomPage)            # 특정 Room
├── /rooms/admin (AdminPage)              # 관리자 페이지
├── /mapV1 (MapPage)                      # 지도 V1
├── /map-excel (ExcelMapPage)             # Excel 지도
├── /member-excel (MemberXlsPage)         # 회원 Excel
├── /member-list (MemberListPage)         # 회원 목록
├── /location-list (LocationListPage)     # 위치 목록
├── /member                               # 회원 관리 (준비 중)
├── /schedule                             # 일정 관리 (준비 중)
└── /hello                                # Hello 페이지 (준비 중)
```

## 🎯 주요 기능

### HomePage
- 유기견 프로필 카드 표시
- 상태별 필터링 (전체/예약 가능/산책 중/산책 완료)
- 예약 가능한 유기견 클릭 시 예약 모달 표시
- 당일 예약 시 산책 상태 확인

### Components
- **Header**: 네비게이션 메뉴
- **DogCard**: 유기견 정보 카드
- **ReservationModal**: 산책 예약 모달

### Types
- **WalkStatus**: 'available' | 'walking' | 'completed'
- **Dog**: 유기견 정보 인터페이스

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트
npm run lint
```

## 📦 주요 의존성

- React 19.2.0
- React Router DOM
- TypeScript
- Vite
