---
layout: page
title: "양자화 (Quantization)"
description: "모델 가중치의 숫자 정밀도를 낮춰 메모리 사용량을 줄이는 기술. GPTQ, AWQ, GGUF 비교."
tags: [개념, LLM, 최적화]
---

# 양자화 (Quantization)

모델 가중치의 숫자 정밀도를 낮춰(FP16→INT4) 메모리 사용량을 줄이는 기술. 로컬 AI 시대의 핵심.

## Kernel

70B 모델은 FP16 기준 140GB VRAM 필요. 양자화로 4비트 압축 시 ~35GB. 원본 성능의 95% 이상 유지.

$$W_q = \text{round}\left(\frac{W}{S}\right) + Z$$

## 3대 기법

| 기법 | 타겟 | 핵심 전략 | 호환성 |
|------|------|----------|--------|
| GPTQ | GPU | 열 단위 순차 보상 | vLLM, TGI |
| AWQ | GPU | 활성화 기반 채널 보존 | vLLM, TGI |
| GGUF | CPU+GPU | 혼합 정밀도 | llama.cpp, Ollama |

### GPTQ

가중치 행렬을 열 단위로 순차 양자화. 앞선 열의 오차를 뒤 열에서 보상. ~128개 보정 샘플로 7B 모델 수 분 내 양자화.

### AWQ

활성화 값 기반으로 중요 가중치 채널 식별. 중요 채널은 높은 정밀도 유지. GPTQ보다 빠른 양자화 속도.

### GGUF

llama.cpp 생태계 표준. CPU+GPU 혼합 추론. Mac, Windows, Linux 어디서든 구동.

## 왜 95% 성능이 유지되는가?

거대한 네트워크의 전체적인 논리 구조는 미세한 소수점 값이 무뎌져도 쉽게 붕괴되지 않기 때문.

---

**관련:** [트랜스포머]({{ site.baseurl }}/concepts/transformer/)

**← [Gemma 4를 이해하는 과정]({{ site.baseurl }}/posts/gemma4-understanding/)으로 돌아가기**
