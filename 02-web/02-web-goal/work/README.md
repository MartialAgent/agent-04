# 작업 폴더 (2-2단계)

**여러분이 만든 결과물이 쌓이는 곳입니다.**

2-1단계와 달리 **빈 폴더에서 시작하지 않습니다.**
[`../docs/03-steps.md`](../docs/03-steps.md)의 STEP 0에서 2-1단계 결과물을 여기로 복사합니다.

| STEP | 생기는 / 바뀌는 파일 |
|---|---|
| 0 | `index.html` `style.css` `script.js` `app.py` `requirements.txt` (2-1에서 복사), `CLAUDE.md` |
| 1 🔧 | `agent.py` `brain.py` `data.py` 신규, `app.py` 수정 |
| 2 🖥 | `script.js` `style.css` 수정 |
| 3 🔧 | `agent.py` `brain.py` 수정 |
| 4 🖥 | `script.js` `style.css` 수정 |
| 5 🔧 | `app.py` `data.py` 수정 |
| 6 🖥 | `index.html` `style.css` `script.js` 수정 |

## 실행

```powershell
# 리포 맨 위 폴더에서
.venv\Scripts\Activate.ps1
pip install -r 02-web/02-web-goal/work/requirements.txt
uvicorn app:app --reload --app-dir 02-web/02-web-goal/work
```

→ 브라우저에서 **http://localhost:8000**

> `--reload` 덕분에 파일을 저장하면 서버가 알아서 다시 뜹니다.

## 서버 없이 에이전트만 테스트

```powershell
python 02-web/02-web-goal/work/agent.py
```

터미널에서 `think` / `action` 이 오가는 걸 직접 볼 수 있습니다.

---

시작 → [`../docs/00-how-to-use.md`](../docs/00-how-to-use.md)
