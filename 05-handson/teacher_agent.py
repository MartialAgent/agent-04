"""
교사 업무 도우미 에이전트 (미리 만들어둔 완성본 — 실행해보기만!)
================================================================
요청을 받으면 에이전트가 스스로 업무 종류를 판단해서
알맞은 담당 노드로 보냅니다. (조건 분기 = 에이전트다움의 핵심)

                          ┌─> [가정통신문 작성]
[요청 입력] ─> [분류 노드] ┼─> [생활기록부 문구]
                          ├─> [수업 아이디어]
                          └─> [일반 상담]

실행: python 05-handson/teacher_agent.py
준비: 리포 맨 위 폴더의 .env 파일 (4단계에서 설정한 그대로)
"""

from typing import TypedDict

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")


# ── 상태: 노드들이 주고받는 공유 메모장 ──────────────────────
class State(TypedDict):
    request: str   # 교사의 요청
    category: str  # 분류 결과 (notice / record / lesson / chat)
    answer: str    # 최종 답변


# ── 노드 1: 분류 — 요청이 어떤 업무인지 AI가 판단 ────────────
def classify_node(state: State) -> dict:
    prompt = f"""다음 교사의 요청을 딱 한 단어로 분류해줘.
- 가정통신문/안내문 작성 요청이면: notice
- 생활기록부/평가 문구 요청이면: record
- 수업/활동 아이디어 요청이면: lesson
- 그 외 대화/고민이면: chat

요청: {state['request']}
답 (한 단어만):"""
    category = llm.invoke(prompt).content.strip().lower()
    if category not in ("notice", "record", "lesson", "chat"):
        category = "chat"  # 애매하면 일반 상담으로
    return {"category": category}


# ── 노드 2~5: 담당 업무별 노드 ───────────────────────────────
def notice_node(state: State) -> dict:
    prompt = f"""당신은 20년 경력의 초등학교 교사입니다.
아래 요청에 맞는 가정통신문을 작성해주세요.
형식: 제목 / 인사말 / 안내 내용(핵심은 개조식) / 협조 요청 / 마무리 인사.
정중하지만 딱딱하지 않은 말투로.

요청: {state['request']}"""
    return {"answer": "📄 [가정통신문 노드]\n\n" + llm.invoke(prompt).content}


def record_node(state: State) -> dict:
    prompt = f"""당신은 생활기록부 작성 경험이 풍부한 교사입니다.
아래 학생 특성에 맞는 행동특성 및 종합의견 문구를 3가지 버전으로 제안해주세요.
- 공식 문서에 어울리는 객관적·긍정적 서술
- 각 버전은 2~3문장, '~함', '~임' 체로

학생 특성: {state['request']}"""
    return {"answer": "✏️ [생활기록부 노드]\n\n" + llm.invoke(prompt).content}


def lesson_node(state: State) -> dict:
    prompt = f"""당신은 창의적인 수업 설계 전문가입니다.
아래 요청에 맞는 수업 아이디어를 제안해주세요.
각 아이디어마다: 활동명 / 진행 방법(3줄 이내) / 준비물.

요청: {state['request']}"""
    return {"answer": "💡 [수업 아이디어 노드]\n\n" + llm.invoke(prompt).content}


def chat_node(state: State) -> dict:
    prompt = f"""당신은 교사의 마음을 잘 이해하는 따뜻한 동료입니다.
공감하며 짧고 진심 어린 답을 해주세요.

이야기: {state['request']}"""
    return {"answer": "💬 [일반 상담 노드]\n\n" + llm.invoke(prompt).content}


# ── 그래프 조립: 분류 결과에 따라 갈림길 선택 ────────────────
graph = StateGraph(State)
graph.add_node("classify", classify_node)
graph.add_node("notice", notice_node)
graph.add_node("record", record_node)
graph.add_node("lesson", lesson_node)
graph.add_node("chat", chat_node)

graph.add_edge(START, "classify")

# 조건 분기: classify 노드의 결과(category)를 보고 다음 노드를 고른다
graph.add_conditional_edges(
    "classify",
    lambda state: state["category"],
    {"notice": "notice", "record": "record", "lesson": "lesson", "chat": "chat"},
)

for node in ("notice", "record", "lesson", "chat"):
    graph.add_edge(node, END)

app = graph.compile()


# ── 실행: 계속 대화하기 (빈 입력이면 종료) ───────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("🍎 교사 업무 도우미 에이전트")
    print("   요청을 입력하세요. (그냥 엔터 = 종료)")
    print("=" * 50)

    while True:
        request = input("\n👩‍🏫 요청 > ").strip()
        if not request:
            print("👋 수고하셨습니다!")
            break

        result = app.invoke({"request": request})
        print("\n" + result["answer"])
        print("-" * 50)
