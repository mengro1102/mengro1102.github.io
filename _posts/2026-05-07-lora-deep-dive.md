---
layout: post
title: "LoRA 딥다이브: 저랭크 분해로 LLM을 효율적으로 파인튜닝하는 원리"
date: 2026-05-07
categories: [study, LLM]
tags: [LoRA, Fine-Tuning, PEFT, LLM, Transformer]
description: "LoRA(Low-Rank Adaptation)의 핵심 원리를 수식과 직관으로 풀어본다. 왜 모델 가중치를 직접 건드리지 않고도 성능을 끌어올릴 수 있는지, 그 수학적 근거와 실무 적용까지."
wiki_source: [concepts/lora, sources/lora-paper-explained]
math: true
---

70B 모델을 파인튜닝하려면 FP16 기준 140GB 이상의 VRAM이 필요하다. gradient와 optimizer 상태까지 합치면 가중치의 2~3배. 현실적으로 대부분의 연구자에게 불가능한 수치다.

2021년, Microsoft Research에서 이 문제에 대한 우아한 해법을 내놓았다. **LoRA(Low-Rank Adaptation)**. 모델 가중치를 얼리고(freeze), 아주 작은 저랭크 행렬만 학습하여 간접적으로 가중치를 업데이트하는 기법이다.

---

## 1. Fully Fine-Tuning이 비현실적인 이유

LLM의 학습 과정에서 GPU에 올라가는 것들을 정리하면:

| 항목 | 크기 (대략) |
|------|------------|
| 모델 가중치 (W) | 1× |
| Gradient | 1× |
| Optimizer 상태 (Adam: m, v) | 2× |
| **합계** | **~4×** |

7B 모델이 FP16으로 14GB라면, 학습 시에는 약 56GB가 필요하다. 70B면 560GB. 단일 GPU로는 불가능하고, 멀티 GPU 병렬화를 해도 비용이 막대하다.

핵심 질문: **가중치 전체를 업데이트하지 않고도 동등한 성능을 낼 수 있을까?**

---

## 2. LoRA의 핵심 사상: 저랭크 가설

LoRA의 출발점은 하나의 가설이다:

> Fine-Tuning 시 가중치 변화량 ΔW는 **저랭크(low-rank) 구조**를 가진다.

즉, 수십억 개의 파라미터가 변하지만, 그 변화의 "본질적 차원"은 전체 파라미터 수보다 훨씬 작다. 마치 고차원 공간에서의 움직임이 실제로는 저차원 부분공간 위에서만 일어나는 것과 같다.

이 가설이 맞다면, ΔW를 직접 학습하는 대신 저랭크 행렬의 곱으로 근사할 수 있다.

---

## 3. 수학적 원리

### 3.1. 저랭크 분해 (Low-Rank Decomposition)

원본 가중치 행렬 $W \in \mathbb{R}^{d \times k}$를 freeze하고, 두 개의 작은 행렬을 도입한다:

$$W' = W + \Delta W = W + B \cdot A$$

여기서:
- $A \in \mathbb{R}^{r \times k}$ — 다운프로젝션 (LoRA_A)
- $B \in \mathbb{R}^{d \times r}$ — 업프로젝션 (LoRA_B)
- $r \ll d$ — 랭크. 보통 4, 8, 16 정도

### 3.2. Forward Pass 구조

```
입력 x → [Frozen W] → h₁
       → [LoRA_A → LoRA_B] → h₂
       → h = h₁ + h₂  (단순 덧셈)
```

학습 시에는 A와 B만 gradient가 흐른다. W는 완전히 고정.

### 3.3. 파라미터 절감 효과

원본 W의 파라미터 수: $d \times k$

LoRA 추가 파라미터 수: $d \times r + r \times k = r(d + k)$

$d = k = 4096$, $r = 8$이라면:
- 원본: 16,777,216개
- LoRA: 65,536개 (원본의 **0.39%**)

---

## 4. 어디에 적용하는가: Weight Type 선택

Transformer의 Self-Attention 레이어에는 4개의 가중치 행렬이 있다:

| Weight Type | 역할 | 차원 |
|-------------|------|------|
| $W_q$ | Query 투영 | $d \times d$ |
| $W_k$ | Key 투영 | $d \times d$ |
| $W_v$ | Value 투영 | $d \times d$ |
| $W_o$ | Output 투영 | $d \times d$ |

논문의 실험 결과, **Query + Key에 적용했을 때 최고 성능**을 보였다. 이는 어텐션 패턴(어떤 토큰이 어떤 토큰을 바라보는지)을 조정하는 것이 Fine-Tuning의 핵심임을 시사한다.

---

## 5. LoRA의 4가지 장점

### 5.1. 성능: Fully Fine-Tuning과 동등하거나 우수

18M 파라미터만으로 다양한 Downstream task에서 Full Fine-Tuning 수준의 성능을 달성.

### 5.2. VRAM 절감

W를 freeze하면 gradient와 optimizer 텐서가 GPU에 로드되지 않는다. 학습 대상은 오직 A와 B뿐.

### 5.3. 추론 속도 동일

학습 완료 후 $W' = W + B \cdot A$로 합산하면, 추론 시에는 단일 행렬 연산. 추가 연산량 제로.

### 5.4. 원복 용이

더한 만큼 빼면 원본 모델로 즉시 복원. 여러 태스크용 LoRA 어댑터를 스왑하며 사용 가능.

---

## 6. 실무 적용 시나리오

### 로컬 GPU에서의 도메인 특화 LLM

[양자화(Quantization)]({{ site.baseurl }}/concepts/quantization/)와 LoRA를 결합하면:

1. 4비트 양자화로 모델을 24GB GPU에 로드
2. LoRA로 도메인 데이터에 파인튜닝
3. 추론 시 합산하여 단일 모델로 서빙

이것이 **QLoRA** 패턴이며, Gemma 4 같은 오픈소스 모델에 Hugging Face TRL, Unsloth 등으로 바로 적용 가능하다.

### 멀티 태스크 어댑터

하나의 베이스 모델에 여러 LoRA 어댑터를 학습해두고, 요청에 따라 동적으로 로드:
- 코드 생성용 LoRA
- 한국어 대화용 LoRA
- 의료 도메인용 LoRA

---

## 7. 한계와 후속 연구

LoRA가 만능은 아니다:

- **랭크 r 선택**: 너무 작으면 표현력 부족, 너무 크면 효율성 감소. 태스크별 최적값이 다름.
- **적용 레이어 선택**: Q+K가 최적이라는 결과는 특정 실험 조건에서의 결론. 모델/태스크에 따라 다를 수 있음.
- **복잡한 태스크**: 대규모 도메인 전환(예: 영어→한국어)에서는 Full Fine-Tuning 대비 성능 갭이 존재할 수 있음.

후속 연구로 QLoRA, DoRA, LoRA+, AdaLoRA 등이 이 한계들을 개선하고 있다.

---

## 정리

| 항목 | Fully Fine-Tuning | LoRA |
|------|-------------------|------|
| 학습 파라미터 | 전체 W | A, B만 (0.1~1%) |
| VRAM | W × 4 | W × 1 + α |
| 추론 속도 | 기준 | 동일 |
| 원복 | 불가 | 즉시 가능 |
| 성능 | 기준 | 동등~우수 |

LoRA의 핵심 통찰은 단순하다: **거대한 모델의 변화는 생각보다 저차원적이다.** 이 가설 하나가 LLM 파인튜닝의 민주화를 이끌었다.

---

**관련 개념:**
- [양자화 (Quantization)]({{ site.baseurl }}/concepts/quantization/)
- [트랜스포머 (Transformer)]({{ site.baseurl }}/concepts/transformer/)
- [어텐션 (Attention)]({{ site.baseurl }}/concepts/attention/)

**참고 자료:**
- Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models" (2021), arXiv:2106.09685
