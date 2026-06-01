# 가상 DJ(P2) 어드민 프론트 + 백엔드 read 보강 — 설계 (Plan B)

- 작성일: 2026-06-01
- 대상 레포: `pfplay-admin`(어드민 UI, 주), `pfplay-platform`(백엔드 read 엔드포인트 보강)
- 선행: P2 백엔드 = pfplay-platform `develop` 머지 완료(PR #283, `f50e51db`). 본 문서는 그 위에 **조작 UI**를 얹는다.
- 백엔드 설계 원본: `pfplay-platform/docs/superpowers/specs/2026-06-01-virtual-dj-p2-design.md` (특히 §6 어드민 UX)

---

## 0. 배경과 목적

P2 가상 DJ 백엔드(봇 풀 / 송 팩 / 룸별 config / reconcile / drain·freeze / 일괄)는 `develop`에 살아있으나
**조작 UI가 없다**. 운영자가 빈 파티룸에 봇 DJ를 상주시키려면 어드민 콘솔에서 다음을 할 수 있어야 한다:

1. 봇 풀 생성·현황 확인
2. 송 팩(봇이 트는 곡 묶음) 빌드
3. 파티룸별로 가상 DJ 활성화(T·floor·송팩·상태) + 체크박스 다중방 일괄 적용
4. 라이브 상태 확인 + drain/freeze

본 문서는 이 end-to-end 사용성을 만드는 **어드민 프론트** 설계 + 이를 위해 필요한 **백엔드 read 엔드포인트 보강**을 다룬다.

### 전체 비전 내 위치
3단계 누적 비전(P1 아바타 콘솔 / **P2 능동 디제잉** / P3 AI 에이전트화) 중 P2의 운영 인터페이스.
P2 백엔드 아키텍처(path A: 봇=실제 계정 + ThreadLocal 임퍼소네이션 + guarded service + ArchUnit 강제)는
이미 잠겼고 본 문서의 범위가 아니다.

---

## 1. 확인된 사실 (탐색 결과)

### 1.1 백엔드 mutation 표면 — 완비
`AdminVirtualDjController` (`/api/v1/admin`, 전부 `@adminAuth.canManageVirtualDj()` 게이팅):

| 메서드 | 경로 | 요청 | 응답 |
|---|---|---|---|
| POST | `/virtual-dj/pool` | `{count}` | 201 |
| POST | `/virtual-dj/song-packs` | `{name, description}` | 201 `{id}` |
| PUT | `/virtual-dj/song-packs/{id}` | `{name}` (이름변경) | 204 |
| DELETE | `/virtual-dj/song-packs/{id}` | — | 204 |
| POST | `/virtual-dj/song-packs/{id}/tracks` | `{name, linkId, duration, thumbnailImage}` | 201 `{id}` |
| DELETE | `/virtual-dj/song-packs/{id}/tracks/{trackId}` | — | 204 |
| PUT | `/partyrooms/{id}/virtual-dj` | `{status, targetCount(@Min1), companionFloor(@Min0), songPackId?}` | 204 |
| POST | `/partyrooms/{id}/virtual-dj/drain` | — | 204 |
| POST | `/partyrooms/{id}/virtual-dj/freeze` | — | 204 |
| GET | `/partyrooms/{id}/virtual-dj` | — | `{status, targetCount, companionFloor, songPackId, currentBotDjCount}` |
| PUT | `/virtual-dj/bulk` | `{partyroomIds[], status, targetCount, companionFloor, songPackId}` | 204 |

`VirtualDjStatus` = `OFF | MANAGED | FROZEN`. 도메인 예외는 `GlobalExceptionHandler`가 매핑
(CONFIG_NOT_FOUND 404 / SONG_PACK_* 409·404 / INVALID_CONFIG 400).

### 1.2 백엔드 read 표면 — 공백 (보강 필요)
조회 엔드포인트는 **per-room live-status GET 하나뿐**이다. 없는 것:
- **봇 풀 목록/요약** 조회 (내부 `BotPoolQueryRepository.findIdleBotUserIds(limit)`만 존재)
- **송 팩 목록** 조회
- **특정 팩의 트랙 목록** 조회

→ §3에서 백엔드 GET 3종을 신설한다.

### 1.3 어드민 ↔ 유저 엔드포인트 분리 (누수 없음)
- 어드민 파티룸 목록: `GET /api/v1/admin/partyrooms` → `AdminPartyroomQueryController` (administration 모듈, 어드민 전용 DTO)
- 유저(pfplay-web) 파티룸: `/api/v1/partyrooms/...` → `party` 모듈 컨트롤러, **별개 경로·별개 DTO**

따라서 어드민 파티룸 목록 응답에 가상 DJ 요약을 조인해도 **pfplay-web에는 누수되지 않는다**(§3.4).

### 1.4 music-search 컴포넌트
`music-search`는 **pfplay-web(Next.js)에 존재**(`features/playlist/add-tracks`)하고 `GET /api/v1/music-search`를 호출한다.
pfplay-admin(Vite)에는 없으므로 **포팅**한다. 검색 엔드포인트는 app 모듈 밖(pfplay-streaming/proxy)이라
**admin 인증 도달 여부는 plan 단계 코드확인 항목**(§7-C1).

### 1.5 어드민 IA / 패턴
- nav 그룹: `대시보드` / `운영 관리`(회원·파티룸·신고·피드백) / `시스템 관리`(어드민·공지·아바타[SUPER_ADMIN])
- 라우팅: React Router. 아바타가 `/avatars/:resourceType` 서브라우팅 패턴 사용.
- 파티룸 feature에 **완성된 bulk 인프라** 존재: `bulk-action-toolbar`, `bulk-action-dialog`,
  `bulk-action-result-dialog`, `use-bulk-partyroom-action`, `bulk-schema`, mutation-dialogs 패턴.
- feature 구조: `features/<name>/{api,model,ui}`, 테스트는 vitest + MSW.
- role 게이팅 존재(`nav item.role`).

---

## 2. 결정 요약

| ID | 결정 | 근거 |
|---|---|---|
| B-D1 | 백엔드 read GET 3종 신설(Plan B에 포함, 두 레포에 걸침) | mutation만으로는 "쓰기는 되나 확인 불가"한 반쪽 UI |
| B-D2 | IA = **신규 "가상 DJ" 섹션(풀·송팩) + 방별 config는 파티룸 페이지 통합** | 풀·송팩은 글로벌 리소스, 방 config는 방 컨텍스트 — 리소스 성격에 IA 정렬 + 파티룸 bulk 인프라 재사용 |
| B-D3 | 파티룸 목록 봇 컬럼 = **어드민 목록 응답에 가상DJ 요약 조인** | N+1 제거. 어드민 전용 DTO라 pfplay-web 무영향(§1.3) |
| B-D4 | music-search = pfplay-web 컴포넌트 **포팅** | AddPackTrackRequest가 name/linkId/duration/thumbnail 요구 → 검색 결과가 그 필드 제공 |
| B-D5 | 구별가능 모드(`virtualdj.distinguishable`) 토글 UI = **제외(deferred)** | 백엔드 pre-seed로 OFF 이미 존재. 필요 시 소규모 후속 |

---

## 3. 백엔드 보강 (pfplay-platform, read-only)

모두 `@adminAuth.canManageVirtualDj()` 게이팅, `ApiCommonResponse` 봉투, 기존 query 패턴 준수.

### 3.1 `GET /api/v1/admin/virtual-dj/pool` — 풀 요약
```
{ total, idle, placed: [ { partyroomId, partyroomTitle, botCount } ] }
```
- `total` = is_dummy 봇 계정 수(탈퇴 제외), `idle` = 활성 crew 없는 봇 수, `placed` = 배치된 방별 봇 수.
- 데이터원: `BotPoolQueryRepository` 확장(요약 카운트 + 방별 그룹). 신규 query 메서드.

### 3.2 `GET /api/v1/admin/virtual-dj/song-packs` — 팩 목록
```
[ { id, name, description, trackCount } ]
```

### 3.3 `GET /api/v1/admin/virtual-dj/song-packs/{id}` — 팩 상세 + 트랙
```
{ id, name, description, tracks: [ { trackId, name, linkId, duration, thumbnailImage } ] }
```
- 없는 팩 → 404(SONG_PACK_NOT_FOUND, 기존 매핑 재사용).

### 3.4 어드민 파티룸 목록 응답에 가상DJ 요약 조인
`AdminPartyroomQueryController` `GET /api/v1/admin/partyrooms` 응답 DTO에 필드 추가:
```
virtualDj: { status, targetCount, botDjCount } | null   // config 없으면 null(=OFF 취급)
```
- `botDjCount` = 해당 방의 봇 DJ 수. 목록 쿼리에서 한 번에 조인(행별 GET N+1 회피).
- **어드민 전용 DTO만 수정** — party 모듈/유저 응답 불변(§1.3).
- 기존 어드민 파티룸 목록 테스트가 깨지지 않도록 필드는 **추가만**(nullable, 기존 필드 보존).

### 3.5 테스트
컨트롤러 슬라이스 + 쿼리 통합 테스트. 권한 게이팅(`canManageVirtualDj`) 검증.

---

## 4. 어드민 프론트 (pfplay-admin)

### 4.1 라우팅 (아바타 패턴 미러)
```
/virtual-dj                      → redirect /virtual-dj/pool
/virtual-dj/:resourceType        (pool | song-packs)
/virtual-dj/song-packs/:packId   (송팩 트랙 빌더 상세)
```
nav 신규 항목 "가상 DJ"(`시스템 관리` 그룹). role 게이팅은 백엔드 `canManageVirtualDj`에 매핑(plan §7-C2 코드확인).

### 4.2 화면 ① 봇 풀 (`/virtual-dj/pool`)
- **요약 카드**: 총 봇 / idle / 배치됨(방별 목록). 데이터 = `GET /virtual-dj/pool`(§3.1).
- **봇 N명 생성** 폼 → `POST /virtual-dj/pool {count}`. 성공 시 요약 invalidate.
- feature: `features/virtual-dj-pool/{api,model,ui}`.

### 4.3 화면 ② 송 팩 (`/virtual-dj/song-packs` + `/:packId`)
- **목록**: 팩(이름·트랙수·설명) + 생성(`POST song-packs`) / 이름변경(`PUT`) / 삭제(`DELETE`). 데이터 = §3.2.
- **상세(빌더)**: 트랙 목록(`GET song-packs/{id}`, §3.3) + **music-search(포팅)로 트랙 추가**
  (`POST .../tracks`) + 트랙 삭제(`DELETE .../tracks/{trackId}`). duration 표시.
- music-search 포팅: pfplay-web `features/playlist/add-tracks`의 검색박스→결과리스트→선택 흐름을
  admin 스택(Vite + 기존 http 클라이언트)으로 이식. 검색 응답 → AddPackTrackRequest 필드 매핑.
- feature: `features/virtual-dj-song-packs/{api,model,ui}` + 공용 `features/music-search`(또는 shared).

### 4.4 파티룸 페이지 통합 (기존 확장)
- **목록 컬럼 추가**: "봇 x/T · 상태(OFF/MANAGED/FROZEN)". 데이터 = §3.4 조인 필드(추가 호출 없음).
- **행 체크박스 → 일괄**: 기존 bulk 인프라 계승. 가상DJ 일괄 다이얼로그(status/target/floor/songPack 폼)
  → `PUT /virtual-dj/bulk {partyroomIds[], ...}`. 결과 다이얼로그도 기존 `bulk-action-result-dialog` 패턴.
- **상세 페이지 패널**: 가상 DJ config 폼(status/target/floor/songPack) → `PUT /partyrooms/{id}/virtual-dj`
  + **drain**(`POST .../drain`) · **freeze**(`POST .../freeze`) 버튼 + live-status(`GET`, §1.1) 표시.
- 송팩 선택 드롭다운은 §3.2 팩 목록 사용.

### 4.5 폼 검증 (백엔드 제약 미러)
- MANAGED → targetCount(≥1), companionFloor(≥0) 필수. zod 스키마로 클라 선검증(기존 `model/*-schema.ts` 패턴).
- MANAGED + songPackId 미설정 허용하되 **"송팩 없으면 봇이 곡을 못 틀어요"(reconcile SKIP_NO_SONG_PACK)** 경고 배지.
- OFF/FROZEN → 나머지 필드 무시(백엔드 의미론과 일치).

---

## 5. 데이터 흐름 & 에러 처리

- 모든 호출은 기존 admin `http` 클라이언트(AdminAccessToken 쿠키 + XSRF double-submit + Origin allowlist) 경유.
- react-query: 조회는 `useQuery`(queryKey 네임스페이스 `["virtual-dj", ...]`), 변경은 `useMutation` + 성공 시
  관련 query invalidate(풀 요약 / 팩 목록·상세 / 파티룸 목록·상세).
- 에러: 기존 admin 패턴(mutation `onError` → toast + 폼 인라인). 도메인 코드별 메시지 매핑
  (409 송팩 중복/사용중, 404 미존재, 400 잘못된 config).

---

## 6. 테스트 전략

- **프론트(vitest + MSW)**: feature별 `api`(요청 형태·에러), `model`(zod 스키마), `ui`(폼·다이얼로그·테이블).
  파티룸 통합은 기존 `partyrooms-table`·bulk 테스트 **확장**(봇 컬럼·가상DJ 일괄). music-search 포팅분 단위 테스트.
- **백엔드(JUnit)**: §3 GET 컨트롤러 슬라이스 + 쿼리 통합. 권한 게이팅. 파티룸 목록 DTO 필드 추가가
  기존 어드민 목록 테스트를 깨지 않는지 회귀.
- 키스톤 회귀: "어드민 파티룸 목록 응답에 가상DJ 필드 추가 → 유저(party 모듈) 응답 불변"을 백엔드 테스트로 잠금.

---

## 7. plan 단계 코드확인 항목 (현재 미단정)

- **C1 (검색 인증)**: `/api/v1/music-search`(pfplay-streaming/proxy)가 AdminAccessToken으로 도달 가능한지.
  불가 시 → 어드민 스코프 검색 엔드포인트 신설 or 프록시 인증 처리.
- **C2 (role 매핑)**: `@adminAuth.canManageVirtualDj()`가 어떤 role(ADMIN/SUPER_ADMIN)인지 → nav role 게이팅 일치.
- **C3 (풀 요약 쿼리)**: `BotPoolQueryRepository` 확장으로 total/idle/placed 집계가 cross-BC(user_account×crew)
  조회 패턴 안에서 가능한지(기존 admin 조회 패턴 준수).
- **C4 (파티룸 목록 조인)**: 봇 DJ 수를 목록 쿼리에 조인할 때 기존 페이징/필터와의 결합 형태.

---

## 8. 범위 밖 (명시)

- 구별가능 모드 토글 UI(`virtualdj.distinguishable`) — deferred(B-D5)
- 아바타 커스터마이징(P1) / AI 채팅·플레이리스트 자가갱신·방 컨셉 추종(P3)
- 크로스룸 자동 reconcile(#264 통합) — 본 단계는 어드민 수동 지시형
- 부하측정(stg N=20/50), anti-flap 타이밍 IT — 백엔드 비블로커 후속

---

## 9. 산출물 요약

- **pfplay-platform**: GET 3종(풀 요약 / 송팩 목록 / 송팩 상세) + 어드민 파티룸 목록 DTO 봇 요약 조인 + 테스트.
- **pfplay-admin**: nav 항목 + `virtual-dj-pool` · `virtual-dj-song-packs` feature + `music-search` 포팅
  + 파티룸 페이지 통합(봇 컬럼 · 가상DJ 일괄 다이얼로그 · 상세 config 패널 · drain/freeze) + 테스트.
