# 크루 ONE_TIME 강퇴 UI Design

**상태**: 초안
**브랜치**: `feature/admin-crew-expel-ui` (base `origin/develop` `a649c5d`)
**범위**: pfplay-admin 파티룸 상세 화면의 크루 카드에 ONE_TIME 강퇴 액션 추가. 기존 백엔드 엔드포인트(`POST /api/v1/admin/partyrooms/{partyroomId}/penalties`)를 UI로 노출.

**배경**: prod 에서 한 user_account 가 2개 파티룸에 동시에 `is_active=true` 크루로 존재(룸3 DJ + 룸4 HOST)하는 wedge 발생. 근본 원인은 `createGeneralPartyRoom`→`enterByHost` 가 one-active-room invariant 미강제(별도 task T1-3). 즉시 복구 수단으로 admin 이 특정 크루를 강퇴할 방법이 필요하나, 해당 기능이 admin UI 에 없어 curl 시도 시 `FORBIDDEN_ORIGIN` / `CSRF token validation failed` 로 막힘. admin 콘솔의 공유 `http` 클라이언트는 CSRF/credentials/Origin 을 이미 올바르게 처리하므로 UI 로 노출하는 것이 정공법. 14g §1.2 에서 "penalty UI" 는 명시적 비목적(별 PR)으로 이연된 항목.

---

## 1. 목적과 비목적

### 1.1 목적

1. 파티룸 상세 화면 크루 카드의 각 크루 행에서 ONE_TIME 강퇴 실행
2. 강퇴 시 필수 사유(reason) 입력 — 백엔드 `@NotBlank`, 1..255 미러
3. HOST 등급 크루 행은 강퇴 비활성(룸이 호스트 없이 남는 사고 차단)
4. 성공 시 상세 자동 갱신 → 강퇴된 크루가 목록에서 사라짐(백엔드가 `is_active=false` + DJ 큐 정리 + 현재 DJ면 skipPlayback + EXIT 브로드캐스트 수행)

### 1.2 비목적

- `PERMANENT_EXPULSION`(영구 밴 + history row), 페널티 해제(`DELETE .../penalties/{id}`) — 별 PR
- 크루 행 다중 액션 드롭다운, DJ 큐 테이블에서의 강퇴(크루 카드가 모든 크루를 커버하므로 불필요)
- T1-3(백엔드 근본 fix: `createGeneralPartyRoom`/`enterByHost` 의 one-active-room invariant 강제) — 별 task. 본 PR 은 운영 복구 수단만 제공
- 일괄(bulk) 강퇴

---

## 2. 백엔드 ground-truth

엔드포인트(기존, 변경 없음):

```
POST /api/v1/admin/partyrooms/{partyroomId}/penalties
@PreAuthorize("@adminAuth.isAdmin()")
body: { crewId: Long, penaltyType: "ONE_TIME_EXPULSION", reason: String(1..255) }
201 → { data: { penaltyId: null } }   // ONE_TIME 은 history row 없음 → penaltyId null
```

서버 동작(`AdminCrewPenaltyCommandService.apply`):
- `partyroom` 미존재 → `NOT_FOUND_ROOM`
- `partyroom.isTerminated()` → `ALREADY_TERMINATED`
- `crewId` 미존재 또는 `path partyroomId != crew.partyroomId` → `NOT_FOUND_ROOM`
- 통과 시 `partyroomAccessCommandService.expel(partyroom, crew, isPermanent=false)`:
  - `deactivateCrew` (atomic toggle, 이미 inactive 면 멱등 no-op)
  - `handleDjQueueOnLeave` — DJ 큐 dequeue + 현재 DJ면 `skipPlayback` + `DjQueueChangedEvent`
  - `CrewAccessedEvent EXIT` 발행
- ONE_TIME 은 ban 없음, `crew_penalty_history` row 없음, `AdminCrewPenalizedEvent` 발행(historyId=null)

CSRF/Origin: 공유 `http` 클라이언트(`@/shared/api/http`)가 admin 콘솔 origin 에서 `AdminOriginGuardFilter` allowlist 통과 + `EagerCsrfTokenRequestAttributeHandler` 기반 CSRF double-submit 을 자동 처리. 신규 코드는 이 클라이언트만 사용하므로 origin/CSRF 추가 처리 불필요.

---

## 3. 컴포넌트/파일

| 파일 | 신규/수정 | 역할 |
|---|---|---|
| `features/partyrooms/api/partyrooms-api.ts` | 수정 | `applyCrewPenalty(partyroomId, body)` 추가 → 위 엔드포인트 POST. `penaltyType` 은 함수 내부에서 `"ONE_TIME_EXPULSION"` 고정 |
| `features/partyrooms/model/mutation-schema.ts` | 수정 | `expelCrewSchema` (zod): `crewId: number(int, positive)`, `reason: string().trim().min(1).max(255)`. `ExpelCrewRequest` 타입 export |
| `features/partyrooms/api/use-expel-crew.ts` | 신규 | `useMutation`. mutationFn=`applyCrewPenalty`. onSuccess: `qc.invalidateQueries({queryKey:["partyrooms"]})` (prefix → detail `["partyrooms","detail",id]` 포함) + `mutationSuccessToast("크루 강퇴 완료")`. onError: `mutationErrorToast` |
| `features/partyrooms/ui/mutation-dialogs/expel-crew-dialog.tsx` | 신규 | `terminate-dialog.tsx` 패턴 복제. props `{ partyroomId, crewId, crewLabel, open, onOpenChange }`. reason textarea(필수). zod 검증 실패/빈값 시 submit disabled. 성공 시 `onOpenChange(false)`. 닫힐 때 폼+mutation reset(기존 dialog reset 패턴 따름) |
| `features/partyrooms/ui/crew-card.tsx` | 신규 | 현 `partyroom-detail-cards.tsx` 섹션 4(크루 `Card`+`Table`) 추출. props `{ partyroomId, crews }`. "액션" 컬럼 추가: 비-HOST 행 = "강퇴" `Button`(`variant="destructive"` 또는 outline+destructive 텍스트, 기존 강제종료 스타일 일치), HOST 행 = `disabled` Button + `title`/tooltip "HOST 강퇴 불가". 로컬 state 로 열린 crew 다이얼로그 1개 관리 |
| `features/partyrooms/ui/partyroom-detail-cards.tsx` | 수정 | 섹션 4 인라인 블록을 `<CrewCard partyroomId={detail.partyroomId} crews={detail.crews} />` 로 교체. 그 외 섹션(재생/DJ큐/페널티/신고/액션) 불변 |

크루 행 식별: `detail.crews[].crewId`(상세에 이미 표시 중), `gradeType`(HOST 판별), `nickname`(다이얼로그 라벨용 `crewLabel = "#{crewId} {nickname ?? memberId}"`).

---

## 4. 데이터 흐름

```
파티룸 상세(/partyrooms/:id)
  └ CrewCard
      └ crew 행(예: crewId=14, gradeType=DJ) "강퇴" 클릭
          └ ExpelCrewDialog(open, crewId=14, crewLabel) — reason 입력
              └ submit → useExpelCrew.mutate({ partyroomId, crewId:14, reason })
                  └ applyCrewPenalty → http POST /api/v1/admin/partyrooms/{id}/penalties
                     body { crewId:14, penaltyType:"ONE_TIME_EXPULSION", reason }
                     (http 클라이언트가 CSRF/credentials/Origin 처리)
                  └ 201
                     ├ invalidateQueries(["partyrooms"]) → 상세 refetch → crew 14 목록에서 제거
                     ├ mutationSuccessToast("크루 강퇴 완료")
                     └ dialog close
```

백엔드가 DJ 큐 정리/skipPlayback/EXIT 브로드캐스트까지 수행하므로 프론트는 무효화만 담당.

---

## 5. 에러 처리

| 상황 | 처리 |
|---|---|
| reason 빈값/공백/255 초과 | 클라이언트 zod + submit 버튼 disabled (서버 도달 전 차단) |
| 룸 TERMINATED (`ALREADY_TERMINATED`) | `http`→`ApiError`→`mutationErrorToast` 메시지. 다이얼로그 유지(재시도 가능) |
| crew 미존재 / partyroom 불일치 (`NOT_FOUND_ROOM`) | 동일 — 토스트, 다이얼로그 유지 |
| 네트워크/5xx | 동일 — `mutationErrorToast` |
| 이미 inactive 한 crew | 백엔드 멱등 처리(`deactivateCrew` 0행) → 200/201 정상. 무효화로 목록 정합 |

다이얼로그는 에러 시 닫지 않음(성공 시에만 close) — 기존 terminate/suspend 다이얼로그 동작과 일치.

권한: admin 콘솔 전체가 admin 인증 뒤 + 엔드포인트 `@adminAuth.isAdmin()`. 기존 terminate 와 동일 등급, 추가 게이팅 없음.

---

## 6. 테스트 (기존 `__tests__` 패턴 미러)

| 파일 | 케이스 |
|---|---|
| `features/partyrooms/api/__tests__/partyrooms-api.test.ts` | `applyCrewPenalty`: path `/api/v1/admin/partyrooms/{id}/penalties`, method POST, body 에 `penaltyType:"ONE_TIME_EXPULSION"` + 전달된 crewId/reason 포함 |
| `features/partyrooms/api/__tests__/use-expel-crew.test.tsx` | 성공 → `["partyrooms"]` invalidate 호출 + 성공 토스트 / 실패 → 에러 토스트, invalidate 미호출 |
| `features/partyrooms/ui/__tests__/crew-card.test.tsx` | (a) HOST 행 강퇴 버튼 `disabled` + tooltip 텍스트 (b) 비-HOST 행 클릭 → 다이얼로그 open + 올바른 crewId 전달 (c) `crews=[]` → "크루 없음" (d) 한 행 다이얼로그 열려도 다른 행 독립 |
| `features/partyrooms/ui/__tests__/expel-crew-dialog.test.tsx` | (a) reason 빈값/공백/256자 → submit disabled (b) 유효 reason submit → mutate({partyroomId,crewId,reason}) 호출 (c) 성공 → onOpenChange(false) (d) 실패 → 다이얼로그 유지 (e) close 시 폼 reset |
| `src/test/mocks/handlers/partyrooms.ts` | penalties 엔드포인트 MSW 핸들러(성공 201 `{data:{penaltyId:null}}`, 에러 케이스 토글) 추가 |
| `pages/__tests__/partyroom-detail-page.test.tsx` | 회귀: 상세 페이지 렌더 시 CrewCard 표시 + 기존 섹션 불변 |

---

## 7. 회귀 체크

- `partyroom-detail-cards.tsx` 섹션 4 추출 후 시각/구조 동일(크루 ID/회원 ID/등급/닉네임/입장시각 + 신규 액션 컬럼). 나머지 7개 섹션 diff 없음
- 기존 `partyroom-detail-cards.test.tsx` 통과 유지(크루 카드가 별 컴포넌트로 빠져도 통합 렌더 동일)
- 신규 mutation 이 `["partyrooms"]` prefix invalidate → 목록/상세 캐시 정합 (기존 terminate 와 동일 전략)

## 8. 범위 밖 (YAGNI 재확인)

PERMANENT_EXPULSION · 페널티 해제 · bulk 강퇴 · DJ큐 행 강퇴 · 크루 행 액션 드롭다운 · T1-3 백엔드 invariant fix. 모두 별 task/PR.
