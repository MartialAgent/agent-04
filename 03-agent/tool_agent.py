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

실행: python 03-agent/tool_agent.py
"""

import sys
sys.stdout.reconfigure(encoding="utf-8")  # 윈도우 콘솔 이모지 출력 문제 해결
sys.stdin.reconfigure(encoding="utf-8")   # 한글 입력이 깨지지 않도록

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
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
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


# 2-B) action 노드 = 행동.  AI가 요청한 도구를 실제로 실행한다.
#      (ToolNode: 랭그래프가 제공하는 "도구 실행 전담" 노드)
action_node = ToolNode(tools)


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
app = graph.compile()


# 5) 실행 — 사용자가 터미널에 직접 질문을 입력한다
if __name__ == "__main__":
    # input(): 터미널에서 사용자가 타이핑한 글자를 받아온다
    question = input("❓ 질문을 입력하세요 (예: 1234 곱하기 5678은? 42를 더하면?)\n> ")
    print()

    # 각 노드가 순서대로 도는 모습을 눈으로 보자
    for step in app.stream({"messages": [HumanMessage(content=question)]}):
        for node_name, output in step.items():
            msg = output["messages"][-1]
            if getattr(msg, "tool_calls", None):
                call = msg.tool_calls[0]
                print(f"[think 노드] 🤔 판단: 도구 쓰자 → calculator({call['args']['expression']})")
            elif msg.type == "tool":
                print(f"[action 노드] 🔧 행동 결과: {msg.content}")
            else:
                print(f"\n[think 노드] ✅ 최종 답:\n{msg.content}")
