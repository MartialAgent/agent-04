# 작업 폴더 (2-1단계)

**여러분이 만든 결과물이 쌓이는 곳입니다.** 지금은 이 README 하나뿐입니다.

[`../docs/03-steps.md`](../docs/03-steps.md)의 STEP을 하나씩 진행하면 여기에 파일이 생깁니다.

| STEP | 생기는 파일 |
|---|---|
| 0 | `CLAUDE.md` (규칙 파일 복사) |
| 1 | `index.html` |
| 2 | `style.css` |
| 3~4 | `script.js` |
| 5 | `server.py`, `requirements.txt` |
| 6 | (기존 파일 수정) |

## 실행

```powershell
# 리포 맨 위 폴더에서
.venv\Scripts\Activate.ps1
pip install -r 02-web/01-web-basic/work/requirements.txt
uvicorn server:app --reload --app-dir 02-web/01-web-basic/work
```

→ 브라우저에서 **http://localhost:8000**

> STEP 1~4까지는 서버가 없으니 `index.html`을 더블클릭해서 열면 됩니다.

---

시작 → [`../docs/00-how-to-use.md`](../docs/00-how-to-use.md)
