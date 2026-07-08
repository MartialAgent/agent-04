# 3단계 — 에이전트 바이브코딩: 랭그래프(LangGraph) 입문

## 1. 에이전트가 뭔가요?

| | 챗봇 | 에이전트 |
|---|---|---|
| 동작 | 질문 → 답 (1회성) | 판단 → 행동 → 확인 → 다음 행동 (여러 단계) |
| 비유 | 안내데스크 직원 | 일을 통째로 맡기는 비서 |

**랭그래프(LangGraph)** 는 에이전트를 만드는 대표적인 파이썬 라이브러리입니다.
핵심 아이디어: **AI의 작업 흐름을 순서도(그래프)로 그린다.**

```
[시작] ──> [노드: 질문에 답하기] ──> [끝]
```

- **노드(Node)** = 작업 한 단계 (파이썬 함수 하나)
- **엣지(Edge)** = 화살표, "다음엔 이거 해"
- **상태(State)** = 노드들이 주고받는 공유 메모장

이 세 개만 알면 랭그래프의 80%를 아는 겁니다.

---

## 2. 준비: Gemini API 키 설정 🔑

이번 실습은 구글의 **Gemini 2.5 Flash-Lite** 모델을 사용합니다 (빠르고 저렴/무료 티어).

### API 키란?
AI 회사 서버에 "나 사용 허가 받은 사람이야"라고 보여주는 **출입증**입니다.
- 훈이 수업 시간에 **새로 발급해서 전달**하고, **수업이 끝나면 폐기**합니다.
- 그래서 키를 코드에 직접 쓰지 않고 **`.env` 파일**에 넣습니다. (`.env`는 깃허브에 안 올라감)

### 설정 순서

1. 리포 **맨 위 폴더**에서 `.env.example` 파일을 복사 → 이름을 `.env`로 변경
2. 훈이 보내준 키를 붙여넣기:
   ```
   GOOGLE_API_KEY=AIza...받은키...
   ```
3. 터미널에서 라이브러리 설치:
   ```powershell
   pip install -r 03-agent/requirements.txt
   ```

> ⚠️ **절대 하면 안 되는 것**: API 키를 코드 파일에 직접 쓰고 깃허브에 푸시하기.
> 봇들이 깃허브를 24시간 뒤지며 유출된 키를 수집합니다. 키는 항상 `.env`에!

---

## 3. 가장 기본 코드 — 이것만 이해하면 됩니다

[`basic_graph.py`](basic_graph.py) 전체가 아래 몇 줄이 전부입니다:

```python
# ① 상태: 노드들이 주고받는 공유 메모장
class State(TypedDict):
    question: str
    answer: str

# ② 노드: 작업 한 단계 = 함수 하나
def answer_node(state):
    response = llm.invoke(state["question"])   # AI에게 질문
    return {"answer": response.content}        # 메모장에 답 적기

# ③ 그래프: 순서도 조립
graph = StateGraph(State)
graph.add_node("answer", answer_node)   # 노드 등록
graph.add_edge(START, "answer")         # 시작 → answer
graph.add_edge("answer", END)           # answer → 끝
app = graph.compile()

# ④ 실행
result = app.invoke({"question": "안녕!"})
```

### 실행해보기 🎯

```powershell
python 03-agent/basic_graph.py
```

AI의 답이 출력되면 성공!

---

## 4. 바이브코딩 미션 🚀

이제 기본 구조를 이해했으니, AI에게 요청해서 **직접 기능을 만들어보세요.**

> "basic_graph.py를 참고해서, ○○하는 랭그래프 에이전트를 만들어줘.
> 모델은 gemini-2.5-flash-lite, API 키는 .env의 GOOGLE_API_KEY를 써."

추천 미션 (쉬운 순):
1. **번역 에이전트** — 한국어 입력 → 영어로 번역해서 출력
2. **3단계 요약 에이전트** — 긴 글 입력 → `요약 노드` → `핵심단어 추출 노드` 2개를 거쳐 출력 (노드 2개 연결 연습)
3. **판단 에이전트** — 입력이 질문이면 답하고, 아니면 맞장구치기 (조건 분기 `add_conditional_edges` 체험)
4. **대화 반복 에이전트** — `while` 문으로 계속 대화하는 챗봇

**미션의 진짜 목표**: 결과 코드에서 **노드가 몇 개인지, 화살표가 어떻게 이어졌는지** 스스로 찾아 설명하기.

---

## ✅ 체크포인트

- [ ] 노드 / 엣지 / 상태를 한 문장씩으로 설명할 수 있다
- [ ] `basic_graph.py`를 실행해서 AI의 답을 받았다
- [ ] 바이브코딩으로 나만의 에이전트를 하나 만들었다
- [ ] API 키를 왜 `.env`에 넣는지 설명할 수 있다

다음 → [`04-teacher/README.md`](../04-teacher/README.md)
