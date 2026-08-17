"""
에이전트의 가장 기본형 — 도구(Tool)를 쓰는 에이전트
====================================================
챗봇은 "질문 → 답" 1회로 끝난다.
에이전트는 스스로 "판단 → 행동 → 확인 → 다시 판단"을 반복한다. ← 이게 차이!

       ┌──────────────────────────────┐
       │                              │ (도구 결과 들고 다시 판단)
[시작]─▶[think: 판단]──조건분기──▶[action: 행동(도구 실행)]
                          │
                          └──(도구 필요 없음)──▶[끝]

- 노드(Node) 2개:  think(판단) / action(행동)
- 조건 분기 엣지:   think 다음에 "도구 쓸까? 말까?"로 갈림길 (add_conditional_edges)
- 반복 엣지:        action ──▶ think  (결과 들고 다시 판단하러 돌아감)

이 "판단↔행동" 반복은 한 질문 안에서 일어나는 반복이고, 그것과는 별개로
프로그램 자체도 질문 하나 답하고 끝나지 않도록 **대화 루프**(while)를 돈다.
AI가 되묻는 경우("어떤 분위기를 원하세요?")에도 이어서 답할 수 있도록,
MemorySaver로 이전 대화 내용을 기억해뒀다가 다음 질문에 이어 붙인다.

실행: python 04-agent/tool_agent.py
"""

import sys
import time

sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)  # 윈도우 콘솔 이모지 출력 문제 해결 + 줄단위 즉시 출력
sys.stdin.reconfigure(encoding="utf-8")   # 한글 입력이 깨지지 않도록

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

load_dotenv()


# 0) 도구(Tool): 에이전트가 손에 쥘 수 있는 "연장".
#    AI 혼자 암산하면 큰 수 곱셈에서 틀리기도 하는데, 도구를 쓰면 정확하다.
@tool
def calculator(expression: str) -> str:
    """수식을 계산한다. 예: '1234 * 5678'"""
    return str(eval(expression))


tools = [calculator]

# 모델에게 "너 이런 도구 쓸 수 있어"라고 알려준다 (bind_tools)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite").bind_tools(tools)


# 1) 상태(State): 노드들이 주고받는 공유 메모장.
#    여기선 "지금까지 오간 대화(메시지) 목록"을 쌓아간다.
class State(TypedDict):
    messages: Annotated[list, add_messages]


# 2-A) think 노드 = 판단.  AI가 "직접 답할지 / 도구를 쓸지" 결정한다.
def think_node(state: State) -> dict:
    print(f"[think 노드] 🤔 판단 중... (누적 메시지 {len(state['messages'])}개, LLM 호출 시작)", flush=True)
    start = time.time()
    response = llm.invoke(state["messages"])
    elapsed = time.time() - start
    if getattr(response, "tool_calls", None):
        call = response.tool_calls[0]
        print(f"[think 노드] → 결론: 도구 필요함 → {call['name']}({call['args']})  ({elapsed:.2f}초)", flush=True)
    else:
        preview = response.content[:40].replace("\n", " ")
        print(f"[think 노드] → 결론: 도구 불필요, 직접 답변 생성 완료 (\"{preview}...\")  ({elapsed:.2f}초)", flush=True)
    return {"messages": [response]}


# 2-B) action 노드 = 행동.  AI가 요청한 도구를 실제로 실행한다.
#      (ToolNode: 랭그래프가 제공하는 "도구 실행 전담" 노드)
_tool_node = ToolNode(tools)


def action_node(state: State) -> dict:
    for call in state["messages"][-1].tool_calls:
        print(f"[action 노드] ⚙️  실행 시작: {call['name']}({call['args']})", flush=True)
    start = time.time()
    result = _tool_node.invoke(state)
    elapsed = time.time() - start
    for msg in result["messages"]:
        print(f"[action 노드] ✅ 실행 완료 → 결과: {msg.content}  ({elapsed:.2f}초)", flush=True)
    return result


# 3) 조건 분기: think 노드 다음의 갈림길.
#    AI가 도구를 부르려 하면 → action 으로, 아니면 → 끝.
def route(state: State) -> str:
    last_message = state["messages"][-1]
    if last_message.tool_calls:   # AI가 "도구 써줘"라고 했으면
        return "action"
    return END                    # 아니면 답이 다 나온 것 → 끝


# 4) 그래프(순서도) 조립
graph = StateGraph(State)
graph.add_node("think", think_node)      # 노드 등록
graph.add_node("action", action_node)
graph.add_edge(START, "think")           # 시작 ──▶ think
graph.add_conditional_edges(             # think ──▶ (갈림길) ──▶ action 또는 끝
    "think", route, {"action": "action", END: END}
)
graph.add_edge("action", "think")        # action ──▶ think (결과 들고 다시 판단!)

# MemorySaver: 대화가 끝나도 메시지 기록을 기억해두는 저장소.
# thread_id(대화방 번호)별로 지금까지 오간 메시지를 이어서 기억한다.
app = graph.compile(checkpointer=MemorySaver())


# 5) 실행 — 사용자가 터미널에서 대화하듯 여러 번 질문한다 (대화 루프)
if __name__ == "__main__":
    # 실행 전, 지금 이 에이전트가 어떻게 구성되어 있는지 먼저 안내한다
    print("=" * 60)
    print("🔧 에이전트 구성 안내")
    print("=" * 60)
    print(f"  모델      : gemini-2.5-flash-lite")
    print(f"  도구 목록 : {[t.name for t in tools]}")
    print(f"  노드      : think(판단) → action(도구 실행)")
    print(f"  흐름      : START → think ⇄ action → END")
    print(f"              (think가 도구 필요 없다고 판단하면 바로 END)")
    print(f"  대화 기억 : MemorySaver (이전 질문·답변을 기억하고 이어감)")
    print("=" * 60)
    print()

    # thread_id: 이 대화를 구분하는 번호. 같은 번호로 계속 물어보면 이전 대화가 이어진다.
    config = {"configurable": {"thread_id": "cli-session"}}
    turn_no = 0

    # while True: AI가 되묻거나 답이 끝나도 프로그램이 끝나지 않고 계속 다음 질문을 받는다.
    #             (빈 줄만 입력하면 대화를 끝낸다)
    while True:
        turn_no += 1
        question = input(f"❓ [{turn_no}번째] 질문을 입력하세요 (예: 1234 곱하기 5678은? 42를 더하면? / 빈 줄=종료)\n> ")
        if not question.strip():
            print("\n👋 대화를 종료합니다.")
            break

        print()
        print("▶ 실행 시작 ------------------------------------------------", flush=True)

        step_no = 0
        run_start = time.time()

        # 이번 턴에서는 "새로 한 말"만 넘긴다. 이전 대화는 MemorySaver가 thread_id로 기억하고 있다가
        # 자동으로 이어 붙여준다 (add_messages 리듀서가 새 메시지를 기존 기록 뒤에 누적).
        for step in app.stream({"messages": [HumanMessage(content=question)]}, config):
            step_no += 1
            for node_name, output in step.items():
                print(f"  └─ 스텝 {step_no} 종료: [{node_name}] 노드 완료  (누적 {time.time() - run_start:.2f}초)", flush=True)
                msg = output["messages"][-1]
                if msg.type not in ("tool",) and not getattr(msg, "tool_calls", None):
                    print(f"\n[think 노드] ✅ 최종 답 ({time.time() - run_start:.2f}초 소요):\n{msg.content}", flush=True)

        print("------------------------------------------------------------")
        print(f"■ {turn_no}번째 턴 종료 (총 {step_no}스텝, {time.time() - run_start:.2f}초)")
        print()
