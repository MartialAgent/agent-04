/*
  2-2단계 완성본 — 에이전트 (껍데기에 들어가는 "내용물")
  ================================================================
  script.js는 이 파일의 Backend 하나만 부릅니다.
  화면은 안을 들여다보지 않습니다. 그래서 이 파일만 갈아끼우면
  같은 껍데기가 어떤 도메인의 에이전트도 받아냅니다.

  ★ 그래프 구조 — 에이전트를 에이전트답게 만드는 건 딱 두 개입니다.
    ① 갈림길(조건 분기)   ② 되돌아가는 화살표(반복)

         ┌───────────────────────────────────┐
         │                                   │ (도구 결과를 들고 다시 판단)
   [시작]─▶[think: 판단]──조건분기──▶[action: 행동 = 도구 실행]
                            │
                            └──(도구 필요 없음)──▶[끝]

  ★ 여기서 "진짜"인 것 / "가짜"인 것
      진짜 : 이 파일 전체의 구조 — 노드, 엣지, 상태, 조건분기, 반복
      가짜 : think 노드가 부르는 decide() 의 판단 로직 (규칙 기반)
             → 3~5단계에서 여기에 진짜 LLM이 들어갑니다. 이 파일은 안 바뀝니다.

  ★ 옆의 agent.py는 같은 그래프를 LangGraph로 짠 것입니다.
    이 파일은 그 그래프를 손으로 돌립니다 (while 반복 한 줄).
    LangGraph가 대신 해주는 일이 무엇인지 두 파일을 비교하면 보입니다.
      agent.py  : graph.add_conditional_edges("think", route, ...)  ← 선언한다
      agent.js  : while (true) { ... if (route() === END) break; }  ← 직접 돈다
    선언해두면 나중에 중단·재개·병렬·기록이 공짜로 따라옵니다. 그게 LangGraph를 쓰는 이유입니다.
*/

// ════════════════════════════════════════════════════════════════
//  ① 도구(Tool) — 에이전트가 손에 쥐는 "연장"
// ════════════════════════════════════════════════════════════════
//
// 도구는 그냥 함수입니다. 특별한 게 없습니다.
// 다만 결과와 함께 **출처(source)** 를 같이 돌려주게 했습니다.
// 그래야 화면에서 "이 답이 어디서 나왔는지"를 보여줄 수 있습니다.
//
// ★ 진짜 서비스라면 이 함수 안이 DB 조회나 사내 API 호출로 바뀝니다.
//   함수의 겉모양(이름·인자·돌려주는 값)은 그대로입니다.

// 품번으로 재고 수량과 납기를 조회한다. 예: 'A-1023'
function lookup(args) {
  const code = args.code;
  console.log("  🔧 [도구] lookup(" + code + ")");

  const item = INVENTORY[code];
  if (!item) {
    // ★ 없는 걸 지어내지 않습니다. 이게 도구를 쓰는 이유입니다.
    return { text: code + " : 등록되지 않은 품번입니다.", sources: [] };
  }

  const text =
    code + " (" + item.이름 + ")\n" +
    "  재고 " + item.재고 + "개 · 납기 " + item.납기 + " · 담당 " + item.담당;

  return { text: text, sources: ["재고표 / " + code] };
}

// 등록된 품번 전체 목록을 돌려준다. 인자 없음.
function listCodes() {
  console.log("  🔧 [도구] list_codes()");

  const lines = Object.keys(INVENTORY).map(function (code) {
    return "  " + code + " — " + INVENTORY[code].이름;
  });

  return {
    text: "등록된 품번은 다음과 같습니다.\n" + lines.join("\n"),
    sources: ["재고표 / 전체"],
  };
}

const TOOLS = {
  lookup: lookup,
  list_codes: listCodes,
};


// ════════════════════════════════════════════════════════════════
//  ② 상태(State) — 노드들이 주고받는 공유 메모장
// ════════════════════════════════════════════════════════════════
//
//   messages : 대화 내용 (사용자 / 에이전트 / 도구)
//   steps    : 에이전트가 밟은 단계 기록  ← 화면에 그대로 보여줄 것
//   sources  : 참조한 데이터 출처         ← 화면에 근거 칩으로 보여줄 것
//
// ★ steps와 sources는 "에이전트가 무슨 일을 했는지"를 밖에서 볼 수 있게
//   일부러 상태에 넣어둔 것입니다. 챗봇이라면 필요 없는 항목입니다.
//   이 두 개가 화면의 [진행 과정]과 [근거 칩]이 됩니다.


// ════════════════════════════════════════════════════════════════
//  ③ 노드(Node) — 작업 한 단계 = 함수 하나
// ════════════════════════════════════════════════════════════════

// 판단하는 자리. "도구를 쓸까? 그냥 답할까?"
function thinkNode(state) {
  console.log("  🧠 [think] 판단 중...");

  const decision = decide(state.messages);      // ← 여기가 진짜 LLM 자리 (brain.js)

  if (decision.tool_calls) {
    const names = decision.tool_calls.map(function (c) { return c.name; }).join(", ");
    return {
      messages: [{ role: "assistant", content: "", tool_calls: decision.tool_calls }],
      steps: [{ node: "think", label: "도구가 필요하다고 판단 → " + names }],
      sources: [],
    };
  }

  // 도구를 쓰고 돌아온 길인지, 처음부터 도구가 필요 없었는지 구분해서 적습니다
  const cameBack = state.messages[state.messages.length - 1].role === "tool";
  const label = cameBack ? "도구 결과를 정리해 답변 작성" : "도구 없이 답할 수 있다고 판단";

  return {
    messages: [{ role: "assistant", content: decision.content, tool_calls: [] }],
    steps: [{ node: "think", label: label }],
    sources: [],
  };
}

// 행동하는 자리. think가 지시한 도구를 실제로 실행합니다.
function actionNode(state) {
  console.log("  ⚙️ [action] 도구 실행");

  const calls = state.messages[state.messages.length - 1].tool_calls;
  const messages = [], steps = [], sources = [];

  calls.forEach(function (call) {
    const tool = TOOLS[call.name];
    const result = tool(call.args);

    messages.push({ role: "tool", name: call.name, content: result.text });
    steps.push({ node: "action", label: call.name + "(" + formatArgs(call.args) + ") 실행" });
    result.sources.forEach(function (s) { sources.push(s); });
  });

  return { messages: messages, steps: steps, sources: sources };
}

function formatArgs(args) {
  return Object.keys(args).map(function (k) { return k + "='" + args[k] + "'"; }).join(", ");
}


// ════════════════════════════════════════════════════════════════
//  ④ 갈림길(조건 분기) — think 다음에 어디로 갈까?
// ════════════════════════════════════════════════════════════════
//
// ★ 이 함수 하나가 챗봇과 에이전트를 가릅니다.
//   챗봇에는 갈림길이 없습니다. 질문 → 답, 끝입니다.
//
const END = "__end__";

function route(state) {
  const last = state.messages[state.messages.length - 1];
  if (last.tool_calls && last.tool_calls.length > 0) {   // "도구 써줘"라고 했으면
    return "action";                                     //   → 행동 노드로
  }
  return END;                                            // 아니면 답이 다 나온 것 → 끝
}


// ════════════════════════════════════════════════════════════════
//  ⑤ 그래프 돌리기
// ════════════════════════════════════════════════════════════════
//
// agent.py에서는 이 부분이 이렇게 생겼습니다.
//     graph.add_edge(START, "think")
//     graph.add_conditional_edges("think", route, {"action": "action", END: END})
//     graph.add_edge("action", "think")   ← 되돌아가는 화살표 = 반복
//
// 여기서는 라이브러리 없이 그 흐름을 직접 돕니다. 하는 일은 같습니다.
//
function runGraph(state) {
  let guard = 0;

  while (true) {
    // [think] 판단
    merge(state, thinkNode(state));

    // 갈림길
    if (route(state) === END) break;

    // [action] 행동 → 그리고 while이 다시 think로 돌려보냅니다 (= 반복 엣지)
    merge(state, actionNode(state));

    // 혹시 규칙이 잘못돼 무한 반복이 되면 멈추게 하는 안전장치
    if (++guard > 10) break;
  }

  return state;
}

// 노드가 돌려준 것을 상태에 "이어붙입니다" (덮어쓰지 않습니다)
// agent.py의 Annotated[list, add] 가 하는 일과 같습니다.
function merge(state, patch) {
  ["messages", "steps", "sources"].forEach(function (key) {
    (patch[key] || []).forEach(function (item) { state[key].push(item); });
  });
}


// 질문 한 줄을 받아 { answer, steps, sources } 를 돌려준다.
//
// ★ 2-1단계에서는 화면이 data.js의 표를 훑어 문자열 하나만 얻었습니다.
//   지금은 답변에 더해 **에이전트가 무슨 일을 했는지**까지 함께 돌려줍니다.
//   화면에 새 기능이 생기는 건 바로 이것 때문입니다.
//
function runAgent(question, history) {
  console.log("\n💬 질문: " + question);

  const messages = (history || []).concat([{ role: "user", content: question }]);
  const state = runGraph({ messages: messages, steps: [], sources: [] });

  const last = state.messages[state.messages.length - 1];

  return {
    answer: last.content,
    steps: state.steps,
    sources: [...new Set(state.sources)],   // 중복 제거
  };
}


// ════════════════════════════════════════════════════════════════
//  ⑥ 화면이 부르는 곳 — 진짜 서비스라면 여기가 "서버"입니다
// ════════════════════════════════════════════════════════════════
//
// ★ 이 Backend 객체는 app.py가 하던 일을 브라우저 안에서 대신합니다.
//
//     app.py                        agent.js의 Backend
//     ─────────────────────────     ──────────────────────────
//     @app.post("/api/login")   →   Backend.login(name)
//     @app.post("/api/chat")    →   Backend.chat(question, threadId)
//     @app.get("/api/history")  →   Backend.history(threadId)
//     @app.post("/api/reset")   →   Backend.reset(threadId)
//
//   주고받는 데이터의 모양이 완전히 같습니다. 그래서 나중에 진짜 서버를 붙일 때
//   script.js에서 Backend.chat(...) 을 fetch("/api/chat", ...) 로 바꾸기만 하면 됩니다.
//   **그 한 줄이 2-1 → 2-2 → 진짜 서비스로 가는 길 전부입니다.**
//
// ⚠️ 지금은 모든 게 브라우저 안에 있습니다. 그래서
//      · 데이터(data.js)가 F12에 다 보이고
//      · 새로고침하면 대화가 사라집니다
//    진짜 서비스가 되려면 이 Backend를 서버로 옮겨야 합니다.
//    그 모습이 옆의 app.py입니다.

// 대화방 저장소 — 사용자마다 하나씩. 그냥 객체입니다. 데이터베이스가 아닙니다.
const THREADS = {};

function makeId(name) {
  // 이름을 짧은 영문 아이디로 바꿉니다.
  // ⚠️ 한글을 그대로 쓰면 나중에 진짜 서버를 붙일 때 HTTP 헤더에서 막힙니다.
  //    (헤더에는 아스키만 넣을 수 있습니다) 그래서 처음부터 영문으로 만듭니다.
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return "u" + hash.toString(16).slice(0, 7);
}

const Backend = {
  // 더미 로그인 — 아무 이름이나 통과합니다. 비밀번호도 없습니다.
  login: function (name) {
    const cleaned = name.trim() || "손님";
    const userId = makeId(cleaned);
    const threadId = "thread-" + userId;

    if (!THREADS[threadId]) THREADS[threadId] = [];

    return {
      token: "dummy-token-" + userId,   // ⚠️ 진짜 토큰이 아닙니다. 검사도 안 합니다.
      user: findUser(cleaned),
      thread_id: threadId,
    };
  },

  // 질문을 에이전트에게 넘기고 결과를 돌려준다
  chat: function (question, threadId) {
    const thread = THREADS[threadId] || (THREADS[threadId] = []);

    const result = runAgent(question, thread);

    thread.push({ role: "user", content: question });
    thread.push({
      role: "bot",
      content: result.answer,
      steps: result.steps,
      sources: result.sources,
    });

    return result;
  },

  // 이 대화방에 쌓인 기록을 돌려준다
  history: function (threadId) {
    return { messages: THREADS[threadId] || [] };
  },

  // 이 대화방을 비운다 (= 새 대화 시작)
  reset: function (threadId) {
    THREADS[threadId] = [];
    return { ok: true };
  },
};
