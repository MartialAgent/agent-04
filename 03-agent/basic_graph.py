"""
랭그래프(LangGraph) 가장 기본 코드
==================================
[시작] ──> [answer 노드: AI가 질문에 답한다] ──> [끝]

실행: python 03-agent/basic_graph.py
준비: 리포 맨 위 폴더에 .env 파일 (.env.example 참고)
"""

from typing import TypedDict

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

# 0) .env 파일에서 GOOGLE_API_KEY를 읽어온다
load_dotenv()

# AI 모델 준비 (Gemini 2.5 Flash-Lite: 빠르고 가벼운 모델)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")


# 1) 상태(State): 노드들이 주고받는 "공유 메모장"
class State(TypedDict):
    question: str  # 사용자의 질문
    answer: str    # AI의 답


# 2) 노드(Node): 작업 한 단계 = 파이썬 함수 하나
#    메모장(state)을 받아서, 새로 적을 내용을 돌려준다
def answer_node(state: State) -> dict:
    response = llm.invoke(state["question"])
    return {"answer": response.content}


# 3) 그래프(Graph): 순서도 조립
graph = StateGraph(State)
graph.add_node("answer", answer_node)  # 노드 등록
graph.add_edge(START, "answer")        # 시작 ──> answer
graph.add_edge("answer", END)          # answer ──> 끝
app = graph.compile()                  # 완성!


# 4) 실행
if __name__ == "__main__":
    result = app.invoke({"question": "에이전트가 뭔지 초등학생도 알 수 있게 두 문장으로 설명해줘."})
    print("🤖 AI의 답:")
    print(result["answer"])
