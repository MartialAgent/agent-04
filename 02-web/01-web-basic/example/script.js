/*
  2-1단계 완성본 — 채팅창 "동작"
  ================================================================
  이 파일에서 배울 개념은 딱 4개입니다. 도메인 불문 전원에게 필요합니다.

    ① 요소 잡기   document.getElementById("...")   HTML에서 부품 꺼내오기
    ② 이벤트      addEventListener("submit", ...)  "제출되면 이걸 해라"
    ③ 값 읽기     요소.value                        사용자가 쓴 글자 가져오기
    ④ 화면 바꾸기  createElement / appendChild       말풍선을 새로 만들어 붙이기

  ★ 단계별로 이 파일이 어떻게 변했는지

    STEP 3  ①②③④ 까지. 내가 친 말만 말풍선으로 쌓임. 답이 없음.
    STEP 4  data.js를 훑어 답을 찾음. 대화가 됨. (지금 이 상태)
    STEP 5  data.js만 내 도메인으로 교체. ★ 이 파일은 한 글자도 안 바뀜.

  ★ 이 파일은 DUMMY_DATA의 "내용"을 모릅니다. "모양"만 압니다.

    { 키워드: [...], 답변: "..." } 이 모양만 지키면
    재고표든 업무분장표든 서지 목록이든 똑같이 동작합니다.
    그래서 도메인이 달라도 이 파일은 공용입니다.
    2-2단계에서 그 표가 통째로 서버로 이사갈 수 있는 이유이기도 합니다.

  ★ 이 파일에는 서버 호출도, 서버 주소도, API 키도 없습니다.
    2-1단계는 브라우저 안에서 끝납니다. 부를 곳이 아예 없습니다.
    (그래서 F12 → Network 탭을 열어둬도 아무 요청이 안 생깁니다)
*/

// ① 요소 잡기 — index.html의 id와 짝을 맞춥니다
const messagesBox = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");


// ── ④ 화면 바꾸기 — 말풍선 하나를 만들어 대화 영역에 붙입니다 ──
//
// role: "me" = 내가 쓴 말(오른쪽), "bot" = 답변(왼쪽)
//
function addBubble(role, text, extraClass) {
  const empty = messagesBox.querySelector(".empty");
  if (empty) empty.remove();          // 안내 문구가 있으면 치웁니다

  const bubble = document.createElement("div");
  bubble.className = "bubble " + role + (extraClass ? " " + extraClass : "");
  bubble.textContent = text;          // ★ innerHTML이 아니라 textContent
                                      //   사용자가 쓴 글을 태그로 해석하지 않게 합니다.
                                      //   innerHTML을 쓰면 <b>나 <script>를 입력했을 때
                                      //   글자가 아니라 "명령"으로 실행됩니다.
  messagesBox.appendChild(bubble);

  // 항상 맨 아래(최신 메시지)가 보이도록 스크롤을 내립니다
  messagesBox.scrollTop = messagesBox.scrollHeight;
  return bubble;
}


// ── 답 찾기 — data.js의 표를 위에서부터 훑습니다 ──────────────
//
// ★ 여기가 "찾아본다"에 해당하는 자리입니다.
//   지금은 배열 하나를 훑을 뿐이지만, 진짜 서비스라면
//   이 자리에서 데이터베이스를 조회하거나 사내 API를 부릅니다.
//   2-2단계에서는 이 일이 서버로 옮겨가고, 그다음엔 에이전트가 맡습니다.
//
function findAnswer(question) {
  // toLowerCase() — 대소문자를 구분하지 않으려고 전부 소문자로 맞춥니다.
  // "HELLO"라고 쳐도 "hello"와 똑같이 걸리게 하려는 것입니다.
  const text = question.toLowerCase();

  for (const 항목 of DUMMY_DATA) {
    // 키워드 중 하나라도 질문에 들어 있으면 그 답변을 씁니다.
    // 위에서부터 훑으니 먼저 걸리는 것이 이깁니다 = 순서가 곧 우선순위.
    const 걸렸나 = 항목.키워드.some(function (키워드) {
      return text.includes(키워드.toLowerCase());
    });

    if (걸렸나) return 항목.답변;
  }

  // 어디에도 안 걸렸으면 — 아는 척하지 않습니다
  return 모르는답변(question);
}


// ── ② 이벤트 — 보내기 ────────────────────────────────────────
form.addEventListener("submit", function (event) {
  event.preventDefault();             // 폼의 기본 동작(페이지 새로고침)을 막습니다

  // ③ 값 읽기 — .trim()은 앞뒤 공백 제거
  const question = input.value.trim();
  if (question === "") return;        // 빈 입력은 무시

  addBubble("me", question);          // 내 말풍선 먼저 띄우기
  input.value = "";                   // 입력창 비우기
  sendButton.disabled = true;         // 연타 방지

  const pending = addBubble("bot", "🤔 생각 중...", "pending");

  /*
    ★ setTimeout — 기다리는 "흉내"입니다.

      지금은 기다릴 이유가 전혀 없습니다. 답이 이미 옆 파일(data.js)에 있으니
      사실 0초 만에 답할 수 있습니다. 그런데도 0.6초를 세는 이유는

        2-2단계에서 이 자리가 "진짜 서버 통신"으로 바뀌기 때문입니다.

      그때는 정말로 기다리게 됩니다. 자리를 미리 비워두는 것입니다.
      바뀌는 건 이 안쪽뿐이고, 바깥의 ①②③④는 그대로입니다.
  */
  setTimeout(function () {
    pending.remove();
    addBubble("bot", findAnswer(question));

    sendButton.disabled = false;      // 버튼을 다시 살리고
    input.focus();                    // 커서를 입력창에 둡니다
  }, 600);
});


// ── Enter로 보내기 / Shift+Enter로 줄바꿈 ────────────────────
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();             // 위의 submit 이벤트를 그대로 발생시킵니다
  }
});


// ── 시작할 때 안내 문구 ──────────────────────────────────────
//
// ★ 이 문구는 새로고침할 때마다 다시 나옵니다.
//   나눈 대화가 어디에도 안 남기 때문입니다 (브라우저 메모리에만 있었음).
//   F5를 눌러 직접 확인해보세요. 그 불편이 2-2단계로 가는 이유의 나머지 절반입니다.
//
messagesBox.innerHTML =
  '<p class="empty">아직 대화가 없습니다.<br>아래에 무엇이든 입력해보세요.' +
  '<br><br>예: <b>A-1023 재고 얼마나 있어?</b></p>';


/*
  🔎 F12 — 개발자 도구. 도메인 불문 공통 생존 기술입니다.

    Console 탭 — 빨간 글씨가 뜨면 그게 에러입니다.
                 클로드에게 물어볼 땐 그 빨간 글씨를 그대로 복사해서 붙이세요.

    Sources 탭 — 이 단계의 하이라이트입니다.
                 data.js를 클릭해보세요. 답변 데이터가 전부 그대로 보입니다.
                 접속자 누구나 볼 수 있습니다. 여기에 사내 데이터를 적었다면
                 그 순간 유출입니다.

    Network 탭 — 열어둔 채로 메시지를 보내보세요. 아무 요청도 안 생깁니다.
                 서버가 없다는 증거입니다. 2-2단계에서 여기에 chat이 생깁니다.
*/
console.log("script.js 로딩 완료. 요소를 다 찾았나요?", {
  messagesBox: messagesBox,
  form: form,
  input: input,
  sendButton: sendButton,
  더미데이터개수: typeof DUMMY_DATA !== "undefined" ? DUMMY_DATA.length : "data.js를 못 찾았습니다!",
});
