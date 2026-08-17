/*
  2-2단계 완성본 — 화면 "동작"
  ================================================================
  ★ 2-1단계의 script.js에서 무엇이 늘었나

    ① 사내 데이터를 표로 그린다        (data.js를 읽어서)
    ② 도구를 버튼으로 직접 실행한다     ← 내가 고른다
    ③ 대화 = 에이전트가 도구를 고른다   ← 쟤가 고른다
    ④ 밟은 노드를 그래프에 켠다 + 진행 과정/근거를 보여준다

  ★ 그런데 핵심 4개 — 요소 잡기 · 이벤트 · 값 읽기 · 화면 바꾸기 —
    는 2-1단계와 똑같습니다. 새로 배우는 개념은 사실상 없습니다.
    **에이전트가 더 많은 걸 돌려주니 화면이 더 많은 걸 보여줄 뿐입니다.**

  ★ 이 화면은 에이전트 안을 들여다보지 않습니다.
    agent.js의 Backend를 부르고, 받은 것을 그릴 뿐입니다.

      Backend.login(name)                → { token, user, thread_id }
      Backend.chat(question, threadId)   → { answer, steps, sources }
      Backend.history(threadId)          → { messages }
      Backend.reset(threadId)            → { ok }

    ★ 이 네 줄이 진짜 서비스에서는 그대로 서버 주소가 됩니다.
      Backend.chat(...) → fetch("/api/chat", ...) 로 바꾸는 것이 전부입니다.
      그 모습이 옆의 app.py입니다. 지금은 서버 없이 브라우저 안에서 끝냅니다.

  ★ 이 파일에 API 키도, 비밀번호도 없습니다. 있어서도 안 됩니다.
    브라우저가 통째로 내려받는 파일이라 접속자 누구나 볼 수 있습니다.
*/

// ── ① 요소 잡기 ──────────────────────────────────────────────
const loginForm = document.getElementById("login-form");
const loginName = document.getElementById("login-name");
const whoBox = document.getElementById("who-box");
const whoLabel = document.getElementById("who");
const newChatButton = document.getElementById("new-chat");
const logoutButton = document.getElementById("logout");

const inventoryBody = document.getElementById("inventory");
const toolCode = document.getElementById("tool-code");
const runLookupButton = document.getElementById("run-lookup");
const runListButton = document.getElementById("run-list");
const toolResult = document.getElementById("tool-result");

const graphNodes = {
  start: document.getElementById("g-start"),
  think: document.getElementById("g-think"),
  action: document.getElementById("g-action"),
  branch: document.getElementById("g-branch"),
  end: document.getElementById("g-end"),
};
const traceList = document.getElementById("trace");

const messagesBox = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");


// ── 로그인 상태 ──────────────────────────────────────────────
//
// ★ 그냥 변수 하나입니다. localStorage에도, 쿠키에도 넣지 않습니다.
//
//   그래서 **새로고침하거나 창을 닫으면 바로 로그인이 풀립니다.**
//   "세션이 끝나면 풀린다"는 게 이런 뜻입니다.
//
//   진짜 서비스는 여기서 갈립니다.
//     · 탭을 닫으면 풀리게  → sessionStorage
//     · 계속 로그인 유지    → localStorage 또는 쿠키 (+ 만료 관리)
//   어느 쪽이든 "얼마나 오래 기억할 것인가"를 정하는 문제입니다.
//
let session = null;   // { token, user, thread_id }


// ══ ② 사내 데이터를 표로 그리기 ══════════════════════════════
//
// data.js의 INVENTORY를 그대로 읽어 <tr>을 만듭니다.
// ★ 도메인을 바꾸면 data.js만 고치면 되고, 이 함수는 그대로입니다.
//
function drawInventory() {
  Object.keys(INVENTORY).forEach(function (code) {
    const item = INVENTORY[code];

    const row = document.createElement("tr");
    row.className = "row";
    row.title = code + " 조회하기";

    row.innerHTML =
      '<td class="code">' + code + "</td>" +
      "<td>" + item.이름 + "</td>" +
      '<td class="num' + (item.재고 === 0 ? " zero" : "") + '">' + item.재고 + "</td>" +
      "<td>" + item.납기 + "</td>";

    // 줄을 누르면 조회 도구가 바로 돕니다 (에이전트를 거치지 않습니다)
    row.addEventListener("click", function () {
      toolCode.value = code;
      showToolResult("lookup", lookup({ code: code }));
    });

    inventoryBody.appendChild(row);
  });
}


// ══ ③ 도구를 직접 실행하기 ═══════════════════════════════════
//
// ★ 여기가 이 화면에서 제일 중요한 대비입니다.
//
//     이 패널  : 어떤 도구를 쓸지 **내가** 고른다   → 그냥 프로그램
//     아래 대화 : 어떤 도구를 쓸지 **쟤가** 고른다   → 에이전트
//
//   부르는 함수는 똑같은 lookup() 입니다. 고르는 주체만 다릅니다.
//   그 차이 하나가 "챗봇"과 "에이전트"를 가릅니다.
//
function showToolResult(name, result) {
  const 근거 = result.sources.length
    ? "\n\n근거: " + result.sources.join(", ")
    : "\n\n근거: (없음)";

  toolResult.textContent = "> " + name + "()\n\n" + result.text + 근거;
}

runLookupButton.addEventListener("click", function () {
  const code = toolCode.value.trim().toUpperCase();
  if (code === "") {
    toolResult.textContent = "> 품번을 넣어주세요. (예: A-1023)";
    return;
  }
  showToolResult("lookup", lookup({ code: code }));
});

runListButton.addEventListener("click", function () {
  showToolResult("list_codes", listCodes());
});


// ══ ④ 그래프에 밟은 노드 켜기 ════════════════════════════════
//
// steps 배열을 처음부터 하나씩 재생합니다.
// ★ 배열을 그냥 그리는 게 아니라 순서대로 켜는 이유:
//   "판단 → 행동 → 다시 판단"이 **시간 순서로 일어난다**는 걸 보여주려고요.
//
function clearGraph() {
  Object.keys(graphNodes).forEach(function (key) {
    graphNodes[key].classList.remove("on");
  });
  traceList.innerHTML = '<li class="muted">아직 아무것도 안 했습니다.</li>';
}

function playGraph(steps) {
  Object.keys(graphNodes).forEach(function (k) { graphNodes[k].classList.remove("on"); });
  traceList.innerHTML = "";

  graphNodes.start.classList.add("on");

  steps.forEach(function (step, i) {
    setTimeout(function () {
      // 노드 켜기 — think면 보라, action이면 주황
      graphNodes.think.classList.toggle("on", step.node === "think");
      graphNodes.action.classList.toggle("on", step.node === "action");
      if (step.node === "action") graphNodes.branch.classList.add("on");

      // 밟은 단계를 목록에 한 줄 추가
      const li = document.createElement("li");
      li.innerHTML = '<span class="node ' + step.node + '">' + step.node + "</span>";
      li.appendChild(document.createTextNode(step.label));
      traceList.appendChild(li);

      // 마지막 단계면 잠시 뒤 끝 노드를 켭니다.
      // (바로 켜면 방금 켜진 노드가 보이기도 전에 지나가버립니다)
      if (i === steps.length - 1) {
        setTimeout(function () { graphNodes.end.classList.add("on"); }, 260);
      }
    }, 260 * i);
  });
}


// ══ ⑤ 말풍선 ════════════════════════════════════════════════

function addMyBubble(text) {
  clearEmpty();
  const bubble = document.createElement("div");
  bubble.className = "bubble me";
  bubble.textContent = text;
  messagesBox.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

// ── 답변 한 덩어리 ───────────────────────────────────────────
//
// ★ 여기가 2-1단계와 가장 크게 달라진 곳입니다.
//   2-1: 말풍선 하나
//   2-2: 말풍선 + 근거 칩 + 진행 과정   ← 에이전트가 그만큼 더 줬기 때문
//
function addBotBlock(text, steps, sources) {
  clearEmpty();

  const block = document.createElement("div");
  block.className = "bot-block";

  const bubble = document.createElement("div");
  bubble.className = "bubble bot";
  bubble.textContent = text;             // ★ innerHTML이 아니라 textContent
  block.appendChild(bubble);

  // 근거 칩 — 이 답이 어디서 나왔는지
  if (sources && sources.length) {
    const chips = document.createElement("div");
    chips.className = "sources";
    sources.forEach(function (source) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = "📎 " + source;
      chips.appendChild(chip);
    });
    block.appendChild(chips);
  }

  // 진행 과정 — <details>라 JavaScript 없이 접었다 폈다 됩니다
  if (steps && steps.length) {
    const details = document.createElement("details");
    details.className = "steps";

    const summary = document.createElement("summary");
    summary.textContent = "에이전트가 한 일 " + steps.length + "단계";
    details.appendChild(summary);

    const list = document.createElement("ol");
    steps.forEach(function (step) {
      const item = document.createElement("li");
      item.innerHTML = '<span class="node ' + step.node + '">' + step.node + "</span>";
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

function addPendingBubble() {
  clearEmpty();
  const bubble = document.createElement("div");
  bubble.className = "bubble bot pending";
  bubble.textContent = "🤔 판단 중...";
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


// ══ ⑥ 로그인 / 로그아웃 ══════════════════════════════════════
//
// ★ 실패라는 게 없습니다. 이름만 적으면 바로 들어갑니다.
//   비밀번호도, 확인도, 거절도 없습니다. 인증의 "자리"만 만들어둔 더미입니다.
//
//   그래도 배울 건 다 배웁니다 — 사용자가 구분되면 대화방(thread)이 나뉩니다.
//   [나가기] 후 다른 이름으로 들어가보세요. 대화가 따로 쌓입니다.
//
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = loginName.value.trim();
  if (name === "") return;              // 빈칸이면 아무것도 안 함

  session = Backend.login(name);        // 토큰·사용자·대화방을 받습니다
  applySession();
  loadHistory();
});

logoutButton.addEventListener("click", function () {
  // 변수를 비우는 게 로그아웃의 전부입니다. 어디에도 저장한 게 없으니까요.
  session = null;
  loginName.value = "";
  applySession();
  clearGraph();
});

// 로그인 상태에 맞춰 화면을 맞춥니다
function applySession() {
  const 들어옴 = session !== null;

  loginForm.classList.toggle("hidden", 들어옴);
  whoBox.classList.toggle("hidden", !들어옴);

  input.disabled = !들어옴;
  sendButton.disabled = !들어옴;

  if (들어옴) {
    whoLabel.textContent =
      session.user.name + " (" + session.user.부서 + ") · " + session.thread_id;
    input.focus();
  } else {
    messagesBox.innerHTML =
      '<p class="empty">위에 <b>이름을 넣고 [입장]</b>하면 대화할 수 있습니다.' +
      "<br>비밀번호는 없습니다. 아무 이름이나 됩니다." +
      "<br><br>왼쪽의 <b>데이터와 도구는 로그인 없이도</b> 눌러볼 수 있습니다.</p>";
    loginName.focus();
  }
}


// ══ ⑦ 대화 — 에이전트가 도구를 고르는 자리 ═══════════════════
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const question = input.value.trim();
  if (question === "" || session === null) return;

  addMyBubble(question);
  input.value = "";
  sendButton.disabled = true;

  const pending = addPendingBubble();

  // setTimeout은 기다리는 "흉내"입니다. 에이전트는 사실 즉시 답합니다.
  // 생각하는 티를 내야 사람이 덜 답답해하기 때문에 0.5초를 셉니다.
  setTimeout(function () {
    // ★ 에이전트가 돌려주는 것: { answer, steps, sources }
    //   2-1단계에서는 answer 하나뿐이었습니다.
    //   steps(진행 과정)와 sources(근거)가 늘어난 것이 이 단계의 전부입니다.
    const data = Backend.chat(question, session.thread_id);

    pending.remove();
    addBotBlock(data.answer, data.steps, data.sources);
    playGraph(data.steps);              // 위 그래프에 밟은 길을 재생

    sendButton.disabled = false;
    input.focus();
  }, 500);
});


// Enter로 보내기 / Shift+Enter로 줄바꿈
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});


// ── 새 대화 — 이 대화방을 비웁니다 ───────────────────────────
newChatButton.addEventListener("click", function () {
  Backend.reset(session.thread_id);
  loadHistory();
  clearGraph();
});


// ── 대화 기록 불러오기 ───────────────────────────────────────
//
// ★ 대화가 어디에 사는가 — 이 표가 2단계의 마지막 결론입니다
//
//     브라우저 (지금 여기) : 새로고침하면 사라짐
//     서버                 : 새로고침해도 남음
//     데이터베이스         : 서버를 꺼도 남음   → 진짜 서비스가 되려면 필요 (Supabase)
//
//   지금은 전부 브라우저 안에 있습니다. 그래서 F5를 누르면 대화도 로그인도 없어집니다.
//   직접 해보세요. 그 불편이 "서버가 왜 필요한가"에 대한 답입니다.
//
function loadHistory() {
  const data = Backend.history(session.thread_id);
  messagesBox.innerHTML = "";

  if (data.messages.length === 0) {
    messagesBox.innerHTML =
      '<p class="empty">아직 대화가 없습니다.<br><br>' +
      "예) <b>B-2041 언제 들어와?</b>  → 도구를 씁니다<br>" +
      "예) <b>안녕?</b>  → 도구 없이 답합니다<br>" +
      "예) <b>품번 목록 보여줘</b>  → 다른 도구를 씁니다</p>";
    return;
  }

  data.messages.forEach(function (message) {
    if (message.role === "user") {
      addMyBubble(message.content);
    } else {
      addBotBlock(message.content, message.steps, message.sources);
    }
  });
}


// ── 시작 ─────────────────────────────────────────────────────
drawInventory();
clearGraph();
applySession();        // session이 null이니 로그인 안 된 화면으로 시작합니다


/*
  🔎 이 화면에서 꼭 해볼 것

    1. 왼쪽 표에서 **B-2041을 누르세요** → 도구가 바로 돕니다 (내가 고름)
    2. 오른쪽에 **"B-2041 언제 들어와?"** 라고 치세요 → 에이전트가 같은 도구를 고릅니다
       ★ 결과는 같습니다. 다른 건 **누가 골랐느냐** 뿐입니다.

    3. **"안녕?"** 이라고 쳐보세요
       → 그래프에서 action이 안 켜집니다. 도구가 필요 없다고 판단한 것입니다.
       ★ 같은 코드가 질문에 따라 다른 길을 갑니다 = 갈림길(조건 분기)

    4. **"A-1023이랑 C-3077 재고 알려줘"**
       → action이 두 번 실행되고 근거 칩도 두 개 붙습니다.

    5. **"Z-9999?"**
       → "등록되지 않은 품번"이라고 답합니다. **지어내지 않습니다.**
         도구를 쓰는 이유가 이것입니다.

  🔎 F12 → Console 탭을 열어두면 에이전트가 걸어간 길이 그대로 찍힙니다.
     직접 불러볼 수도 있습니다.

       runAgent("품번 목록 보여줘")
       Backend.history(session.thread_id)
*/
