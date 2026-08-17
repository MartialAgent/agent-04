# 4-3단계 — 에이전트 구현 방식들

[4-1단계](01-agent-basic.md)에서 만든 건 **에이전트 한 마리**입니다. 도구를 쓰고, 판단하고, 반복합니다.
[4-2단계](02-agent-category.md)에서 **어떤 방식으로 만들지**를 4축으로 골랐습니다.
여기서부터는 그 한 마리를 **실제 업무에 쓸 수 있게 만드는 방식들**을 다룹니다.

> 📌 4-2가 **"무엇을 고를까"** 였다면, 4-3은 **"고른 걸 어떻게 짤까"** 입니다.
> 이 문서의 코드는 전부 [4-2단계 축 A3](02-agent-category.md#2-축-a--오케스트레이션-흐름을-누가-정하나)(코드 프레임워크) 기준입니다.

> 📥 코드는 전부 이 리포 기준(**Gemini + `.env`의 `GOOGLE_API_KEY`**)으로 **실행해서 확인했습니다.**
> 실행 결과도 같이 실었고, **처음에 실패한 것은 실패한 채로 먼저 보여줍니다.**

## 난이도

| 표시 | 대상 | 할 일 |
|---|---|---|
| 🟢 | 전원 | 읽고 "내 업무엔 뭐가 필요한가" 고르기 |
| 🟡 | 전원 (권장) | 코드를 복사해 실행하고 값 바꿔보기 |
| 🔴 | 개발 트랙 | 내 도메인에 맞게 고쳐 짜기 |

## 목차

| 절 | 내용 | 난이도 |
|---|---|---|
| [0](#0-공통-준비) | 공통 준비 | 🟡 |
| [1](#1-패턴-지도--언제-무엇이-필요한가) | **패턴 지도** — 언제 무엇이 필요한가 | 🟢 |
| [2](#2-메모리--대화를-어디까지-기억할까) | 메모리 — 대화를 어디까지 기억할까 | 🟡 |
| [3](#3-멀티에이전트--일을-나눠-맡기기) | 멀티에이전트 — 일을 나눠 맡기기 | 🟡 |
| [4](#4-잠깐--지금-에이전트를-만들고-있는게-맞나) | **잠깐** — 지금 에이전트가 맞나 | 🟢 |
| [5](#5-평가--잘-도는지-어떻게-아나) | 평가 — 잘 도는지 어떻게 아나 | 🔴 |
| [6](#6-내-도메인에-무엇을-고를까) | 내 도메인에 무엇을 고를까 | 🟢 |

---

## 0. 공통 준비

🟡 · 2-2단계에서 만든 환경 그대로입니다. **추가 설치 없습니다.**

아래 절의 코드는 전부 이 머리말을 공유합니다.

```python
from pathlib import Path
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()   # .env 의 GOOGLE_API_KEY

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")
```

---

## 1. 패턴 지도 — 언제 무엇이 필요한가

🟢 **전원**

에이전트가 잘 안 될 때, 증상마다 처방이 다릅니다. **먼저 증상을 고르세요.**

| 증상 | 필요한 것 | 절 |
|---|---|---|
| 앞에서 한 말을 자꾸 까먹는다 | **메모리** | [2](#2-메모리--대화를-어디까지-기억할까) |
| 대화가 길어지면 느려지고 비싸진다 | **메모리 (요약)** | [2-3](#2-3-요약-기반--오래된-건-압축한다) |
| 프롬프트 하나로 다 시키려니 답이 어중간하다 | **멀티에이전트 (순차)** | [3-1](#3-1-순차--한-줄로-이어붙이기) |
| 여러 관점이 필요한데 하나씩 하면 느리다 | **멀티에이전트 (병렬)** | [3-2](#3-2-병렬--동시에-돌리기) |
| 요청 종류가 너무 달라서 프롬프트가 안 잡힌다 | **멀티에이전트 (슈퍼바이저)** | [3-3](#3-3-슈퍼바이저--누구에게-맡길지-정하는-노드) |
| 잘 되는 것 같은데 확신이 안 선다 | **평가** | [5](#5-평가--잘-도는지-어떻게-아나) |

> ⚠️ **전부 다 붙이지 마세요.** 하나씩, 증상이 있을 때만 붙입니다.
> 이유는 [4절](#4-잠깐--지금-에이전트를-만들고-있는게-맞나)에 있습니다.

---

## 2. 메모리 — 대화를 어디까지 기억할까

🟡

### 2-1. 메모리 유형 4가지 🟢

| 유형 | 설명 | 구현 |
|---|---|---|
| **단기(In-Context)** | 지금 대화창 안 | 메시지 리스트 |
| **장기(External)** | DB·파일에 저장 | JSON, 벡터DB |
| **에피소딕** | 과거 "대화"를 기억 | 요약 + 검색 |
| **시맨틱** | 과거 "사실"을 기억 | 임베딩 + 검색 |

지금까지 쓴 건 전부 **단기**입니다. `messages` 리스트가 곧 기억이었습니다.
문제는 이게 **무한히 길어진다**는 것입니다. 토큰이 늘면 느려지고 비싸집니다.

### 2-2. 슬라이딩 윈도우 — 최근 N개만 들고 간다

가장 단순한 해법입니다. **오래된 건 그냥 버립니다.**

```python
from collections import deque

class WindowMemoryAgent:
    def __init__(self, max_turns: int = 6):
        self.history = deque(maxlen=max_turns)   # ★ 넘치면 앞에서부터 자동으로 버림
        self.system = "너는 간결하게 답하는 조수다. 한국어로 한두 문장."

    def chat(self, text: str) -> str:
        self.history.append(HumanMessage(content=text))
        reply = llm.invoke([SystemMessage(content=self.system)] + list(self.history))
        self.history.append(AIMessage(content=reply.content))
        return reply.content


agent = WindowMemoryAgent(max_turns=6)
print(agent.chat("내 이름은 앨리스야."))
print(agent.chat("내 이름이 뭐야?"))
```

실행 결과:

```
앨리스님, 만나서 반갑습니다.
당신의 이름은 앨리스입니다.
```

**장점** 코드 5줄. **단점** `max_turns`를 넘어가는 순간 이름을 잊습니다.

> 🔎 **실험:** `max_turns=2`로 줄이고 사이에 딴 얘기를 두 번 끼워보세요. 이름을 잊습니다.

### 2-3. 요약 기반 — 오래된 건 압축한다

버리는 대신 **값싼 호출로 요약해서 시스템 프롬프트에 넣습니다.**

#### 먼저, 실패한 버전 ⚠️

처음 짠 코드는 이랬고, **실행했더니 실패했습니다.**

```python
    def chat(self, text: str) -> str:
        self.recent.append(HumanMessage(content=text))
        system = self.system + (f"\n\n[이전 대화 요약]\n{self.summary}" if self.summary else "")
        ...
```

```
   [압축] 요약 = 밥은 제조업에서 재고 관리가 가장 힘들다고 합니다.
> 내 이름과 업종이 뭐였지?
< 죄송하지만, 저는 이전 대화 내용을 기억하지 못합니다.     ← ❌
```

**요약에는 답이 들어 있는데도** 모델이 "기억 못 한다"고 답했습니다.
`[이전 대화 요약]` 이라는 라벨만 붙였을 뿐, **그걸 자기 기억으로 취급하라고 말한 적이 없기 때문**입니다.

#### 고친 버전 ✅

```python
class SummaryMemoryAgent:
    def __init__(self, keep_recent: int = 4):
        self.recent, self.summary, self.keep_recent = [], "", keep_recent

    def _compress(self):
        """최근 N개만 남기고 나머지는 요약으로 접는다."""
        if len(self.recent) <= self.keep_recent:
            return
        old, self.recent = self.recent[:-self.keep_recent], self.recent[-self.keep_recent:]
        lines = "\n".join(f"{m.type}: {m.content}" for m in old)
        self.summary = llm.invoke(
            f"이전 요약:\n{self.summary}\n\n새 대화:\n{lines}\n\n"
            "위를 3줄 이내로 요약해라. 사람의 이름·소속·선호처럼 "
            "나중에 다시 필요한 사실은 반드시 남겨라."      # ★ 무엇을 남길지 지정
        ).content.strip()

    def chat(self, text: str) -> str:
        self.recent.append(HumanMessage(content=text))
        system = "너는 간결하게 답하는 조수다. 한국어로 한두 문장."
        if self.summary:
            # ★★ 실패한 버전과의 차이는 이 문단 하나뿐입니다
            system += ("\n\n아래는 이 대화의 앞부분에서 네가 이미 알게 된 사실이다. "
                       "네 기억으로 취급하고, 질문에 해당하면 이걸 근거로 답해라. "
                       "'기억하지 못한다'고 말하지 마라.\n"
                       f"{self.summary}")
        reply = llm.invoke([SystemMessage(content=system)] + self.recent)
        self.recent.append(AIMessage(content=reply.content))
        self._compress()
        return reply.content
```

실행 결과:

```
> 내 이름은 밥이고 제조업에서 일해.
< 안녕하세요, 밥님. 제조업에 종사하시는군요.
> 재고 관리가 제일 힘들어.
< 재고 관리가 가장 어려운 점이시라니, 많은 제조업체들이 공감할 문제입니다.
> 오늘 날씨 좋네.
   [압축] 요약 = 밥님은 제조업에서 일합니다.
> 커피 한 잔 했어.
   [압축] 요약 = 밥님은 제조업에서 일하며, 재고 관리가 가장 어려운 점입니다.
> 내 이름과 업종이 뭐였지?
< 밥님은 제조업에서 일하십니다.                            ← ✅
```

> 🎯 **이 실패에서 가져갈 것**
> **"정보를 넣었다"와 "쓰라고 말했다"는 다릅니다.**
> 프롬프트에 데이터를 넣어두면 알아서 쓸 거라고 기대하면 안 됩니다.
> **무엇으로 취급할지, 언제 쓸지를 문장으로 적어야 합니다.**
> 4-1단계에서 도구 docstring을 뭉개면 도구를 안 쓰던 것과 정확히 같은 현상입니다.

### 2-4. 랭그래프에는 이미 있다

[4-1단계 7-1](01-agent-basic.md#7-1-checkpointer--대화-기억)에서 본 `checkpointer`가 이 일을 대신합니다.

| | 직접 만들기 | `checkpointer` |
|---|---|---|
| 대화 저장 | 클래스에 리스트 들고 있기 | `compile(checkpointer=MemorySaver())` |
| 사용자 구분 | 딕셔너리로 직접 관리 | `thread_id` |
| 영구 저장 | DB 코드 직접 | `langgraph-checkpoint-postgres` |

> **그럼 왜 직접 만들어봤나?** `checkpointer`는 **전량 보관**입니다.
> 대화가 길어질 때 **무엇을 버리고 무엇을 요약할지는 여전히 직접 정해야 합니다.**
> Generative Agents 논문([2304.03442](https://arxiv.org/abs/2304.03442))의 기억-반성 구조가
> 이 결정을 정교하게 만든 버전입니다.

---

## 3. 멀티에이전트 — 일을 나눠 맡기기

🟡 · 프롬프트 하나에 다 시키면 답이 어중간해집니다. **역할을 나눕니다.**

공통으로 쓸 헬퍼 하나:

```python
def role_agent(role: str, instruction: str, text: str) -> str:
    return llm.invoke([SystemMessage(content=f"너는 {role}다. {instruction}"),
                       HumanMessage(content=text)]).content
```

### 3-1. 순차 — 한 줄로 이어붙이기

**앞의 결과가 뒤의 입력**이 되는 형태. 가장 흔합니다.

```python
def pipeline(topic: str) -> dict:
    research = role_agent("조사 전문가",   "핵심 사실만 5줄 이내로.", f"{topic} 조사해줘")
    draft    = role_agent("글쓰기 전문가", "읽기 쉽게 3문단으로.",   f"재작성:\n\n{research}")
    review   = role_agent("편집자",       "문제점만 3개 이내로 지적.", f"평가:\n\n{draft}")
    return {"research": research, "draft": draft, "review": review}
```

```
[research] 사내 재고 관리 자동화는 효율성 증대, 오류 감소, 비용 절감을 목표로 합니다...
[draft]    ## 사내 재고 관리 자동화, 효율성을 높이는 핵심 전략...
[review]   1. "첨단 솔루션"의 구체성 부족: 바코드, RFID, ERP 연동을 언급했지만...
```

> 💡 [5단계의 `writing-skills.md`](../05-handson/writing-skills.md)가 이 패턴의 실무판입니다.
> 거기선 파이프라인 7단계에 **사람 승인**이 끼어 있습니다.

### 3-2. 병렬 — 동시에 돌리기

**서로 결과를 안 보는** 작업이면 동시에 돌립니다. 3배 빨라집니다.

```python
import concurrent.futures

def parallel_agents(topic: str, roles: list) -> list:
    def one(role):
        return role, role_agent(f"{role} 전문가", "3줄 이내.", f"{topic}의 {role} 측면은?")
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(roles)) as ex:
        return list(ex.map(one, roles))

for role, ans in parallel_agents("AI 에이전트 도입", ["기술", "비용", "리스크"]):
    print(f"[{role}] {ans}")
```

```
[기술]   AI 에이전트는 특정 작업을 자율적으로 수행하는 소프트웨어 프로그램으로...
[비용]   초기 개발 및 통합 비용, 지속적인 운영 및 유지보수 비용, 그리고...
[리스크] 의도치 않은 행동이나 오류 발생 가능성, 데이터 편향으로 인한 차별...
```

> **판단 기준:** 뒤 작업이 앞 결과를 **읽어야 하면 순차**, 아니면 **병렬**입니다.

### 3-3. 슈퍼바이저 — 누구에게 맡길지 정하는 노드

요청 종류가 너무 다르면, **먼저 분류하는 노드**를 둡니다.
[`domain_agent.py`](../05-handson/domain_agent.py)가 이미 이 구조입니다.

#### 먼저, 실패한 버전 ⚠️

```python
def supervisor(state):
    pick = llm.invoke(f"다음 일을 누구에게 맡길까? "
                      f"analyst / writer / lawyer 중 한 단어로만 답해라.\n\n"
                      f"일: {state['task']}").content.strip().lower()
```

```
> 이 계약서에 '무제한 책임' 조항이 있는데 괜찮아?
   [supervisor] → analyst                                  ← ❌ 법무 질문인데
< [analyst] 데이터 분석가로서 숫자와 근거에 기반하여 답변드리겠습니다...
```

**이름만 주고 각자 뭘 하는지 안 알려줬기 때문**입니다.
모델이 `lawyer`라는 단어에서 업무 범위를 추측해야 했습니다.

#### 고친 버전 ✅

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

WORKERS = {
    "analyst": ("너는 데이터 분석가다. 숫자와 근거 위주로 답해라.",
                "숫자·데이터·통계·추세 분석"),          # ★ 두 번째 칸이 추가된 것
    "writer":  ("너는 카피라이터다. 짧고 매력적으로 써라.",
                "홍보 문구·제목·소개글 작성"),
    "lawyer":  ("너는 법무 담당이다. 위험 요소를 지적해라.",
                "계약·약관·규정·법적 위험 검토"),
}

class SupState(TypedDict):
    task: str
    worker: str
    result: str

def supervisor(state: SupState) -> dict:
    menu = "\n".join(f"- {k}: {desc}" for k, (_, desc) in WORKERS.items())
    pick = llm.invoke(
        f"다음 일을 누구에게 맡길까? 아래 중 한 단어로만 답해라.\n\n{menu}\n\n"
        f"일: {state['task']}"
    ).content.strip().lower()
    if pick not in WORKERS:
        pick = "analyst"                      # 애매하면 기본값
    return {"worker": pick}

def work(state: SupState) -> dict:
    w = state["worker"]
    r = llm.invoke([SystemMessage(content=WORKERS[w][0]),
                    HumanMessage(content=state["task"])]).content
    return {"result": f"[{w}] {r}"}

g = StateGraph(SupState)
g.add_node("supervisor", supervisor)
g.add_node("work", work)
g.add_edge(START, "supervisor")
g.add_edge("supervisor", "work")
g.add_edge("work", END)
SUP = g.compile()
```

```
> 지난 분기 이탈 고객 5곳의 공통점을 분석해줘   → analyst  ✅
> 신제품 런칭 문구 한 줄 써줘                  → writer   ✅
> 이 계약서에 '무제한 책임' 조항이 있는데 괜찮아? → lawyer   ✅
```

> 🎯 **2-3의 실패와 같은 교훈입니다.**
> **선택지를 나열하는 것만으로는 부족하고, 각 선택지가 무엇인지 적어야 합니다.**
> 도구 docstring · 요약 라벨 · 분류 메뉴 — 전부 같은 자리입니다.

### 3-4. 세 방식 비교

| | 순차 | 병렬 | 슈퍼바이저 |
|---|---|---|---|
| 언제 | 뒤가 앞 결과를 씀 | 서로 독립 | 요청 종류가 다양 |
| 호출 수 | N번 (순서대로) | N번 (동시에) | 1 + 1번 |
| 랭그래프로 | 노드를 일직선 연결 | (파이썬 스레드가 더 단순) | 조건부 엣지 |
| 실패 지점 | 앞이 틀리면 전부 틀림 | 결과를 합칠 사람이 필요 | **분류가 틀리면 끝** |

---

## 4. 잠깐 — 지금 에이전트를 만들고 있는게 맞나

🟢 **전원 필수**

3-1의 순차 파이프라인을 다시 보세요.

```python
research = role_agent(...)
draft    = role_agent(...)
review   = role_agent(...)
```

**갈림길도 없고 반복도 없습니다.** 이건 그냥 **함수 세 개를 순서대로 부른 것**입니다.

Anthropic의 [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)는 이 둘을 나눕니다.

| | 워크플로(Workflow) | 에이전트(Agent) |
|---|---|---|
| 경로 | **사람이 코드로 정해둠** | **모델이 그때그때 정함** |
| 예 | 3-1 순차 파이프라인 | 4-1단계의 `think ↔ act` 루프 |
| 예측 가능성 | 높음 | 낮음 |
| 디버깅 | 쉬움 | 어려움 |
| 비용 | 예측됨 | 루프가 몇 번 돌지 모름 |

그리고 원칙이 하나입니다.

> **"가장 단순한 방법부터 쓰고, 필요할 때만 복잡도를 올려라."**

정리하면 이렇습니다.

```
경로가 정해져 있나?  ── 예 ──▶ 워크플로 (그냥 함수 순서대로 부르기)
        │
        아니오
        ▼
매번 다른 판단이 필요한가? ── 예 ──▶ 에이전트 (도구 + 루프)
```

> ⚠️ **04기가 특히 조심할 것**
> "에이전트를 만든다"가 목표가 되면 **필요 없는 자리에 루프를 넣게 됩니다.**
> 내 업무의 절반은 아마 **워크플로로 충분**합니다. 그게 더 싸고, 빠르고, 안 틀립니다.
> [3절 표](#3-4-세-방식-비교)에서 「슈퍼바이저 — 분류가 틀리면 끝」이 그 대가입니다.

---

## 5. 평가 — 잘 도는지 어떻게 아나

🔴 · **석사과정이라면 이 절이 가장 중요합니다.** 논문이 되려면 결국 숫자가 필요합니다.

### 5-1. 규칙 기반 지표

정답을 미리 아는 경우입니다. 싸고 빠르고 재현됩니다.

```python
def tool_call_accuracy(expected: list, actual: list) -> float:
    """기대한 도구를 실제로 불렀는가"""
    hit = sum(1 for e, a in zip(expected, actual) if e == a)
    return hit / max(len(expected), 1)

def task_completion_rate(tasks: list, completed: list) -> float:
    """맡긴 일을 끝냈는가"""
    done = set(completed)
    return sum(1 for t in tasks if t in done) / max(len(tasks), 1)
```

```python
>>> tool_call_accuracy(["lookup", "lookup", "search"], ["lookup", "search", "search"])
0.666...
>>> task_completion_rate(["a", "b", "c", "d"], ["a", "c"])
0.5
```

### 5-2. LLM-as-a-Judge

정답이 하나가 아닌 경우(요약 품질, 말투)는 **모델에게 채점을 시킵니다.**

```python
def llm_judge(question: str, answer: str, criterion: str) -> dict:
    raw = llm.invoke(
        f"아래 답변을 기준에 따라 1~5점으로 채점해라.\n"
        f"형식: 점수|한 줄 이유\n\n"
        f"기준: {criterion}\n질문: {question}\n답변: {answer}"
    ).content.strip()
    score, _, reason = raw.partition("|")
    return {"score": score.strip(), "reason": reason.strip()}
```

실행 결과:

```python
>>> llm_judge("B-2041 재고 있어?", "재고는 넉넉한 편입니다.",
...           "구체적 숫자를 근거로 제시했는가")
{'score': '1',
 'reason': '구체적인 수량이나 재고 상황에 대한 언급 없이 "넉넉한 편"이라는 추상적인 표현만 사용했습니다.'}
```

> ⚠️ **심판도 틀립니다.** 같은 답을 두 번 채점하면 점수가 달라질 수 있습니다.
> 논문에 쓰려면 **사람 채점과의 일치도**를 함께 보고해야 합니다.
> 이 방식 자체가 연구 주제입니다 — Agent-as-a-Judge ([2410.10934](https://arxiv.org/abs/2410.10934)).

### 5-3. 최소한의 평가셋 만들기

거창할 필요 없습니다. **질문 10개 + 기대 결과**면 시작됩니다.

```python
EVALSET = [
    {"q": "A-1023 재고 얼마나 있어?", "expect_tool": "lookup", "expect_in": "48"},
    {"q": "안녕?",                    "expect_tool": None,     "expect_in": None},
    # ... 8개 더
]
```

> 🎯 **에이전트를 고칠 때마다 이걸 돌리세요.**
> 프롬프트 한 줄 고치고 "좋아진 것 같다"로 판단하면, **다음 주에 뭐가 나아졌는지 말할 수 없습니다.**

### 5-4. 실제 연구용 벤치마크

[4-1단계 2절 Phase 5](01-agent-basic.md#phase-5--실무-에이전트와-평가-2023--2024)에 목록이 있습니다.

| 벤치마크 | 무엇을 재나 |
|---|---|
| **SWE-bench** | 실제 GitHub 이슈 해결 (코딩) |
| **GAIA** | 사람은 쉽고 모델은 어려운 범용 과제 |
| **AgentBench** | 8개 환경에서의 에이전트 능력 |
| **OSWorld** | 진짜 OS 조작 |

---

## 6. 내 도메인에 무엇을 고를까

🟢 **전원** · **이 표를 채우는 게 이 문서의 목적입니다.**

| 질문 | 예 → 붙일 것 |
|---|---|
| 사용자가 여러 턴에 걸쳐 물어보나? | **메모리** (짧으면 2-2, 길면 2-3) |
| 사용자가 여러 명인가? | `checkpointer` + `thread_id` |
| 요청 종류가 3가지 이상인가? | **슈퍼바이저** (3-3) |
| 결과를 만드는 데 단계가 있나? | **순차** (3-1) |
| 여러 관점을 한 번에 봐야 하나? | **병렬** (3-2) |
| 경로가 매번 똑같은가? | **아무것도 안 붙임 — 워크플로면 충분** (4절) |
| 고칠 때마다 나아졌는지 알고 싶나? | **평가셋 10개** (5-3) |

### 내 에이전트 설계표 🟡

| 칸 | 내 답 |
|---|---|
| 내 업무 한 줄 | |
| 요청 종류 몇 가지? | |
| 필요한 메모리 유형 | |
| 순차 / 병렬 / 슈퍼바이저 중 | |
| **이거 워크플로로 충분한가?** | |
| 평가 질문 10개 중 3개 | |

> **다섯 번째 칸에 "예"가 나와도 괜찮습니다.** 오히려 좋은 신호입니다.

---

## ✅ 체크포인트

🟢
- [ ] 워크플로와 에이전트의 차이를 "경로를 누가 정하나"로 설명할 수 있다
- [ ] 내 업무에 메모리가 필요한지 아닌지 답할 수 있다
- [ ] 순차 / 병렬 / 슈퍼바이저 중 내게 맞는 걸 고를 수 있다

🟡
- [ ] 슬라이딩 윈도우를 실행해 `max_turns`를 줄였을 때 잊는 걸 봤다
- [ ] 요약 메모리의 **실패 버전과 고친 버전 차이**를 짚을 수 있다
- [ ] 6절 설계표를 채웠다

🔴
- [ ] 평가셋 10개를 만들었다
- [ ] 프롬프트를 고치고 평가셋을 다시 돌려 숫자를 비교했다

---

## 📌 연습문제

**레벨 1 (개념)** 🟢
- 4-1단계 5절 코드에서 Thought / Action / Observation은 각각 어느 줄인가?
- 2-3의 실패와 3-3의 실패는 **같은 원인**입니다. 무엇인가?

**레벨 2 (설계)** 🟡
- 내 도메인 에이전트를 설계하라: 어떤 도구가 필요하고, **도구가 실패하면 어떻게 복구**하나?
- 에피소딕 메모리와 시맨틱 메모리를 각각 언제 쓰나? 내 도메인 예시로.

**레벨 3 (구현)** 🔴
- 4-1단계 5절 루프에 **재시도**(도구 실패 시 다시 시도)를 넣어라
- 4-1단계 6절 그래프에 `interrupt_before`로 사람 승인 게이트를 넣어라
- 순수 루프와 `StateGraph` 에이전트로 같은 질문 10개를 돌려 **도구 호출 정확도**를 비교하라
- 슈퍼바이저의 분류 정확도를 재는 평가셋을 만들고, 메뉴 설명을 지웠을 때 얼마나 떨어지는지 재라

---

## 📌 TODO

- [ ] 이 문서의 코드를 실행 가능한 `.py`로 분리 (`patterns_memory.py` / `patterns_multi.py` / `eval.py`)
- [ ] 5단계 [`domain_agent.py`](../05-handson/domain_agent.py)에 평가셋 붙이기
- [ ] 각자 도메인의 평가셋 10개를 모아 공용 벤치마크 만들기

---

이전 ← [4-2단계 `02-agent-category.md`](02-agent-category.md) ｜ 다음 → 5단계 [`05-handson/`](../05-handson/05-handson.md)
