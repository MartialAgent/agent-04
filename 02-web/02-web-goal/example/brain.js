/*
  2-2단계 완성본 — 가짜 두뇌 (규칙 기반)
  ================================================================
  ★★★ 이 파일이 이 수업에서 유일하게 "가짜"인 부분입니다. 꼭 읽으세요. ★★★

  에이전트의 think 노드는 매번 이 질문에 답해야 합니다.

      "지금 도구를 써야 하나? 아니면 그냥 답하면 되나?
       쓴다면 어떤 도구에 어떤 인자를 넣어야 하나?"

  진짜 에이전트에서는 **LLM(Gemini 같은 모델)이 이 판단을 합니다.**
  여기서는 그 자리를 **if 문 몇 줄로 흉내냅니다.**

  왜 이렇게 했나
  --------------
  2단계의 목표는 "껍데기(화면·구조)"를 손에 쥐는 것입니다.
  여기서 API 키를 요구하면 전원이 키 발급·과금·네트워크 오류에서 시간을 다 씁니다.
  **진짜 LLM은 3~5단계에서 붙입니다.**

  무엇이 가짜이고 무엇이 진짜인가
  ------------------------------
      가짜 : 이 파일의 판단 로직 (if 문)
      진짜 : agent.js의 그래프 구조 — 노드 · 엣지 · 상태 · 조건분기 · 반복
             script.js가 그 결과를 보여주는 방식

  나중에 진짜 모델을 붙일 때 **바뀌는 건 이 파일 하나뿐입니다.**
  decide()가 돌려주는 모양만 지키면 나머지는 한 줄도 안 고칩니다.
  그게 "인터페이스를 맞춰둔다"는 말의 뜻입니다.

  ★ 옆의 brain.py와 같은 내용입니다. 나란히 열어 비교해보세요.
*/

// 품번처럼 생긴 것 찾기 — 예: A-1023, b2041
const CODE_PATTERN = /[A-Za-z]\s*-?\s*\d{3,4}/g;

const LIST_WORDS = ["목록", "전체", "리스트", "뭐가 있", "뭐 있", "다 보여", "품목"];
const GREET_WORDS = ["안녕", "하이", "반갑", "hello", "hi"];
const THANKS_WORDS = ["고마", "감사", "thank"];


// 'b 2041' 같은 걸 'B-2041'로 다듬는다
function normalizeCode(raw) {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase();
  return cleaned[0] + "-" + cleaned.slice(1);
}


/*
  지금까지의 대화를 보고 다음 행동을 정한다.

  돌려주는 모양은 둘 중 하나입니다. ★ 이 계약이 전부입니다.

      { tool_calls: [{ name: "lookup", args: { code: "A-1023" } }] }
          → "도구를 써줘"  (agent.js가 action 노드로 보냅니다)

      { content: "재고는 48개입니다." }
          → "답이 다 나왔어"  (agent.js가 여기서 끝냅니다)

  진짜 LLM도 정확히 이 두 가지 중 하나를 돌려줍니다.
  (OpenAI든 Gemini든 tool_calls 아니면 content 입니다)
*/
function decide(messages) {
  const last = messages[messages.length - 1];

  // ── 경우 1. 방금 도구가 실행되고 돌아왔다 → 결과를 문장으로 정리 ──
  if (last.role === "tool") {
    return { content: composeAnswer(messages) };
  }

  // ── 경우 2. 사용자가 새로 물었다 → 도구가 필요한지 판단 ──────────
  const text = last.content;

  // 2-1. 품번이 보이면 조회 도구를 쓴다
  const found = text.match(CODE_PATTERN);
  if (found) {
    const codes = [...new Set(found.map(normalizeCode))];   // 중복 제거
    return {
      tool_calls: codes.map(function (code) {
        return { name: "lookup", args: { code: code } };
      }),
    };
  }

  // 2-2. "목록 보여줘" 류면 목록 도구를 쓴다
  if (LIST_WORDS.some(function (w) { return text.includes(w); })) {
    return { tool_calls: [{ name: "list_codes", args: {} }] };
  }

  // 2-3. 도구가 필요 없는 말 → 그냥 답한다 (= 갈림길의 다른 쪽 길)
  const lowered = text.toLowerCase();

  if (GREET_WORDS.some(function (w) { return lowered.includes(w); })) {
    return { content: "안녕하세요! 품번을 말씀해주시면 재고와 납기를 확인해드립니다. (예: A-1023)" };
  }

  if (THANKS_WORDS.some(function (w) { return lowered.includes(w); })) {
    return { content: "도움이 되었다니 다행입니다. 또 필요하시면 말씀해주세요." };
  }

  return {
    content:
      "무엇을 찾아드릴지 조금 더 알려주세요.\n" +
      "품번을 주시면 재고와 납기를 조회합니다. (예: B-2041 언제 들어와?)\n" +
      '"품번 목록 보여줘" 라고 하셔도 됩니다.',
  };
}


/*
  도구 결과들을 모아 답변 문장으로 만든다.

  ★ 진짜 LLM이라면 이 자리에서 자연스러운 문장을 생성합니다.
    여기서는 문자열을 이어붙이는 것으로 대신합니다.
*/
function composeAnswer(messages) {
  // 마지막 사용자 질문 뒤에 붙은 도구 결과만 모읍니다
  const outputs = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "tool") break;
    outputs.unshift(messages[i].content);
  }
  return "조회 결과입니다.\n\n" + outputs.join("\n\n");
}


/*
  ── 참고 — 나중에 진짜 모델로 바꿀 때의 모습 (파이썬) ─────────────

    def decide(messages):
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite").bind_tools(TOOLS)
        reply = llm.invoke([SystemMessage(content=SYSTEM_PROMPT)] + messages)
        if reply.tool_calls:
            return {"tool_calls": reply.tool_calls}
        return {"content": reply.content}

  위 CODE_PATTERN·LIST_WORDS 같은 규칙이 전부 사라지고,
  대신 도구의 **설명문(docstring)** 이 그 역할을 합니다.
  그래서 4~5단계에서 "설명문이 곧 성능"이라는 말이 나옵니다.
*/
