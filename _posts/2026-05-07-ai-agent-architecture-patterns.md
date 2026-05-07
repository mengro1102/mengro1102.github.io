---
layout: post
title: "AI 에이전트 아키텍처 4대 패턴: ReAct, Plan-Execute, Reflexion, Multi-Agent"
date: 2026-05-07
categories: [study, Agent]
tags: [AI에이전트, ReAct, MCP, LLM, 아키텍처]
description: "2026년 AI 에이전트의 4대 아키텍처 패턴을 비교하고, 메모리 전략과 도구 연결 프로토콜, 그리고 실제 프레임워크들의 설계 철학을 분석한다."
wiki_source: [concepts/ai-agent, sources/claude-code-prompt-caching, sources/hermes-agent, sources/openharness]
---

2025~2026년, AI 에이전트는 "챗봇"에서 "자율적 행위자"로 진화했다. Claude Code가 코드를 작성하고, Cursor가 프로젝트를 리팩토링하며, AutoResearchClaw가 논문을 쓴다.

하지만 이 에이전트들의 내부를 들여다보면, 몇 가지 반복되는 아키텍처 패턴이 보인다. 이 글은 그 패턴들을 정리하고, 각각의 트레이드오프를 분석한다.

---

## 1. 에이전트의 핵심 루프

모든 AI 에이전트는 하나의 루프로 귀결된다:

<div class="mermaid">
graph LR
    A[입력] --> B[추론/계획]
    B --> C[도구 호출]
    C --> D[행동]
    D --> E[관찰]
    E --> F[평가]
    F --> G[정제]
    G --> B
</div>

차이는 이 루프를 **어떻게 구조화하느냐**에 있다.

---

## 2. 4대 아키텍처 패턴

### 2.1. ReAct (Reason + Act)

가장 기본적이고 널리 쓰이는 패턴. 추론(Thought)과 행동(Action)을 교대로 수행한다.

```
Thought: 사용자가 버그를 보고했다. 먼저 에러 로그를 확인해야 한다.
Action: read_file("error.log")
Observation: TypeError: Cannot read property 'name' of undefined
Thought: user 객체가 undefined인 경우가 있다. null check를 추가해야 한다.
Action: edit_file("user.js", ...)
Observation: 파일 수정 완료
Thought: 테스트를 실행하여 수정을 검증한다.
Action: run_command("npm test")
Observation: All tests passed
Answer: 버그를 수정했습니다. user 객체의 null check를 추가했습니다.
```

| 장점 | 단점 |
|------|------|
| 단순하고 직관적 | 매 단계 LLM 호출 → 비용/지연 |
| 투명한 추론 과정 | 루프에 빠질 위험 |
| 동적 환경 적응 | 장기 계획 능력 부족 |

**사용 사례**: Claude Code, OpenHarness, 대부분의 코딩 에이전트

### 2.2. Plan-and-Execute (계획-실행 분리)

전략적 계획과 전술적 실행을 분리한다. Planner가 한 번 계획을 세우고, Executor가 순차 실행한다.

```
[Planner]
1. 프로젝트 구조 분석
2. 관련 파일 식별
3. 수정 코드 작성
4. 테스트 실행
5. PR 생성

[Executor]
Step 1: list_directory("src/") → 구조 파악
Step 2: read_file("src/auth.js") → 관련 파일 확인
Step 3: edit_file("src/auth.js", ...) → 수정
Step 4: run_command("npm test") → 검증
Step 5: create_pr(...) → PR 생성

[Re-planner] (Step 4 실패 시)
수정된 계획: 3번으로 돌아가 edge case 처리 추가
```

| 장점 | 단점 |
|------|------|
| 복잡한 태스크 분해 | 초기 계획 오류 시 전체 실패 |
| 계획 1회 → 실행 N회 (효율적) | 동적 환경 적응 어려움 |
| 진행 상황 추적 용이 | Re-planning 비용 |

**사용 사례**: Cursor (복잡한 리팩토링), 연구 에이전트

### 2.3. Reflexion (자기 반성)

실패에서 학습하는 패턴. 시도 → 평가 → 반성 → 재시도 루프를 반복한다.

```
[시도 1]
코드 작성 → 테스트 실행 → 3개 실패

[반성]
"edge case를 고려하지 않았다. 빈 배열과 null 입력을 처리해야 한다."

[시도 2]
edge case 추가 → 테스트 실행 → 1개 실패

[반성]
"비동기 처리에서 race condition이 발생한다. await를 추가해야 한다."

[시도 3]
await 추가 → 테스트 실행 → 전체 통과 ✓
```

| 장점 | 단점 |
|------|------|
| 실패에서 학습 | 여러 번 시도 → 비용 증가 |
| 점진적 품질 향상 | 반성 품질이 LLM 능력에 의존 |
| 복잡한 문제 해결 | 수렴 보장 없음 |

**사용 사례**: 코드 생성, 수학 문제 풀이, 복잡한 추론

### 2.4. Multi-Agent (다중 에이전트)

여러 전문화된 에이전트가 협업하는 패턴.

<div class="mermaid">
graph TD
    O[Orchestrator] --> R[Researcher]
    O --> C[Coder]
    O --> V[Reviewer]
    O --> T[Tester]
    R -->|분석 결과| C
    C -->|구현 완료| V
    V -->|피드백| C
    C -->|수정 완료| T
    T -->|통과| O
</div>

**실행 흐름 예시:**
1. Orchestrator: "새 API 엔드포인트를 추가해야 합니다"
2. Researcher: 기존 API 패턴 분석 결과 전달
3. Coder: 패턴에 맞춰 구현
4. Reviewer: "에러 핸들링이 부족합니다" → Coder에게 반환
5. Coder: 수정 후 Tester에게 전달
6. Tester: 테스트 통과 확인 → Orchestrator에 완료 보고

| 장점 | 단점 |
|------|------|
| 전문화로 품질 향상 | 오케스트레이션 복잡도 |
| 병렬 처리 가능 | 에이전트 간 통신 비용 |
| 역할 분리로 디버깅 용이 | 설계/구현 난이도 높음 |

**사용 사례**: MiroFish (집단 지능), 대규모 프로젝트, 연구 자동화

---

## 3. 메모리 전략: 에이전트의 기억

에이전트가 "맥락을 잃지 않는 것"은 핵심 과제다.

| 전략 | 방식 | 용량 | 속도 | 적합 상황 |
|------|------|------|------|----------|
| Context Window | 대화 이력을 프롬프트에 포함 | 제한적 (128K) | 즉시 | 단기 태스크 |
| RAG | 벡터 DB에서 검색 | 무제한 | 검색 지연 | 대규모 지식 |
| Wiki (LLM Wiki) | 구조화된 마크다운 | 무제한 | 파일 읽기 | 복리 축적형 |
| 프롬프트 캐싱 | 이전 KV Cache 재사용 | 세션 내 | 매우 빠름 | 장기 실행 |

### Claude Code의 선택: 프롬프트 캐싱

Claude Code는 전체 아키텍처를 **프롬프트 캐싱** 중심으로 설계했다. 이전 라운드트립의 KV Cache를 재사용하여:
- 중복 연산 제거
- 지연 시간 대폭 감소
- 장기 실행 에이전트의 비용 절감

### Hermes Agent의 선택: 세션 간 메모리

Hermes Agent는 **외부 메모리**에 세션 간 맥락을 저장한다. 어제의 대화를 오늘 이어갈 수 있다.

---

## 4. 도구 연결: MCP의 부상

에이전트가 도구를 호출하는 방식도 표준화되고 있다.

### Function Calling (OpenAI 스타일)

```json
{
  "name": "read_file",
  "parameters": {"path": "src/main.py"}
}
```

모델이 JSON 형태로 도구 호출을 생성. 간단하지만 도구 정의가 모델별로 다름.

### MCP (Model Context Protocol)

Anthropic이 주도하는 표준 프로토콜. 도구를 **서버**로 분리하여:
- 모델 독립적 (어떤 LLM이든 연결 가능)
- 도구 재사용 (한 번 만들면 여러 에이전트에서 사용)
- 표준화된 인터페이스

<div class="mermaid">
graph LR
    A[에이전트] <-->|요청/응답| B[MCP 클라이언트]
    B <-->|표준 프로토콜| C[MCP 서버 - 도구]
</div>

---

## 5. 실제 프레임워크 비교

| 프레임워크 | 패턴 | 메모리 | 도구 연결 | 특징 |
|-----------|------|--------|----------|------|
| Claude Code | ReAct + 캐싱 | 프롬프트 캐싱 | MCP | 캐싱 중심 설계 |
| Cursor | Plan-Execute | Context Window | 내장 | IDE 통합 |
| OpenHarness | ReAct | Context Window | Function Call | 44배 경량 |
| Hermes Agent | ReAct + 메모리 | 외부 메모리 | 플러그인 | 세션 간 맥락 |
| AutoResearchClaw | Plan-Execute | RAG | 다중 도구 | 연구 자동화 |
| MiroFish | Multi-Agent | 공유 상태 | CAMEL-AI | 집단 지능 |

---

## 6. 패턴 선택 가이드

<div class="mermaid">
graph TD
    Q{태스크 복잡도?}
    Q -->|단순 1~3단계| R[ReAct]
    Q -->|복잡 4+단계| C{세부 조건?}
    C -->|실패에서 학습| RF[Reflexion]
    C -->|병렬 처리 가능| MA[Multi-Agent]
    C -->|순차적 실행| PE[Plan-and-Execute]
</div>

실무에서의 경험칙:
- **대부분의 코딩 태스크**: ReAct로 충분
- **대규모 리팩토링**: Plan-and-Execute
- **품질이 중요한 생성**: Reflexion
- **연구/분석**: Multi-Agent 또는 Plan-and-Execute

---

## 7. 미래 방향

### 에이전트의 에이전트 (Meta-Agent)

태스크에 따라 최적 패턴을 자동 선택하는 메타 에이전트. "이 태스크는 Plan-Execute가 적합하다"를 스스로 판단.

### 학습하는 에이전트

Reflexion을 넘어, 과거 경험에서 패턴을 학습하여 점점 효율적으로 동작하는 에이전트. DiscoRL의 메타러닝 아이디어와 연결.

### 표준화

MCP의 확산으로 도구 생태계가 표준화되면, 에이전트 간 도구 공유와 협업이 자연스러워진다.

---

## 정리

AI 에이전트의 핵심은 "어떤 패턴으로 루프를 구조화하느냐"다.

| 패턴 | 핵심 아이디어 | 비용 | 품질 | 복잡도 |
|------|------------|------|------|--------|
| ReAct | 추론-행동 교대 | 중간 | 기준 | 낮음 |
| Plan-Execute | 계획-실행 분리 | 낮음 | 좋음 | 중간 |
| Reflexion | 실패에서 학습 | 높음 | 높음 | 중간 |
| Multi-Agent | 전문화 협업 | 높음 | 높음 | 높음 |

2026년의 에이전트는 아직 초기 단계다. 하지만 패턴이 수렴하고 있고, MCP 같은 표준이 자리잡으면서, "에이전트를 설계하는 것"이 "프로그램을 작성하는 것"만큼 체계적인 엔지니어링이 되어가고 있다.

---

**관련 개념:**
- [MCP (Model Context Protocol)]({{ site.baseurl }}/concepts/mcp/)
- [RAG (Retrieval-Augmented Generation)]({{ site.baseurl }}/concepts/rag/)

**참고 자료:**
- Masterman et al., "The Landscape of Emerging AI Agent Architectures for Reasoning, Planning, and Tool Calling" (2024), [arXiv:2404.11584](https://arxiv.org/abs/2404.11584)
- Anthropic, "Claude Code: Lessons from Building" (2026)
- NeuralWired, "Multi-Agent Orchestration Patterns Drive Enterprise ROI" (2026)
