# 4-1단계 — 에이전트 기초: 논문에서 코드까지

2단계에서 만든 껍데기에 들어갈 **내용물의 정체**를 파헤치는 단계입니다.
"에이전트"라는 말이 논문에서 어떻게 시작해서 지금의 `StateGraph`가 됐는지,
그리고 **그 논문들을 실제로 돌려볼 수 있는지**를 확인합니다.

> 4단계는 문서 세 장입니다.
> **4-1(이 문서)** 뼈대 → **[4-2](02-agent-category.md)** 개발 방식 분류 → **[4-3](03-agent-handson.md)** 구현 방식들

> 📥 출처: AgentStudy 리포의 논문 조사 자료를 04기용으로 통합·재작성했습니다.
> 코드는 전부 이 리포 기준(**Gemini + `.env`의 `GOOGLE_API_KEY`**)으로 포팅해 동작을 확인했습니다.

## 난이도 표시

원우마다 배경이 달라서 절마다 표시를 붙였습니다. **자기 트랙만 따라가도 됩니다.**

| 표시 | 대상 | 할 일 |
|---|---|---|
| 🟢 | 전원 | 읽고 이해하기. 코드 없음 |
| 🟡 | 전원 (권장) | 코드를 **복사해 실행**하고 값 바꿔보기 |
| 🔴 | 개발 트랙 | 보고 **직접 짜기**. 못 해도 진도에 지장 없음 |

## 목차

| 절 | 내용 | 난이도 |
|---|---|---|
| [1](#1-에이전트란-무엇인가) | 에이전트란 무엇인가 | 🟢 |
| [2](#2-논문-계보--에이전트-10년-2013--2024) | 논문 계보 — 에이전트 10년 | 🟢 |
| [3](#3-핵심-질문--이-논문들을-랭그래프로-돌려볼-수-있나) | **핵심 질문** — 논문을 랭그래프로 돌려볼 수 있나 | 🟢 |
| [4](#4-그래서-이렇게-배운다--학습-경로) | 학습 경로 4단계 | 🟢 |
| [5](#5-0단계--프레임워크-없이-react-루프-짜기) | 0단계 — 프레임워크 없이 | 🟡 |
| [6](#6-1단계--같은-걸-stategraph로-다시-쓰기) | 1단계 — 같은 걸 `StateGraph`로 | 🟡 |
| [7](#7-2단계--랭그래프가-실제로-존재하는-이유) | 2단계 — 랭그래프가 존재하는 이유 | 🔴 |
| [8](#8-3단계--원문-정독) | 3단계 — 원문 정독 | 🟢 |

> 📎 이어지는 문서
> → [`02-agent-category.md`](02-agent-category.md) — 에이전트를 **어떤 방식으로 만들 것인가** (4축 분류)
> → [`03-agent-handson.md`](03-agent-handson.md) — 메모리 · 멀티에이전트 · 평가

---

## 1. 에이전트란 무엇인가

🟢 **전원**

### 1-1. 한 문장

**인식(Perceive) → 추론(Reason) → 행동(Act)** 사이클을 스스로 반복하는 시스템입니다.
LLM 하나만으로는 안 되고 **LLM + 도구 + 메모리 + 흐름 제어**의 조합입니다.

결정적 차이는 이것입니다.

| | 챗봇 | 에이전트 |
|---|---|---|
| 동작 | 질문 → 답 (1회성) | **판단 → 행동 → 확인 → 다시 판단** (반복) |
| 도구 | 없음 (아는 것만 말함) | **도구를 직접 씀** (조회·계산·검색) |
| 비유 | 안내데스크 직원 | 일을 통째로 맡기는 비서 |

> 이미 [2-2단계](../02-web/02-web-goal/02-web-goal.md) §5에서 이 표를 봤습니다.
> 거기선 "쓰는 법"을 배웠고, 여기선 **"이게 어디서 나왔는지"** 를 봅니다.

### 1-2. 에이전트 유형 4가지

이름만 알아두면 3절의 조사 결과를 읽을 수 있습니다.

| 유형 | 특징 | 예시 | 원 논문 |
|---|---|---|---|
| **ReAct** | 추론과 행동을 교대로 반복 | 검색하며 답하는 QA | Yao 2022 |
| **Plan-and-Execute** | 계획을 먼저 세우고 단계별 실행 | 복잡한 데이터 분석 | Wang 2023 |
| **Reflexion** | 실패를 언어로 기록해 다음 시도에 반영 | 코드 디버깅 | Shinn 2023 |
| **Multi-Agent** | 역할 나눈 에이전트들이 협업 | 소프트웨어 개발팀 시뮬레이션 | Wu 2023 (AutoGen) |

**이 중 ReAct가 오늘날 거의 모든 에이전트의 뼈대입니다.** 5·6절에서 직접 짜볼 것도 이겁니다.

---

## 2. 논문 계보 — 에이전트 10년 (2013 ~ 2024)

🟢 **전원** · 전부 읽을 필요 없습니다. **★ 표시 10편이 "먼저 읽을 것"** 이고 나머지는 맥락입니다.

### Phase 0 — RL 에이전트 시대 (2013 ~ 2016)

"에이전트"가 LLM이 아니라 **정책(policy)** 이던 시절. 환경-행동-보상 루프의 원형.

| 연도 | 논문 | 링크 | 한 줄 |
|---|---|---|---|
| 2013 | Playing Atari with Deep RL (Mnih) | [1312.5602](https://arxiv.org/abs/1312.5602) | 픽셀 입력 → 행동 출력, DQN의 출발점 |
| 2015 | Human-level control through deep RL (Mnih) | [Nature](https://www.nature.com/articles/nature14236) | DQN 정식판 |
| 2016 | Asynchronous Methods for Deep RL — A3C | [1602.01783](https://arxiv.org/abs/1602.01783) | 병렬 액터, 멀티에이전트 사고의 씨앗 |
| 2016 | Mastering the game of Go — AlphaGo | [Nature](https://www.nature.com/articles/nature16961) | 탐색 + 학습 = 계획하는 에이전트 |

### Phase 1 — 기반 모델의 등장 (2017 ~ 2021)

에이전트의 "두뇌"가 정책 네트워크에서 **언어 모델**로 교체되는 구간.

| 연도 | 논문 | 링크 | 한 줄 |
|---|---|---|---|
| 2017 | ★ Attention Is All You Need | [1706.03762](https://arxiv.org/abs/1706.03762) | Transformer. 이후 전부의 전제 ([3단계](../03-nanogpt/README.md)에서 직접 학습시켜봄) |
| 2020 | ★ GPT-3 (Brown) | [2005.14165](https://arxiv.org/abs/2005.14165) | 파인튜닝 없이 프롬프트만으로 태스크 전이 |
| 2021 | WebGPT (Nakano) | [2112.09332](https://arxiv.org/abs/2112.09332) | LLM에 브라우저를 쥐어준 첫 사례급 시도 |

### Phase 2 — 추론과 행동의 결합 (2022) ← **에이전트의 진짜 원년**

| 연도 | 논문 | 링크 | 한 줄 |
|---|---|---|---|
| 2022 | ★ Chain-of-Thought Prompting (Wei) | [2201.11903](https://arxiv.org/abs/2201.11903) | 중간 추론 단계를 뱉게 하면 성능이 뛴다 |
| 2022 | InstructGPT (Ouyang) | [2203.02155](https://arxiv.org/abs/2203.02155) | RLHF. 지시를 따르는 = 조종 가능한 모델 |
| 2022 | SayCan (Ahn) | [2204.01691](https://arxiv.org/abs/2204.01691) | 언어 계획을 실제 가능한 행동으로 접지 |
| 2022 | LLMs are Zero-Shot Reasoners (Kojima) | [2205.11916](https://arxiv.org/abs/2205.11916) | "Let's think step by step" 한 줄의 위력 |
| 2022 | WebShop (Yao) | [2207.01206](https://arxiv.org/abs/2207.01206) | 웹 환경 에이전트 벤치마크의 원형 |
| 2022 | ★ **ReAct** (Yao) | [2210.03629](https://arxiv.org/abs/2210.03629) | **Thought→Action→Observation 루프. 오늘날 에이전트의 뼈대** |

### Phase 3 — 도구 · 자기수정 · 시뮬레이션 (2023)

폭발한 해. 도구 사용, 자기 피드백, 장기 메모리, 환경 벤치마크가 한꺼번에.

| 연도 | 논문 | 링크 | 한 줄 |
|---|---|---|---|
| 2023 | ★ Toolformer (Schick) | [2302.04761](https://arxiv.org/abs/2302.04761) | 모델이 스스로 API 호출 지점을 학습 |
| 2023 | ★ Reflexion (Shinn) | [2303.11366](https://arxiv.org/abs/2303.11366) | 실패를 언어로 기록해 다음 시도에 반영 |
| 2023 | HuggingGPT (Shen) | [2303.17580](https://arxiv.org/abs/2303.17580) | LLM이 오케스트레이터, 전문 모델이 도구 |
| 2023 | Self-Refine (Madaan) | [2303.17651](https://arxiv.org/abs/2303.17651) | 자기 출력 비평 → 재작성 루프 |
| 2023 | ★ **Generative Agents** (Park) | [2304.03442](https://arxiv.org/abs/2304.03442) | 기억-반성-계획. 스몰빌 25인 시뮬레이션 |
| 2023 | Tree of Thoughts (Yao) | [2305.10601](https://arxiv.org/abs/2305.10601) | 선형 CoT → 탐색 트리로 확장 |
| 2023 | Voyager (Wang) | [2305.16291](https://arxiv.org/abs/2305.16291) | Minecraft 평생학습, 스킬 라이브러리 축적 |
| 2023 | Mind2Web (Deng) | [2306.06070](https://arxiv.org/abs/2306.06070) | 범용 웹 에이전트 데이터셋 |
| 2023 | WebArena (Zhou) | [2307.13854](https://arxiv.org/abs/2307.13854) | 실제에 가까운 웹 환경 벤치마크 |
| 2023 | ToolLLM (Qin) | [2307.16789](https://arxiv.org/abs/2307.16789) | 16,000+ 실제 API 도구 사용 학습 |
| 2023 | CoALA (Sumers) | [2309.02427](https://arxiv.org/abs/2309.02427) | 메모리/행동공간/의사결정의 이론 정리 |
| 2023 | GAIA (Mialon) | [2311.12983](https://arxiv.org/abs/2311.12983) | 사람은 쉽고 모델은 어려운 과제 모음 |

### Phase 4 — 멀티에이전트 프레임워크 (2023 ~ 2024)

| 연도 | 논문 | 링크 | 한 줄 |
|---|---|---|---|
| 2023 | MetaGPT (Hong) | [2308.00352](https://arxiv.org/abs/2308.00352) | 업무 표준절차(SOP)를 역할별 에이전트에 인코딩 |
| 2023 | ★ AutoGen (Wu) | [2308.08155](https://arxiv.org/abs/2308.08155) | 대화형 멀티에이전트의 사실상 표준 |
| 2023 | AgentBench (Liu) | [2308.03688](https://arxiv.org/abs/2308.03688) | 8개 환경에서 LLM을 에이전트로 평가 |
| 2023 | ★ LLM Based Agents: A Survey (Xi) | [2309.07864](https://arxiv.org/abs/2309.07864) | 전체 지형도. **한 편만 읽는다면 이것** |
| 2024 | LLM based Multi-Agents: A Survey (Guo) | [2402.01680](https://arxiv.org/abs/2402.01680) | 멀티에이전트만 좁혀 본 서베이 |
| 2024 | Magentic-One (Fourney) | [2411.04468](https://arxiv.org/abs/2411.04468) | orchestrator + 전문 에이전트 |

### Phase 5 — 실무 에이전트와 평가 (2023 ~ 2024)

| 연도 | 논문 | 링크 | 한 줄 |
|---|---|---|---|
| 2023 | ★ SWE-bench (Jimenez) | [2310.06770](https://arxiv.org/abs/2310.06770) | 실제 GitHub 이슈 해결. 코딩 에이전트의 기준점 |
| 2024 | CodeAct (Wang) | [2402.01030](https://arxiv.org/abs/2402.01030) | 행동을 JSON이 아니라 **실행 가능한 코드**로 |
| 2024 | OSWorld (Xie) | [2404.07972](https://arxiv.org/abs/2404.07972) | 진짜 OS 위에서 멀티모달 에이전트 평가 |
| 2024 | SWE-agent (Yang) | [2405.15793](https://arxiv.org/abs/2405.15793) | Agent-Computer Interface 설계가 성능을 만든다 |
| 2024 | Agent Workflow Memory (Wang) | [2409.07429](https://arxiv.org/abs/2409.07429) | 성공한 워크플로를 재사용 가능한 메모리로 |
| 2024 | Agent-as-a-Judge (Zhuge) | [2410.10934](https://arxiv.org/abs/2410.10934) | 에이전트로 에이전트를 평가 |

### ★ Top 10 — 먼저 읽을 순서

1. **Survey** ([2309.07864](https://arxiv.org/abs/2309.07864)) — 지도부터
2. **ReAct** ([2210.03629](https://arxiv.org/abs/2210.03629)) — 루프의 뼈대
3. **CoT** ([2201.11903](https://arxiv.org/abs/2201.11903)) — 추론의 기초
4. **Reflexion** ([2303.11366](https://arxiv.org/abs/2303.11366)) — 자기수정
5. **Toolformer** ([2302.04761](https://arxiv.org/abs/2302.04761)) — 도구 사용
6. **Generative Agents** ([2304.03442](https://arxiv.org/abs/2304.03442)) — 메모리와 반성
7. **AutoGen** ([2308.08155](https://arxiv.org/abs/2308.08155)) — 멀티에이전트
8. **SWE-bench** ([2310.06770](https://arxiv.org/abs/2310.06770)) — 실무 평가 기준
9. **Transformer** ([1706.03762](https://arxiv.org/abs/1706.03762)) — 밑바닥
10. **GPT-3** ([2005.14165](https://arxiv.org/abs/2005.14165)) — 프롬프트 패러다임

### 논문 아닌 필독 자료

| 자료 | 링크 |
|---|---|
| Anthropic — Building Effective Agents | https://www.anthropic.com/engineering/building-effective-agents |
| OpenAI — A Practical Guide to Building Agents (34p) | [PDF](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) |
| Model Context Protocol (MCP) 공식 문서 | https://modelcontextprotocol.io |
| SWE-bench 리더보드 | https://www.swebench.com |

*모든 arXiv ID는 arXiv API로 제목·저자·연도 대조 검증 완료 (2026-08-06).*

---

## 3. 핵심 질문 — 이 논문들을 랭그래프로 돌려볼 수 있나

🟢 **전원** · 조사일 2026-08-13 · 조사 도구: Exa 웹검색 + 원문 대조

**이 절이 4단계의 핵심입니다.** 위 논문들을 코드로 돌려보고 싶은 건 자연스러운 욕심인데,
결론부터 말하면 **생각만큼 되지 않습니다.** 그 이유를 아는 것 자체가 배울 거리입니다.

### 3-1. 결론 세 줄

1. **논문 저자가 공개한 공식 코드가 랭그래프 기반인 사례 = 0건.** 시기상 불가능합니다.
2. **랭체인이 논문을 보고 만든 공식 구현 기준 = Top 10 중 2건** — ReAct, Reflexion.
3. 단, 그 구현들은 **논문 재현이 아니라 아키텍처 각색본**입니다. ← 이게 이 절의 핵심 경고

### 3-2. 저자 공식 코드가 0건인 이유

랭그래프 최초 공개는 **2024-01-17**입니다. Top 10 논문은 **전부 그 이전**입니다.

| 논문 | 발표 | 랭그래프 공개일과의 관계 |
|---|---|---|
| Transformer | 2017-06 | 6년 7개월 전 |
| GPT-3 | 2020-05 | 3년 8개월 전 |
| CoT | 2022-01 | 2년 전 |
| ReAct | 2022-10 | 1년 3개월 전 |
| Toolformer | 2023-02 | 11개월 전 |
| Reflexion | 2023-03 | 10개월 전 |
| Generative Agents | 2023-04 | 9개월 전 |
| AutoGen | 2023-08 | 5개월 전 (게다가 경쟁 프레임워크) |
| SWE-bench | 2023-10 | 3개월 전 |

즉 **"저자 코드로 랭그래프를 배운다"는 경로 자체가 성립하지 않습니다.**
AutoGen·MetaGPT는 시기 문제 이전에 **자체 프레임워크가 곧 논문의 기여**라서 랭그래프로 갈 이유가 없습니다.

### 3-3. 랭체인 공식 랭그래프 재구현 — 전체 13종

| 분류 | 구현 | 원 논문 | 형태 |
|---|---|---|---|
| **프리빌트** | **ReAct** | Yao 2022 | `create_react_agent` + [react-agent 템플릿](https://github.com/langchain-ai/react-agent) — **제품화됨** |
| Reflection | **Reflexion** | Shinn 2023 | 튜토리얼 노트북 (아카이브) |
| Reflection | LATS | Zhou 2023 | 튜토리얼 (ToT + Reflexion + MCTS 통합) |
| Reflection | Basic Reflection | — (패턴) | 튜토리얼 |
| Reflection | Self-Discover | Zhou 2024 (Google) | 튜토리얼 |
| Planning | Plan-and-Execute | Wang 2023 + BabyAGI | 튜토리얼 |
| Planning | ReWOO | Xu 2023 | 튜토리얼 |
| Planning | LLMCompiler | Kim 2023 | 튜토리얼 |
| Planning | STORM | Shao 2024 (Stanford) | 튜토리얼 |
| RAG | Self-RAG | Asai 2023 | 노트북 |
| RAG | CRAG | Yan 2024 | 노트북 |
| RAG | Adaptive / Agentic RAG | Jeong 2024 외 | 노트북 |
| Web | Web Voyager | He 2024 | 튜토리얼 |

> ⚠️ `examples/` 노트북들은 문서가 docs.langchain.com으로 통합되면서 **아카이브 처리**됐습니다.
> 첫 셀에 "no longer updated"가 박혀 있습니다. 반면 ReAct만 프리빌트 함수 + 템플릿 리포로 **계속 유지보수됩니다.**

### 3-4. Top 10 대조 — **2 / 10**

| # | 논문 | 랭그래프 공식 구현 |
|---|---|---|
| 1 | Survey | ✗ 서베이 |
| 2 | **ReAct** | ✅ `create_react_agent` + 템플릿 |
| 3 | CoT | ✗ 프롬프트 기법, 그래프 대상 아님 |
| 4 | **Reflexion** | ✅ 튜토리얼 (아카이브) |
| 5 | Toolformer | ✗ 파인튜닝 기반 |
| 6 | Generative Agents | ✗ |
| 7 | AutoGen | ✗ 경쟁 프레임워크 |
| 8 | SWE-bench | ✗ 벤치마크 |
| 9 | Transformer | ✗ |
| 10 | GPT-3 | ✗ |

외부 Top 10 목록([a2a.pub 12선](https://a2a.pub/guides/ai-agents), [zjunlp/LLMAgentPapers](https://github.com/zjunlp/LLMAgentPapers), [awesome-llm-agent-papers](https://github.com/js-lee-AI/awesome-llm-agent-papers))으로 바꿔 세어도 결과는 같습니다.

### 3-5. 함정 — 이건 "논문 재현"이 아니다

랭체인 본인들이 문서에 써둔 문장들입니다.

> "We will skip the knowledge refinement phase as a first pass." — CRAG 튜토리얼
>
> "The paper will perform a generation from each chunk and grade it twice. Instead, we perform a single generation from all relevant documents." — Self-RAG 튜토리얼
>
> "based **loosely** on Wang, et. al.'s paper on Plan-and-Solve Prompting" — Plan-and-Execute

즉 **아키텍처 스케치만 빌린 각색본**입니다. 여기에 더해:

- **실험이 없습니다.** ReAct의 본체는 HotpotQA/ALFWorld/FEVER 결과이고, Reflexion의 본체는 HumanEval pass@1 91%입니다. 튜토리얼은 질문 하나 던져보고 끝납니다.
- **"왜 이 방법이 더 낫다고 주장하는가"는 노트북을 100번 돌려도 안 나옵니다.**

> 🎯 **튜토리얼로 배우는 것은 패턴이지 논문이 아닙니다. 둘을 섞지 마세요.**
> 석사과정에서 이 구분을 못 하면, 논문을 인용하면서 실제로는 각색본을 설명하게 됩니다.

---

## 4. 그래서 이렇게 배운다 — 학습 경로

🟢 **전원**

3절의 결론이 곧 학습 설계입니다. 돌려볼 공식 코드가 없으니 **직접 짜면서 배웁니다.**

| 단계 | 내용 | 소요 | 목적 | 난이도 |
|---|---|---|---|---|
| **0** | **프레임워크 없이** 순수 파이썬으로 ReAct 루프 구현 | 반나절 | 에이전트의 실체가 `while` 루프임을 체득 | 🟡 |
| **1** | 같은 걸 `StateGraph`로 다시 작성 | 반나절 | 프레임워크가 **무엇을 대신해주는지** 대조로 파악 | 🟡 |
| **2** | checkpointer / interrupt(HITL) / streaming 추가 | 1일 | 랭그래프의 실제 존재 이유 | 🔴 |
| **3** | ReAct 원문 + Reflexion 원문 정독 | 1일 | 벤치마크·한계 확인 | 🟢 |

### 리스크 — 반드시 읽을 것

- **0단계를 건너뛰면** "랭그래프 없이는 에이전트를 못 만드는 사람"이 됩니다. 이 경로의 **유일한 실질적 위험**입니다.
- `create_react_agent(model, tools)` 한 줄만 호출하면 학습 가치는 **거의 0**입니다. 루프가 전부 함수 안에 숨습니다.
- **스킵 권장:** 아카이브된 노트북(Reflexion/LATS)은 API 변경으로 실행이 깨져 디버깅에 시간이 녹습니다.
  RAG 4종은 에이전트 기초가 아니라 검색 파이프라인 응용입니다.

### 준비

5·6절 코드는 **2-2단계에서 이미 만든 환경 그대로** 돌아갑니다. 추가 설치가 없습니다.

```powershell
# 이미 했다면 건너뛰세요
.venv\Scripts\Activate.ps1
pip install -r 02-web/02-web-goal/requirements.txt
```

`.env`에 `GOOGLE_API_KEY`가 있어야 합니다.

---

## 5. 0단계 — 프레임워크 없이 ReAct 루프 짜기

🟡 **전원 권장** · 이 절이 4단계에서 **제일 중요합니다.**

### 5-1. ReAct 루프 개념

```
Thought      : 현재 상황 분석 및 다음 행동 계획
Action       : 도구 호출
Observation  : 도구 결과 수신
... 반복 ...
Thought      : 충분한 정보 수집됨
Answer       : 최종 답변
```

**이게 전부입니다.** 논문 제목이 거창하지만(Synergizing Reasoning and Acting)
구현은 아래 `for` 루프 15줄입니다.

### 5-2. 코드

```python
from pathlib import Path
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()   # .env의 GOOGLE_API_KEY

# ── 도구 ─────────────────────────────────────────────
# ★ docstring이 곧 도구 설명입니다. AI가 이 글을 읽고 언제 쓸지 판단합니다.
@tool
def calculator(expression: str) -> str:
    """수식을 계산한다. 예: '2**15'"""
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"오류: {e}"

@tool
def search(query: str) -> str:
    """지식베이스에서 키워드를 검색한다. 예: 'transformer'"""
    kb = {
        "python": "파이썬은 1991년 귀도 반 로섬이 만든 언어다.",
        "transformer": "트랜스포머는 2017년 Attention Is All You Need 논문에서 제안됐다.",
        "react": "ReAct는 2022년 Yao 등이 제안한 Thought-Action-Observation 루프다.",
    }
    for k, v in kb.items():
        if k in query.lower():
            return v
    return "관련 정보를 찾을 수 없습니다."

TOOLS = [calculator, search]
BY_NAME = {t.name: t for t in TOOLS}
SYSTEM = "너는 도구를 쓸 수 있는 조수다. 모르는 건 반드시 도구로 확인하고 한국어로 답해라."

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite").bind_tools(TOOLS)


# ── 에이전트 = 이 for 루프가 전부 ────────────────────
def react_agent(question: str, max_steps: int = 6) -> str:
    messages = [SystemMessage(content=SYSTEM), HumanMessage(content=question)]

    for step in range(max_steps):
        reply = llm.invoke(messages)        # Thought  — 판단
        messages.append(reply)

        if not reply.tool_calls:            # ★ 종료 조건 — 도구를 안 부르면 끝
            return reply.content

        for call in reply.tool_calls:       # Action   — 도구 실행
            print(f"  [{step}] {call['name']}({call['args']})")
            output = BY_NAME[call["name"]].invoke(call["args"])
            messages.append(                # Observation — 결과를 대화에 되먹임
                ToolMessage(content=str(output), tool_call_id=call["id"])
            )

    return "최대 스텝 초과"


if __name__ == "__main__":
    print(react_agent("2의 15승을 계산하고, ReAct가 뭔지도 알려줘"))
```

실행 결과:

```
  [0] calculator({'expression': '2**15'})
  [0] search({'query': 'ReAct'})
2의 15승은 32768이고, ReAct는 2022년 Yao 등이 제안한 Thought-Action-Observation 루프입니다.
```

### 5-3. 여기서 반드시 짚을 것

| 코드 한 줄 | 정체 |
|---|---|
| `for step in range(max_steps)` | **에이전트의 "반복"이 사실 그냥 for 루프**입니다 |
| `if not reply.tool_calls: return` | **"언제 멈출지"가 조건문 한 줄**입니다 |
| `messages.append(...)` | **"상태 관리"가 사실 리스트에 이어붙이기**입니다 |
| `max_steps` | 없으면 **무한 루프**로 요금이 계속 나갑니다 |

> 🎯 이 네 줄을 손으로 쳐본 사람과 아닌 사람의 차이가 6절에서 갈립니다.
> 프레임워크는 이 네 줄에 **이름을 붙여준 것**뿐입니다.

### 🔎 직접 실험

1. `"안녕?"` 을 넣어보세요 → 도구 없이 1스텝에 끝납니다 (`tool_calls`가 비어 있음)
2. `max_steps=1` 로 줄여보세요 → 도구를 부르고도 답을 못 만들고 끝납니다
3. `search`의 docstring을 `"""도구."""` 로 뭉개보세요 → AI가 도구를 안 쓰거나 엉뚱할 때 씁니다

---

## 6. 1단계 — 같은 걸 `StateGraph`로 다시 쓰기

🟡 **전원 권장**

**도구도 모델도 5절과 완전히 같습니다.** 오직 루프만 바뀝니다. 그래서 대조가 선명합니다.

### 6-1. 무엇이 사라지나

| | 5절 (순수 루프) | 6절 (랭그래프) |
|---|---|---|
| 종료 판단 | `if not reply.tool_calls: return` 직접 씀 | `route()` 함수가 조건부 엣지로 분리됨 |
| 도구 실행 | `for call in ...` 수동 분기 | 노드 하나로 분리 (또는 프리빌트 `ToolNode`) |
| 상태 관리 | `messages.append()` 수동 | `State` + `add_messages` 리듀서가 자동 누적 |
| 재사용성 | 함수 하나에 로직이 뭉쳐 있음 | 노드 단위로 분리 → 갈아끼우기 쉬움 |
| 대화 기억 | 직접 구현해야 함 | `checkpointer` 한 줄 (7절) |

### 6-2. 3개 단어

- **노드(Node)** = 작업 한 단계 (파이썬 함수 하나)
- **엣지(Edge)** = 화살표, "다음엔 이거 해"
- **상태(State)** = 노드들이 주고받는 공유 메모장

이 셋이면 랭그래프의 80%입니다.

### 6-3. 코드

```python
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# ── 도구·모델은 5절과 동일 (TOOLS, BY_NAME, SYSTEM, llm 그대로) ──

# ── 상태: add_messages = "덮어쓰지 말고 뒤에 이어붙여라"는 규칙 ──
class State(TypedDict):
    messages: Annotated[list, add_messages]

# ── 노드 1. think — 판단 (5절의 llm.invoke 부분) ──
def think(state: State) -> dict:
    return {"messages": [llm.invoke(state["messages"])]}

# ── 노드 2. act — 행동 (5절의 for call 부분) ──
def act(state: State) -> dict:
    out = []
    for call in state["messages"][-1].tool_calls:
        print(f"  [graph] {call['name']}({call['args']})")
        out.append(ToolMessage(
            content=str(BY_NAME[call["name"]].invoke(call["args"])),
            tool_call_id=call["id"],
        ))
    return {"messages": out}

# ── 갈림길 (5절의 if 한 줄) ──
def route(state: State) -> str:
    return "act" if state["messages"][-1].tool_calls else END

# ── 조립 ──
g = StateGraph(State)
g.add_node("think", think)
g.add_node("act", act)

g.add_edge(START, "think")
g.add_conditional_edges("think", route, {"act": "act", END: END})
g.add_edge("act", "think")        # ★ 되돌아가는 화살표 = 반복

GRAPH = g.compile()


if __name__ == "__main__":
    result = GRAPH.invoke({"messages": [
        SystemMessage(content=SYSTEM),
        HumanMessage(content="2의 15승을 계산하고, ReAct가 뭔지도 알려줘"),
    ]})
    print(result["messages"][-1].content)
```

**5절과 글자 하나까지 같은 답이 나옵니다.**

### 6-4. 그래프 구조

```
START ─▶ think ──(도구 호출 없음)──▶ END
           ▲ │
           │ └──(도구 호출 있음)──▶ act
           │                         │
           └─────────────────────────┘
                  (결과 들고 다시 판단)
```

`think ↔ act` 사이클이 곧 ReAct의 `Thought → Action → Observation → Thought …` 루프입니다.

### 6-5. 이미 본 적 있습니다

[2-2단계의 `agent.py`](../02-web/02-web-goal/agent.py)가 **정확히 이 구조**입니다.
거기선 도구가 `lookup` 하나였고, 여기선 `calculator`+`search` 둘일 뿐입니다.

> ⚠️ **`create_react_agent`로 한 줄 축약하는 건 지금 하지 마세요.**
> 위 그래프 조립 전체가 한 줄로 대체되지만, 그러면 배울 게 사라집니다.
> 손으로 조립해본 다음에 축약하는 순서여야 합니다.

---

## 7. 2단계 — 랭그래프가 실제로 존재하는 이유

🔴 **개발 트랙** · 6절까지만 해도 "그냥 for 루프가 낫지 않나?" 싶습니다. 그 반문에 대한 답입니다.

### 7-1. checkpointer — 대화 기억

```python
from langgraph.checkpoint.memory import MemorySaver

GRAPH = g.compile(checkpointer=MemorySaver())

config = {"configurable": {"thread_id": "user-42"}}   # 대화방 번호
GRAPH.invoke({"messages": [HumanMessage(content="내 이름은 앨리스야")]}, config)
GRAPH.invoke({"messages": [HumanMessage(content="내 이름이 뭐야?")]}, config)  # 기억함
```

`thread_id`가 같으면 이전 대화가 이어집니다. 5절 루프로 이걸 직접 만들려면
대화 리스트를 사용자별로 저장·복원하는 코드를 전부 짜야 합니다.

> ⚠️ `MemorySaver`는 **서버를 끄면 사라집니다.** 진짜 서비스는 DB에 저장해야 합니다.
> (`langgraph-checkpoint-postgres` 등)

### 7-2. interrupt — 사람 승인 (HITL)

에이전트가 **되돌릴 수 없는 일**(메일 발송, 결제, 파일 삭제)을 하기 직전에 멈추고 사람에게 묻는 장치입니다.

```python
GRAPH = g.compile(checkpointer=MemorySaver(), interrupt_before=["act"])
# → act 노드 직전에 멈춤. 사람이 확인 후 GRAPH.invoke(None, config)로 재개
```

**실무에서 에이전트를 도입할 때 가장 먼저 요구받는 기능입니다.**
"AI가 마음대로 하는 거 아니냐"에 대한 구조적 답이 이겁니다.

### 7-3. streaming — 진행 상황 보여주기

```python
for chunk in GRAPH.stream({"messages": [...]}, config):
    print(chunk)     # think 끝날 때, act 끝날 때마다 즉시 나옴
```

사용자가 30초를 빈 화면으로 기다리는 것과, `think→act→think` 진행이 보이는 것의 차이입니다.

### 7-4. 정리

| 기능 | 순수 루프로 만들려면 | 랭그래프 |
|---|---|---|
| 대화 기억 | 사용자별 저장·복원 직접 구현 | `checkpointer=` 한 줄 |
| 사람 승인 | 루프 중간에 중단·재개 로직 직접 | `interrupt_before=` 한 줄 |
| 진행 스트리밍 | 콜백 구조 직접 설계 | `.stream()` |
| 재현·감사 | 로그 직접 설계 | 그래프 정의 = 명세, step별 상태 저장 |

**이 표가 "왜 프레임워크를 쓰는가"에 대한 정직한 답입니다.**
반대로 이 넷이 다 필요 없다면 5절의 `for` 루프로 충분합니다.

---

## 8. 3단계 — 원문 정독

🟢 **전원** · 코드를 다 짜본 다음에 읽어야 의미가 있습니다.

| 논문 | 볼 것 |
|---|---|
| **ReAct** ([2210.03629](https://arxiv.org/abs/2210.03629)) | 5절에서 짠 루프가 **HotpotQA·ALFWorld·FEVER에서 얼마나 올랐는지**. 그리고 실패 사례 분석 |
| **Reflexion** ([2303.11366](https://arxiv.org/abs/2303.11366)) | HumanEval pass@1 91%. **"실패를 언어로 기록"** 이 왜 파인튜닝 없이 작동하는지 |

> 3절에서 말한 함정을 여기서 확인하게 됩니다.
> **튜토리얼에는 이 숫자들이 없습니다.** 그게 "패턴"과 "논문"의 차이입니다.

---

## ✅ 체크포인트

**개념** 🟢
- [ ] 챗봇과 에이전트의 차이를 도구·반복 두 단어로 설명할 수 있다
- [ ] ReAct가 뭐고 왜 중요한지 한 문장으로 말할 수 있다
- [ ] "랭그래프 튜토리얼 = 논문 재현"이 **아닌** 이유를 설명할 수 있다

**구현** 🟡
- [ ] 5절 코드를 실행해서 도구가 호출되는 걸 봤다
- [ ] `"안녕?"` 을 넣어 도구 없이 끝나는 갈래도 봤다
- [ ] 6절 코드를 실행해 5절과 같은 답이 나오는 걸 확인했다
- [ ] 5절의 `if not reply.tool_calls`와 6절의 `route()`가 같은 일임을 짚을 수 있다

**심화** 🔴
- [ ] `checkpointer`를 붙여 대화가 이어지는 걸 확인했다
- [ ] 랭그래프를 쓸 이유와 안 쓸 이유를 각각 댈 수 있다

---

## 📌 TODO

- [ ] 5·6절 코드를 실행 가능한 `.py` 파일로 분리 (`agent_loop.py` / `agent_graph.py`)
- [ ] 2-2단계 [`02-web-goal.md`](../02-web/02-web-goal/02-web-goal.md) §5와 중복 정리 — 노드·엣지·상태 설명이 겹침
- [ ] 각자 연구 주제와 이어지는 논문 1편씩 골라 5절에 추가

---

## 이전에 있던 것

랭그래프 입문 + 계산기 도구 에이전트(`tool_agent.py`)가 있었습니다. **2-2단계로 옮겨졌습니다.**
옛 코드는 `git log --oneline -- 04-agent/tool_agent.py` 로 꺼낼 수 있습니다.

---

이전 ← 3단계 [`03-nanogpt/`](../03-nanogpt/README.md) ｜ 다음 → 4-2단계 [`02-agent-category.md`](02-agent-category.md)
