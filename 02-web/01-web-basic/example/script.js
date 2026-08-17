/*
  2-1단계 완성본 — 채팅창 "동작"
  ================================================================
  이 파일에서 배울 개념은 딱 5개입니다. 도메인 불문 전원에게 필요합니다.

    ① 요소 잡기   document.getElementById("...")   HTML에서 부품 꺼내오기
    ② 이벤트      addEventListener("submit", ...)  "제출되면 이걸 해라"
    ③ 값 읽기     요소.value                        사용자가 쓴 글자 가져오기
    ④ 화면 바꾸기  createElement / appendChild       말풍선을 새로 만들어 붙이기
    ⑤ 서버에 묻기  fetch(...)                        JSON을 보내고 JSON을 받기

  ★ 단계별로 이 파일이 어떻게 변했는지

    STEP 3  ①②③④ 까지. 내가 친 말만 말풍선으로 쌓임. 답이 없음.
    STEP 4  가짜 답변 규칙을 이 파일 안에 넣음. 프론트만으로 대화가 됨.
            → 그런데 규칙이 브라우저에 다 보이고, 새로고침하면 다 사라짐.
    STEP 5  ⑤ 등장. 답변 만드는 일을 server.py로 이사시킴. (지금 이 상태)
    STEP 6  시작할 때 서버에 저장된 대화를 불러옴 → 새로고침해도 안 사라짐.

  ★ 이 파일에 API 키는 없습니다. 있어서도 안 됩니다.
    이 파일은 브라우저가 통째로 내려받는 파일이라 접속자 누구나 볼 수 있습니다.
*/

// ① 요소 잡기 — index.html의 id와 짝을 맞춥니다
const messagesBox = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");


// ── ④ 화면 바꾸기 — 말풍선 하나를 만들어 대화 영역에 붙입니다 ──
//
// role: "me" = 내가 쓴 말(오른쪽), "bot" = 서버 답(왼쪽), "error" = 오류
//
function addBubble(role, text, extraClass) {
  const empty = messagesBox.querySelector(".empty");
  if (empty) empty.remove();          // 안내 문구가 있으면 치웁니다

  const bubble = document.createElement("div");
  bubble.className = "bubble " + role + (extraClass ? " " + extraClass : "");
  bubble.textContent = text;          // ★ innerHTML이 아니라 textContent
                                      //   사용자가 쓴 글을 태그로 해석하지 않게 합니다
  messagesBox.appendChild(bubble);

  // 항상 맨 아래(최신 메시지)가 보이도록 스크롤을 내립니다
  messagesBox.scrollTop = messagesBox.scrollHeight;
  return bubble;
}


// ── ② 이벤트 — 보내기 ────────────────────────────────────────
//
// async가 붙었습니다. "이 안에서 기다릴 일이 있다"는 표시입니다.
//
form.addEventListener("submit", async function (event) {
  event.preventDefault();             // 폼의 기본 동작(페이지 새로고침)을 막습니다

  // ③ 값 읽기 — .trim()은 앞뒤 공백 제거
  const question = input.value.trim();
  if (question === "") return;        // 빈 입력은 무시

  addBubble("me", question);          // 내 말풍선 먼저 띄우기
  input.value = "";                   // 입력창 비우기
  sendButton.disabled = true;         // 연타 방지

  const pending = addBubble("bot", "🤔 생각 중...", "pending");

  try {
    /*
      ⑤ 서버에 묻기

        fetch(주소, 옵션)  = "이 주소로 요청을 보내라"
        await             = "답이 올 때까지 기다려라"

      보내는 것도 받는 것도 JSON입니다.
      화면과 서버는 서로의 코드를 모른 채, JSON이라는 공용어로만 대화합니다.

      ★ 여기가 STEP 4의 "가짜 답변 규칙"이 있던 자리입니다.
        규칙은 사라지지 않았습니다. server.py로 이사한 것뿐입니다.
    */
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question }),   // JS 객체 → JSON 글자
    });

    if (!response.ok) {
      throw new Error("서버가 " + response.status + " 를 돌려줬습니다");
    }

    const data = await response.json();               // JSON 글자 → JS 객체
    pending.remove();
    addBubble("bot", data.answer);

  } catch (error) {
    // 서버가 꺼져 있거나 통신에 실패했을 때
    pending.remove();
    addBubble("error",
      "❌ 서버에 연결하지 못했습니다.\n\n" + error.message +
      "\n\n터미널에서 uvicorn이 돌고 있는지 확인해보세요.");
    console.error(error);

  } finally {
    sendButton.disabled = false;      // 성공하든 실패하든 버튼은 다시 살립니다
    input.focus();
  }
});


// ── Enter로 보내기 / Shift+Enter로 줄바꿈 ────────────────────
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();             // 위의 submit 이벤트를 그대로 발생시킵니다
  }
});


// ── STEP 6 — 시작할 때 서버에 저장된 대화 불러오기 ───────────
//
// ★ 이게 "데이터가 어디에 사는가"를 보여주는 자리입니다.
//   STEP 4까지는 대화가 브라우저 메모리에만 있어서 새로고침하면 증발했습니다.
//   지금은 서버가 들고 있으니 새로고침해도 남아 있습니다.
//   (다만 서버를 끄면 사라집니다 — 진짜 서비스라면 DB가 필요합니다)
//
async function loadHistory() {
  try {
    const response = await fetch("/api/history");
    const data = await response.json();

    if (data.messages.length === 0) {
      messagesBox.innerHTML =
        '<p class="empty">아직 대화가 없습니다.<br>아래에 무엇이든 입력해보세요.</p>';
      return;
    }
    data.messages.forEach(function (message) {
      addBubble(message.role === "user" ? "me" : "bot", message.content);
    });

  } catch (error) {
    messagesBox.innerHTML =
      '<p class="empty">서버에 연결하지 못했습니다.<br>터미널에서 uvicorn을 실행했나요?</p>';
  }
}

loadHistory();


/*
  🔎 F12 — 개발자 도구. 도메인 불문 공통 생존 기술입니다.

    Console 탭 — 빨간 글씨가 뜨면 그게 에러입니다.
                 클로드에게 물어볼 땐 그 빨간 글씨를 그대로 복사해서 붙이세요.

    Network 탭 — 이 단계의 하이라이트입니다.
                 열어둔 채로 메시지를 보내면 목록에 chat 이 새로 생깁니다.
                   Payload  탭 : 내가 보낸 것    {"question": "..."}
                   Response 탭 : 서버가 준 것    {"answer": "..."}
                 화면과 서버가 분리되어 있다는 말을 눈으로 확인하는 자리입니다.
*/
console.log("script.js 로딩 완료. 요소를 다 찾았나요?", {
  messagesBox: messagesBox,
  form: form,
  input: input,
  sendButton: sendButton,
});
