/*
  2-2단계 완성본 — 화면 "동작"
  ================================================================
  ★ 2-1단계의 script.js에서 무엇이 늘었나

    STEP 2 : 서버가 준 steps(진행 과정)를 답변 아래에 접기/펴기로 표시
    STEP 4 : 서버가 준 sources(근거)를 칩으로 표시
    STEP 6 : 로그인 화면 · 토큰 저장 · 대화방(thread) 관리 · 새 대화

  ★ 그런데 핵심 4개 — 요소 잡기 · 이벤트 · 값 읽기 · 화면 바꾸기 —
    는 2-1단계와 똑같습니다. 새로 배우는 개념은 사실상 없습니다.
    **서버가 더 많은 걸 돌려주니 화면이 더 많은 걸 보여줄 뿐입니다.**

  ★ 이 파일에 API 키도, 비밀번호도 없습니다. 있어서도 안 됩니다.
    브라우저가 통째로 내려받는 파일이라 접속자 누구나 볼 수 있습니다.
*/

// ── ① 요소 잡기 ──────────────────────────────────────────────
const loginView = document.getElementById("login-view");
const loginForm = document.getElementById("login-form");
const loginName = document.getElementById("login-name");

const chatView = document.getElementById("chat-view");
const whoLabel = document.getElementById("who");
const newChatButton = document.getElementById("new-chat");
const messagesBox = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");


// ── 로그인 상태 ──────────────────────────────────────────────
//
// localStorage = 브라우저에 남는 작은 저장소. 새로고침해도 안 사라집니다.
//
// ⚠️ 진짜 서비스에서는 토큰을 여기 두는 것도 조심해야 합니다
//    (XSS 공격에 노출). 지금은 더미 토큰이라 상관없습니다.
//
let session = null;   // { token, user, thread_id }

function saveSession(data) {
  session = data;
  localStorage.setItem("session", JSON.stringify(data));
}

function loadSession() {
  const raw = localStorage.getItem("session");
  session = raw ? JSON.parse(raw) : null;
  return session;
}

// ★ 로그인 이후 모든 요청에 이 머리(header)가 붙습니다.
//   서버는 이걸 보고 "누가 보낸 요청인지" 알아냅니다.
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + session.token,
  };
}


// ══ 화면 바꾸기 ═════════════════════════════════════════════

function showLogin() {
  loginView.classList.remove("hidden");
  chatView.classList.add("hidden");
  loginName.focus();
}

function showChat() {
  loginView.classList.add("hidden");
  chatView.classList.remove("hidden");
  whoLabel.textContent =
    session.user.name + " (" + session.user.부서 + ") · 대화방 " + session.thread_id;
  input.focus();
}


// ── 내가 쓴 말풍선 ───────────────────────────────────────────
function addMyBubble(text) {
  clearEmpty();
  const bubble = document.createElement("div");
  bubble.className = "bubble me";
  bubble.textContent = text;
  messagesBox.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

// ── 서버 답변 한 덩어리 ──────────────────────────────────────
//
// ★ 여기가 2-1단계와 가장 크게 달라진 곳입니다.
//   2-1: 말풍선 하나
//   2-2: 말풍선 + 근거 칩 + 진행 과정   ← 서버가 그만큼 더 줬기 때문
//
function addBotBlock(text, steps, sources) {
  clearEmpty();

  const block = document.createElement("div");
  block.className = "bot-block";

  // (1) 답변 말풍선 — 2-1단계와 동일
  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.textContent = text;
  block.appendChild(bubble);

  // (2) 근거 칩 — STEP 4에서 추가
  //     "이 답이 우리 데이터 어디서 나왔는지"를 보여줍니다
  if (sources && sources.length > 0) {
    const row = document.createElement("div");
    row.className = "sources";
    sources.forEach(function (source) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = "📄 " + source;
      row.appendChild(chip);
    });
    block.appendChild(row);
  }

  // (3) 진행 과정 — STEP 2에서 추가
  //     <details>는 브라우저가 이미 아는 태그라 JS 없이 접혔다 펴집니다
  if (steps && steps.length > 0) {
    const details = document.createElement("details");
    details.className = "steps";

    const summary = document.createElement("summary");
    summary.textContent = "에이전트가 한 일 " + steps.length + "단계";
    details.appendChild(summary);

    const list = document.createElement("ol");
    steps.forEach(function (step) {
      const item = document.createElement("li");

      const badge = document.createElement("span");
      badge.className = "node " + step.node;      // think / action
      badge.textContent = step.node;

      item.appendChild(badge);
      item.appendChild(document.createTextNode(step.label));
      list.appendChild(item);
    });
    details.appendChild(list);
    block.appendChild(details);
  }

  messagesBox.appendChild(block);
  scrollToBottom();
  return block;
}

function addErrorBubble(text) {
  return addPlainBubble("bubble error", text);
}

// "🤔 생각 중..." 자리표시 말풍선 — 답이 오면 지웁니다
function addPendingBubble() {
  return addPlainBubble("bubble bot pending", "🤔 생각 중...");
}

function addPlainBubble(className, text) {
  clearEmpty();
  const bubble = document.createElement("div");
  bubble.className = className;
  bubble.textContent = text;
  messagesBox.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

function clearEmpty() {
  const empty = messagesBox.querySelector(".empty");
  if (empty) empty.remove();
}

function scrollToBottom() {
  messagesBox.scrollTop = messagesBox.scrollHeight;
}


// ══ ② 이벤트 ═══════════════════════════════════════════════

// ── 로그인 (STEP 6) ──────────────────────────────────────────
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = loginName.value.trim();
  if (name === "") return;

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name }),
  });

  saveSession(await response.json());
  showChat();
  loadHistory();
});


// ── 메시지 보내기 ────────────────────────────────────────────
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const question = input.value.trim();
  if (question === "") return;

  addMyBubble(question);
  input.value = "";
  sendButton.disabled = true;

  const pending = addPendingBubble();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: authHeaders(),                       // ★ 토큰을 달고 갑니다
      body: JSON.stringify({
        question: question,
        thread_id: session.thread_id,               // ★ 어느 대화방인지
      }),
    });

    pending.remove();

    if (response.status === 401) {
      // 토큰이 없거나 잘못됐을 때 — 서버가 문을 열어주지 않은 것입니다
      localStorage.removeItem("session");
      showLogin();
      return;
    }
    if (!response.ok) {
      throw new Error("서버가 " + response.status + " 를 돌려줬습니다");
    }

    // 서버가 준 것: { answer, steps, sources }
    // 2-1단계에서는 answer 하나뿐이었습니다.
    const data = await response.json();
    addBotBlock(data.answer, data.steps, data.sources);

  } catch (error) {
    pending.remove();
    addErrorBubble(
      "❌ " + error.message +
      "\n\n터미널에서 uvicorn이 돌고 있는지 확인해보세요.");
    console.error(error);

  } finally {
    sendButton.disabled = false;
    input.focus();
  }
});


// Enter로 보내기 / Shift+Enter로 줄바꿈
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});


// ── 새 대화 (STEP 6) — 이 대화방을 비웁니다 ──────────────────
newChatButton.addEventListener("click", async function () {
  await fetch("/api/reset?thread_id=" + encodeURIComponent(session.thread_id), {
    method: "POST",
    headers: authHeaders(),
  });
  messagesBox.innerHTML = "";
  loadHistory();
});


// ── 대화 기록 불러오기 (STEP 6) ──────────────────────────────
//
// ★ 대화가 어디에 사는가
//     브라우저 : 새로고침하면 사라짐
//     서버     : 새로고침해도 남음   ← 지금 여기
//     DB       : 서버를 꺼도 남음    → 진짜 서비스가 되려면 필요 (Supabase)
//
async function loadHistory() {
  try {
    const url = "/api/history?thread_id=" + encodeURIComponent(session.thread_id);
    const response = await fetch(url, { headers: authHeaders() });

    if (response.status === 401) {
      localStorage.removeItem("session");
      showLogin();
      return;
    }

    const data = await response.json();
    messagesBox.innerHTML = "";

    if (data.messages.length === 0) {
      messagesBox.innerHTML =
        '<p class="empty">아직 대화가 없습니다.<br>' +
        '예) <b>B-2041 언제 들어와?</b> 또는 <b>품번 목록 보여줘</b></p>';
      return;
    }

    data.messages.forEach(function (message) {
      if (message.role === "user") {
        addMyBubble(message.content);
      } else {
        addBotBlock(message.content, message.steps, message.sources);
      }
    });

  } catch (error) {
    messagesBox.innerHTML =
      '<p class="empty">서버에 연결하지 못했습니다.<br>터미널에서 uvicorn을 실행했나요?</p>';
  }
}


// ── 시작 ─────────────────────────────────────────────────────
if (loadSession()) {
  showChat();       // 이미 로그인해둔 상태면 바로 채팅으로
  loadHistory();
} else {
  showLogin();
}


/*
  🔎 F12 → Network 탭에서 확인해볼 것

    1. [시작하기]를 누르면  → login  요청. Response에 token과 thread_id
    2. 메시지를 보내면      → chat   요청.
         Headers  탭 : Authorization: Bearer dummy-token-...
         Payload  탭 : {"question": "...", "thread_id": "..."}
         Response 탭 : {"answer": "...", "steps": [...], "sources": [...]}

    ★ steps 배열을 눈으로 보세요.
      화면의 "에이전트가 한 일"은 저 배열을 그대로 그린 것입니다.
      **프론트가 똑똑해진 게 아니라 백엔드가 더 많이 알려준 것입니다.**

  🔎 로그아웃하고 싶으면 Console 탭에서:
      localStorage.clear(); location.reload();
*/
