# 가상 크루 관리 IA 개편 스펙 (2026-07-13)

이슈: pfplay/pfplay-admin#28

## 목표
운영자가 **무엇부터 셋팅하고 어떻게 해제하는지** 화면만 봐도 알 수 있는, 순서가 보이는 **응집된** 가상 크루 관리 흐름. 과거형(채팅·페르소나 전제로 과분할)에서, 현재 필요분 + 운영 액션 중심으로 개편.

## 개념 모델 (셋팅 수준)
| 계층 | 대상 | 저장 |
|---|---|---|
| ① 전역 자산 | 봇 계정 풀 · 송팩 라이브러리 · 페르소나 라이브러리 | bot 계정 / song_pack / virtual_persona |
| ② 봇 단위 | 봇별 페르소나 배정(1:1) | bot_persona_assignment |
| ③ 파티룸 단위 | 크루 config: status/총원(targetCount)/DJ수(djBotCount)/송팩(songPackId) | partyroom_virtual_crew_config |
| 전역 런타임 | 채팅 설정(on/off + probability/cooldown/context/tokens) | system_config `vcrew.chat.*` |

배치 필수 선행조건(백엔드 확정): status=MANAGED + targetCount(≥1) + djBotCount(0..target) + **송팩**(없으면 SKIP_NO_SONG_PACK로 봇 0). 페르소나=선택(없으면 무배정 배치), 채팅=전역·기본 OFF.

## 화면 맵
| 화면 | 계층 | 라우트 | 비고 |
|---|---|---|---|
| **허브(가이드)** | 개요 | `/virtual-crew` | STEP 1~4 상태+바로가기+경고. 신설 |
| 봇 풀 | ① | `/virtual-crew/pool` | 봇 생산·재고 + 봇별 페르소나 배정. 유지 |
| 송팩 | ① | `/virtual-crew/song-packs`(+`/:packId`) | 라이브러리·빌더. nav 노출 |
| 페르소나 | ① | `/virtual-crew/personas` | 라이브러리 CRUD. 유지(노출) |
| 채팅 설정 | 전역 | `/virtual-crew/chat-config` | on/off+파라미터. 유지(노출) |
| **크루 배치 & 운영** | ③ | `/virtual-crew/rooms` | 방별 config + 적용/드레인/재배치 + 일괄. 신설 |
| 파티룸 상세 카드 | ③ | `/partyrooms/:id` | 방 중심 진입점. 유지 |

## 허브 레이아웃 (`/virtual-crew`)
STEP 1 봇 풀(유휴/전체, [충원]) → STEP 2 송팩(개수, [관리]) → STEP 3 페르소나·채팅(선택, 채팅 상태, [설정]) → STEP 4 크루 배치(MANAGED 방/배치봇, [배치 관리]). 각 단계 준비상태 ✅/⚪/⚠️. **전제조건 자동 점검**: 유휴 봇 부족 / 송팩 없는 MANAGED 방 → 경고 + 바로가기.

## 크루 배치 화면 (`/virtual-crew/rooms`)
- 방 목록(가상 크루 관점): 상태·총원·DJ·송팩·현재 배치봇.
- **방별 액션**: 적용(apply) · 드레인(drain) · 재배치(replace). 기존 `use-apply/-drain/-replace-virtual-crew` 재사용.
- **선택 일괄**: 적용/드레인/재배치(bulk). 기존 bulk 훅 재사용.
- config 폼: MANAGED 시 총원·DJ·**송팩 필수**.

## 사이드바 (접이식)
```
운영 관리
  · 회원 · 파티룸 · 신고 · 사용자 피드백
  · 가상 크루 ▾   (클릭→허브 / 펼침→상세)
      · 봇 풀 · 송팩 · 페르소나 · 채팅 설정 · 크루 배치
```
- `NavItem`에 `children?` + 접이식(확장 상태) 지원. 라벨 "가상 DJ"→"가상 크루".

## 셋업/해제 흐름 (UX가 안내)
- 셋업(위→아래): 봇 충원 → 송팩 생성 → (선택 채팅/페르소나) → 크루 배치 방별 설정 → 적용.
- 운영/해제(크루 배치): 재배치(설정·송팩 반영) · 드레인(봇 회수, 유휴 복귀) · status OFF(종료). 봇은 풀↔방 순환(재고 수치로 가시화).

## 비스코프
- 백엔드 무변경(기존 API 재사용). 채팅 상시 ON 아님(전역 토글 기본 OFF).
- 드레인 2종(drain / drain-resources) 노출 정책은 구현 시 확정.
