# 2-1단계 완성 예시 (정답지)

> ⚠️ **먼저 열지 마세요.** 이 폴더는 [`../docs/`](../docs/00-how-to-use.md)를 따라
> 직접 만들다가 **막혔을 때 펴보는 정답지**입니다.
>
> 정답지를 먼저 보면 "만들어봤다"가 아니라 "읽어봤다"로 끝납니다.

## 이 폴더에 뭐가 있나

| 파일 | 언제 생겼나 | 역할 |
|---|---|---|
| [`index.html`](index.html) | STEP 1 | 뼈대 — 무엇이 있는가 |
| [`style.css`](style.css) | STEP 2 | 꾸미기 — 어떻게 보이는가 |
| [`script.js`](script.js) | STEP 3~6 | 동작 — 무슨 일이 일어나는가 |
| [`server.py`](server.py) | STEP 5~6 | 서버 — 답을 만들고 대화를 보관 |
| [`requirements.txt`](requirements.txt) | STEP 5 | 설치할 라이브러리 목록 (2개뿐) |

여기 있는 건 **STEP 6까지 다 끝난 최종 상태**입니다.
각 파일 맨 위 주석에 "어느 STEP에서 무엇이 추가됐는지"가 적혀 있습니다.

## 돌려보기

```powershell
# 리포 맨 위 폴더에서
.venv\Scripts\Activate.ps1
pip install -r 02-web/01-web-basic/example/requirements.txt
uvicorn server:app --reload --app-dir 02-web/01-web-basic/example
```

→ 브라우저에서 **http://localhost:8000**

> 💡 STEP 1~4만 확인하고 싶다면 서버 없이 `index.html`을 더블클릭해도 화면은 뜹니다.
> (다만 서버가 없으니 답변은 오지 않고 오류 말풍선이 뜹니다 — 그게 정상입니다)

## 여기엔 없는 것

API 키 · `.env` · 로그인 · 외부 서비스 호출 — **하나도 없습니다.**
2-1단계는 인터넷이 끊겨도 끝까지 돌아갑니다. 계정에서 막히는 사람이 없도록 일부러 그렇게 만들었습니다.

---

이전 ← [`../docs/`](../docs/00-how-to-use.md) ｜ 다음 → [2-2단계](../../02-web-goal/02-web-goal.md)
