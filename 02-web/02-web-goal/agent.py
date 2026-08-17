"""
2-2단계 — 에이전트 (껍데기에 들어가는 "내용물")
================================================================
app.py는 이 파일의 run_agent() 하나만 호출합니다.
서버는 안을 들여다보지 않습니다. 그래서 이 파일만 갈아끼우면
같은 껍데기가 어떤 도메인의 에이전트도 받아냅니다.

그래프 구조 — 갈림길과 반복

       ┌──────────────────────────────┐
       │                              │ (도구 결과 들고 다시 판단)
 [시작]─▶[think: 판단]──조건분기──▶[action: 행동(도구 실행)]
                          │
                          └──(도구 필요 없음)──▶[끝]
"""

from pathlib import Path
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

# 리포 맨 위 폴더의 .env를 읽습니다 (어느 폴더에서 실행하든 동일하게 동작)
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


# ════════════════════════════════════════════════════════════════
#  ★★★ 여기 한 줄만 바꾸면 1차 ↔ 2차가 전환됩니다 ★★★
#
#    False = 1차. 가짜 응답. AI 없이 화면↔서버 연결만 확인합니다.
#    True  = 2차. 진짜 LangGraph 에이전트가 답합니다. (.env에 키 필요)
#
#  먼저 False로 서버를 띄워 연결을 확인하고, 그 다음 True로 바꾸세요.
# ════════════════════════════════════════════════════════════════
USE_AGENT = False


# ── 우리 조직 데이터 ─────────────────────────────────────────────
# ★ 수강생이 갈아끼우는 건 사실상 이 딕셔너리 하나입니다.
#   (지금은 가짜. 실제 서비스라면 Supabase 같은 DB에서 읽어옵니다)
INVENTORY = {
    "A-1023": {"재고": 48, "납기": "3일"},
    "B-2041": {"재고": 0, "납기": "3주"},
    "C-3077": {"재고": 5, "납기": "1주"},
}


# ── 도구(Tool): 에이전트가 손에 쥐는 "연장" ──────────────────────
# ★ docstring이 곧 도구 설명입니다. AI는 이 글을 읽고 언제 쓸지 판단합니다.
#   설명을 대충 쓰면 도구를 안 쓰거나 엉뚱할 때 씁니다.
@tool
def lookup(code: str) -> str:
    """품번으로 재고 수량과 납기를 조회한다. 예: 'A-1023'"""
    print(f"  🔧 [도구] lookup({code!r}) 실행")
    return str(INVENTORY.get(code, "해당 품번을 찾을 수 없습니다"))


TOOLS = [lookup]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}

SYSTEM_PROMPT = """당신은 사내 재고 문의를 처리하는 어시스턴트입니다.
- 재고나 납기를 물으면 반드시 lookup 도구로 확인한 뒤 답하세요. 추측하지 마세요.
- 도구가 필요 없는 일상 대화에는 그냥 답하세요.
- 한국어로, 두세 문장으로 간결하게 답하세요."""


# ── 상태(State): 노드들이 주고받는 공유 메모장 ───────────────────
# add_messages = "덮어쓰지 말고 뒤에 이어붙여라"는 규칙
class State(TypedDict):
    messages: Annotated[list, add_messages]


# ── 노드 1. think — 판단하는 자리 ────────────────────────────────
def think_node(state: State) -> dict:
    print("  🧠 [think] 판단 중...")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite").bind_tools(TOOLS)
    reply = llm.invoke([SystemMessage(content=SYSTEM_PROMPT)] + state["messages"])
    return {"messages": [reply]}


# ── 노드 2. action — 행동하는 자리 (도구 실행) ───────────────────
def action_node(state: State) -> dict:
    print("  ⚙️  [action] 도구 실행")
    results = []
    for call in state["messages"][-1].tool_calls:
        output = TOOLS_BY_NAME[call["name"]].invoke(call["args"])
        results.append(ToolMessage(content=str(output), tool_call_id=call["id"]))
    return {"messages": results}


# ── 갈림길(조건 분기): think 다음에 어디로 갈까? ─────────────────
def route(state: State) -> str:
    if state["messages"][-1].tool_calls:   # AI가 "도구 써줘"라고 했으면
        return "action"                    #   → 행동 노드로
    return END                             # 아니면 답이 다 나온 것 → 끝


# ── 그래프 조립 ──────────────────────────────────────────────────
graph = StateGraph(State)
graph.add_node("think", think_node)
graph.add_node("action", action_node)

graph.add_edge(START, "think")
graph.add_conditional_edges("think", route, {"action": "action", END: END})
graph.add_edge("action", "think")   # ★ 되돌아가는 화살표 = 반복

# MemorySaver = 대화 기록 저장소. thread_id가 같으면 이전 대화가 이어집니다.
# ⚠️ 서버를 끄면 사라집니다. 진짜 서비스가 되려면 DB에 저장해야 합니다.
APP = graph.compile(checkpointer=MemorySaver())


# ── app.py가 호출하는 유일한 함수 ────────────────────────────────
def run_agent(question: str, thread_id: str = "web-demo") -> str:
    """질문 한 줄을 받아 답변 한 줄을 돌려준다."""

    if not USE_AGENT:
        # 1차 — 가짜 응답. 화면 → 서버 → 화면 왕복이 되는지만 확인합니다.
        return (
            "🤖 (가짜 응답입니다 — 하지만 방금 서버를 다녀왔습니다!)\n\n"
            f"방금 받은 질문: {question}\n\n"
            "F12 → Network 탭에서 ask 요청을 확인해보세요.\n"
            "진짜 에이전트를 붙이려면 agent.py의 USE_AGENT를 True로 바꾸세요."
        )

    # 2차 — 진짜 에이전트
    print(f"\n💬 질문: {question}")
    result = APP.invoke(
        {"messages": [HumanMessage(content=question)]},
        {"configurable": {"thread_id": thread_id}},   # 대화방 번호
    )
    answer = result["messages"][-1].content
    print(f"✅ 답변: {answer}\n")
    return answer


# ── 서버 없이 이 파일만 단독 실행해볼 때 ─────────────────────────
if __name__ == "__main__":
    print("agent.py 단독 테스트 (그냥 엔터 = 종료)")
    print("예: B-2041 언제 들어와?  /  안녕?")
    while True:
        q = input("\n> ").strip()
        if not q:
            break
        print(run_agent(q))
