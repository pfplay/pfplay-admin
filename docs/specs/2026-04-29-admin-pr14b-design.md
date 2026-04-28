# PR 14b Design — 어드민 회원/파티룸 read-only (목록 + 상세 + 필터/정렬/페이징)

**작성일**: 2026-04-29
**대상 레포**: `pfplay-admin` (별 레포)
**시리즈 위치**: pfplay-platform admin-platform 시리즈 PR 14의 두 번째 sub-PR (14b)
**의존**: PR 14a (인프라: `shared/api/http.ts`, `entities/session`, FSD 컨벤션, vitest+RTL+msw), 백엔드 PR 12b1 (`AdminMemberQueryController`), 백엔드 PR 8 (`AdminPartyroomQueryController`)
**백엔드 변경**: 0 (cross-repo 제약. 기존 endpoint 재사용)

## 1. 목적과 비목적

### 1.1 목적

- 어드민이 가입 회원(`member` 테이블, FM/AM)을 목록/상세로 조회할 수 있다.
- 어드민이 파티룸(`partyroom` 테이블)을 목록/상세로 조회할 수 있다.
- 백엔드가 노출하는 모든 필터·정렬·페이징을 UI에 노출한다 (어드민 ad-hoc 조회 핵심 가치).
- Filter 상태는 URL search params를 single source of truth로 두어 북마크/공유/새로고침이 안전하다.
- 14a에서 정착된 인프라(`shared/api/http.ts`, `entities/session`, ProtectedRoute, FSD 컨벤션, vitest+RTL+msw)를 그대로 재사용하며, demo 슬라이스(`entities/{user,room}`, `features/{users,rooms}`, `widgets/{users,rooms}`)를 backend DTO 정합 슬라이스로 교체한다.
- 사이드바의 "가상 유저"(disabled), "파티룸"(disabled) 두 메뉴를 "회원"(`/members`), "파티룸"(`/partyrooms`)으로 enable한다.

### 1.2 비목적 (14b 범위 외)

- **Mutation** — tier 변경(`AdminMemberTierCommandController`), withdraw(`AdminMemberWithdrawCommandController`), 파티룸 강제 종료/penalty/admin action(`AdminPartyroomCommandController`)은 backend endpoint가 이미 존재하지만 14c 이후 별도 chunk.
- **Guest 어드민 화면** — `guest` 테이블은 별도 entity(`GuestData`)이며 backend에 어드민 조회 endpoint(`/admin/guests` 등)가 부재. PR-14b는 `member` 테이블만 다룸. 14c 이후 backend + frontend 한 묶음으로 분리.
- **Avatar / 신고 / Scenario 어드민 화면** — 14c/14d 또는 별 PR.
- **e2e Playwright, Storybook, 시각적 회귀, axe-core a11y, i18n, 다국어** — 14a §13에서 미해결로 박혀 있고 14b도 상속.
- **모바일/Sheet 반응형** — 어드민은 desktop-first.

## 2. 백엔드 ground-truth (PR 12b1 / PR 8 read 결과)

### 2.1 회원 (`member` 테이블)

| 항목 | 값 / 위치 |
|---|---|
| List endpoint | `GET /api/v1/admin/members` (`AdminMemberQueryController`) |
| Detail endpoint | `GET /api/v1/admin/members/{memberId}` |
| 권한 가드 | `@adminAuth.isAdmin()` (SUPER_ADMIN + ADMIN 둘 다 통과) |
| List 응답 envelope | `ApiCommonResponse<Page<AdminMemberSummaryResponse>>` (data wrap 있음) |
| List query params | `email` (max 255), `tier` (`AuthorityTier` enum: `FM`/`AM`/`GT`), `joined_from` (LocalDate), `joined_to` (LocalDate), `page` (default 0, min 0), `size` (default 50, 1~200), `sort` (`created_at_desc`/`created_at_asc`/`last_activity_desc`) |
| List cross-field 검증 | `joined_from > joined_to` → 400 `INVALID_LIST_QUERY` |
| Sort 화이트리스트 | controller `@Pattern(regexp = "created_at_desc\|created_at_asc\|last_activity_desc")` |
| List size cap | 200 (admin DOS 방어) |
| `AdminMemberSummaryResponse` | `memberId`, `userAccountId`, `email`, `providerType`, `nickname`, `authorityTier`, `lastLoginAt`, `createdAt`, `withdrawn`(derived), `withdrawnAt` |
| Detail 응답 envelope | `ApiCommonResponse<AdminMemberDetailResponse>` |
| `AdminMemberDetailResponse` | `memberId`, `userAccount: UserAccountSummary`, `profile: MemberProfileSummary`, `authorityTier`, `createdAt`, `recentActivityLog: List<RecentActivityLogItem>` (top 30 by occurredAt desc) |
| Detail 404 errorCode | `AdminMemberException.MEMBER_NOT_FOUND` |
| List 400 errorCode | `AdminMemberException.INVALID_LIST_QUERY` |
| `AuthorityTier` enum | `FM`(FULL_MEMBER) / `AM`(ASSOCIATE_MEMBER) / `GT`(GUEST). **member 테이블은 가입 시 AM 시작 → wallet 등록 시 FM 자동 승격. GT는 별도 `guest` 테이블의 tier이며 member 테이블에는 admin 강등(`changeTier(GT)`) edge case에만 등장.** |
| `ProviderType` enum | `GOOGLE`, `TWITTER`, `LOCAL`. **`LOCAL`은 admin local login + virtual users용** — 어드민 본인 + 운영용 가상 유저 row가 `LOCAL`로 표시되므로 list/detail UI가 첫날부터 처리해야 함. (위치: `common/.../security/enums/ProviderType.java`) |

### 2.2 파티룸 (`partyroom` 테이블)

| 항목 | 값 / 위치 |
|---|---|
| List endpoint | `GET /api/v1/admin/partyrooms` (`AdminPartyroomQueryController`) |
| Detail endpoint | `GET /api/v1/admin/partyrooms/{partyroomId}` |
| 권한 가드 | `@adminAuth.isAdmin()` |
| List 응답 envelope | `Page<AdminPartyroomListItemResponse>` (**raw — `ApiCommonResponse` wrap 없음**. 14b 시점 backend 비대칭. §13에 future polish로 통일 backfill) |
| List query params | `status` (`PartyroomStatus` enum), `stageType` (`StageType` enum), `createdFrom` (LocalDateTime ISO), `createdTo` (LocalDateTime ISO), `host` (String — `email LIKE '%q%' OR nickname LIKE '%q%'` 부분일치, 양 필드 동시 검색. backend 내부 DTO 필드명은 `hostQuery`, controller param 이름은 `host`), `page`, `size`, `sort` |
| **Status default 동작** | **`status=null` → TERMINATED 자동 제외** (ACTIVE + SUSPENDED만 반환, admin usability Risk #6 backend 결정). 명시적 `status=TERMINATED`로만 종료 룸 조회 가능. UI는 status dropdown 옆에 info 힌트 |
| Sort default | `createdAt,desc` (Spring Pageable 형태) |
| Sort 화이트리스트 | `createdAt`, `lastActivityAt`, `crewCount`, `title`, `hostNickname` (5개. 위치: `AdminPartyroomQueryRepositoryImpl.applySort`). `hostNickname`은 `Bio.nickname` cast string. unsorted 시 `createdAt desc` |
| Sort 화이트리스트 위반 | repo `IllegalArgumentException` → controller 로컬 변환 400 `ADM-PR-001 "Unsupported sort field: <name>"` |
| List size cap | 200 (어드민 DOS 방어) |
| `AdminPartyroomListItemResponse` | `partyroomId`, `title`, `stageType`, `hostUserAccountId`, `hostNickname`, `crewCount`, `djCount`, `playbackActivated`, `status`, `displayFlag`, `createdAt`, `lastActivityAt` |
| Detail 응답 envelope | `AdminPartyroomDetailResponse` (raw, wrap 없음 동일) |
| `AdminPartyroomDetailResponse` 필드 | `partyroomId`, `title`, `status`, `displayFlag`, `hostUserAccountId`, `hostNickname`, `hostEmail`, `crewCount`, `lastActivityAt`, `stageType`, `playback: PlaybackSummary`, `crews: List<CrewSummary>`, `djQueue: List<DjSummary>`, `recentPenalties: List<PenaltySummary>` (top 5), `recentReports: List<ReportSummary>` (PR-13 이후 채워짐), `recentAdminActions: List<AdminActionSummary>` |
| `PlaybackSummary` | `activated`, `currentTrackName`(nullable), `currentDjCrewId`(nullable) — playlist 모듈 query port 부재로 `currentTrackName`/`playlistName` 일부 null |
| Detail 404 errorCode | `NOT_FOUND_ROOM` |
| `PartyroomStatus` enum | `ACTIVE`, `SUSPENDED`, `TERMINATED` (위치: `app/.../party/domain/enums/PartyroomStatus.java`) |
| `StageType` enum | `MAIN`, `GENERAL` |
| 기타 enum | `DisplayFlag`, `GradeType`, `PenaltyType`, `PartyroomAdminActionType` — detail 뱃지/section 라벨에서만 쓰이고 filter 안 함. G7/G8에서 코드 grep으로 확정 후 §12 backfill |

### 2.3 인증/인가 (14a 인프라 그대로)

- 쿠키 기반 (`AdminAccessToken` httpOnly + `SharedSessionToken`)
- CSRF: `XSRF-TOKEN` 쿠키 ↔ `X-XSRF-TOKEN` 헤더 echo. **GET/HEAD는 CSRF 면제** — 14b는 모두 GET이라 CSRF 부담 없음
- Origin Guard: `AdminOriginGuardFilter` (dev=`localhost:3000`)
- 401 인터셉터: `http.ts` 단에서 `useSessionStore.clear()` + `/login` hard redirect

## 3. 아키텍처

### 3.1 FSD 레이어 매핑

```
src/
├── shared/
│   ├── api/
│   │   ├── http.ts                ← 14a 그대로
│   │   ├── error.ts               ← 14a 그대로
│   │   ├── csrf.ts                ← 14a 그대로
│   │   └── page.ts                ← NEW: Spring Page<T> + ApiCommonResponse<T> + unwrap()
│   ├── config/                    ← 14a 그대로
│   └── lib/
│       ├── utils.ts               ← 14a 그대로
│       └── url-state.ts           ← NEW: URL search params ↔ form state 동기화 helper
├── entities/
│   ├── session/                   ← 14a 기존
│   ├── member/                    ← NEW
│   │   ├── model/types.ts         ← AdminMemberSummary, AdminMemberDetail, ProviderType, AuthorityTier (FM/AM, GT는 union 포함하되 코멘트로 edge case 명시)
│   │   └── index.ts
│   └── partyroom/                 ← NEW
│       ├── model/types.ts         ← AdminPartyroomListItem, AdminPartyroomDetail + sub records (PlaybackSummary, CrewSummary 등) + enum (PartyroomStatus 등)
│       └── index.ts
├── features/
│   ├── login/                     ← 14a 기존
│   ├── change-password/           ← 14a 기존
│   ├── logout/                    ← 14a 기존
│   ├── members/                   ← NEW
│   │   ├── api/
│   │   │   ├── members-api.ts     ← http() 호출 + unwrap. listMembers(filters) / getMemberDetail(id)
│   │   │   ├── use-members-list.ts ← useQuery, queryKey=["members","list",filters]
│   │   │   └── use-member-detail.ts ← useQuery, queryKey=["members","detail",id]
│   │   ├── model/
│   │   │   └── filter-schema.ts   ← zod: email/tier/joined_from/joined_to/sort/page/size + URL parse/serialize
│   │   └── ui/
│   │       ├── members-filter-form.tsx
│   │       └── members-table.tsx
│   └── partyrooms/                ← NEW
│       ├── api/
│       │   ├── partyrooms-api.ts
│       │   ├── use-partyrooms-list.ts
│       │   └── use-partyroom-detail.ts
│       ├── model/
│       │   └── filter-schema.ts
│       └── ui/
│           ├── partyrooms-filter-form.tsx
│           └── partyrooms-table.tsx
├── widgets/
│   ├── protected-route.tsx        ← 14a 기존
│   ├── members-list.tsx           ← NEW: filter-form + table + pagination 조립
│   ├── members-detail.tsx         ← NEW: 헤더 + section 카드들 + activity log
│   ├── partyrooms-list.tsx        ← NEW
│   └── partyrooms-detail.tsx      ← NEW: 헤더 + 7개 section 카드
├── pages/
│   ├── login-page.tsx             ← 14a 기존
│   ├── change-password-page.tsx   ← 14a 기존
│   ├── dashboard-page.tsx         ← 14a 기존
│   ├── scenarios-page.tsx         ← 14a 기존 (demo, 14d 이후 처리)
│   ├── members-page.tsx           ← NEW (`/members`)
│   ├── member-detail-page.tsx     ← NEW (`/members/:memberId`)
│   ├── partyrooms-page.tsx        ← NEW (`/partyrooms`)
│   └── partyroom-detail-page.tsx  ← NEW (`/partyrooms/:partyroomId`)
└── app/
    └── layout.tsx                 ← 사이드바 enable + 라벨 변경 + nav 4개 (대시보드/회원/파티룸/시나리오)
```

### 3.2 삭제 대상 (G1 chunk)

- `entities/user/` 전체 (mock `VirtualUser`)
- `entities/room/` 전체 (mock `PartyRoom`)
- `features/users/` 전체 (`bulk-actions.tsx`, `user-create-form.tsx`, `users-list-table.tsx`)
- `features/rooms/` 전체 (`dj-queue-panel.tsx`, `room-selector.tsx`, `rooms-list-panel.tsx`, `user-assignment-panel.tsx`)
- `widgets/users/`, `widgets/rooms/` 전체
- `pages/users-page.tsx`, `pages/rooms-page.tsx`
- App.tsx 라우트 `/users`, `/rooms` 제거
- demo `src/shared/lib/api-client.ts` — G1에서 grep `from "@/shared/lib/api-client"` 후 사용처 0이면 삭제, 잔존(`scenarios`/`dj-queue`/`playlist`)이면 보존하고 §12에 reality 기록

### 3.3 라우트 (App.tsx)

| 경로 | 페이지 | 가드 |
|---|---|---|
| `/login` | LoginPage | public |
| `/password/change` | ChangePasswordPage | ProtectedRoute + mustChange gate |
| `/` | DashboardPage | ProtectedRoute + Layout |
| `/members` | MembersPage | ProtectedRoute + Layout |
| `/members/:memberId` | MemberDetailPage | ProtectedRoute + Layout |
| `/partyrooms` | PartyroomsPage | ProtectedRoute + Layout |
| `/partyrooms/:partyroomId` | PartyroomDetailPage | ProtectedRoute + Layout |
| `/scenarios` | ScenariosPage | ProtectedRoute + Layout (demo 잔존, 14d에서 처리) |

### 3.4 사이드바 (`app/layout.tsx`)

총 4개 nav 유지 (변경: 1행 relabel + 경로 변경 + 1행 enable + 1행 enable+경로 변경).

| # | 14a 라벨/경로/상태 | 14b 라벨/경로/상태 | 아이콘 |
|---|---|---|---|
| 1 | "대시보드" / `/` / enabled | "대시보드" / `/` / enabled | LayoutDashboard |
| 2 | "가상 유저" / `/users` / disabled | **"회원" / `/members` / enabled** | Users |
| 3 | "파티룸" / `/rooms` / disabled | **"파티룸" / `/partyrooms` / enabled** | DoorOpen |
| 4 | "시나리오" / `/scenarios` / enabled | "시나리오" / `/scenarios` / enabled | PlaySquare |

## 4. Page<T> + ApiCommonResponse 처리

```ts
// shared/api/page.ts
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number      // 0-based
  size: number
  first: boolean
  last: boolean
  empty: boolean
  numberOfElements: number
}

export interface ApiCommonResponse<T> {
  data: T
}

export const unwrap = <T>(res: ApiCommonResponse<T>): T => res.data
```

### 4.1 wrap 비대칭 처리

```ts
// features/members/api/members-api.ts
import { http } from "@/shared/api/http"
import type { ApiCommonResponse, Page } from "@/shared/api/page"
import { unwrap } from "@/shared/api/page"

export async function listMembers(query: MembersListQuery): Promise<Page<AdminMemberSummary>> {
  const res = await http<ApiCommonResponse<Page<AdminMemberSummary>>>(
    `/api/v1/admin/members?${serializeMembersQuery(query)}`,
  )
  return unwrap(res)
}

// features/partyrooms/api/partyrooms-api.ts
export async function listPartyrooms(query: PartyroomsListQuery): Promise<Page<AdminPartyroomListItem>> {
  return http<Page<AdminPartyroomListItem>>(
    `/api/v1/admin/partyrooms?${serializePartyroomsQuery(query)}`,
  )
  // raw — backend가 ApiCommonResponse wrap 안 함
}
```

backend 비대칭은 §13.2 future polish로 백엔드 일괄 통일 backfill — 통일 후 14b는 `unwrap()` 일괄 적용 한 줄 변경.

## 5. members 도메인 — list + detail + filter

### 5.1 List query 직렬화

```ts
// features/members/model/filter-schema.ts
import { z } from "zod"

export const TierEnum = z.enum(["FM", "AM", "GT"])

export const membersListQuerySchema = z.object({
  email: z.string().max(255).optional(),
  tier: TierEnum.optional(),
  joined_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),  // ISO date
  joined_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.enum(["created_at_desc", "created_at_asc", "last_activity_desc"]).default("created_at_desc"),
}).superRefine((v, ctx) => {
  if (v.joined_from && v.joined_to && v.joined_from > v.joined_to) {
    ctx.addIssue({ code: "custom", path: ["joined_to"], message: "가입일 종료가 시작보다 빨라요" })
  }
})

export type MembersListQuery = z.infer<typeof membersListQuerySchema>
```

`serializeMembersQuery(q): string` — `URLSearchParams` 빌드 후 빈/undefined 값은 drop. `joined_from`/`joined_to`는 backend 필드명 그대로(`@RequestParam(name="joined_from")`).

### 5.2 react-query hook

```ts
export function useMembersList(query: MembersListQuery) {
  return useQuery({
    queryKey: ["members", "list", query],
    queryFn: () => listMembers(query),
    keepPreviousData: true,   // 페이지네이션 점프 시 이전 결과 유지
    staleTime: 30_000,
  })
}

export function useMemberDetail(memberId: number) {
  return useQuery({
    queryKey: ["members", "detail", memberId],
    queryFn: () => getMemberDetail(memberId),
    staleTime: 30_000,
  })
}
```

### 5.3 Detail composition

`AdminMemberDetailResponse`의 top-level 6개 멤버 (`memberId`, `userAccount: UserAccountSummary`, `profile: MemberProfileSummary`, `authorityTier`, `createdAt`, `recentActivityLog: List<RecentActivityLogItem>`)를 widget이 다음 5개 카드로 분할:
1. **Header** — `memberId`, 닉네임(profile.nickname), withdrawn 뱃지(있으면 `withdrawnAt` 툴팁) — list에서 받아와 prefetch 가능
2. **UserAccount 카드** — `userAccount.email` / `userAccount.providerType` (`GOOGLE`/`TWITTER`/`LOCAL`) / `userAccount.userAccountId` / `userAccount.createdAt`
3. **Profile 카드** — `profile.nickname` / `profile.introduction` (avatar/wallet 필드는 14c 이후)
4. **Tier + meta** — `authorityTier` 뱃지 (FM/AM, GT는 강등 edge — `tier=GT`인 row면 "강등" 부가 라벨) + `createdAt`
5. **Recent activity log** — `recentActivityLog` top 30 table (`occurredAt` / `type` / `summary`). 빈 상태 시 "최근 활동 없음"

## 6. partyrooms 도메인 — list + detail + filter

### 6.1 List query 직렬화

```ts
// features/partyrooms/model/filter-schema.ts
export const PartyroomStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "TERMINATED"])
export const StageTypeEnum = z.enum(["MAIN", "GENERAL"])

// backend 화이트리스트 = createdAt | lastActivityAt | crewCount | title | hostNickname × asc/desc
export const PartyroomSortEnum = z.enum([
  "createdAt,desc", "createdAt,asc",
  "lastActivityAt,desc", "lastActivityAt,asc",
  "crewCount,desc", "crewCount,asc",
  "title,desc", "title,asc",
  "hostNickname,desc", "hostNickname,asc",
])

export const partyroomsListQuerySchema = z.object({
  status: PartyroomStatusEnum.optional(),
  stageType: StageTypeEnum.optional(),
  createdFrom: z.string().datetime().optional(),  // ISO datetime
  createdTo: z.string().datetime().optional(),
  host: z.string().max(50).optional(),  // backend = email LIKE OR nickname LIKE 부분일치. 클라 self-limit 50자
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(200).default(50),
  sort: PartyroomSortEnum.default("createdAt,desc"),
}).superRefine((v, ctx) => {
  if (v.createdFrom && v.createdTo && v.createdFrom > v.createdTo) {
    ctx.addIssue({ code: "custom", path: ["createdTo"], message: "생성일 종료가 시작보다 빨라요" })
  }
})
```

**필터 form 라벨/힌트:**
- `host` 필드 라벨: "호스트 (이메일 또는 닉네임)" + placeholder "부분일치"
- `status` dropdown 옆: info 아이콘 + 툴팁 "기본 보기는 종료 룸을 제외합니다. 종료 룸을 보려면 'TERMINATED' 선택."
- `sort` dropdown: 위 10개 옵션을 한국어 라벨로 매핑 ("최신순"/"오래된순"/"마지막 활동 ↓" 등)

### 6.2 Detail composition

`AdminPartyroomDetailResponse`의 top-level 9개 스칼라 + `playback` 1개 record + 5개 sub-list (총 15개 멤버)를 widget이 다음 8개 카드로 분할:
1. **Header** — `partyroomId` / `title` / `status` 뱃지 / `displayFlag` 뱃지 + "← 목록으로" 링크
2. **Top-level meta** — `stageType` / host (`hostNickname`/`hostEmail`/`hostUserAccountId`) / `crewCount` / `lastActivityAt`
3. **Playback** — `playback.activated` / `playback.currentTrackName` (null fallback "-") / `playback.currentDjCrewId`
4. **Crews** — table (`crewId` / `memberId` / `gradeType` / `nickname` / `enteredAt`)
5. **DJ queue** — table (`djId` / `crewId` / `playlistName` (null fallback "-") / `orderNumber`)
6. **Recent penalties** — top 5 (`id` / `crewId` / `penaltyType` / `punisherType` / `reason` / `date`). 빈 상태 "최근 페널티 없음"
7. **Recent reports** — (`id` / `category` / `status` / `reporterUserAccountId` / `createdAt`) PR-13 이후 데이터. 빈 상태 "신고 내역 없음"
8. **Recent admin actions** — (`actionId` / `actionType` / `administratorId` / `occurredAt`). 빈 상태 "최근 관리자 액션 없음"

## 7. URL ↔ filter 동기화

**Single source of truth: URL search params.**

```tsx
function MembersPage() {
  const [params, setParams] = useSearchParams()
  const parsed = membersListQuerySchema.safeParse(Object.fromEntries(params))
  if (!parsed.success) {
    // invalid 필드만 drop → URL replace로 정정 + toast 1회
    const cleaned = stripInvalidParams(params, parsed.error)
    setParams(cleaned, { replace: true })
    toast.error("필터 일부가 잘못돼 무시했어요")
    return null  // 다음 렌더에서 cleaned 기반으로 재진입
  }
  const { data, isLoading, error } = useMembersList(parsed.data)
  ...
}
```

**Form ↔ URL 동기화:**
- text 필드 (email, host): `useDebouncedCallback(300ms)` 후 `setParams(prev => ({ ...prev, email: value, page: 0 }))` (필터 변경 시 page=0 reset)
- dropdown / sort / date: 즉시 `setParams`
- pagination: 즉시 `setParams({ ...query, page: nextPage })`
- 초기화 버튼: `setParams({})`

**Page reset 규칙:**
- `email`/`tier`/`joined_*`/`status`/`stageType`/`host`/`createdFrom`/`createdTo`/`sort` 변경 → `page=0`로 reset
- pagination만 변경 → 다른 필드 유지

## 8. 컴포넌트 / 페이지 분해

(§3.1 디렉토리 구조와 §5/§6 detail composition 참조)

### 8.1 Empty / Loading / Error 패턴

| 상태 | 표시 |
|---|---|
| Loading (initial) | shadcn `Skeleton` (table은 row 5개 모양, detail은 카드 placeholder) |
| Loading (refetch) | 기존 데이터 + 우상단 inline spinner (`isFetching && !isLoading`) |
| Empty | 아이콘 + 메시지 + 부가 액션 ("필터를 초기화해 보세요" 버튼) |
| 401 | `http.ts` 단에서 처리 — 페이지에 도달하지 않음 |
| 403 | inline ("이 화면을 볼 권한이 없습니다") + sonner toast |
| 400 (`INVALID_LIST_QUERY` / `ADM-PR-001`) | sonner toast (errorCode + message) — 정상 운용에선 frontend zod가 미리 차단 |
| 404 (`MEMBER_NOT_FOUND` / `NOT_FOUND_ROOM`) | inline ("존재하지 않는 회원/파티룸") + "목록으로" 버튼 |
| 5xx | inline + toast + react-query `retry: 1` (network error만 retry, `ApiError 5xx`는 retry 안 함 — `retry: (n,e) => !(e instanceof ApiError) && n < 1`). list/detail 모두 동일. `keepPreviousData: true`와 충돌 없음(retry는 새 fetch 사이클 시작 전, previous data 유지는 그 위 layer) |

### 8.2 shadcn 컴포넌트 의존

- 필수: `Table`, `Select`, `Input`, `Button`, `Card`, `Badge`, `Skeleton`, `Calendar` + `Popover` (date range), `Pagination` (custom)
- G1에서 `components/ui/` 디렉토리 grep 후 누락분만 추가 설치

## 9. 에러 / Edge / 미래 호환

### 9.1 enum unknown 값 처리

backend가 enum을 추가/변경할 때 frontend가 즉시 깨지지 않도록:
- zod schema는 `.catch(undefined)` 패턴 (parse 실패 시 undefined로 fallback) — 옵셔널 필드만 적용
- 렌더 단에서 unknown 값은 raw string fallback ("미정의: XYZ") + `console.warn`
- `tier=GT`가 list에 등장하면 (admin 강등 edge case) — UI는 `GT` 뱃지 + 툴팁 ("게스트로 강등된 회원")

### 9.2 LocalDateTime 타임존

- backend가 `LocalDateTime`(타임존 없음)을 반환 — 14b는 KST 가정으로 그대로 표시. footer 1회 표기 ("시간은 KST 기준")
- 14a §13.1 future polish "OffsetDateTime 통일"이 적용되면 14b도 일괄 교체

### 9.3 Pagination edge

- `page=999` 같은 over-range → backend `empty: true, content: []` → UI "결과 없음" + "1페이지로" 버튼

### 9.4 Withdrawn 회원

- list table에 `withdrawn` 뱃지 (회색) + `withdrawnAt` tooltip
- detail은 withdrawn이어도 view 허용 (감사 목적)

### 9.5 권한

- backend: `@adminAuth.isAdmin()` — SUPER_ADMIN과 ADMIN 둘 다 통과
- frontend: 14b는 role 기반 메뉴 가시성 분기 없음. SUPER_ADMIN이든 ADMIN이든 회원/파티룸 메뉴를 동일하게 노출 (14a 사이드바와 동일 정책)

### 9.6 Resource 크기

- 기본 size 50, URL param으로 100까지 허용, 200은 backend cap이지만 클라는 지원 안 함

## 10. 테스트 전략

스택: vitest + RTL + msw (14a 그대로). 핸들러는 `src/test/mocks/handlers/{members,partyrooms}.ts` 분할 후 `handlers.ts`에서 spread.

| 레이어 | 대상 | 케이스 수 |
|---|---|---|
| Unit (api) | `members-api.ts` URL 빌드 + unwrap | 4 |
| Unit (api) | `partyrooms-api.ts` raw + sort 직렬화 | 3 |
| Unit (model) | members filter zod | 4 |
| Unit (model) | partyrooms filter zod | 4 |
| Unit (lib) | URL ↔ form 동기화 helper | 3 |
| Component | members filter form (debounce + 즉시) | 3 |
| Component | members table (empty/loaded/row click) | 3 |
| Component | partyrooms filter + table | 3 |
| Component | member detail sections | 2 |
| Component | partyroom detail sections | 3 |
| Integration | `/members` page (URL → fetch → table → row click) | 3 |
| Integration | `/members/:id` (404 / withdrawn / activity log) | 2 |
| Integration | `/partyrooms` (sort 위반 400) | 2 |
| Integration | `/partyrooms/:id` (404 / 빈 reports) | 2 |
| Integration | 사이드바 nav (회원/파티룸 enabled) | 1 |
| **합계** | | **~42** (14a 16에서 +26) |

수동 검증 (chunk별 staging):
- G1: 사이드바 enable, `/members` 진입, cross-subdomain 401/CSRF 자연 catch (14a deferred R1·R4)
- G3: filter URL 동기화 (북마크/공유)
- G4: detail 직링크 새로고침
- G6: 파티룸 list 검증
- G8: 파티룸 detail full
- G9: 회귀 회로 — login → list → detail → 로그아웃 → returnTo

## 11. 의존 라이브러리 추가

- `@tanstack/react-query` (PR-14a 미설치 — `package.json` G1에서 확인 후 추가)
- `@tanstack/react-query-devtools` (dev only, optional)
- date 처리: 14a 기존 `date-fns` 활용, 미설치 시 추가
- shadcn 누락 컴포넌트 (G1에서 list)

## 12. 구현 chunk 분할

| Chunk | 산출물 |
|---|---|
| **G0** | 본 spec 작성 + spec polish + plan 작성 + plan reviewer 반영 |
| **G1** | demo 슬라이스 삭제 (`entities/{user,room}`, `features/{users,rooms}`, `widgets/{users,rooms}`, `pages/{users,rooms}-page`) + App.tsx 라우트 정리 + 사이드바 라벨/경로 변경 + react-query + 누락 shadcn 설치 + `entities/{member,partyroom}` 타입 정의 + `shared/api/page.ts` + `shared/lib/url-state.ts` + `mocks/handlers/{members,partyrooms}.ts` 분할 + `QueryClientProvider` wiring |
| **G2** | `features/members/{api,model}` (list query + zod schema + URL serialize + react-query hook) + msw mock + unit test |
| **G3** | `widgets/members-list` + `pages/members-page` (filter form + table + pagination) + integration test (`/members`) |
| **G4** | `features/members/api` detail + `widgets/members-detail` + `pages/member-detail-page` (header + 5 카드 = §5.3) + integration test (`/members/:memberId`) |
| **G5** | `features/partyrooms/{api,model}` (list query + zod + sort 화이트리스트 정렬) + msw mock + unit test |
| **G6** | `widgets/partyrooms-list` + `pages/partyrooms-page` + integration test |
| **G7** | `features/partyrooms/api` detail + `widgets/partyrooms-detail` + `pages/partyroom-detail-page` (header + top-level + playback + crews + djQueue) + integration test |
| **G8** | partyroom detail sub-list (penalties + reports + adminActions 카드) + 회귀 점검 |
| **G9** | §12 catch-up + §13 future polish backfill + 사이드바 final wiring 검증 + 14a §13.2 forward-evolution backfill (demo 의존성 정리 SHA) |

## 13. 위험 / 미해결

### R1 — backend wrap 비대칭 (멤버 wrap / 파티룸 raw)

**위험**: 14b 안에서 두 패턴이 공존 → 신규 도메인 추가 시 어느 쪽을 따를지 혼동.
**대응**: §13 future polish로 backend 일괄 통일. 14b 시점 두 패턴 spec §4.1에 명시. helper 파일 위치는 `shared/api/page.ts` 단일.

### R2 — `host` 필터 매칭 정책 (해소됨, 운용 risk만 잔존)

**확정**: backend `email LIKE '%q%' OR nickname LIKE '%q%'` 양 필드 부분일치 (`AdminPartyroomQueryRepositoryImpl.buildPredicates`). filter form 라벨 "호스트 (이메일 또는 닉네임)" + placeholder "부분일치"로 사용자 명확화 (§6.1).
**잔존 운용 risk**: 검색어 1~2자 입력 시 LIKE가 광범위 매칭 → 응답 큼. UI: 최소 2자 클라 검증 + debounce 300ms.

### R3 — partyroom sort 화이트리스트 (해소됨)

**확정**: `createdAt | lastActivityAt | crewCount | title | hostNickname` × asc/desc (10 옵션). frontend zod `PartyroomSortEnum`으로 화이트리스트 enforce (§6.1) + msw 핸들러는 화이트리스트 위반 400 시뮬레이션 케이스 1개 보유 (회귀 잡기).

### R4 — `tier=GT` filter 결과 의미

**위험**: member 테이블의 GT row는 admin 강등 edge case → list에 등장 시 사용자 혼동.
**대응**: tier dropdown에 GT 옵션 노출하되 라벨에 "(강등)" 표기 + 툴팁 + UI 뱃지 색 구분.

### R5 — withdrawn 회원의 `lastLoginAt`/profile null 처리

**위험**: withdrawn 후 profile/lastLogin이 null로 들어올 수 있음. 컴포넌트 null safe.
**대응**: 컴포넌트 단에서 null fallback ("-"). G2/G4 unit test에 null 케이스 포함.

### R6 — `currentTrackName`/`playlistName` null

**위험**: backend가 명시적으로 null로 둠 (PR 8 scope 외). UI에서 "재생 중인 곡 없음" 같은 텍스트로 뭉뚱그릴지 별도 표시할지 결정 필요.
**대응**: spec §6.2 — null fallback "-". §13에 future polish "playlist 모듈 query port 추가 후 채우기" 상속.

### R7 — `recentReports` 빈 상태 (PR-13 이후 채움)

**위험**: PR-13에서 신고 시스템 완성됐으므로 14b 시점 staging 신고 데이터가 있을 수도/없을 수도 있음. 빈 상태 메시지는 항상 동일.
**대응**: empty state 메시지 "신고 내역 없음".

### R8 — demo `api-client.ts` 의존 잔존

**위험**: 14a §13.2 명시 — demo `scenarios`/`dj-queue`/`playlist` slice가 잔존하면 `api-client.ts`도 살아 있음. G1에서 grep 후 결정.
**대응**: G1 grep 결과를 §12에 reality 기록. 사용처 0이면 14b에서 같이 삭제, 잔존이면 보존하고 향후 PR 위임.

### R9 — react-query 캐시 staleness

**위험**: filter 유지하면서 detail 다녀온 후 list 캐시 stale. 단순 read-only지만 사용자가 "최신" 기대.
**대응**: `staleTime: 30s` + 페이지 우상단 "새로고침" 버튼 (`queryClient.invalidateQueries`). 14b는 폴링/websocket 없음.

### R10 — pagination over-range

**위험**: URL `page=999`로 직접 진입하면 빈 결과.
**대응**: `empty: true && totalPages > 0` 감지 시 "결과 없음 — 1페이지로" 버튼.

### R11 — backend `LocalDateTime` 타임존

**위험**: 14a에서 이미 발견된 이슈. 14b도 상속.
**대응**: KST 가정 footer 1회 표기. §13.1에 14a 미해결 상속.

## 14. Open Items / Implementation Reality (post-build catch-up)

**G9 catch-up 자리**. G1~G8 진행 중 spec ↔ 실제 코드 불일치 항목을 SHA + 사유 + impact로 backfill. 예상 항목:

1. msw mock fixture 분할 timing/구조 결정
2. shadcn 컴포넌트 추가 설치 목록 (G1 grep 결과)
3. `react-query` `QueryClientProvider` 추가 위치 (App.tsx vs main.tsx)
4. URL ↔ form 동기화 helper 실제 구현 위치
5. `Page<T>` 응답에서 사용 안 하는 필드(`pageable`, `sort` 객체) 처리 — 무시 vs 타입 정의 포함
6. backend wrap 비대칭 (멤버 wrap / 파티룸 raw) 두 패턴 공존 정당화
7. demo `api-client.ts` 사용처 grep 결과 (R8)
8. `DisplayFlag` / `GradeType` / `PenaltyType` / `PartyroomAdminActionType` enum 실제 값 (G7/G8 confirm)

각 항목 `**[Gx SHA <hash>]** 사유 / impact` 형식으로 기록.

## 15. Future Polish (§13.1 14a 상속 + 14b 신규)

### 15.1 14a §13에서 상속 — 14b에 직접 영향 있는 항목만 추림

- 백엔드 `GET /api/v1/admin/me` 추가 (새로고침 시 role/mustChangePassword 복원 — 14b list/detail에도 직접 영향)
- `AdminLoginResponse.issuedAt` 타임존 명시 (`OffsetDateTime` or `Z` suffix) — 14b의 모든 LocalDateTime 표시와 같은 결로 일괄 처리
- 403 응답 인터셉터 — 14b는 `@adminAuth.isAdmin()` 통과지만 미래 SUPER_ADMIN 전용 경로 추가 시 인터셉터 일괄 처리
- e2e Playwright (login + members + partyrooms happy path) — 14b 회귀 catch
- Storybook + 시각적 회귀 — 14b 도입 컴포넌트(table/filter form/카드) 회귀 catch
- 다국어 i18n — 14b 한국어 하드코딩 일괄 처리
- a11y axe-core — 14b 도입 widget 검증

(14a §13의 비번 표시 토글, 캡스락 경고, 다중 탭 storage event, `Set-Cookie: XSRF-TOKEN` 명시 등은 14b와 직접 결합 없음 — 14a 자체 §13 유지)

### 15.2 14b 신규

- 백엔드 `/admin/partyrooms` 응답 `ApiCommonResponse` wrap 통일 (R1)
- 백엔드 `LocalDateTime` → `OffsetDateTime` 일괄 (R11)
- filter 조합 preset 저장 (자주 쓰는 필터 북마크)
- export CSV (큰 list 외부 분석)
- sort multi-field
- virtual scroll (size>200 필요 시)
- backend playlist 모듈 query port 추가 후 `currentTrackName`/`playlistName` 채움 (R6)
- mutation chunk (14c 이후): tier 변경, withdraw, partyroom 강제 종료/penalty/admin action
- guest 어드민: backend `AdminGuestQueryController` + frontend `/guests` 라우트 (14c 이후 별 묶음)
