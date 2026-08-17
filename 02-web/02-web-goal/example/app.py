"""
2-2단계 완성본 — 서버 (껍데기의 "주방")
================================================================
★ 2-1단계에는 이 파일이 없었습니다. 서버 자체가 없었습니다.

    2-1 : 브라우저 안에서 끝. data.js의 표를 script.js가 훑어서 답했다
          → 표가 F12에 다 보이고, 새로고침하면 대화가 사라졌다
    2-2 : 그 두 불편을 서버가 해결한다. 표는 서버 안(data.py)으로 들어가 안 보이고,
          대화는 서버가 들고 있어 새로고침해도 남는다.
          그리고 agent.py의 run_agent()를 불러 답변 + 진행과정 + 출처를 돌려준다.

★ 서버는 에이전트가 안에서 뭘 하는지 모릅니다.
  run_agent()를 부르고 결과를 JSON으로 바꿔 내보낼 뿐입니다.
  이 무관심이 중요합니다. 두뇌를 통째로 갈아끼워도 이 파일은 안 바뀝니다.

⚠️ 이 파일에 진짜 인증은 없습니다. 전부 더미입니다.
   자세한 건 아래 check_token() 주석을 보세요.

실행 (리포 맨 위 폴더에서):
    pip install -r 02-web/02-web-goal/example/requirements.txt
    uvicorn app:app --reload --app-dir 02-web/02-web-goal/example

    → 브라우저에서 http://localhost:8000 접속
"""

import hashlib
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from agent import run_agent
from data import find_user

app = FastAPI(title="내 도메인 어시스턴트 (2-2)")

HERE = Path(__file__).parent


# ── 대화 저장소 — 대화방(thread) 번호별로 나눠 보관 ──────────────
#
# {"thread-김영업": [{"role": "user", ...}, {"role": "assistant", ...}], ...}
#
# ★ 2-1단계에서는 리스트 하나였습니다. 전원이 같은 대화방을 썼던 셈입니다.
#   사용자가 구분되니 방도 나뉘어야 합니다. 이게 "로그인이 왜 필요한가"의 답입니다.
#
# ⚠️ 서버를 끄면 전부 사라집니다. 진짜 서비스가 되려면 DB에 저장해야 합니다.
#    → 2-0단계 도구 지도의 Supabase가 필요해지는 자리
#
THREADS: dict[str, list[dict]] = {}


def get_thread(thread_id: str) -> list[dict]:
    return THREADS.setdefault(thread_id, [])


# ════════════════════════════════════════════════════════════════
#  더미 인증
# ════════════════════════════════════════════════════════════════
#
# ⚠️⚠️ 이건 인증이 아닙니다. 인증이 들어갈 "자리"입니다. ⚠️⚠️
#
#   진짜 인증이라면
#     · 비밀번호를 해시로 저장하고 (원문 저장은 사고)
#     · 서명된 토큰(JWT)이나 세션 쿠키를 발급하고
#     · 만료·갱신·로그아웃을 관리하고
#     · HTTPS 위에서만 주고받습니다
#
#   그래서 대부분 직접 만들지 않고 Supabase Auth / Google OAuth 를 씁니다.
#   (2-0단계 도구 지도에 그 서비스들이 있는 이유입니다)
#
#   여기서는 "이름만 적으면 통과"입니다. 그래도 배울 건 다 배웁니다.
#     ① 로그인은 토큰을 발급하는 일이다
#     ② 이후 모든 요청은 그 토큰을 머리(header)에 달고 온다
#     ③ 서버는 토큰을 보고 통과시킬지 정한다
#     ④ 사용자가 구분되면 대화방도 나뉜다
#
TOKEN_PREFIX = "Bearer dummy-token-"


def make_id(name: str) -> str:
    """이름을 영문·숫자로만 된 짧은 아이디로 바꾼다.

    ⚠️ 왜 이름을 그대로 안 쓰나 — 실제로 만나는 함정이라 짚고 갑니다.

      HTTP 헤더(Authorization 등)에는 **영문·숫자만 안전하게** 들어갑니다.
      "Bearer dummy-token-김영업" 처럼 한글을 넣으면
      브라우저의 fetch()가 아예 요청을 거부합니다.

      그래서 이름은 JSON 본문으로 주고받고(본문은 UTF-8이라 한글 OK),
      헤더에 실을 값은 여기서 영문 아이디로 바꿉니다.

    ★ 진짜 토큰은 이름에서 만들지 않습니다. 서버가 서명한 무작위 문자열입니다.
      (이름에서 만들면 남의 토큰을 계산해낼 수 있으니까요)
      여기서는 서버를 껐다 켜도 로그인이 유지되게 하려고 이렇게 했습니다.
    """
    return "u" + hashlib.md5(name.encode("utf-8")).hexdigest()[:8]


def check_token(authorization: str | None) -> str:
    """Authorization 헤더를 확인하고 사용자 아이디를 돌려준다. (더미)"""
    if not authorization or not authorization.startswith(TOKEN_PREFIX):
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    return authorization[len(TOKEN_PREFIX):]


# ── 주고받을 데이터의 모양 ───────────────────────────────────────
class LoginRequest(BaseModel):
    name: str


class ChatRequest(BaseModel):
    question: str
    thread_id: str


# ════════════════════════════════════════════════════════════════
#  엔드포인트
# ════════════════════════════════════════════════════════════════

@app.post("/api/login")
def login(body: LoginRequest):
    """더미 로그인 — 아무 이름이나 통과합니다. 비밀번호도 없습니다."""
    name = body.name.strip() or "손님"
    user = find_user(name)
    user_id = make_id(name)

    return {
        "token": f"dummy-token-{user_id}",   # ← 진짜라면 서명된 JWT
        "user": {"name": name, "부서": user["부서"]},
        "thread_id": f"thread-{user_id}",    # 이 사람의 대화방 번호
    }


@app.post("/api/chat")
def chat(body: ChatRequest, authorization: str | None = Header(default=None)):
    """질문을 에이전트에게 넘기고 결과를 돌려준다."""
    check_token(authorization)

    thread = get_thread(body.thread_id)

    # ★ 이 한 줄이 전부입니다. 서버는 에이전트 안을 모릅니다.
    result = run_agent(body.question, history=thread)

    thread.append({"role": "user", "content": body.question})
    thread.append({
        "role": "assistant",
        "content": result["answer"],
        "steps": result["steps"],
        "sources": result["sources"],
    })

    # 2-1단계는 {"answer": ...} 하나였습니다.
    # 늘어난 두 칸이 화면의 새 기능이 됩니다.
    return {
        "answer": result["answer"],
        "steps": result["steps"],
        "sources": result["sources"],
    }


@app.get("/api/history")
def history(thread_id: str, authorization: str | None = Header(default=None)):
    """이 대화방에 쌓인 기록을 돌려준다. (새로고침해도 대화가 남는 이유)"""
    check_token(authorization)
    return {"messages": get_thread(thread_id)}


@app.post("/api/reset")
def reset(thread_id: str, authorization: str | None = Header(default=None)):
    """이 대화방을 비운다. (= 새 대화 시작)"""
    check_token(authorization)
    THREADS[thread_id] = []
    return {"ok": True}


# ── 화면 파일 서빙 ───────────────────────────────────────────────
#
# ⚠️ 이 줄은 반드시 파일 맨 아래에 있어야 합니다.
#    "/" 가 모든 주소를 삼키기 때문에, 위의 /api/... 보다 먼저 오면
#    API 요청까지 가로채버립니다.
#
from fastapi.staticfiles import StaticFiles  # noqa: E402  (순서가 중요해서 여기 둡니다)

app.mount("/", StaticFiles(directory=HERE, html=True), name="static")
