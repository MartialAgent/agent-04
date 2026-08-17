/*
  2-1단계 — 화면 "동작"
  ========================================
  이 파일에서 배울 개념은 딱 4개입니다.

    ① 요소 잡기   document.getElementById("...")   HTML에서 부품 꺼내오기
    ② 이벤트      addEventListener("click", ...)   "눌리면 이걸 해라"
    ③ 값 읽기     요소.value                        사용자가 쓴 글자 가져오기
    ④ 화면 바꾸기  요소.textContent = ...            결과 영역에 글자 넣기

  ★ 중요 — 이 단계의 응답은 가짜입니다.
    무엇을 입력하든 아래 FAKE_ANSWER가 그대로 나옵니다.
    "이거 진짜 AI가 아니네?" 를 확인하는 게 이 단계의 마지막 장면이고,
    그게 2-2단계(서버 붙이기)의 출발점입니다.
*/

// ① 요소 잡기 — index.html의 id와 짝을 맞춥니다
const questionBox = document.getElementById("question");
const askButton = document.getElementById("ask-button");
const resultBox = document.getElementById("result");

// 가짜 응답 (2-2단계에서 진짜 서버 응답으로 교체됩니다)
const FAKE_ANSWER =
  "🤖 (가짜 응답입니다)\n\n" +
  "아직 AI가 연결되지 않았습니다.\n" +
  "무엇을 입력해도 이 문장만 나옵니다.\n\n" +
  "→ 2-2단계에서 이 자리에 진짜 답변이 들어옵니다.";

// ② 이벤트 — 버튼이 눌리면 아래 함수가 실행됩니다
askButton.addEventListener("click", function () {

  // ③ 값 읽기 — .trim()은 앞뒤 공백 제거
  const question = questionBox.value.trim();

  // 빈 입력 방어
  if (question === "") {
    resultBox.textContent = "내용을 입력해주세요.";
    return;                        // 여기서 함수 종료
  }

  // ④ 화면 바꾸기 — 먼저 "생각 중" 표시
  resultBox.textContent = "🤔 생각 중...";
  askButton.disabled = true;       // 연타 방지

  /*
    setTimeout = "1초 뒤에 실행해라"

    ★ 설계 포인트
      진짜 AI라면 답이 오기까지 시간이 걸립니다.
      지금은 그 대기 시간을 흉내만 냅니다.
      2-2단계에서 이 자리가 실제 서버 통신(fetch)으로 바뀝니다.
      구조를 미리 맞춰둔 것입니다.
  */
  setTimeout(function () {
    resultBox.textContent = FAKE_ANSWER;
    askButton.disabled = false;
  }, 1000);                        // 1000밀리초 = 1초

});

/*
  🔎 F12를 눌러보세요 (개발자 도구)

    Console 탭 — 빨간 글씨가 뜨면 그게 에러입니다.
                 AI에게 물어볼 땐 그 빨간 글씨를 그대로 복사해서 붙이세요.
    Elements 탭 — 화면의 어느 부분이 어느 태그인지 짝지어 볼 수 있습니다.

  아래 줄의 결과가 Console에 찍히는지 확인해보세요.
*/
console.log("script.js가 불러와졌습니다. 요소 3개를 찾았나요?", {
  questionBox: questionBox,
  askButton: askButton,
  resultBox: resultBox,
});
