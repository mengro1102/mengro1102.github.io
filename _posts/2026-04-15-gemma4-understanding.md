---
layout: post
title: "Gemma 4를 이해하는 과정: SLM/LLM의 시작점부터 최신 멀티모달 아키텍처까지"
date: 2026-04-15
categories: [study, LLM]
tags: [Gemma4, LLM, SLM, Transformer, 멀티모달, 양자화, 어텐션]
description: "Gemma 4에 대한 이해를 위해 SLM/LLM의 시작점부터 살펴보며 해석을 수행한다."
---

2026년 4월, Gemma 4가 Hugging Face에 등장했다. Google DeepMind가 개발한 오픈소스 멀티모달 SLM으로, Gemini의 소형화라고 보면 된다. 이미지, 오디오, 비디오를 입력받아 텍스트를 산출하는 Vision-Text-to-Text 모델이다.

본 글은 Gemma 4에 대한 이해를 위해 SLM/LLM의 시작점부터 살펴보며 해석을 수행한다.

---

## 1. 언어 모델의 기원과 본질: 단어는 어떻게 숫자가 되는가?

우리는 Gemma 4와 같은 최신 AI와 대화를 나눌 때, 마치 상대방이 내 말을 '이해'하고 '생각'해서 대답하는 것처럼 느껴진다. 하지만 모델의 내부를 살펴보면, 그곳에는 오직 '수학'과 '통계'만이 존재한다.

### 1.1. Next Token Prediction의 마법

언어 모델의 본질은 주어진 문맥 뒤에 올 가장 확률이 높은 단어를 통계적으로 찍어내는 것이다.

"오늘 날씨가 참 [ ]" → 모델은 '좋다'(0.7) 또는 '나쁘다'(0.2)를 확률적으로 선택한다.

이 단순한 확률 게임을 수조 개의 토큰과 수백억 개의 파라미터 규모로 스케일업했을 때, 모델은 문장의 구조, 논리적 흐름, 세상의 보편적 지식까지 확률 분포 안에 압축하여 '내면화'하게 된다.

### 1.2. [토큰화 (Tokenization)]({{ site.baseurl }}/concepts/tokenization/): 텍스트를 조각내다

컴퓨터는 0과 1만 이해한다. 텍스트를 숫자로 변환하는 전처리가 필수적이다.

현대 LLM들은 주로 **[BPE(Byte Pair Encoding)]({{ site.baseurl }}/concepts/tokenization/)** 알고리즘을 사용한다. 자주 등장하는 글자 조합을 하나의 토큰으로 묶는 방식이다.

```
"hugs" → BPE 학습 후 → ["hug", "s"]
```

BPE의 핵심 장점은 **OOV(Out-of-Vocabulary) 문제 해결** — 어떤 단어든 서브워드 조합으로 표현 가능하다는 것이다.

### 1.3. [임베딩 (Embedding)]({{ site.baseurl }}/concepts/embedding/): 단어에 좌표를 부여하다

토큰에 부여된 ID를 수천 차원의 벡터 공간 상의 좌표로 변환하는 기술이다.

```
[King] - [Man] + [Woman] ≈ [Queen]
```

**Gemma 4의 혁신 — PLE (Per-Layer Embeddings):** 레이어별로 토큰 특화 잔차 신호를 주입하여, 단일 임베딩에 모든 정보를 압축하는 한계를 극복.

---

## 2. LLM의 심장: [트랜스포머]({{ site.baseurl }}/concepts/transformer/)와 [어텐션 메커니즘]({{ site.baseurl }}/concepts/attention/)

"배가 부르다"와 "배를 타다"에서 '배'는 주변 단어에 의해 의미가 완전히 달라진다. 2017년 구글이 발표한 **트랜스포머**가 이 문맥 파악 문제를 해결했다.

### 2.1. [어텐션]({{ site.baseurl }}/concepts/attention/) 메커니즘의 수학적 원리

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

- **Query (Q)**: 기준 단어 — "검색어"
- **Key (K)**: 다른 단어들의 특징 — "문서 키워드"
- **Value (V)**: 다른 단어들의 실제 의미 — "문서 내용"

이 행렬 곱셈 연산은 GPU의 CUDA 코어에서 대규모 병렬 처리에 극도로 최적화되어 있다.

### 2.2. Context Window의 구조적 한계

어텐션의 연산량은 **O(N²)**. 토큰이 2배 길어지면 연산량은 4배. 이것이 OOM의 근본 원인이다.

### 2.3. [Sliding Window Attention]({{ site.baseurl }}/concepts/sliding-window-attention/)과 RAttention

Gemma 4는 **Local-Global Hybrid Attention**을 사용한다:

```
Layer 1: SWA (윈도우 512)    ← 로컬 문맥
Layer 2: Full Attention       ← 글로벌 문맥
Layer 3: SWA (윈도우 512)    ← 로컬 문맥
...
```

Apple의 RAttention 논문은 SWA의 한계를 Residual Linear Attention으로 보완하여, 윈도우 512로도 Full Attention 성능을 매칭했다.

---

## 3. 원석을 에이전트로 제련하다: 모델 학습의 진화

### 3.1. 사전 학습 (Pre-training)

$$L_{CE} = -\sum_{i=1}^{N} \log P(x_i \mid x_{<i}, \theta)$$

수조 개의 토큰에 대해 이 손실 함수를 최소화하면, 모델은 문법, 논리, 상식을 가중치 속에 압축하게 된다.

### 3.2. 정렬 (Alignment): SFT와 RLHF

**SFT:** 전문가가 작성한 고품질 [질문-답변] 쌍으로 '대화하는 법'을 가르친다.

**DPO (Direct Preference Optimization):**

$$L_{DPO} = -\log \sigma \left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{ref}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{ref}(y_l \mid x)}\right)$$

---

## 4. 거대화의 함정과 SLM의 부상

### 4.1. 스케일링 법칙

$$L(N,D) \approx \frac{A}{N^\alpha} + \frac{B}{D^\beta}$$

### 4.2. [양자화 (Quantization)]({{ site.baseurl }}/concepts/quantization/): 로컬 AI 시대의 열쇠

$$W_q = \text{round}\left(\frac{W}{S}\right) + Z$$

| 기법 | 타겟 | 핵심 전략 | 호환성 |
|------|------|----------|--------|
| GPTQ | GPU | 열 단위 순차 보상 | vLLM, TGI |
| AWQ | GPU | 활성화 기반 채널 보존 | vLLM, TGI |
| GGUF | CPU+GPU | 혼합 정밀도 | llama.cpp, Ollama |

### 4.3. 지식 증류 (Knowledge Distillation)

$$\mathcal{L}_{KD} = D_{KL}(P_{\text{teacher}} \| P_{\text{student}})$$

Gemma 4가 Gemini의 핏줄을 이어받은 핵심 메커니즘.

---

## 5. 텍스트의 벽을 넘다: 멀티모달 아키텍처

### 5.1. Vision Encoder

- 이미지를 패치 단위로 분할 → 토큰화
- 가변 종횡비 지원, 토큰 버짓 조절 (70~1120)

### 5.2. Audio Encoder

소형 모델(E2B, E4B)은 USM-style conformer로 오디오를 네이티브 처리.

---

## 6. Gemma 4 해부: 로컬 AI 생태계의 정점

| 모델 | 파라미터 | 컨텍스트 | 특징 |
|------|---------|---------|------|
| E2B | 2.3B effective | 128K | 온디바이스, 오디오 |
| E4B | 4.5B effective | 128K | 온디바이스, 오디오 |
| 31B | 31B dense | 256K | LMArena 1452 |
| 26B-A4B | 26B/4B active (MoE) | 256K | LMArena 1441 |

핵심 아키텍처: [Local-Global Attention]({{ site.baseurl }}/concepts/sliding-window-attention/), Dual RoPE, PLE, Shared KV Cache, MoE, 네이티브 멀티모달, Function Calling.

---

## 7. 결론: 오픈소스 모델이 그려갈 미래

Gemma 4는 독점적 API에서 로컬 주도권으로의 이동을 상징한다. Apache 2 라이선스, [양자화]({{ site.baseurl }}/concepts/quantization/) 최적화, MoE 효율성이 결합되어 개인 GPU에서도 프론티어급 지능을 구동할 수 있게 되었다.

---

**관련 개념 포스트:**
- [토큰화 (Tokenization)]({{ site.baseurl }}/concepts/tokenization/)
- [임베딩 (Embedding)]({{ site.baseurl }}/concepts/embedding/)
- [어텐션 (Attention)]({{ site.baseurl }}/concepts/attention/)
- [트랜스포머 (Transformer)]({{ site.baseurl }}/concepts/transformer/)
- [양자화 (Quantization)]({{ site.baseurl }}/concepts/quantization/)
- [Sliding Window Attention]({{ site.baseurl }}/concepts/sliding-window-attention/)
