# PFPlay Admin Console

PFPlay 서비스를 위한 가상 유저 시뮬레이션 관리 콘솔입니다.

## 🎯 주요 기능

### 1. 가상 유저 관리 (Virtual Users)
- 가상 유저 생성 (개별/대량)
- 유저 목록 조회 및 관리
- 유저 등급 관리 (Free, Premium, VIP)
- 파티룸 배정 상태 추적
- 대량 생성 (최대 100명)

### 2. 파티룸 관리 (Party Rooms)
- 파티룸 생성/삭제
- 유저 배정 및 제거 (멀티 셀렉트)
- DJ 큐 관리 (플레이리스트 + 트랙 선택)
- 룸 상태 모니터링

### 3. 시나리오 실행 (Scenarios)
- **채팅 시나리오**: 스크립트 기반 채팅 메시지 자동 생성
- **반응 시나리오**: 좋아요/잡기 반응 자동 생성

## 🔧 기술 스택

### Core
- **React** 18.3.1 - UI 라이브러리
- **TypeScript** 5 - 타입 안전성
- **Vite** 6.0.11 - 빌드 도구 및 개발 서버 (포트 3000)
- **React Router DOM** 7.1.3 - 클라이언트 라우팅

### UI & Styling
- **Tailwind CSS** 4.1.9 - 유틸리티 CSS 프레임워크
- **shadcn/ui** - Radix UI 기반 컴포넌트 라이브러리
- **Radix UI** - 헤드리스 UI 프리미티브
- **Lucide React** 0.454.0 - 아이콘 라이브러리
- **Class Variance Authority** 0.7.1 - 컴포넌트 variant 관리

### State Management
- **Zustand** 5.0.9 - 전역 상태 관리
- **Immer** - 불변 상태 업데이트
- **TanStack Query** 5.62.12 - 서버 상태 관리

### Forms & Validation
- **React Hook Form** 7.60.0 - 폼 상태 관리
- **Zod** 3.25.76 - TypeScript 우선 스키마 검증

### Utilities
- **date-fns** 4.1.0 - 날짜 유틸리티
- **Sonner** - 토스트 알림
- **clsx** 2.1.1 - 조건부 className 유틸리티
- **tailwind-merge** 3.3.1 - CSS 클래스 병합

## 🏗️ 프로젝트 구조

프로젝트는 **Feature-Sliced Design (FSD)** 아키텍처를 따릅니다.

```
src/
├── app/                    # 애플리케이션 초기화 및 레이아웃
│   └── layout.tsx         # 사이드바 네비게이션이 포함된 메인 레이아웃
│
├── pages/                  # 라우트별 페이지 컴포넌트
│   ├── users-page.tsx     # 가상 유저 관리 페이지
│   ├── rooms-page.tsx     # 파티룸 관리 페이지
│   └── scenarios-page.tsx # 시나리오 실행 페이지
│
├── widgets/                # 페이지 레벨 복합 컴포넌트
│   ├── users/ui/
│   │   └── users-widget.tsx
│   ├── rooms/ui/
│   │   └── rooms-widget.tsx
│   └── scenarios/ui/
│       └── scenarios-widget.tsx
│
├── features/               # 비즈니스 로직 기능 모듈
│   ├── users/ui/
│   │   ├── user-create-form.tsx
│   │   ├── users-list-table.tsx
│   │   └── bulk-actions.tsx
│   ├── rooms/ui/
│   │   ├── rooms-list-panel.tsx
│   │   ├── user-assignment-panel.tsx
│   │   ├── room-selector.tsx
│   │   └── dj-queue-panel.tsx
│   └── scenarios/ui/
│       ├── chat-scenario-panel.tsx
│       └── reaction-scenario-panel.tsx
│
├── shared/                 # 공유 리소스
│   ├── types/             # TypeScript 타입 정의
│   │   └── index.ts
│   ├── store/             # Zustand 상태 관리
│   │   ├── users-store.ts
│   │   └── rooms-store.ts
│   ├── hooks/             # 커스텀 React 훅
│   │   ├── use-chat-scenario.ts
│   │   └── use-reaction-scenario.ts
│   └── lib/               # 유틸리티 및 API 클라이언트
│       ├── api-client.ts
│       ├── constants.ts
│       ├── utils.ts
│       └── index.ts
│
├── components/
│   └── ui/                # shadcn/ui 컴포넌트
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
│
├── App.tsx                # 라우터 설정
├── main.tsx               # 애플리케이션 진입점
└── globals.css            # Tailwind를 포함한 전역 스타일
```

## 📐 FSD 레이어 구조

```
App Layer (app/)
    ↓
Pages Layer (pages/)
    ↓
Widgets Layer (widgets/)
    ↓
Features Layer (features/)
    ↓
Shared Layer (shared/)
```

**레이어 규칙:**
1. **app**: 애플리케이션 초기화, 라우팅, 전역 레이아웃
2. **pages**: 페이지별 위젯 조합
3. **widgets**: 독립적인 페이지 블록, 여러 feature 조합
4. **features**: 사용자 시나리오 구현, 비즈니스 로직
5. **shared**: 재사용 가능한 코드, 모든 레이어에서 사용 가능

각 레이어는 **하위 레이어만 의존**할 수 있으며, 순환 참조가 없습니다.

## 🏪 상태 관리

### useUsersStore

**State:**
```typescript
{
  users: VirtualUser[]
  isLoading: boolean
  error: string | null
}
```

**Actions:**
```typescript
fetchUsers(): Promise<void>           // 유저 목록 조회
createUser(userData): Promise<void>   // 유저 생성
deleteUser(userId): Promise<void>     // 유저 삭제
updateUser(userId, updates): void     // 유저 정보 수정
getUserById(userId): VirtualUser | undefined
getUsersInRoom(roomId): VirtualUser[] // 특정 룸의 유저 조회
getAvailableUsers(): VirtualUser[]    // 배정 가능한 유저 조회
```

### useRoomsStore

**State:**
```typescript
{
  rooms: PartyRoom[]
  selectedRoomId: string | null
  isLoading: boolean
  error: string | null
}
```

**Actions:**
```typescript
fetchRooms(): Promise<void>                      // 룸 목록 조회
createRoom(roomData): Promise<void>              // 룸 생성
deleteRoom(roomId): Promise<void>                // 룸 삭제
selectRoom(roomId): void                         // 룸 선택
getSelectedRoom(): PartyRoom | undefined         // 선택된 룸 조회
assignUsers(roomId, userIds): Promise<void>      // 유저 배정
removeUser(roomId, userId): Promise<void>        // 유저 제거
```

## 📦 도메인 타입

### VirtualUser
```typescript
{
  id: string
  username: string
  email: string
  profileImage?: string
  tier: "free" | "premium" | "vip"
  status: "active" | "inactive"
  isInRoom: boolean
  currentRoomId?: string
  createdAt: string
  lastActiveAt: string
}
```

### PartyRoom
```typescript
{
  id: string
  name: string
  maxCapacity: number
  currentUsers: number
  createdAt: string
  status: "active" | "inactive"
  userIds: string[]
}
```

### DJQueueEntry
```typescript
{
  id: string
  roomId: string
  userId: string
  playlistId: string
  trackId: string
  position: number
  createdAt: string
}
```

### ChatAssignment
```typescript
{
  userId: string
  username: string
  message: string
  order: number
}
```

### ReactionAssignment
```typescript
{
  userId: string
  username: string
  type: "like" | "grab"
  delay: number
}
```

## 🎣 커스텀 훅

### useChatScenario
채팅 스크립트 분석 및 유저 배치 로직을 관리합니다.

**기능:**
- 스크립트를 라인별로 파싱
- 룸 내 유저에게 순환 배정
- 배치 미리보기 제공
- 실행 시뮬레이션

**사용 예:**
```typescript
const {
  script,
  setScript,
  assignments,
  analyzeScript
} = useChatScenario()
```

### useReactionScenario
리액션 이벤트 자동 생성 로직을 관리합니다.

**기능:**
- 참여율 70% 자동 적용
- 좋아요/잡기 50:50 분배
- 1-15초 랜덤 딜레이
- 미리보기 후 실행

**사용 예:**
```typescript
const {
  assignments,
  generateAssignments,
  getLikeAssignments,
  getGrabAssignments
} = useReactionScenario()
```

## 🎬 시나리오 시스템

### 채팅 시나리오 워크플로우
1. 여러 줄의 채팅 스크립트 입력
2. `analyzeScript()` 호출하여 파싱
3. 룸 내 유저에게 순환 배정
4. 미리보기로 배정 결과 확인
5. 실행하여 시뮬레이션 수행

### 반응 시나리오 워크플로우
1. 룸과 유저 선택
2. `generateAssignments()` 호출
3. 자동으로 참여율 70% 적용
4. 좋아요/잡기 50:50 분배
5. 각 유저에게 1-15초 랜덤 딜레이
6. 미리보기 확인 후 실행

## 🚀 개발 환경 설정

### 사전 요구사항
- Node.js 18 이상
- npm 또는 pnpm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 실행
npm run lint
```

## 🔌 API 연동

### 현재 상태
현재는 **Mock 데이터**로 동작합니다:
- 가상 유저 15명 자동 생성
- 파티룸 2개 (하나는 12명 포함, 하나는 빈 룸)

### 실제 API 연동 방법

1. **환경 변수 설정**
```env
VITE_API_BASE_URL=http://localhost:8080
```

2. **API Client 활성화**
`src/shared/lib/api-client.ts`의 주석을 해제하세요.

3. **Store 수정**
각 store(`users-store.ts`, `rooms-store.ts`)의 API 호출 주석을 해제하고, Mock 데이터 코드를 제거하세요.

## 🎨 디자인 시스템

### 테마
- **기본**: 다크 모드 우선
- **영감**: TOSS 디자인 시스템

### 색상 시스템 (OKLCH)
```css
--primary: oklch(0.61 0.24 264)      /* Purple */
--background: oklch(0.11 0 0)        /* Near Black */
--foreground: oklch(0.98 0 0)        /* Near White */
--accent: oklch(0.89 0 0)            /* Gray */
--destructive: oklch(0.61 0.20 28)   /* Red */
```

### 타이포그래피
- **Font Family**: Geist (sans) & Geist Mono
- **Scale**: Tailwind 기본 스케일
- **Weight**: 400 (Regular), 500 (Medium), 600 (Semibold)

### Spacing & Radius
- **Base Radius**: 0.5rem
- **Spacing**: Tailwind 스케일 (4, 6, 8, 12, 16, 20, 24...)

## 📁 경로 별칭

TypeScript와 Vite는 다음 경로 별칭을 지원합니다:

```typescript
// @ = src/
import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import { useUsersStore } from "@/shared/store/users-store"
```

**tsconfig.json 설정:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**중요:** `@/` 별칭을 사용하려면 파일이 `src/` 폴더 내부에 위치해야 합니다.

## 🔄 데이터 플로우 예시

### 유저 배정 워크플로우
```
UserAssignmentPanel (UI)
    ↓
User selects room & users
    ↓
assignUsers() action called
    ↓
useRoomsStore (Zustand)
    ↓
State updated:
  - room.userIds += selected users
  - room.currentUsers += count
    ↓
useUsersStore updated:
  - user.isInRoom = true
  - user.currentRoomId = roomId
    ↓
UI re-renders
    ↓
Toast notification (Sonner)
```

## 📝 코드 컨벤션

### 파일명
- 컴포넌트: `kebab-case.tsx`
- 스토어: `feature-store.ts`
- 훅: `use-feature-name.ts`
- 타입: `index.ts`

### Import 순서
```typescript
// 1. React 및 외부 라이브러리
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

// 2. 내부 컴포넌트
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 3. 아이콘
import { Plus, Trash2 } from "lucide-react"

// 4. 스토어 및 훅
import { useUsersStore } from "@/shared/store/users-store"
import { useChatScenario } from "@/shared/hooks/use-chat-scenario"

// 5. 유틸리티
import { cn, formatDate } from "@/shared/lib/utils"

// 6. 타입
import type { VirtualUser } from "@/shared/types"
```

### 컴포넌트 구조
```typescript
"use client" // 필요한 경우만

// Imports

export function ComponentName() {
  // 1. Hooks
  const store = useStore()
  const [state, setState] = useState()

  // 2. Derived state
  const computed = useMemo(() => ...)

  // 3. Handlers
  const handleClick = () => { ... }

  // 4. Effects
  useEffect(() => { ... }, [])

  // 5. Render
  return (...)
}
```

## 🧪 Mock 데이터

개발 환경에서 자동 생성되는 Mock 데이터:

### 가상 유저 (15명)
- Free tier: 8명
- Premium tier: 4명
- VIP tier: 3명
- 일부는 룸에 배정됨

### 파티룸 (2개)
- "메인 파티룸": 12명 유저 포함, 최대 20명
- "VIP 라운지": 빈 룸, 최대 10명

## 🔍 주요 디렉토리 설명

### `/app` - Application Layer
애플리케이션 전역 설정과 레이아웃을 관리합니다.
- 라우팅 구성
- 전역 프로바이더
- 메인 레이아웃 (사이드바 네비게이션)

### `/pages` - Pages Layer
라우트별 페이지를 정의합니다. Widget을 조합하여 구성됩니다.
- 얇은 래퍼 역할
- 라우트당 하나의 페이지

### `/widgets` - Widgets Layer
페이지 수준의 복합 컴포넌트입니다.
- 여러 Feature 조합
- 탭 기반 인터페이스
- 독립적이고 재사용 가능한 블록

### `/features` - Features Layer
비즈니스 로직이 포함된 기능 단위 컴포넌트입니다.
- 사용자 대면 기능
- UI만 포함, 도메인 로직은 shared에
- Feature별로 조직화

### `/shared` - Shared Layer
모든 레이어에서 사용 가능한 공유 리소스입니다.
- **types**: 도메인 타입 정의
- **store**: Zustand 상태 관리
- **hooks**: 재사용 가능한 커스텀 훅
- **lib**: 유틸리티 함수 및 API 클라이언트

### `/components/ui` - UI Components
shadcn/ui 기반의 재사용 가능한 UI 컴포넌트입니다.
- Radix UI 래퍼
- Tailwind로 스타일링
- Variant 시스템

## 🎯 핵심 아키텍처 패턴

### 1. FSD 레이어 분리
- 명확한 의존성 방향: App → Pages → Widgets → Features → Shared
- 순환 의존성 없음
- Feature는 다른 Feature에 의존할 수 없음

### 2. Zustand 스토어 패턴
- `/shared/store`에 중앙 집중화
- Devtools 미들웨어
- Mock 데이터로 개발
- 실제 API 연동 준비 완료

### 3. UI 컴포넌트 조합
- shadcn/ui 기본 컴포넌트
- Feature 컴포넌트가 UI 요소 조합
- Widget이 Feature 조합
- Page가 Widget 사용

### 4. 커스텀 훅 추상화
- 비즈니스 로직을 훅으로 분리
- 컴포넌트 간 재사용
- TypeScript로 타입 안전성
- 테스트 가능한 로직 분리

## 📄 라이선스

MIT

## 🤝 기여

이슈 및 Pull Request를 환영합니다.

---

Built with ❤️ using React + Vite + Tailwind CSS
