---
layout: post
title: "DiscoRL: 메타러닝으로 강화학습 알고리즘을 자동 발견하다"
date: 2026-05-07
categories: [study, RL]
tags: [DiscoRL, 강화학습, 메타러닝, DeepMind, Nature]
description: "Google DeepMind의 DiscoRL 논문 딥리뷰. 메타네트워크가 RL 업데이트 규칙 자체를 학습하여 Atari 57에서 MuZero를 능가하고, 미학습 환경에도 일반화되는 과정을 분석한다."
wiki_source: [sources/discovering-sota-rl-algorithms, entities/discorl, concepts/meta-learning, concepts/reinforcement-learning]
math: true
---

2025년 10월, Nature에 한 편의 논문이 게재되었다. "Discovering state-of-the-art reinforcement learning algorithms." 저자 목록의 첫 번째 이름은 Junhyuk Oh — 내가 롤모델로 삼고 있는 연구자다.

이 논문의 핵심 주장은 도발적이다: **기계가 스스로 SOTA 강화학습 알고리즘을 발견할 수 있다.** 그리고 그 발견된 규칙(DiscoRL)은 인간이 수십 년간 설계해온 모든 알고리즘을 능가한다.

---

## 1. 왜 이 논문이 중요한가

인간의 학습 메커니즘은 수백만 년의 생물학적 진화가 발견한 것이다. 반면 인공 에이전트의 학습 규칙(Q-Learning, PPO, MuZero 등)은 연구자가 수동으로 설계한다. 이 과정은:

- 느리고 (수년의 연구 기간)
- 인간의 직관에 의존하며 (탐색 공간이 제한됨)
- 발견 가능한 알고리즘의 범위가 좁다

DiscoRL은 이 패러다임을 뒤집는다: **학습 규칙 자체를 학습한다.**

---

## 2. 핵심 아이디어: 2단계 최적화

### 일반 RL vs DiscoRL

```
일반 RL:
  고정된 규칙(예: PPO)으로 에이전트를 학습

DiscoRL:
  외부 루프: 규칙 자체를 최적화 (메타러닝)
    내부 루프: 그 규칙으로 에이전트를 학습
```

외부 루프(느린 메타학습)가 내부 루프(빠른 에이전트 학습)를 최적화한다. 마치 진화가 학습 메커니즘을 발견하듯이.

---

## 3. 방법론 상세

### 3.1. Agent Network: 무엇을 예측하는가

에이전트는 5가지 출력을 생성한다:

| 출력 | 의미 | 특징 |
|------|------|------|
| π | 정책 (행동 확률) | 표준 |
| y(s) ∈ ℝⁿ | 관측 조건부 예측 | **의미 자동 발견** |
| z(s,a) ∈ ℝᵐ | 행동 조건부 예측 | **의미 자동 발견** |
| q(s,a) | 행동 가치 함수 | 사전 정의 |
| p(s,a) | 보조 정책 예측 | 사전 정의 |

핵심: **y와 z의 의미(semantics)는 사전에 정의되지 않는다.** "가치 함수가 되어라"라고 지정하지 않는다. 메타네트워크가 학습 과정에서 이 예측들이 무엇을 의미해야 하는지를 스스로 결정한다.

이 설계의 근거: RL의 근본적 구분인 "예측(prediction)"과 "제어(control)"를 반영. y는 상태 가치 함수 v(s)처럼 관측에만 의존하고, z는 행동 가치 함수 q(s,a)처럼 행동에도 의존한다. 하지만 그 구체적 의미는 열려 있다.

### 3.2. Meta-Network: 타겟을 생성하는 LSTM

메타네트워크는 에이전트가 "어디로 향해야 하는지"를 알려주는 타겟을 생성한다:

$$m_\eta: \text{trajectory}(t \to t+n) \mapsto (\hat{\pi}, \hat{y}, \hat{z})$$

- **입력**: 에이전트 출력의 궤적 + 보상 + 에피소드 종료 신호 (시간 t ~ t+n)
- **처리**: LSTM을 시간 역방향으로 unroll
- **출력**: 에이전트의 예측과 정책이 향해야 할 타겟

왜 역방향인가? n-step 미래 정보를 활용하여 타겟을 구성하기 위해. TD(λ)와 같은 multi-step 방법의 일반화.

### 3.3. Agent Loss: KL Divergence 기반

$$L(\theta) = \mathbb{E}_{s,a \sim \pi_\theta} [D_{KL}(\hat{\pi} \| \pi_\theta) + D_{KL}(\hat{y} \| y_\theta) + D_{KL}(\hat{z} \| z_\theta) + L_{aux}]$$

에이전트는 메타네트워크가 제시한 타겟 방향으로 자신의 예측을 업데이트한다. 거리 함수로 KL divergence를 사용.

### 3.4. Meta-Gradient: 업데이트 과정을 역전파

$$\nabla_\eta J(\eta) \approx \mathbb{E}_\mathcal{E} \mathbb{E}_\theta [\nabla_\eta \theta \cdot \nabla_\theta J(\theta)]$$

- $\nabla_\eta \theta$: 에이전트 업데이트 과정 전체를 통한 역전파 (20 업데이트 sliding window)
- $\nabla_\theta J(\theta)$: Advantage Actor-Critic으로 추정

이것이 계산적으로 가장 비싼 부분이다. 에이전트가 20번 업데이트되는 전체 과정을 미분 가능하게 만들어야 한다.

---

## 4. 실험 결과

### 4.1. Atari 57: 모든 기존 알고리즘 능가

Disco57 (Atari 57에서 메타학습):
- **IQM: 13.86** — MuZero, Dreamer, MEME 등 모든 기존 알고리즘 능가
- MuZero 대비 약 **40% 적은 연산량**으로 동일 성능 도달
- 발견 시보다 큰 네트워크에서도 일반화

### 4.2. 일반화: 본 적 없는 환경에서도 SOTA

| 벤치마크 | 환경 수 | DiscoRL 결과 | 비교 |
|---------|--------|-------------|------|
| ProcGen | 16 games | **모든 기존 방법 능가** | MuZero, PPO 포함 |
| Crafter | 1 | 인간 수준 (Disco103) | — |
| NetHack | 1 | NeurIPS 2021 Challenge **3위** | 도메인 지식 없이 |
| Sokoban | 1 | MuZero에 근접 (Disco103) | — |
| DMLab-30 | 30 | 경쟁적 | IMPALA 대비 우수 |

특히 ProcGen 결과가 인상적이다. Disco57은 Atari에서만 메타학습했는데, 전혀 다른 구조의 ProcGen 게임에서도 SOTA를 달성했다. 이는 발견된 규칙이 특정 환경에 과적합된 것이 아니라 **범용적인 학습 원리**를 포착했음을 의미한다.

### 4.3. 스케일링: 환경이 많을수록 강해진다

- Disco57 (57 환경) → Disco103 (103 환경): 모든 미학습 벤치마크에서 향상
- 환경 다양성 ↑ → 발견된 규칙의 일반성 ↑
- 단순 환경(grid-world)에서 발견 → Atari에서 성능 저조

이것은 "데이터와 컴퓨트의 함수로서의 알고리즘 품질"이라는 스케일링 법칙의 메타러닝 버전이다.

---

## 5. 분석: DiscoRL은 무엇을 발견했는가

### 5.1. 발견된 예측의 의미

논문의 가장 흥미로운 부분이다. y와 z는 무엇이 되었는가?

- **미래 중요 이벤트 직전에 spike**: 보상 획득이나 정책 엔트로피 변화 전에 예측 신뢰도가 급등
- **정책/가치함수와 다른 객체에 주목**: Gradient 분석 결과, 정책은 가까운 적에, 가치함수는 점수판에, 발견된 예측은 **먼 거리의 적**에 집중
- **고유한 정보 포착**: 미래 엔트로피와 대형 보상 이벤트를 정책이나 가치함수보다 더 잘 예측

즉, DiscoRL은 기존 RL에 없던 새로운 종류의 "미래 예측"을 발명한 것이다. 가치 함수가 "미래 보상의 합"을 예측한다면, 발견된 예측은 "미래에 중요한 일이 일어날 것"을 예측한다.

### 5.2. 부트스트래핑의 자연 출현

부트스트래핑(미래 예측값을 현재 타겟으로 사용)은 TD Learning의 핵심 아이디어다. DiscoRL에서는 이것이 **명시적으로 프로그래밍되지 않았음에도 자연스럽게 출현**했다.

- 미래 예측 $z_{t+k}$를 교란하면 현재 타겟 $\hat{z}_t$가 크게 변함
- 부트스트래핑 제거 시 성능 대폭 하락
- 예측이 정책 업데이트에도 직접 활용됨 (단순 보조 태스크가 아님)

이는 부트스트래핑이 RL의 "자연법칙"에 가까운 근본적 원리임을 시사한다.

---

## 6. 왜 이전 시도들은 실패했는가

| 이전 연구 | 한계 | DiscoRL의 해결 |
|----------|------|--------------|
| 하이퍼파라미터 메타러닝 | 탐색 공간이 좁음 | 예측 의미 + 전체 규칙 발견 |
| Evolved Policy Gradients | 정책 손실만 발견 | 예측·정책·타겟 모두 포함 |
| RL² (블랙박스) | 메타 과적합 | 구조적 귀납 편향 유지 |
| 이전 모든 연구 | 단순 환경 (grid-world) | 복잡한 환경 (Atari 57) |

DiscoRL의 성공 요인 2가지:
1. **넓은 탐색 공간**: 예측의 의미까지 열어둠
2. **복잡한 환경에서의 대규모 메타학습**: 57~103개의 도전적 환경

---

## 7. 시사점과 미래

### 연구적 시사점

- RL 알고리즘 설계가 "인간의 직관"에서 "기계의 발견"으로 전환될 수 있음
- 발견된 규칙의 성능이 데이터(환경)와 컴퓨트의 함수 → 스케일링 법칙 적용 가능
- 부트스트래핑 같은 근본 원리가 자동으로 재발견됨 → RL 이론의 검증

### 한계

- 계산 비용: Disco57 발견에 1,024 TPUv3 × 64시간 (개인 연구자에게는 비현실적)
- 연속 행동 공간: 현재는 이산 행동 공간에 집중
- 해석 가능성: 발견된 규칙의 완전한 이해는 아직 어려움

### 개인적 의미

Junhyuk Oh는 내가 목표로 삼는 연구자다. 이 논문은 그의 연구 궤적에서 하나의 정점이다:
- 2020 NeurIPS: "Discovering Reinforcement Learning Algorithms" (초기 버전)
- 2025 Nature: DiscoRL (대규모 스케일업 + SOTA 달성)

5년간의 집요한 추적이 Nature 게재로 결실을 맺었다. "하나의 아이디어를 끝까지 밀어붙이는 것"의 가치를 보여주는 사례.

---

## 정리

DiscoRL의 핵심 메시지:

> **RL 알고리즘은 인간이 설계하는 것이 아니라, 기계가 발견하는 것이 될 수 있다.**

그리고 그 발견된 규칙은 인간이 수십 년간 만들어온 모든 것을 능가한다. 이것은 RL 연구의 패러다임 전환이다.

---

**관련 개념:**
- [강화학습 (Reinforcement Learning)]({{ site.baseurl }}/concepts/reinforcement-learning/)
- [메타러닝 (Meta-Learning)]({{ site.baseurl }}/concepts/meta-learning/)

**참고 자료:**
- Oh, J. et al., "Discovering state-of-the-art reinforcement learning algorithms", Nature (2025), DOI: 10.1038/s41586-025-09761-x
- 오픈소스 코드: [github.com/google-deepmind/disco_rl](https://github.com/google-deepmind/disco_rl)
