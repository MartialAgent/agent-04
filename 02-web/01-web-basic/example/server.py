"""
2-1단계 완성본 — 서버 (채팅창의 "주방")
================================================================
이 파일이 하는 일은 세 가지뿐입니다.

    1. 브라우저가 /api/chat 으로 질문을 보내오면 규칙표대로 답을 만들어 돌려준다
    2. 오간 대화를 서버 메모리에 쌓아둔다
    3. index.html · style.css · script.js 를 브라우저에 내려준다

★ 이 파일에 AI는 없습니다. API 키도, 로그인도, 외부 호출도 없습니다.
  답변은 아래 RULES 표를 그대로 읽은 것입니다.
  "진짜로 판단하는 두뇌"는 2-2단계에서 붙입니다.

실행 (리포 맨 위 폴더에서):
    pip install -r 02-web/01-web-basic/example/requirements.txt
    uvicorn server:app --reload --app-dir 02-web/01-web-basic/example

    → 브라우저에서 http://localhost:8000 접속
"""

from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="내 도메인 어시스턴트 (2-1)")

HERE = Path(__file__).parent


# ── 대화 저장소 ──────────────────────────────────────────────────
#
# 그냥 파이썬 리스트입니다. 데이터베이스가 아닙니다.
#
# ⚠️ 서버를 끄면 전부 사라집니다.
#    "새로고침해도 남는 것"과 "서버를 꺼도 남는 것"은 다른 문제입니다.
#    뒤의 것을 하려면 데이터베이스가 필요합니다 → 2-0단계의 Supabase 자리
#
HISTORY: list[dict] = []


# ── 답변 규칙표 ──────────────────────────────────────────────────
#
# ★ STEP 4에서는 이 표가 script.js 안에 있었습니다.
#   STEP 5에서 이리로 이사왔습니다. 규칙 자체는 그대로입니다.
#
#   달라진 것: 이제 사용자는 이 표를 볼 수 없습니다.
#   (script.js는 브라우저가 내려받지만, server.py는 서버에만 있습니다)
#   이게 "왜 백엔드가 필요한가"의 첫 번째 답입니다.
#
RULES = [
    (("안녕", "하이", "hello", "hi"),
     "안녕하세요! 무엇을 도와드릴까요?"),

    (("이름", "누구", "너 뭐"),
     "저는 2-1단계 실습용 채팅창입니다.\n"
     "index.html의 제목을 바꾸면 제 이름도 바뀝니다."),

    (("뭐 할", "뭘 할", "할 수 있", "도움", "기능"),
     "지금은 server.py의 RULES 표에 적힌 것만 답할 수 있습니다.\n"
     "표에 없는 말은 그냥 되돌려드립니다.\n\n"
     "→ 2-2단계에서 이 자리에 판단하는 에이전트가 들어옵니다."),

    (("고마", "감사", "thanks"),
     "천만에요! 더 물어보실 게 있으면 말씀해주세요."),
]


def make_reply(question: str) -> str:
    """질문 한 줄을 받아 답변 한 줄을 돌려준다. (규칙표 조회일 뿐입니다)"""
    text = question.lower()

    for keywords, answer in RULES:
        if any(keyword in text for keyword in keywords):
            return answer

    # 표에 없으면 되돌려주기
    return (
        f'"{question}"\n\n'
        "라고 하셨네요. 무슨 뜻인지는 아직 모릅니다.\n"
        "저는 server.py의 RULES 표에 적힌 말만 알아듣습니다.\n\n"
        "→ 이 한계가 2-2단계(에이전트 붙이기)의 출발점입니다."
    )


# ── 주고받을 데이터의 모양 ───────────────────────────────────────
# script.js가 보내는 {"question": "..."} 와 짝입니다.
# 모양이 다르면 FastAPI가 알아서 막아줍니다.
class ChatRequest(BaseModel):
    question: str


# ── 엔드포인트 ① 메시지 보내기 ──────────────────────────────────
#
# ★ 아래 데코레이터 한 줄이 평범한 파이썬 함수를
#   "주소가 있는 것"으로 만듭니다.
#
#   3~5단계에서 만들 모든 파이썬 코드가 이 방식으로 세상에 나갈 수 있습니다.
#
@app.post("/api/chat")
def chat(body: ChatRequest):
    answer = make_reply(body.question)

    HISTORY.append({"role": "user", "content": body.question})
    HISTORY.append({"role": "bot", "content": answer})

    return {"answer": answer}          # 파이썬 dict → JSON 자동 변환


# ── 엔드포인트 ② 대화 기록 불러오기 ─────────────────────────────
# 브라우저를 새로고침해도 대화가 남아 있는 이유가 이것입니다.
@app.get("/api/history")
def history():
    return {"messages": HISTORY}


# ── 엔드포인트 ③ 대화 지우기 ────────────────────────────────────
@app.post("/api/reset")
def reset():
    HISTORY.clear()
    return {"ok": True}


# ── 화면 파일 서빙 ───────────────────────────────────────────────
#
# index.html · style.css · script.js 를 브라우저에 내려주는 설정입니다.
#
# ⚠️ 이 줄은 반드시 파일 맨 아래에 있어야 합니다.
#    "/" 가 모든 주소를 삼키기 때문에, 위의 /api/... 보다 먼저 오면
#    API 요청까지 가로채버립니다.
#
from fastapi.staticfiles import StaticFiles  # noqa: E402  (순서가 중요해서 여기 둡니다)

app.mount("/", StaticFiles(directory=HERE, html=True), name="static")
