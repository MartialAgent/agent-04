"""
2-2단계 완성본 — 에이전트 (껍데기에 들어가는 "내용물")
================================================================
app.py는 이 파일의 run_agent() 하나만 호출합니다.
서버는 안을 들여다보지 않습니다. 그래서 이 파일만 갈아끼우면
같은 껍데기가 어떤 도메인의 에이전트도 받아냅니다.

★ 그래프 구조 — 에이전트를 에이전트답게 만드는 건 딱 두 개입니다.
  ① 갈림길(조건 분기)   ② 되돌아가는 화살표(반복)

       ┌───────────────────────────────────┐
       │                                   │ (도구 결과를 들고 다시 판단)
 [시작]─▶[think: 판단]──조건분기──▶[action: 행동 = 도구 실행]
                          │
                          └──(도구 필요 없음)──▶[끝]

★ 여기서 "진짜"인 것 / "가짜"인 것
    진짜 : 이 파일 전체의 구조 — 노드, 엣지, 상태, 조건분기, 반복
    가짜 : think 노드가 부르는 brain.decide() 의 판단 로직 (규칙 기반)
           → 3~5단계에서 여기에 진짜 LLM이 들어갑니다. 이 파일은 안 바뀝니다.

단독 실행 (서버 없이 이 파일만 테스트):
    python 02-web/02-web-goal/example/agent.py
"""

from operator import add
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph

import brain
from data import INVENTORY


# ════════════════════════════════════════════════════════════════
#  ① 도구(Tool) — 에이전트가 손에 쥐는 "연장"
# ════════════════════════════════════════════════════════════════
#
# 도구는 그냥 파이썬 함수입니다. 특별한 게 없습니다.
# 다만 결과와 함께 **출처(source)** 를 같이 돌려주게 했습니다.
# 그래야 화면에서 "이 답이 어디서 나왔는지"를 보여줄 수 있습니다.
#
# ★ 진짜 서비스라면 이 함수 안이 DB 조회나 사내 API 호출로 바뀝니다.
#   함수의 겉모양(이름·인자·돌려주는 값)은 그대로입니다.

def lookup(code: str) -> dict:
    """품번으로 재고 수량과 납기를 조회한다. 예: 'A-1023'"""
    print(f"  🔧 [도구] lookup({code!r})")

    item = INVENTORY.get(code)
    if item is None:
        return {
            "text": f"{code} : 등록되지 않은 품번입니다.",
            "sources": [],
        }

    text = (
        f"{code} ({item['이름']})\n"
        f"  재고 {item['재고']}개 · 납기 {item['납기']} · 담당 {item['담당']}"
    )
    return {"text": text, "sources": [f"재고표 / {code}"]}


def list_codes() -> dict:
    """등록된 품번 전체 목록을 돌려준다. 인자 없음."""
    print("  🔧 [도구] list_codes()")

    lines = [f"  {code} — {item['이름']}" for code, item in INVENTORY.items()]
    return {
        "text": "등록된 품번은 다음과 같습니다.\n" + "\n".join(lines),
        "sources": ["재고표 / 전체"],
    }


TOOLS = {
    "lookup": lookup,
    "list_codes": list_codes,
}


# ════════════════════════════════════════════════════════════════
#  ② 상태(State) — 노드들이 주고받는 공유 메모장
# ════════════════════════════════════════════════════════════════
#
# Annotated[list, add] = "덮어쓰지 말고 뒤에 이어붙여라"는 규칙입니다.
# (add 는 파이썬 기본 함수. [1,2] + [3] = [1,2,3])
#
#   messages : 대화 내용 (사용자 / 에이전트 / 도구)
#   steps    : 에이전트가 밟은 단계 기록  ← 화면에 그대로 보여줄 것
#   sources  : 참조한 데이터 출처         ← 화면에 근거 칩으로 보여줄 것
#
# ★ steps와 sources는 "에이전트가 무슨 일을 했는지"를 밖에서 볼 수 있게
#   일부러 상태에 넣어둔 것입니다. 챗봇이라면 필요 없는 항목입니다.
#
class State(TypedDict):
    messages: Annotated[list, add]
    steps: Annotated[list, add]
    sources: Annotated[list, add]


# ════════════════════════════════════════════════════════════════
#  ③ 노드(Node) — 작업 한 단계 = 파이썬 함수 하나
# ════════════════════════════════════════════════════════════════

def think_node(state: State) -> dict:
    """판단하는 자리. '도구를 쓸까? 그냥 답할까?'"""
    print("  🧠 [think] 판단 중...")

    decision = brain.decide(state["messages"])      # ← 여기가 진짜 LLM 자리

    if "tool_calls" in decision:
        names = ", ".join(call["name"] for call in decision["tool_calls"])
        return {
            "messages": [{
                "role": "assistant",
                "content": "",
                "tool_calls": decision["tool_calls"],
            }],
            "steps": [{"node": "think", "label": f"도구가 필요하다고 판단 → {names}"}],
            "sources": [],
        }

    # 도구를 쓰고 돌아온 길인지, 처음부터 도구가 필요 없었는지 구분해서 적습니다
    came_back = state["messages"][-1]["role"] == "tool"
    label = "도구 결과를 정리해 답변 작성" if came_back else "도구 없이 답할 수 있다고 판단"

    return {
        "messages": [{
            "role": "assistant",
            "content": decision["content"],
            "tool_calls": [],
        }],
        "steps": [{"node": "think", "label": label}],
        "sources": [],
    }


def action_node(state: State) -> dict:
    """행동하는 자리. think가 지시한 도구를 실제로 실행합니다."""
    print("  ⚙️  [action] 도구 실행")

    calls = state["messages"][-1]["tool_calls"]
    messages, steps, sources = [], [], []

    for call in calls:
        tool = TOOLS[call["name"]]
        result = tool(**call["args"])

        messages.append({
            "role": "tool",
            "name": call["name"],
            "content": result["text"],
        })
        steps.append({
            "node": "action",
            "label": f"{call['name']}({_format_args(call['args'])}) 실행",
        })
        sources.extend(result["sources"])

    return {"messages": messages, "steps": steps, "sources": sources}


def _format_args(args: dict) -> str:
    return ", ".join(f"{k}={v!r}" for k, v in args.items())


# ════════════════════════════════════════════════════════════════
#  ④ 갈림길(조건 분기) — think 다음에 어디로 갈까?
# ════════════════════════════════════════════════════════════════
#
# ★ 이 함수 하나가 챗봇과 에이전트를 가릅니다.
#   챗봇에는 갈림길이 없습니다. 질문 → 답, 끝입니다.
#
def route(state: State) -> str:
    if state["messages"][-1]["tool_calls"]:   # "도구 써줘"라고 했으면
        return "action"                       #   → 행동 노드로
    return END                                # 아니면 답이 다 나온 것 → 끝


# ════════════════════════════════════════════════════════════════
#  ⑤ 그래프 조립
# ════════════════════════════════════════════════════════════════
graph = StateGraph(State)
graph.add_node("think", think_node)
graph.add_node("action", action_node)

graph.add_edge(START, "think")
graph.add_conditional_edges("think", route, {"action": "action", END: END})
graph.add_edge("action", "think")   # ★ 되돌아가는 화살표 = 반복

APP = graph.compile()


# ════════════════════════════════════════════════════════════════
#  ⑥ app.py가 호출하는 유일한 함수
# ════════════════════════════════════════════════════════════════

def run_agent(question: str, history: list[dict] | None = None) -> dict:
    """질문 한 줄을 받아 {답변, 진행과정, 출처} 를 돌려준다.

    ★ 2-1단계에서는 서버가 규칙표를 조회해 문자열 하나만 돌려줬습니다.
      지금은 답변에 더해 **에이전트가 무슨 일을 했는지**까지 함께 돌려줍니다.
      화면에 새 기능이 생기는 건 바로 이것 때문입니다.
    """
    print(f"\n💬 질문: {question}")

    messages = list(history or []) + [{"role": "user", "content": question}]

    result = APP.invoke({"messages": messages, "steps": [], "sources": []})

    answer = result["messages"][-1]["content"]
    print(f"✅ 답변: {answer}\n")

    return {
        "answer": answer,
        "steps": result["steps"],
        "sources": list(dict.fromkeys(result["sources"])),   # 중복 제거
    }


# ── 서버 없이 이 파일만 단독으로 돌려볼 때 ───────────────────────
if __name__ == "__main__":
    print("agent.py 단독 테스트 (그냥 엔터 = 종료)")
    print("예시 질문:")
    print("  B-2041 언제 들어와?      → think → action → think  (도구 씀)")
    print("  안녕?                    → think 한 번으로 끝       (도구 안 씀)")
    print("  품번 목록 보여줘         → list_codes 실행")

    while True:
        q = input("\n> ").strip()
        if not q:
            break
        out = run_agent(q)
        print("--- 진행 과정 ---")
        for i, step in enumerate(out["steps"], 1):
            print(f"  {i}. [{step['node']}] {step['label']}")
