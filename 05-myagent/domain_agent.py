"""
내 도메인 업무 도우미 에이전트 (미리 만들어둔 완성본 — 먼저 실행해보기!)
================================================================
요청을 받으면 에이전트가 스스로 "무슨 종류의 일인지" 판단해서
알맞은 담당 노드로 보냅니다. (조건 분기 = 에이전트다움의 핵심)

                          ┌─> [📝 요약 노드]
[요청 입력] ─> [분류 노드] ┼─> [✏️ 초안 노드]
                          ├─> [🔍 검토 노드]
                          └─> [💬 대화 노드]

★ 분류 기준이 "도메인"이 아니라 "일의 종류"인 것에 주목하세요.
  요약·초안·검토는 영업이든 행정이든 연구든 제조든 전부 필요합니다.
  그래서 이 에이전트는 원우 전원에게 그대로 돌아갑니다.

실행: python 05-myagent/domain_agent.py
준비: 리포 맨 위 폴더의 .env 파일 (2-2단계에서 설정한 그대로)
"""

from pathlib import Path
from typing import TypedDict

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")


# ── 상태: 노드들이 주고받는 공유 메모장 ──────────────────────
class State(TypedDict):
    request: str    # 사용자의 요청
    category: str   # 분류 결과 (summarize / draft / review / chat)
    answer: str     # 최종 답변


# ── 노드 1: 분류 — 어떤 종류의 일인지 AI가 판단 ──────────────
def classify_node(state: State) -> dict:
    prompt = f"""다음 요청을 딱 한 단어로 분류해줘.
- 긴 글·자료를 짧게 정리해달라는 요청이면: summarize
- 새로 글·문서·메시지를 써달라는 요청이면: draft
- 이미 있는 것을 검토·분석·평가해달라는 요청이면: review
- 그 외 질문이나 대화면: chat

요청: {state['request']}
답 (한 단어만):"""
    category = llm.invoke(prompt).content.strip().lower()
    if category not in ("summarize", "draft", "review", "chat"):
        category = "chat"   # 애매하면 일반 대화로
    print(f"   [분류] → {category}")
    return {"category": category}


# ── 노드 2~5: 일의 종류별 담당 노드 ──────────────────────────
def summarize_node(state: State) -> dict:
    prompt = f"""아래 내용을 요약해줘.
형식: ① 한 문장 핵심 ② 주요 항목 3~5개(개조식) ③ 빠진 정보가 있으면 지적.

내용: {state['request']}"""
    return {"answer": "📝 [요약 노드]\n\n" + llm.invoke(prompt).content}


def draft_node(state: State) -> dict:
    prompt = f"""아래 요청에 맞는 초안을 작성해줘.
- 받는 사람이 누구일지 추정하고 그에 맞는 말투로
- 정중하되 장황하지 않게
- 확인이 필요한 빈칸은 [ ]로 표시해서 남길 것

요청: {state['request']}"""
    return {"answer": "✏️ [초안 노드]\n\n" + llm.invoke(prompt).content}


def review_node(state: State) -> dict:
    prompt = f"""아래 내용을 검토해줘.
형식: ① 잘된 점 ② 문제점(근거와 함께) ③ 구체적 개선 제안.
근거 없이 단정하지 말고, 판단이 어려우면 "확인 필요"라고 적을 것.

내용: {state['request']}"""
    return {"answer": "🔍 [검토 노드]\n\n" + llm.invoke(prompt).content}


def chat_node(state: State) -> dict:
    prompt = f"""아래 질문에 간결하고 정확하게 답해줘.
모르는 것은 모른다고 말할 것.

질문: {state['request']}"""
    return {"answer": "💬 [대화 노드]\n\n" + llm.invoke(prompt).content}


# ── 그래프 조립: 분류 결과에 따라 갈림길 선택 ────────────────
graph = StateGraph(State)
graph.add_node("classify", classify_node)
graph.add_node("summarize", summarize_node)
graph.add_node("draft", draft_node)
graph.add_node("review", review_node)
graph.add_node("chat", chat_node)

graph.add_edge(START, "classify")

# 조건 분기: classify 노드의 결과(category)를 보고 다음 노드를 고른다
graph.add_conditional_edges(
    "classify",
    lambda state: state["category"],
    {"summarize": "summarize", "draft": "draft", "review": "review", "chat": "chat"},
)

for node in ("summarize", "draft", "review", "chat"):
    graph.add_edge(node, END)

app = graph.compile()


# ── 실행: 계속 대화하기 (빈 입력이면 종료) ───────────────────
if __name__ == "__main__":
    print("=" * 56)
    print("🤖 내 도메인 업무 도우미 에이전트")
    print("   요청을 입력하세요. (그냥 엔터 = 종료)")
    print("=" * 56)

    while True:
        request = input("\n🙋 요청 > ").strip()
        if not request:
            print("👋 수고하셨습니다!")
            break

        result = app.invoke({"request": request})
        print("\n" + result["answer"])
        print("-" * 56)
