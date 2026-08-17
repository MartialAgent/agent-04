# 2-2단계 완성 예시 (정답지)

> ⚠️ **먼저 열지 마세요.** 이 폴더는 [`../docs/`](../docs/00-how-to-use.md)를 따라
> 직접 만들다가 **막혔을 때 펴보는 정답지**입니다.

## 이 폴더에 뭐가 있나

| 파일 | 구분 | 역할 |
|---|---|---|
| [`index.html`](index.html) | 🖥 프론트 | 로그인 화면 + 채팅 화면 |
| [`style.css`](style.css) | 🖥 프론트 | 2-1 + 진행과정 · 근거칩 · 로그인 |
| [`script.js`](script.js) | 🖥 프론트 | 동작 + 진행과정/근거 표시 + 세션 관리 |
| [`app.py`](app.py) | 🔧 백 | 서버. **에이전트를 부르기만** 함 |
| [`agent.py`](agent.py) | 🔧 백 | **그래프** — 노드 · 엣지 · 상태 · 조건분기 · 반복 |
| [`brain.py`](brain.py) | 🔧 백 | **판단** — ★ 여기가 진짜 LLM이 들어갈 자리 |
| [`data.py`](data.py) | 🔧 백 | **더미 사내 데이터** — 원우가 갈아끼우는 곳 |
| [`requirements.txt`](requirements.txt) | | 라이브러리 3줄 |

각 파일 맨 위 주석에 "어느 STEP에서 무엇이 추가됐는지"가 적혀 있습니다.

## 돌려보기

```powershell
# 리포 맨 위 폴더에서
.venv\Scripts\Activate.ps1
pip install -r 02-web/02-web-goal/example/requirements.txt
uvicorn app:app --reload --app-dir 02-web/02-web-goal/example
```

→ 브라우저에서 **http://localhost:8000** · 아무 이름이나 넣고 시작

**해볼 질문**

| 질문 | 보게 되는 것 |
|---|---|
| `B-2041 언제 들어와?` | `think → action → think` 3단계 + 근거 칩 |
| `안녕?` | `think` 1단계, 근거 칩 없음 ← **갈림길의 다른 쪽** |
| `품번 목록 보여줘` | `list_codes` 도구 |
| `A-1023이랑 C-3077 재고 알려줘` | `action` 두 줄 |
| `Z-9999?` | "등록되지 않은 품번" — **지어내지 않음** |

### 서버 없이 에이전트만

```powershell
python 02-web/02-web-goal/example/agent.py
```

## ★ 여기서 진짜인 것 / 가짜인 것

| | 진짜 | 가짜 (더미) |
|---|---|---|
| 그래프 구조 · 서버 · API · 화면 | ✅ | |
| 판단하는 두뇌 | | ❌ `brain.py`의 if 문 |
| 사내 데이터 | | ❌ `data.py`의 딕셔너리 |
| 로그인 | | ❌ 이름만 적으면 통과 |

**API 키도 `.env`도 외부 통신도 없습니다.** 인터넷이 끊겨도 끝까지 돌아갑니다.

3~5단계에서 진짜 LLM을 붙일 때 **바뀌는 건 `brain.py` 하나뿐입니다.**

---

이전 ← [`../docs/`](../docs/00-how-to-use.md) ｜ 다음 → [3단계 `03-nanogpt/`](../../../03-nanogpt/README.md)
