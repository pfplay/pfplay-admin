# 가상 DJ(P2) 어드민 프론트 + 백엔드 read 보강 — 구현 계획 (Plan B)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** P2 가상 DJ 백엔드(develop 머지 완료) 위에 어드민 조작 UI + 필요한 read 엔드포인트를 얹어 end-to-end 사용가능하게 만든다.

**Architecture:** 두 레포에 걸침. (A) pfplay-platform = 읽기 GET 3종(풀 요약/송팩 목록/송팩 상세) + 어드민 검색 프록시 + 어드민 파티룸 목록 DTO에 가상DJ 요약 조인 — 전부 어드민 전용 surface라 pfplay-web 무영향. (B) pfplay-admin = 신규 "가상 DJ" 섹션(풀·송팩 feature) + music-search 컴포넌트 포팅 + 기존 파티룸 페이지 통합(봇 컬럼·일괄·상세 config·drain/freeze). 기존 패턴(QueryDSL tuple projection / react-query + zod + MSW / bulk 인프라)을 그대로 재사용.

**Tech Stack:** Backend = Spring Boot, QueryDSL, JUnit5, ArchUnit. Frontend = Vite + React + react-router, @tanstack/react-query, zod, vitest + MSW, shadcn/ui.

**Spec:** `pfplay-admin/docs/specs/2026-06-01-virtual-dj-p2-admin-design.md`

**선행 사실 (코드 검증됨):**
- 백엔드 mutation API 완비(`AdminVirtualDjController`, `/api/v1/admin`, `@adminAuth.canManageVirtualDj()`).
- `canManageVirtualDj() = isAdmin() = ROLE_ADMIN` — 모든 어드민이 보유(super-admin은 ROLE_SUPER_ADMIN 추가). nav role 무제한.
- `MusicSearchController`(`/api/v1/music-search`)는 `hasRole('MEMBER')` 회원전용 → 어드민 검색 프록시 필요.
- `BotPoolQueryRepositoryImpl` = QueryDSL + NOT EXISTS(active crew). `AdminPartyroomQueryRepositoryImpl.findAdminList` = tuple projection + correlated subquery(`djCountSubquery`).
- 프론트 http: `http<T>(path, {method, body})` + `unwrap(res)`(`@/shared/api/page`). feature = `features/<name>/{api,model,ui}`, hooks `use-*`, zod `*-schema.ts`, 테스트 vitest+MSW.

**환경 주의:** Gradle 호출 시 `JAVA_HOME="C:/Users/Eisen/.jdks/ms-21.0.7"` prefix 필수. 프론트 로컬은 `npx next dev` 아님 — admin은 Vite(`pnpm test`/`pnpm vitest`). 커밋은 한글, push/PR 직전 squash.

**브랜치:** 백엔드 작업 = pfplay-platform 신규 `feature/virtual-dj-p2-admin-api`(origin/develop 분기). 프론트 작업 = pfplay-admin `feature/virtual-dj-p2-admin`(이미 생성됨, spec 커밋 보유).

---

## Chunk 1: 백엔드 read GET 3종 (virtualdj feature)

**레포:** pfplay-platform. **전제:** `feature/virtual-dj-p2-admin-api` 브랜치를 origin/develop에서 분기.
**참고 파일(mirror):** `app/.../virtualdj/adapter/in/web/AdminVirtualDjController.java`, `.../payload/VirtualDjLiveStatusResponse.java`, `.../persistence/impl/BotPoolQueryRepositoryImpl.java`, `app/.../virtualdj/AdminVirtualDjControllerTest.java`.

### Task 1.1: 봇 풀 요약 쿼리 (repo 확장)

**Files:**
- Modify: `app/src/main/java/com/pfplaybackend/api/virtualdj/adapter/out/persistence/BotPoolQueryRepository.java`
- Modify: `app/src/main/java/com/pfplaybackend/api/virtualdj/adapter/out/persistence/impl/BotPoolQueryRepositoryImpl.java`
- Create DTO: `app/src/main/java/com/pfplaybackend/api/virtualdj/application/dto/PoolPlacementRow.java`
- Test: `app/src/test/java/com/pfplaybackend/api/virtualdj/BotPoolQueryRepositoryImplTest.java` (신규 또는 기존 IT 패턴 따름)

- [ ] **Step 1: 실패 테스트 작성** — `@DataJpa" 또는 기존 repo IT 패턴(다른 *QueryRepositoryImplTest 참고)으로: is_dummy 봇 3명 중 1명만 active crew 보유 시 `countBots()==3`, `countIdleBots()==2`, `findPlacements()`가 그 방 1건(botCount=1) 반환.

- [ ] **Step 2: 인터페이스 메서드 추가**

```java
// BotPoolQueryRepository.java 에 추가
long countBots();
long countIdleBots();
List<PoolPlacementRow> findPlacements();
```

```java
// PoolPlacementRow.java (신규)
package com.pfplaybackend.api.virtualdj.application.dto;
public record PoolPlacementRow(Long partyroomId, String partyroomTitle, long botCount) {}
```

- [ ] **Step 3: impl 구현** — 기존 `BotPoolQueryRepositoryImpl`의 QueryDSL 스타일을 따른다.
  - `countBots()` = `userAccountData.isDummy.isTrue().and(withdrawnAt.isNull())` count.
  - `countIdleBots()` = 위 + `findIdleBotUserIds`의 NOT EXISTS(active crew) 동일 술어로 count.
  - `findPlacements()` = `crewData` join: active crew인 dummy 유저를 partyroom별 group by, `partyroomData.title` 조인, `crewData.count()`. (QPartyroomData 사용 — `BotPoolQueryRepositoryImpl`에 import 추가)

- [ ] **Step 4: 테스트 통과 확인** — `JAVA_HOME="C:/Users/Eisen/.jdks/ms-21.0.7" ./gradlew :app:test --tests "*BotPoolQueryRepositoryImplTest"`

- [ ] **Step 5: 커밋** — `feat(virtualdj): 봇 풀 요약 쿼리(count/idle/placements)`

### Task 1.2: GET /admin/virtual-dj/pool

**Files:**
- Create: `app/.../virtualdj/adapter/in/web/payload/PoolSummaryResponse.java`
- Modify: `app/.../virtualdj/application/service/VirtualDjAdminService.java` (poolSummary() 추가) 또는 `VirtualUserPoolService`에 추가 — 기존 `provisionPool`이 있는 서비스에 둔다.
- Modify: `AdminVirtualDjController.java` (GET 추가)
- Test: `AdminVirtualDjControllerTest.java` (GET 케이스 추가)

- [ ] **Step 1: 실패 컨트롤러 테스트** — `AdminVirtualDjControllerTest` 패턴(`@WebMvcTest` 또는 기존 슬라이스)으로 `GET /api/v1/admin/virtual-dj/pool` → 200 + `{total, idle, placed:[...]}`. 서비스 mock.

- [ ] **Step 2: 응답 DTO**

```java
package com.pfplaybackend.api.virtualdj.adapter.in.web.payload;
import java.util.List;
public record PoolSummaryResponse(long total, long idle, List<Placement> placed) {
    public record Placement(Long partyroomId, String partyroomTitle, long botCount) {}
}
```

- [ ] **Step 3: 서비스 메서드** — `poolSummary()` = repo의 countBots/countIdleBots/findPlacements 조합 → `PoolSummaryResponse`.

- [ ] **Step 4: 컨트롤러 엔드포인트**

```java
@Operation(summary = "봇 풀 요약 조회")
@SecurityRequirement(name = "cookieAuth")
@PreAuthorize("@adminAuth.canManageVirtualDj()")
@GetMapping("/virtual-dj/pool")
public ResponseEntity<ApiCommonResponse<PoolSummaryResponse>> poolSummary() {
    return ResponseEntity.ok(ApiCommonResponse.success(adminService.poolSummary()));
}
```

- [ ] **Step 5: 테스트 통과 + 커밋** — `feat(virtualdj): GET 봇 풀 요약 엔드포인트`

### Task 1.3: GET /admin/virtual-dj/song-packs (목록)

**Files:**
- Create: `app/.../virtualdj/adapter/in/web/payload/SongPackListItemResponse.java`
- Modify: `VirtualSongPackService.java` (listPacks() 추가)
- Modify: `AdminVirtualDjController.java` (GET 추가)
- Test: `AdminVirtualDjControllerTest.java`

- [ ] **Step 1: 실패 테스트** — `GET /virtual-dj/song-packs` → 200 + `[{id,name,description,trackCount}]`.

- [ ] **Step 2: DTO**

```java
package com.pfplaybackend.api.virtualdj.adapter.in.web.payload;
public record SongPackListItemResponse(Long id, String name, String description, long trackCount) {}
```

- [ ] **Step 3: 서비스** — `listPacks()`: `VirtualSongPackRepository.findAll()` + 각 팩 trackCount. N+1 회피 위해 `VirtualSongPackTrackRepository`에 `@Query`로 packId→count group by 한 번에 조회하는 메서드 추가 권장:
```java
// VirtualSongPackTrackRepository.java
@Query("select t.songPackId as packId, count(t) as cnt from VirtualSongPackTrackData t group by t.songPackId")
List<TrackCountView> countGroupBySongPackId();
interface TrackCountView { Long getPackId(); long getCnt(); }
```
서비스에서 Map<packId,cnt>로 합성. (팩 수가 적으면 단순 loop도 허용 — 단 §6 회귀 주의.)

- [ ] **Step 4: 컨트롤러** — `GET /virtual-dj/song-packs` → `ApiCommonResponse.success(List<...>)`.

- [ ] **Step 5: 테스트 통과 + 커밋** — `feat(virtualdj): GET 송팩 목록`

### Task 1.4: GET /admin/virtual-dj/song-packs/{id} (상세 + 트랙)

**Files:**
- Create: `app/.../virtualdj/adapter/in/web/payload/SongPackDetailResponse.java`
- Modify: `VirtualSongPackService.java` (getPack(id) 추가)
- Modify: `AdminVirtualDjController.java`
- Test: `AdminVirtualDjControllerTest.java`

- [ ] **Step 1: 실패 테스트** — 존재 팩 → 200 + `{id,name,description,tracks:[{trackId,name,linkId,duration,thumbnailImage}]}`; 없는 팩 → 404(SONG_PACK_NOT_FOUND).

- [ ] **Step 2: DTO**

```java
package com.pfplaybackend.api.virtualdj.adapter.in.web.payload;
import java.util.List;
public record SongPackDetailResponse(Long id, String name, String description, List<Track> tracks) {
    public record Track(Long trackId, String name, String linkId, String duration, String thumbnailImage) {}
}
```

- [ ] **Step 3: 서비스** — `getPack(id)`: `findById(id).orElseThrow(SONG_PACK_NOT_FOUND)` + `findBySongPackIdOrderByOrderNumberAsc(id)` 매핑. (기존 `VirtualDjException`/예외코드 재사용 — `deletePack` 등에서 쓰는 NOT_FOUND 코드 확인 후 동일 사용.)

- [ ] **Step 4: 컨트롤러** — `GET /virtual-dj/song-packs/{id}`.

- [ ] **Step 5: 테스트 통과 + 커밋** — `feat(virtualdj): GET 송팩 상세+트랙`

### Chunk 1 완료: 전체 `:app:test` GREEN 확인 후 plan-document-reviewer 게이트.

---

## Chunk 2: 백엔드 어드민 검색 프록시 + 파티룸 목록 가상DJ 조인

**레포:** pfplay-platform (동일 브랜치).

### Task 2.1: 어드민 music-search 프록시

**Files:**
- 확인: `app` 모듈이 `playlist` 모듈(`MusicSearchService`)을 의존하는지 (`app/build.gradle` 확인).
  - 의존 O → 어드민 엔드포인트를 `AdminVirtualDjController`에 추가, `MusicSearchService` 주입.
  - 의존 X → `playlist` 모듈에 `AdminMusicSearchController` 신설, `@adminAuth.canManageVirtualDj()` 게이팅(common 모듈 SpEL은 전 모듈 가시).
- Modify/Create: 위 결정에 따른 컨트롤러 + 기존 `QueryMusicSearchResponse` 재사용
- Test: 컨트롤러 슬라이스 — 어드민 인증 통과 / 응답 형태.

- [ ] **Step 1: 모듈 의존 확인** — `grep -n "project(" app/build.gradle | grep playlist`. 결과를 plan 노트에 기록하고 위 분기 선택.

- [ ] **Step 2: 실패 테스트** — `GET /api/v1/admin/virtual-dj/music-search?q=foo` → 200 + 검색 결과 형태. `MusicSearchService` mock.

- [ ] **Step 3: 엔드포인트 구현**

```java
@Operation(summary = "어드민 음악 검색 (송팩 빌더용)",
        description = "회원전용 /music-search 와 동일 서비스, 어드민 인증 경로")
@SecurityRequirement(name = "cookieAuth")
@PreAuthorize("@adminAuth.canManageVirtualDj()")
@GetMapping("/virtual-dj/music-search")
public ResponseEntity<ApiCommonResponse<QueryMusicSearchResponse>> searchMusic(@RequestParam("q") String q) {
    return ResponseEntity.ok(ApiCommonResponse.success(
            QueryMusicSearchResponse.from(musicSearchService.getSearchList(q))));
}
```
(playlist 모듈에 둘 경우 동일 시그니처의 별도 컨트롤러.)

- [ ] **Step 4: 인증 분리 회귀 테스트** — 회원전용 `/api/v1/music-search`는 `hasRole('MEMBER')` 유지(불변), 어드민 경로는 `canManageVirtualDj`로 별개임을 테스트로 잠금.

- [ ] **Step 5: 테스트 통과 + 커밋** — `feat(virtualdj): 어드민 음악 검색 프록시(canManageVirtualDj)`

### Task 2.2: 어드민 파티룸 목록에 가상DJ 요약 조인

**Files:**
- Modify: `app/.../administration/adapter/in/web/payload/response/AdminPartyroomListItemResponse.java` (nullable `virtualDj` 필드 추가)
- Modify: `app/.../administration/application/dto/AdminPartyroomListRow.java` (동일 필드)
- Modify: `app/.../administration/application/service/AdminPartyroomQueryService.java` (list 매핑)
- Modify: `app/.../administration/adapter/out/persistence/impl/AdminPartyroomQueryRepositoryImpl.java` (subquery + left join)
- Modify: `AdminPartyroomQueryService` 가 참조하는 곳
- Test: 기존 `AdminPartyroomQuery*Test` 확장 + 신규 케이스(가상DJ config 있는 방 / 없는 방).

- [ ] **Step 1: 실패 테스트** — config MANAGED·botDj 2명인 방 → 응답에 `virtualDj:{status:MANAGED, targetCount, botDjCount:2}`; config 없는 방 → `virtualDj:null`. **기존 목록 테스트(필드 추가가 기존 필드/정렬/페이징 안 깨뜨림)도 GREEN 유지.**

- [ ] **Step 2: DTO 필드 추가 (nullable, 추가만)**

```java
// AdminPartyroomListItemResponse 의 record 마지막에 추가
// + 중첩 record
public record VirtualDjSummary(VirtualDjStatus status, Integer targetCount, long botDjCount) {}
// 기존 필드 전부 보존, 맨 끝에 VirtualDjSummary virtualDj 추가 (null 허용)
```
`AdminPartyroomListRow`에도 동일 필드 추가.

- [ ] **Step 3: 쿼리 확장** — `findAdminList`에:
  - `QPartyroomVirtualDjConfigData cfg` left join on `cfg.partyroomId.id.eq(p.id)` (엔티티/Q클래스 경로 확인 — `domain/entity/data/PartyroomVirtualDjConfigData`).
  - `botDjCountSubquery` = correlated: dj join userAccount(isDummy) where `dj.partyroomId.id.eq(p.id)` and dummy. (`djCountSubquery` 패턴 복제 + isDummy 술어.)
  - select tuple 끝에 `cfg.status`, `cfg.targetCount`, `botDjCountSubquery` 추가; `mapRow`에서 `cfg.status==null ? null : new VirtualDjSummary(...)`.

- [ ] **Step 4: 서비스 매핑** — `AdminPartyroomQueryService.list`가 Row→Response 매핑 시 virtualDj 전달.

- [ ] **Step 5: 키스톤 회귀 테스트** — party 모듈(`/api/v1/partyrooms`) 유저 응답 DTO는 본 변경과 무관(다른 컨트롤러/DTO)임을 명시 테스트 또는 주석으로 잠금. 전체 `:app:test` + `:app:integrationTest` GREEN.

- [ ] **Step 6: 커밋** — `feat(admin): 파티룸 목록에 가상DJ 요약 조인(어드민 전용 DTO)`

### Chunk 2 완료: plan-document-reviewer 게이트 + 백엔드 PR 준비(별도). 프론트는 이 API들에 의존하므로 백엔드 먼저 dev 머지 권장(또는 MSW로 계약 고정 후 병행).

---

## Chunk 3: 프론트 nav + 봇 풀 feature

**레포:** pfplay-admin (`feature/virtual-dj-p2-admin`).
**참고(mirror):** `src/features/announcements/api/announcements-api.ts`, `src/features/announcements/model/*-schema.ts`, `src/pages/avatars-page.tsx`(resourceType 라우팅), `src/app/layout.tsx`.

### Task 3.1: entities/virtual-dj 타입 + 라우팅 + nav

**Files:**
- Create: `src/entities/virtual-dj/model/types.ts`, `src/entities/virtual-dj/index.ts`
- Modify: `src/App.tsx` (라우트 추가)
- Modify: `src/app/layout.tsx` (nav 항목 — 운영 관리 그룹, role 무제한)
- Create: `src/pages/virtual-dj-page.tsx`(resourceType 스위치), `src/pages/song-pack-detail-page.tsx`
- Test: `src/app/__tests__/layout.test.tsx` 확장(가상 DJ nav 노출 — ADMIN·SUPER_ADMIN 둘 다).

- [ ] **Step 1: 실패 테스트** — layout 테스트에 "가상 DJ" 링크가 ADMIN·SUPER_ADMIN 양쪽 meta에서 노출 검증.

- [ ] **Step 2: 타입** — `VirtualDjStatus = "OFF"|"MANAGED"|"FROZEN"`, `PoolSummary`, `SongPackListItem`, `SongPackDetail`, `SongPackTrack`, `PartyroomVirtualDjSummary`, `VirtualDjLiveStatus` 등 백엔드 DTO 미러.

- [ ] **Step 3: nav 항목** — `layout.tsx` 운영 관리 `items`에 `{ to: "/virtual-dj/pool", icon: <적절한 lucide 아이콘, 예: Bot 또는 Music2>, label: "가상 DJ" }` 추가(role 미지정).

- [ ] **Step 4: 라우트** — `App.tsx`:
```tsx
<Route path="/virtual-dj" element={<Navigate to="/virtual-dj/pool" replace />} />
<Route path="/virtual-dj/:resourceType" element={<VirtualDjPage />} />
<Route path="/virtual-dj/song-packs/:packId" element={<SongPackDetailPage />} />
```
`VirtualDjPage`는 `resourceType`(`pool`|`song-packs`)에 따라 PoolPage/SongPacksPage 렌더(아바타 페이지 스위치 패턴).

- [ ] **Step 5: 테스트 통과 + 커밋** — `feat(virtual-dj): nav 항목 + 라우팅 골격`

### Task 3.2: 봇 풀 api + 훅

**Files:**
- Create: `src/features/virtual-dj-pool/api/pool-api.ts`, `use-pool-summary.ts`, `use-provision-pool.ts`
- Create: `src/features/virtual-dj-pool/model/provision-schema.ts`
- Test: `src/features/virtual-dj-pool/api/__tests__/pool-api.test.ts`(MSW)

- [ ] **Step 1: 실패 테스트(MSW)** — `getPoolSummary()`가 `/api/v1/admin/virtual-dj/pool` GET→unwrap; `provisionPool({count})`가 POST.

- [ ] **Step 2: api**
```ts
import { http } from "@/shared/api/http"
import { unwrap, type ApiCommonResponse } from "@/shared/api/page"
import type { PoolSummary } from "@/entities/virtual-dj"
const API = "/api/v1/admin/virtual-dj"
export async function getPoolSummary(): Promise<PoolSummary> {
  return unwrap(await http<ApiCommonResponse<PoolSummary>>(`${API}/pool`))
}
export async function provisionPool(count: number): Promise<void> {
  await http<void>(`${API}/pool`, { method: "POST", body: { count } })
}
```

- [ ] **Step 3: zod 스키마** — `provisionSchema = z.object({ count: z.coerce.number().int().min(1).max(500) })`. (백엔드 `ProvisionPoolRequest`의 @Min/@Max 미러 — 실제 상한 확인.)

- [ ] **Step 4: react-query 훅** — `useQuery(["virtual-dj","pool"], getPoolSummary)`; `useMutation(provisionPool, onSuccess → invalidate ["virtual-dj","pool"])`.

- [ ] **Step 5: 테스트 통과 + 커밋** — `feat(virtual-dj): 봇 풀 api/훅`

### Task 3.3: 봇 풀 페이지 UI

**Files:**
- Create: `src/features/virtual-dj-pool/ui/pool-summary-cards.tsx`, `provision-pool-form.tsx`, `pool-page-content.tsx`
- Test: `src/features/virtual-dj-pool/ui/__tests__/*.test.tsx`

- [ ] **Step 1: 실패 테스트** — 요약 카드가 total/idle/placed 표시, 폼 제출이 provisionPool 호출, 0/음수 막힘.
- [ ] **Step 2: UI 구현** — 기존 shadcn `Card`, `Button`, `Input` 재사용. placed는 방별 목록(파티룸 링크).
- [ ] **Step 3: 테스트 통과 + 커밋** — `feat(virtual-dj): 봇 풀 페이지`

### Chunk 3 완료: `pnpm vitest run` GREEN + plan-document-reviewer 게이트.

---

## Chunk 4: 송팩 feature + music-search 포팅

**레포:** pfplay-admin.
**참고(mirror):** pfplay-web `src/features/playlist/add-tracks/ui/music-search.component.tsx`, `search-input.component.tsx`, `search-list-item.component.tsx`, `api/use-search-musics.query.ts`.

### Task 4.1: 송팩 api + 훅

**Files:**
- Create: `src/features/virtual-dj-song-packs/api/song-packs-api.ts` + hooks(`use-song-packs`, `use-song-pack-detail`, `use-create/rename/delete-song-pack`, `use-add/remove-track`)
- Create: `src/features/virtual-dj-song-packs/model/song-pack-schema.ts`
- Test: `__tests__/song-packs-api.test.ts`(MSW)

- [ ] **Step 1: 실패 테스트(MSW)** — 7개 호출(list GET, detail GET, create POST, rename PUT, delete DELETE, addTrack POST, removeTrack DELETE) 경로/메서드/언랩 검증.
- [ ] **Step 2: api 구현** — `const API = "/api/v1/admin/virtual-dj/song-packs"`. addTrack body = `{name, linkId, duration, thumbnailImage}`(이미 매핑된 형태).
- [ ] **Step 3: zod** — create/rename name 1..100, description ≤255. addTrack 필드 제약(name≤200, linkId≤100, duration non-blank, thumbnail≤1000) — 백엔드 `AddPackTrackRequest` 미러.
- [ ] **Step 4: 훅** — invalidate `["virtual-dj","song-packs"]` / `["virtual-dj","song-pack",id]`.
- [ ] **Step 5: 테스트 통과 + 커밋** — `feat(virtual-dj): 송팩 api/훅`

### Task 4.2: 송팩 목록 페이지

**Files:**
- Create: `src/features/virtual-dj-song-packs/ui/song-packs-list.tsx`, `create-song-pack-dialog.tsx`, `rename-song-pack-dialog.tsx`, `delete-song-pack-dialog.tsx`, `song-packs-page-content.tsx`
- Test: `ui/__tests__/*.test.tsx`

- [ ] **Step 1: 실패 테스트** — 목록 렌더(이름·트랙수), 생성/이름변경/삭제 다이얼로그가 해당 mutation 호출. 삭제 확인 다이얼로그(기존 partyrooms mutation-dialog 패턴 mirror).
- [ ] **Step 2: UI 구현** — 행 클릭 → `/virtual-dj/song-packs/:packId`. 409(이름 중복/사용중) 에러 toast.
- [ ] **Step 3: 테스트 통과 + 커밋** — `feat(virtual-dj): 송팩 목록 페이지`

### Task 4.3: music-search 컴포넌트 포팅 + boundary 매퍼

**Files:**
- Create: `src/features/music-search/api/search-api.ts`, `use-search-musics.ts`
- Create: `src/features/music-search/model/to-pack-track.ts` (**boundary 매퍼**)
- Create: `src/features/music-search/ui/music-search.tsx`, `search-input.tsx`, `search-list-item.tsx`
- Create: `src/features/music-search/index.ts`
- Test: `model/__tests__/to-pack-track.test.ts`, `ui/__tests__/music-search.test.tsx`

- [ ] **Step 1: 실패 테스트 — 매퍼** — web 검색 결과(`{videoTitle, videoId, runningTime, thumbnailUrl}`)를 `AddPackTrackRequest`(`{name, linkId, duration, thumbnailImage}`)로 변환. **spread 금지, 명시 매퍼**([[reference_dto_vocabulary_zero_content_hidden]] 교훈):
```ts
export function toPackTrack(m: MusicSearchResult): AddTrackInput {
  return { name: m.videoTitle, linkId: m.videoId, duration: m.runningTime, thumbnailImage: m.thumbnailUrl }
}
```
실제 응답 필드명은 백엔드 `QueryMusicSearchResponse` 확인 후 확정.

- [ ] **Step 2: search api** — `GET /api/v1/admin/virtual-dj/music-search?q=` (어드민 프록시, Task 2.1). `useQuery(["music-search", q], enabled: q.length>0)`.
- [ ] **Step 3: UI 포팅** — web 컴포넌트 3종을 admin 스택(http client, shadcn)으로 이식. 결과 아이템에 duration·thumbnail 표시. `onSelect(track)` 콜백 prop.
- [ ] **Step 4: 테스트 통과 + 커밋** — `feat(music-search): 어드민 음악 검색 포팅 + boundary 매퍼`

### Task 4.4: 송팩 상세(빌더) 페이지

**Files:**
- Create: `src/features/virtual-dj-song-packs/ui/song-pack-builder.tsx`, `track-list.tsx`
- Modify: `src/pages/song-pack-detail-page.tsx`
- Test: `ui/__tests__/song-pack-builder.test.tsx`

- [ ] **Step 1: 실패 테스트** — 트랙 목록 렌더, music-search에서 선택 시 `toPackTrack`→addTrack 호출, 트랙 삭제 호출.
- [ ] **Step 2: UI** — `music-search`의 `onSelect`에 `(m)=>addTrack(toPackTrack(m))` 연결. 트랙 행에 삭제 버튼. 빈 팩 안내.
- [ ] **Step 3: 테스트 통과 + 커밋** — `feat(virtual-dj): 송팩 빌더 페이지`

### Chunk 4 완료: `pnpm vitest run` GREEN + plan-document-reviewer 게이트.

---

## Chunk 5: 파티룸 페이지 통합

**레포:** pfplay-admin.
**참고(mirror):** `src/features/partyrooms/ui/partyrooms-table.tsx`, `bulk-action-toolbar.tsx`, `mutation-dialogs/bulk-action-dialog.tsx`, `use-bulk-partyroom-action.ts`, `model/bulk-schema.ts`, `partyroom-detail-cards.tsx`.

### Task 5.1: 파티룸 목록 봇 컬럼

**Files:**
- Modify: `src/entities/partyroom/model/types.ts` (목록 아이템에 nullable `virtualDj` 필드)
- Modify: `src/features/partyrooms/ui/partyrooms-table.tsx` (컬럼 추가)
- Test: `src/features/partyrooms/ui/__tests__/partyrooms-table.test.tsx` 확장

- [ ] **Step 1: 실패 테스트** — virtualDj summary 있는 행은 "봇 2/3 · MANAGED", 없는 행은 "—"(또는 OFF). 기존 컬럼 테스트 GREEN 유지.
- [ ] **Step 2: 타입 + 컬럼** — `virtualDj?: { status, targetCount, botDjCount } | null`. 컬럼 셀에 상태 배지 + `botDjCount/targetCount`.
- [ ] **Step 3: 테스트 통과 + 커밋** — `feat(partyrooms): 가상DJ 봇 컬럼`

### Task 5.2: 가상DJ 일괄 다이얼로그 (bulk 인프라 계승)

**Files:**
- Create: `src/features/partyrooms/api/use-bulk-virtual-dj.ts`, `api/bulk-virtual-dj-api.ts`
- Create: `src/features/partyrooms/model/virtual-dj-bulk-schema.ts`
- Create: `src/features/partyrooms/ui/mutation-dialogs/virtual-dj-bulk-dialog.tsx`
- Modify: `src/features/partyrooms/ui/bulk-action-toolbar.tsx` (가상DJ 액션 추가) — 기존 bulk-action 패턴 따름
- Test: 각 `__tests__`

- [ ] **Step 1: 실패 테스트(MSW + UI)** — 체크박스 선택 후 가상DJ 일괄 → `PUT /api/v1/admin/virtual-dj/bulk {partyroomIds, status, targetCount, companionFloor, songPackId}`. 결과는 기존 `bulk-action-result-dialog` 패턴.
- [ ] **Step 2: api/schema/dialog** — schema: status enum, MANAGED일 때 targetCount≥1·companionFloor≥0 required(zod refine). 송팩 드롭다운은 `use-song-packs`(Task 4.1) 재사용. MANAGED+송팩 미설정 → 경고 배지.
- [ ] **Step 3: toolbar 통합** — 기존 bulk-action-toolbar에 "가상 DJ 설정" 액션 추가, 선택 ids 전달.
- [ ] **Step 4: 테스트 통과 + 커밋** — `feat(partyrooms): 가상DJ 일괄 적용 다이얼로그`

### Task 5.3: 파티룸 상세 가상DJ config 패널 + drain/freeze

**Files:**
- Create: `src/features/partyrooms/api/virtual-dj-room-api.ts` (applyConfig, getLiveStatus, drain, freeze) + hooks
- Create: `src/features/partyrooms/model/virtual-dj-config-schema.ts`
- Create: `src/features/partyrooms/ui/virtual-dj-config-card.tsx`
- Modify: `src/pages/partyroom-detail-page.tsx` (카드 삽입)
- Test: `ui/__tests__/virtual-dj-config-card.test.tsx`, api `__tests__`

- [ ] **Step 1: 실패 테스트** — live status(`GET /partyrooms/{id}/virtual-dj`) 렌더; config 폼 제출(`PUT`); drain(`POST .../drain`)·freeze(`POST .../freeze`) 버튼; MANAGED 검증.
- [ ] **Step 2: api/hooks** — 4개 호출. invalidate live status + 파티룸 상세/목록.
- [ ] **Step 3: UI** — status 셀렉트(OFF/MANAGED/FROZEN), target/floor 입력, 송팩 셀렉트, 적용 버튼 + drain(확인 다이얼로그)·freeze. live: "봇 x/T". MANAGED+송팩 없음 경고.
- [ ] **Step 4: 테스트 통과 + 커밋** — `feat(partyrooms): 상세 가상DJ config 패널 + drain/freeze`

### Chunk 5 완료: 전체 `pnpm vitest run` + `pnpm tsc` + lint GREEN. plan-document-reviewer 게이트 → 실행 핸드오프.

---

## 통합/검증 (전 chunk 후)

- [ ] 백엔드: `:app:test` + `:app:integrationTest` 전체 GREEN. ArchUnit 영향 없음(read-only 추가).
- [ ] 프론트: `pnpm vitest run` 전체 GREEN, `pnpm tsc --noEmit`, lint clean.
- [ ] 로컬 풀스택 수동 e2e(선택): backend docker :8080 + admin Vite dev → 풀 생성→송팩 빌드→방 MANAGED 적용→봇 컬럼/상태 확인→drain. ([[reference_admin_mutation_manual_call]] 인증 경로.)
- [ ] 백엔드 PR(한글) → develop. 프론트 PR(한글) → develop. push 직전 마이크로커밋 squash([[feedback_commit_consolidation_before_push]]).
- [ ] release/main 승격 = **사용자 게이트**(별도). pfplay-admin은 GHA 없음([[reference_pfplay_admin_no_gha]]) — Cloudflare/Vercel native deploy.

## 비범위 (재확인)
구별모드 토글 UI(deferred) / 아바타 커스터마이징(P1) / AI(P3) / 크로스룸 자동 reconcile(#264). 부하측정·anti-flap IT는 백엔드 비블로커 후속.

## plan 실행 중 코드확인 잔여(소형, 블로커 아님)
- 송팩 NOT_FOUND 예외코드 정확한 enum 값(`VirtualDjException`/`deletePack` 경유 확인).
- `ProvisionPoolRequest` count 상한(@Max) 실제 값 → zod 미러.
- `QueryMusicSearchResponse` 정확한 필드명 → boundary 매퍼 확정.
- `PartyroomVirtualDjConfigData` Q클래스 경로/필드명(status/targetCount/companionFloor/songPackId).
- `app→playlist` 모듈 의존 여부(Task 2.1 분기).
