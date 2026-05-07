---
layout: post
title: "Sliding Window Attention의 한계와 RAttention: 윈도우 512로 Full Attention을 매칭하다"
date: 2026-05-07
categories: [study, LLM]
tags: [Attention, SWA, RAttention, Transformer, 효율성, Apple]
description: "Sliding Window Attention의 O(N²) → O(N×W) 절감 원리와 근본 한계, 그리고 Apple의 RAttention이 윈도우 512만으로 Full Attention 성능을 매칭하는 방법을 분석한다."
wiki_source: [concepts/sliding-window-attention, sources/rattention-sliding-window]
math: true
---

[트랜스포머]({{ site.baseurl }}/concepts/transformer/)의 어텐션은 O(N²)이다. 토큰이 2배 길어지면 연산량은 4배. 이것이 긴 문맥에서 OOM이 발생하는 근본 원인이다.

Sliding Window Attention(SWA)은 이 문제를 O(N×W)로 줄인다. 하지만 대가가 있다: **윈도우 밖 토큰을 완전히 무시한다.** Apple의 RAttention 논문은 이 근본 한계를 해결하여, 윈도우 512만으로 Full Attention 성능을 매칭했다.

---

## 1. Full Attention의 비용

표준 어텐션의 수식:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

시퀀스 길이 N에 대해:
- 연산량: O(N² × d)
- KV Cache (추론 시): O(N × d) — 시퀀스가 길어질수록 선형 증가

128K 토큰 문맥에서 KV Cache만 수십 GB를 차지할 수 있다.

---

## 2. Sliding Window Attention: O(N×W)로의 축소

### 원리

최근 W개 토큰에 대해서만 어텐션을 수행한다:

$$o_t^{\text{swa}} = \frac{\sum_{i=\max(1,t-w)}^{t} \exp(q_t k_i^T) v_i}{\sum_{i=\max(1,t-w)}^{t} \exp(q_t k_i^T)}$$

- 연산량: O(N × W × d) — W가 고정이면 N에 선형
- KV Cache: O(W × d) — **상수**. 시퀀스 길이와 무관

### Local-Global Hybrid (Gemma 4, Mistral)

현대 모델은 SWA만 쓰지 않는다. SWA 레이어와 Full Attention 레이어를 교대 배치한다:

```
Layer 1: SWA (윈도우 512)    ← 로컬 문맥, 상수 메모리
Layer 2: Full Attention       ← 글로벌 문맥, O(N) 메모리
Layer 3: SWA (윈도우 512)    ← 로컬 문맥
Layer 4: Full Attention       ← 글로벌 문맥
...
```

Gemma 4는 소형 모델에서 윈도우 512, 대형 모델에서 1024를 사용한다.

### Pareto 트레이드오프

| 윈도우 크기 | 성능 | 효율 | 문제 |
|-----------|------|------|------|
| 4096 (Gemma 2, Mistral) | Full Attention에 근접 | 짧은 문맥에서 이점 없음 | 보수적 |
| 1024 | 약간 저하 | 중간 | — |
| 512 | 저하 | 높음 | 정보 손실 |
| 128 | 심각한 저하 | 매우 높음 | 사용 불가 |

핵심 딜레마: 윈도우를 줄이면 효율은 좋아지지만 성능이 떨어진다. 이 Pareto 경계를 이동시킬 수 있을까?

---

## 3. SWA의 근본 한계

흔히 알려진 경험적 규칙:

> layers × window_size ≥ context_length

이 규칙은 "정보가 레이어를 거치며 전파되므로, 충분한 레이어가 있으면 먼 토큰의 정보도 도달한다"는 가정에 기반한다.

**RAttention 논문은 이것이 불충분함을 증명했다.** SWA의 진짜 문제는:

- 윈도우 밖 토큰을 **완전히 무시**한다 (0% 참조)
- 레이어 간 전파는 간접적이고 손실이 크다
- 특히 recall-intensive 태스크(특정 정보를 정확히 기억해야 하는 경우)에서 치명적

---

## 4. RAttention: Residual Linear Attention으로 보완

### 핵심 아이디어

SWA가 놓치는 "윈도우 밖 토큰"의 정보를 Linear Attention의 recurrent 상태로 캡처한다.

```
RAttention = SWA (윈도우 내) + RLA (윈도우 밖)
```

### Residual Linear Attention (RLA) 수식

$$S_t = S_{t-1} + \phi(k_t)^T v_t$$
$$o_t^{\text{rla}} = \phi(q_t) \cdot S_{t-w-1}$$

- $S_t$: 선형 어텐션의 recurrent 상태 (행렬값 hidden state)
- $\phi$: 특성 맵 (softmax 기반이 최적)
- 핵심: $S_{t-w-1}$에서 읽어옴 — 윈도우 밖 토큰의 정보만 캡처

### 최종 출력

$$o_t = \text{RMS}(o_t^{\text{swa}}) + \text{RMS}(o_t^{\text{rla}})$$

SWA의 로컬 정보와 RLA의 글로벌 정보를 합산.

### 설계 특징

- **추가 파라미터 없음**: SWA의 Q/K/V 투영을 그대로 재사용
- **상수 메모리 유지**: RLA의 상태 $S$는 고정 크기 (d' × d)
- **GQA 호환**: Group-Query Attention과 자연스럽게 결합
- **전용 커널**: chunkwise parallel 구현으로 학습 효율 유지

---

## 5. 실험 결과

### 3B, 12B 스케일 사전학습

| 설정 | 윈도우 | 성능 (vs Full Attention) | KV Cache 절감 |
|------|--------|------------------------|--------------|
| SWA only | 4096 | 동등 | 짧은 문맥에서 미미 |
| SWA only | 512 | **저하** | 큼 |
| **RAttention** | **512** | **Full Attention 매칭** | **~87% (4K 문맥)** |

- 3B와 12B 모두에서 일관된 결과
- 윈도우 512의 RAttention이 윈도우 4096의 SWA와 동등하거나 우수

### 장문맥 성능 (RULER 벤치마크)

RLA의 recurrent 특성이 장문맥 일반화에 기여:
- SWA 대비 현저히 우수한 zero-shot 길이 일반화
- 위치 임베딩에 대한 과도한 의존도 감소

### 학습 효율

전용 커널 구현 + 축소된 윈도우 크기 덕분에:
- Full Attention 모델과 동등한 학습 속도
- 더 큰 윈도우의 SWA 모델과도 동등

---

## 6. 왜 Linear Attention 단독으로는 안 되는가

순수 Linear Attention 모델은 Transformer에 미치지 못한다. 특히 recall-intensive 태스크에서. 이유:

- 고정 크기 상태 $S$에 모든 과거 정보를 압축해야 함
- 정보 병목(information bottleneck)이 발생
- softmax 어텐션의 "선택적 집중" 능력이 없음

RAttention의 해법: **SWA가 로컬의 정밀한 recall을 담당하고, RLA는 글로벌의 대략적 문맥만 보완한다.** 역할 분담이 핵심.

---

## 7. Gemma 4에서의 적용

Gemma 4의 어텐션 설계는 RAttention 논문의 맥락에서 이해할 수 있다:

- **소형 dense 모델**: 윈도우 512 + Full Attention 교대
- **대형 모델**: 윈도우 1024 + Full Attention 교대
- **Dual RoPE**: sliding 레이어는 표준 RoPE, global 레이어는 proportional RoPE
- **Shared KV Cache**: 마지막 N개 레이어가 이전 레이어의 KV 재사용

RAttention은 이 아키텍처의 "Full Attention 레이어"를 줄이거나 제거할 수 있는 가능성을 제시한다.

---

## 8. 시사점

### 실무적 의미

- 윈도우 512로도 충분하다면, 추론 시 KV Cache가 극적으로 줄어듦
- 4K 문맥에서 ~87% KV Cache 절감 → 더 긴 문맥을 같은 메모리로 처리 가능
- 온디바이스 모델에서 특히 중요 (메모리 제약이 심한 환경)

### 연구적 의미

- "layers × window ≥ context" 규칙의 불충분함을 실증
- SWA + Linear Attention 하이브리드가 Full Attention의 실질적 대안
- Recurrent 특성이 장문맥 일반화에 기여 → RNN의 부활?

---

## 정리

| 방식 | 연산량 | KV Cache | 성능 |
|------|--------|----------|------|
| Full Attention | O(N²) | O(N) | 기준 |
| SWA (w=4096) | O(N×W) | O(W) | 동등 |
| SWA (w=512) | O(N×W) | O(W) | 저하 |
| **RAttention (w=512)** | O(N×W) + α | O(W) + O(d²) | **동등** |

RAttention의 메시지: **윈도우 밖 정보를 완전히 버리지 말고, 저비용으로 요약하여 보존하라.** 이 단순한 아이디어가 Pareto 경계를 이동시켰다.

---

**관련 개념:**
- [어텐션 (Attention)]({{ site.baseurl }}/concepts/attention/)
- [트랜스포머 (Transformer)]({{ site.baseurl }}/concepts/transformer/)

**참고 자료:**
- Wang et al., "RAttention: Towards the Minimal Sliding Window Size in Local-Global Attention Models" (2025), [arXiv:2506.15545](https://arxiv.org/abs/2506.15545)
- [Apple Machine Learning Research](https://machinelearning.apple.com/research/rattention)
