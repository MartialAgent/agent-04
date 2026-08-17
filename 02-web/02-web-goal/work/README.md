# 작업 폴더 (2-2단계)

**여러분이 만든 결과물이 쌓이는 곳입니다.**

2-1단계와 달리 **빈 폴더에서 시작하지 않습니다.**
[`../docs/agent.md`](../docs/agent.md)의 STEP 0에서 2-1단계의 **화면 세 개**를 여기로 복사합니다.

| STEP | 생기는 / 바뀌는 파일 |
|---|---|
| 0 | `index.html` `style.css` `script.js` (2-1에서 복사), `CLAUDE.md` |
| 1 | `data.js` `brain.js` **신규** |
| 2 | `agent.js` **신규** |
| 3 | `script.js` `style.css` 수정 (진행 과정 표시) |
| 4 | `script.js` `style.css` 수정 (근거 칩) |
| 5 | `index.html` `style.css` `script.js` 수정 (한 화면으로 펴기) |
| 6 | `index.html` `script.js` `style.css` 수정 (로그인 · 대화방) |

## 실행

**터미널 명령이 없습니다.** `index.html`을 **더블클릭**하세요.

> 2단계는 2-1이든 2-2든 **브라우저 안에서 끝납니다.**
> 결과물에 `app.py`·`server.py`·`requirements.txt`가 생겼다면 **잘못 만든 것입니다** —
> [`../docs/agent.md`](../docs/agent.md)의 3절(넘지 말아야 할 선)을 다시 보세요.

## 에이전트만 따로 테스트

F12 → Console 탭에서 직접 불러볼 수 있습니다.

```js
runAgent("B-2041 언제 들어와?")   // think → action → think
runAgent("안녕?")                 // think 하나로 끝  ← 갈림길
```

---

시작 → [`../docs/prd.md`](../docs/prd.md)
