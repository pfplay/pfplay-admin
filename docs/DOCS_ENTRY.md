# 문서 색인

> 최종 갱신: 2026-07-31.

## 🟢 상시 문서 (현재 코드를 설명한다 — 틀리면 버그)

| 문서 | 언제 읽나 |
|---|---|
| [`../README.md`](../README.md) | 처음 들어왔을 때. 기능 트리·스택·구조·로컬 실행·인증 |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | 코드를 만지기 전. FSD 레이어 규칙, 데이터 흐름, HTTP/CSRF 규약, 테스트 전략 |
| [`OPERATIONS.md`](OPERATIONS.md) | 배포·환경변수·세션·운영 mutation·진단 |

## ⚪ 시점 산출물 (그 작업 시점의 설계·계획 — 갱신하지 않는다)

`docs/specs/` 는 설계서, `docs/plans/` 는 실행 계획이다. 파일명 앞의 날짜가 시점이다.
현재 코드와 다를 수 있으며, **"왜 이렇게 만들었나" 를 추적할 때만** 본다.

| 문서 | 주제 |
|---|---|
| `specs/2026-07-13-virtual-crew-admin-ia.md` | 가상 크루 어드민 IA 개편 (현 허브 구조의 근거) |
| `specs/2026-06-01-virtual-dj-p2-admin-design.md` · `plans/2026-06-01-virtual-dj-p2-admin.md` | 가상 DJ P2 어드민 |
| `specs/2026-05-16-admin-crew-expel-ui-design.md` · `plans/2026-05-16-admin-crew-expel-ui.md` | 크루 추방 UI |
| `specs/2026-05-02-api-alignment-audit.md` | 백엔드 API 정합성 감사 |
| `specs/2026-04-2*-admin-pr14{a..g}-design.md` · `plans/2026-04-2*-admin-pr14{a..g}.md` | 콘솔 초기 구축 PR 시리즈 |

## 문서를 고칠 때

- 🟢 상시 문서는 **코드를 바꾼 PR 안에서 같이** 고친다. 미루면 드리프트가 쌓인다
  (README 가 6개월 동안 존재하지 않는 페이지를 설명하고 있었던 이유).
- ⚪ 시점 산출물은 고치지 않는다. 낡은 것이 정상이다.
