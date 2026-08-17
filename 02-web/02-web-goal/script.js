/*
  2-2단계 — 화면 "동작" (2-1과 딱 한 군데가 다릅니다)
  ========================================
  2-1: setTimeout으로 1초 기다렸다가 → 미리 적어둔 가짜 문장을 표시
  2-2: fetch로 서버에 물어보고  → 서버가 준 진짜 답을 표시

  기다리는 자리가 "흉내"에서 "진짜 네트워크 대기"로 바뀐 것뿐입니다.
  요소 잡기 · 이벤트 · 값 읽기 · 화면 바꾸기 4개는 그대로입니다.

  ★ 이 파일에 API 키는 없습니다. 있어서도 안 됩니다.
    이 파일은 브라우저가 내려받는 파일이라 접속자 누구나 볼 수 있습니다.
    키는 서버 쪽 .env에만 둡니다.
*/

// ① 요소 잡기 — 2-1과 동일
const questionBox = document.getElementById("question");
const askButton = document.getElementById("ask-button");
const resultBox = document.getElementById("result");

// ② 이벤트 — async가 붙었습니다. "안에서 기다릴 일이 있다"는 표시입니다.
askButton.addEventListener("click", async function () {

  // ③ 값 읽기
  const question = questionBox.value.trim();

  if (question === "") {
    resultBox.textContent = "내용을 입력해주세요.";
    return;
  }

  // ④ 화면 바꾸기
  resultBox.textContent = "🤔 생각 중...";
  askButton.disabled = true;

  try {
    /*
      ★ 여기가 2-1의 setTimeout 자리입니다.

        fetch(주소, 옵션)  = "이 주소로 요청을 보내라"
        await             = "답이 올 때까지 기다려라"

      보내는 것도 받는 것도 JSON입니다.
      화면과 서버는 서로의 코드를 모른 채, JSON이라는 공용어로만 대화합니다.
    */
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question }),   // 자바스크립트 객체 → JSON 글자
    });

    if (!response.ok) {
      throw new Error("서버가 " + response.status + " 를 돌려줬습니다");
    }

    const data = await response.json();               // JSON 글자 → 자바스크립트 객체
    resultBox.textContent = data.answer;

  } catch (error) {
    // 서버가 꺼져 있거나 에러가 났을 때
    resultBox.textContent =
      "❌ 오류가 났습니다.\n\n" + error.message +
      "\n\n서버가 켜져 있는지 확인해보세요. (터미널에 uvicorn 실행 중?)";
    console.error(error);

  } finally {
    // 성공하든 실패하든 버튼은 다시 살립니다
    askButton.disabled = false;
  }

});

/*
  🔎 이 단계의 하이라이트 — F12 → Network 탭

    1. F12를 눌러 개발자 도구를 열고 Network 탭을 선택
    2. 그 상태로 [물어보기] 버튼 클릭
    3. 목록에 ask 라는 줄이 새로 생깁니다  ← 이게 방금 나간 요청

    그 줄을 클릭하면
      Payload  탭 : 내가 보낸 것    {"question": "..."}
      Response 탭 : 서버가 준 것    {"answer": "..."}

    화면과 서버가 분리되어 있고 JSON으로 대화한다는 말을
    눈으로 확인하는 자리입니다.
*/
