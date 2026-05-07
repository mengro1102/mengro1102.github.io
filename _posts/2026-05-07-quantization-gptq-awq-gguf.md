---
layout: post
title: "양자화 3대 기법 비교: GPTQ vs AWQ vs GGUF — 로컬 AI 시대의 열쇠"
date: 2026-05-07
categories: [study, LLM]
tags: [양자화, Quantization, GPTQ, AWQ, GGUF, LLM, 최적화]
description: "70B 모델을 24GB GPU에서 돌리는 마법. 양자화의 원리부터 GPTQ, AWQ, GGUF 3대 기법의 동작 방식과 트레이드오프를 비교한다."
wiki_source: [concepts/quantization, sources/gptq-awq-gguf-comparison]
math: true
---

70B 모델은 FP16 기준 140GB VRAM이 필요하다. RTX 4090(24GB)으로는 로드조차 불가능하다.

하지만 4비트 양자화를 적용하면 ~35GB로 축소된다. 놀랍게도 원본 성능의 95% 이상을 유지하면서. 이것이 로컬 AI 시대를 가능하게 만든 핵심 기술이다.

---

## 1. 양자화란 무엇인가

모델 가중치의 숫자 정밀도를 낮추는 기술이다. FP16(16비트 부동소수점)을 INT4(4비트 정수)로 변환하면 메모리 사용량이 1/4로 줄어든다.

### 기본 수식

$$W_q = \text{round}\left(\frac{W}{S}\right) + Z$$

- **W**: 원본 가중치 (FP16 실수값)
- **S (Scale Factor)**: 데이터 범위를 압축하는 스케일링 팩터
- **Z (Zero-point)**: 비대칭 분포 보정을 위한 영점
- **round()**: 반올림. 실수를 정수 버킷에 매핑

### 왜 95% 성능이 유지되는가?

뉴런 간 연결 강도(가중치)의 미세한 소수점 값이 무뎌져도, 거대한 네트워크가 만들어내는 전체적인 문맥 파악의 논리 구조는 쉽게 붕괴되지 않기 때문이다. 수십억 개의 파라미터가 만드는 "집단적 패턴"은 개별 값의 정밀도보다 훨씬 견고하다.

---

## 2. GPTQ: 열 단위 순차 보상 (GPU 전용)

### 원리

가중치 행렬을 **열(column) 단위**로 순차 양자화한다. 핵심 아이디어: 앞선 열을 양자화할 때 발생한 오차를 뒤 열의 가중치를 조정하여 보상한다.

```
열 1 양자화 → 오차 발생
  ↓ 오차를 열 2~N에 분배
열 2 양자화 → 오차 발생
  ↓ 오차를 열 3~N에 분배
...
```

이 방식은 Optimal Brain Surgeon(OBS) 프레임워크에서 유래했다. 각 열의 양자화가 전체 출력에 미치는 영향을 Hessian 행렬로 추정하고, 후속 열에서 보상한다.

### 보정 데이터

~128개 텍스트 샘플로 활성화 값을 수집한다. 이 데이터가 "어떤 가중치가 출력에 얼마나 영향을 주는지"를 추정하는 데 사용된다.

### 특징

- 4비트에서도 원본과 유사한 품질
- 7B 모델 수 분 내 양자화 완료
- GPU 전용 (CUDA 커널 필요)
- 추론 시 역양자화(dequantization) 필요
- vLLM, TGI와 호환

---

## 3. AWQ: 활성화 기반 채널 보존 (GPU 전용)

### 원리

AWQ(Activation-aware Weight Quantization)의 핵심 통찰:

> **모든 가중치가 동등하지 않다.** 활성화(Activation) 크기가 큰 채널이 출력에 더 큰 영향을 준다.

보정 데이터를 통해 각 가중치 채널의 활성화 크기를 측정하고, 중요 채널은 높은 정밀도를 유지한다. 덜 중요한 채널은 공격적으로 양자화해도 전체 성능에 미치는 영향이 적다.

### GPTQ와의 차이

- GPTQ: 오차를 **후속 열에 분배**하여 보상
- AWQ: 중요 채널을 **사전에 식별**하여 보호

### 특징

- GPTQ보다 빠른 양자화 속도
- 동등한 품질
- GPU 전용
- vLLM, TGI와 호환

---

## 4. GGUF: 크로스플랫폼 호환 (CPU+GPU)

### 원리

GGUF(GPT-Generated Unified Format)는 llama.cpp 생태계의 표준 포맷이다. 특정 양자화 알고리즘이라기보다는 **다양한 양자화 방식을 담을 수 있는 컨테이너 포맷**에 가깝다.

핵심 강점은 **CPU+GPU 혼합 추론**:
- GPU VRAM이 부족하면 일부 레이어를 CPU RAM에 오프로드
- Mac, Windows, Linux 어디서든 구동
- Ollama, LM Studio 등 로컬 런타임과 즉시 호환

### 양자화 레벨

| 레벨 | 비트 | 품질 | 용도 |
|------|------|------|------|
| Q2_K | ~2.5bit | 낮음 | 극한 메모리 제약 |
| Q4_K_M | ~4.5bit | 좋음 | 일반 사용 권장 |
| Q5_K_M | ~5.5bit | 매우 좋음 | 품질 우선 |
| Q8_0 | 8bit | 거의 원본 | VRAM 여유 시 |

### 특징

- 크로스플랫폼 (CPU/GPU/Metal)
- Ollama 한 줄 설치로 즉시 사용
- GPU 전용 기법 대비 추론 속도 다소 느림
- 커뮤니티 생태계가 가장 활발

---

## 5. 비교 테이블

| 기법 | 타겟 | 보상 전략 | 양자화 속도 | 추론 속도 | 호환성 |
|------|------|----------|-----------|----------|--------|
| GPTQ | GPU | 열 단위 순차 보상 | 빠름 | 빠름 | vLLM, TGI |
| AWQ | GPU | 활성화 기반 채널 보존 | 매우 빠름 | 빠름 | vLLM, TGI |
| GGUF | CPU+GPU | 혼합 정밀도 | 보통 | 보통 | llama.cpp, Ollama |

---

## 6. 어떤 걸 써야 하는가: 의사결정 트리

```
GPU 서버에서 서빙? (vLLM/TGI)
├── Yes → AWQ (속도 우선) 또는 GPTQ (품질 우선)
└── No
    └── 로컬 PC에서 개인 사용?
        ├── NVIDIA GPU 있음 → GGUF (Q4_K_M) + GPU 오프로드
        └── CPU만 또는 Mac → GGUF (Q4_K_M)
```

실무에서의 경험칙:
- **프로덕션 서빙**: AWQ + vLLM. 양자화 속도와 추론 성능 모두 우수.
- **로컬 실험/개인 사용**: GGUF + Ollama. 설치 1분, 즉시 사용.
- **품질 최우선**: GPTQ. 보정 데이터를 도메인에 맞게 준비하면 품질 극대화.

---

## 7. Gemma 4에서의 양자화

Gemma 4는 양자화에 최적화된 설계를 갖추고 있다:

- **MoE (26B/4B active)**: 활성 파라미터가 4B뿐이므로 양자화 시 메모리 효율 극대화
- **Shared KV Cache**: KV 캐시 공유로 양자화 후에도 추론 메모리 절감
- **Apache 2 라이선스**: 자유롭게 양자화·배포 가능

Hugging Face에서 GPTQ, AWQ, GGUF 버전 모두 커뮤니티가 제공하고 있어, 용도에 맞게 선택하면 된다.

---

## 8. 양자화 + LoRA = 로컬 AI의 완성

[양자화]({{ site.baseurl }}/posts/quantization-gptq-awq-gguf/)와 [LoRA]({{ site.baseurl }}/posts/lora-deep-dive/)를 결합하면:

1. 4비트 양자화로 모델을 24GB GPU에 로드
2. LoRA로 도메인 데이터에 파인튜닝 (QLoRA)
3. 추론 시 합산하여 단일 모델로 서빙

이것이 "개인 GPU에서 도메인 특화 LLM을 구축하는" 현실적 경로다.

---

## 정리

양자화는 단순한 압축 기술이 아니다. **로컬 AI 시대의 민주화 도구**다.

- 70B 모델을 소비자 GPU에서 구동 가능하게 만들고
- 95% 이상의 성능을 유지하며
- 오픈소스 생태계와 결합하여 누구나 접근 가능한 AI를 실현한다

GPTQ, AWQ, GGUF는 각각의 트레이드오프가 있지만, 공통된 메시지는 하나다: **거대한 모델의 지능은 소수점 아래 자릿수에 있지 않다.**

---

**관련 개념:**
- [LoRA (Low-Rank Adaptation)]({{ site.baseurl }}/posts/lora-deep-dive/)
- [트랜스포머 (Transformer)]({{ site.baseurl }}/concepts/transformer/)

**참고 자료:**
- Frantar et al., "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers" (2022)
- Lin et al., "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration" (2023)
- llama.cpp GGUF 포맷 명세, GitHub
