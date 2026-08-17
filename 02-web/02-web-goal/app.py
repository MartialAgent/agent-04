"""
2-2단계 — 서버 (껍데기의 "주방")
================================================================
이 파일이 하는 일은 딱 하나입니다.

    "브라우저가 /api/ask로 질문을 보내오면,
     agent.py의 run_agent()에 넘기고, 그 결과를 돌려준다."

그게 전부입니다. 서버는 에이전트가 안에서 뭘 하는지 모릅니다.

실행 (리포 맨 위 폴더에서):
    uvicorn app:app --reload --app-dir 02-web/02-web-goal

    → 브라우저에서 http://localhost:8000 접속
"""

from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

from agent import run_agent

app = FastAPI(title="내 도메인 어시스턴트")

HERE = Path(__file__).parent


# ── 받을 데이터의 모양 ───────────────────────────────────────────
# script.js가 보내는 {"question": "..."} 와 짝입니다.
# 모양이 다르면 FastAPI가 알아서 막아줍니다.
class Question(BaseModel):
    question: str


# ── 엔드포인트 — 이 리포에서 유일한 API 주소 ─────────────────────
#
# ★ 아래 데코레이터 한 줄이 평범한 파이썬 함수를
#   "주소가 있는 것"으로 만듭니다.
#
#   3~5단계에서 만들 모든 파이썬 코드가
#   이 방식으로 세상에 나갈 수 있습니다.
#
@app.post("/api/ask")
def ask(body: Question):
    answer = run_agent(body.question)
    return {"answer": answer}          # 파이썬 dict → JSON 자동 변환


# ── 화면 파일 서빙 ───────────────────────────────────────────────
#
# index.html · style.css · script.js를 브라우저에 내려주는 설정입니다.
# ⚠️ 이 줄은 반드시 맨 아래에 있어야 합니다.
#    "/" 가 모든 주소를 삼키기 때문에, 위의 /api/ask 보다 먼저 오면
#    API 요청까지 가로채버립니다.
#
from fastapi.staticfiles import StaticFiles  # noqa: E402  (순서가 중요해서 여기 둡니다)

app.mount("/", StaticFiles(directory=HERE, html=True), name="static")
