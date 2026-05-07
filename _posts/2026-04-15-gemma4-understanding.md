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

모델 성능은 파라미터 수(N)와 학습 데이터 양(D)에 의해 예측 가능한 법칙을 따른다:

$$L(N,D) \approx \frac{A}{N^\alpha} + \frac{B}{D^\beta}$$

여기서 $L$은 손실(loss), $A$, $B$는 상수, $\alpha \approx 0.076$, $\beta \approx 0.095$이다. 모델을 키우면 성능은 올라가지만, 수확 체감(diminishing returns)이 존재한다. 파라미터를 10배 늘려도 성능 향상은 로그 스케일에 불과하다.

Chinchilla 연구는 **최적의 N:D 비율**이 존재함을 보였다. 같은 연산 예산이라면 모델을 무작정 키우는 것보다 데이터를 충분히 확보하는 것이 더 효율적이다. Gemma 4의 설계 철학은 이 원칙을 충실히 따른다.

### 4.2. [양자화 (Quantization)]({{ site.baseurl }}/concepts/quantization/): 로컬 AI 시대의 열쇠

양자화는 모델의 가중치를 FP32/FP16에서 INT8/INT4로 낮추어 메모리와 연산량을 줄이는 기법이다:

$$W_q = \text{round}\left(\frac{W}{S}\right) + Z$$

여기서 $S$는 스케일 팩터, $Z$는 제로 포인트이다. 양자화의 도전 과제는 정밀도 손실을 최소화하면서 압축률을 극대화하는 것이다.

| 기법 | 타겟 | 핵심 전략 | 호환성 |
|------|------|----------|--------|
| GPTQ | GPU | 열 단위 순차 보상 — Hessian 역행렬로 양자화 오차를 후속 열에 분산 | vLLM, TGI |
| AWQ | GPU | 활성화 기반 채널 보존 — 활성화 값이 큰 채널은 높은 정밀도 유지 | vLLM, TGI |
| GGUF | CPU+GPU | 혼합 정밀도 — 레이어별로 다른 비트 수 할당, CPU 오프로딩 지원 | llama.cpp, Ollama |

### 4.3. 지식 증류 (Knowledge Distillation)

거대 모델(Teacher)의 지식을 소형 모델(Student)에 전이하는 기법이다:

$$\mathcal{L}_{KD} = D_{KL}(P_{\text{teacher}} \| P_{\text{student}})$$

Teacher의 소프트 확률 분포(soft label)를 Student가 모방하도록 학습시킨다. 하드 라벨(정답만 1, 나머지 0)과 달리, 소프트 라벨은 "정답이 아닌 토큰들 간의 상대적 확률"까지 전달하므로 더 풍부한 정보를 담고 있다.

Gemma 4가 Gemini의 핏줄을 이어받은 핵심 메커니즘이 바로 이것이다. Gemini의 방대한 파라미터에 압축된 세계 지식을, 증류를 통해 Gemma 4의 소형 아키텍처에 효율적으로 전이했다.

---

## 5. 텍스트의 벽을 넘다: 멀티모달 아키텍처

현대 AI의 핵심 트렌드는 텍스트만이 아닌 이미지, 오디오, 비디오를 하나의 모델에서 통합 처리하는 것이다. Gemma 4는 각 모달리티별 전용 인코더를 두고, 이를 언어 모델의 임베딩 공간에 정렬(align)하는 구조를 채택했다.

### 5.1. Vision Encoder

Gemma 4의 비전 인코더는 SigLIP 기반의 ViT(Vision Transformer) 아키텍처를 사용한다.

**처리 파이프라인:**
1. 입력 이미지를 고정 크기 패치(예: 14×14 픽셀)로 분할
2. 각 패치를 선형 투영하여 토큰 시퀀스로 변환
3. 위치 임베딩을 추가하여 공간 정보 보존
4. ViT 레이어를 통과시켜 시각적 특징 추출
5. 프로젝션 레이어를 통해 언어 모델의 임베딩 차원에 정렬

**가변 종횡비 지원:** Pan-and-Scan 방식으로 원본 이미지의 종횡비를 유지하면서 패치를 생성한다. 토큰 버짓은 70~1120개로 조절 가능하며, 이미지 해상도와 복잡도에 따라 동적으로 결정된다.

### 5.2. Audio Encoder

소형 모델(E2B, E4B)은 USM-style conformer 아키텍처로 오디오를 네이티브 처리한다.

**Conformer 구조:**
- **Convolution 모듈:** 로컬 패턴(음소, 음절) 포착
- **Self-Attention 모듈:** 글로벌 문맥(문장 구조, 억양) 파악
- **Feed-Forward 모듈:** 비선형 변환

오디오 입력은 Mel-spectrogram으로 변환된 후, conformer 레이어를 통과하여 텍스트 토큰과 동일한 임베딩 공간에 매핑된다. 이를 통해 음성 인식, 음성 번역, 오디오 이해가 단일 모델에서 가능해진다.

### 5.3. 모달리티 정렬 (Cross-Modal Alignment)

각 인코더의 출력은 별도의 프로젝션 레이어를 거쳐 언어 모델의 디코더에 입력된다. 핵심은 **소프트 토큰(soft token)** 방식으로, 비전/오디오 특징을 언어 토큰과 동일한 시퀀스에 인터리빙하여 어텐션 메커니즘이 자연스럽게 크로스모달 관계를 학습하도록 한다.

---

## 6. Gemma 4 해부: 로컬 AI 생태계의 정점

Gemma 4 패밀리는 용도와 하드웨어 제약에 따라 4가지 변형을 제공한다.

| 모델 | 파라미터 | 컨텍스트 | 특징 |
|------|---------|---------|------|
| E2B | 2.3B effective | 128K | 온디바이스, 오디오 네이티브 |
| E4B | 4.5B effective | 128K | 온디바이스, 오디오 네이티브 |
| 31B | 31B dense | 256K | LMArena 1452, 최고 품질 |
| 26B-A4B | 26B/4B active (MoE) | 256K | LMArena 1441, 효율성 극대화 |

### 6.1. 핵심 아키텍처 혁신

**Local-Global Hybrid Attention:** 홀수 레이어는 [Sliding Window Attention]({{ site.baseurl }}/concepts/sliding-window-attention/)(윈도우 512)으로 로컬 문맥을, 짝수 레이어는 Full Attention으로 글로벌 문맥을 처리한다. 이를 통해 $O(N^2)$ 연산량을 실질적으로 $O(N \cdot W)$에 가깝게 줄이면서도 긴 문맥 이해 능력을 유지한다.

**Dual RoPE (Rotary Position Embedding):** 로컬 어텐션과 글로벌 어텐션에 서로 다른 주파수의 RoPE를 적용하여, 각 레이어가 최적의 위치 인코딩을 사용하도록 한다.

**PLE (Per-Layer Embeddings):** 기존 모델은 입력 임베딩을 한 번만 생성하지만, Gemma 4는 각 레이어마다 토큰 특화 잔차 신호를 주입한다. 깊은 레이어에서도 입력 토큰의 원본 정보가 희석되지 않는다.

**Shared KV Cache:** MoE 모델에서 전문가(expert) 간 Key-Value 캐시를 공유하여 메모리 사용량을 대폭 절감한다. 26B-A4B 모델이 4B 활성 파라미터만으로 26B급 성능을 내는 핵심 비결이다.

**MoE (Mixture of Experts):** 26B-A4B 모델은 총 26B 파라미터 중 입력 토큰마다 4B만 활성화하는 희소 구조를 사용한다. 라우터 네트워크가 각 토큰을 가장 적합한 전문가에게 배정하여, 연산 효율과 모델 용량을 동시에 확보한다.

### 6.2. 실전 배포 시나리오

- **E2B/E4B:** 스마트폰, 엣지 디바이스에서 실시간 음성 비서, 이미지 캡셔닝
- **31B:** 연구용 고품질 추론, 복잡한 코드 생성, 장문 분석
- **26B-A4B:** RTX 3090/4090 단일 GPU에서 INT4 양자화로 구동 가능, 프로덕션 서빙에 최적

---

## 7. 결론: 오픈소스 모델이 그려갈 미래

Gemma 4는 단순한 모델 릴리스를 넘어, AI 생태계의 패러다임 전환을 상징한다.

**독점에서 개방으로:** GPT-4, Claude 같은 독점 API에 의존하던 시대에서, Apache 2.0 라이선스의 오픈소스 모델이 동등한 성능을 제공하는 시대로 전환되고 있다. 이는 개인 개발자와 소규모 팀에게 AI 주도권을 돌려준다.

**클라우드에서 로컬로:** [양자화]({{ site.baseurl }}/concepts/quantization/) 기술(GPTQ, AWQ, GGUF)과 MoE 아키텍처의 결합으로, 소비자급 GPU에서도 프론티어급 지능을 구동할 수 있게 되었다. RTX 3090 한 장으로 26B 모델을 실시간 추론하는 것이 현실이 되었다.

**단일 모달에서 멀티모달로:** 텍스트만 처리하던 LLM이 이미지, 오디오, 비디오를 통합 이해하는 범용 AI로 진화하고 있다. Gemma 4의 네이티브 멀티모달 아키텍처는 이 방향의 최전선에 있다.

**앞으로의 과제:** 환각(hallucination) 감소, 추론 능력 강화, 에이전트 시스템과의 통합이 다음 단계의 핵심 연구 주제가 될 것이다. Gemma 4가 제공하는 Function Calling 기능은 이미 에이전트 생태계로의 진입을 예고하고 있다.

---

**관련 개념 포스트:**
- [토큰화 (Tokenization)]({{ site.baseurl }}/concepts/tokenization/)
- [임베딩 (Embedding)]({{ site.baseurl }}/concepts/embedding/)
- [어텐션 (Attention)]({{ site.baseurl }}/concepts/attention/)
- [트랜스포머 (Transformer)]({{ site.baseurl }}/concepts/transformer/)
- [양자화 (Quantization)]({{ site.baseurl }}/concepts/quantization/)
- [Sliding Window Attention]({{ site.baseurl }}/concepts/sliding-window-attention/)
