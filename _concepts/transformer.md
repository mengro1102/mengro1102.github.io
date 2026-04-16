---
layout: page
title: "트랜스포머 (Transformer)"
description: "2017년 구글이 발표한 현대 LLM의 표준 아키텍처."
tags: [개념, AI, 아키텍처]
---

# 트랜스포머 (Transformer)

2017년 구글 "Attention Is All You Need" 기반. 현대 LLM의 표준 아키텍처.

## Kernel

RNN/LSTM의 순차 처리 한계를 셀프 어텐션의 병렬 행렬 연산으로 극복. 모든 단어가 모든 단어를 동시에 바라본다.

## 아키텍처 (Decoder-only)

```
입력 토큰 → [토큰화] → [임베딩] → [위치 인코딩]
    ↓
┌─────────────────────────┐ × N 레이어
│  Self-Attention          │
│  Feed-Forward Network    │
│  Layer Norm + Residual   │
└─────────────────────────┘
    ↓
출력 확률 분포 → [다음 토큰 선택]
```

### 핵심 키워드

- **[셀프 어텐션]({{ site.baseurl }}/concepts/attention/)**: 모든 토큰이 서로를 참조
- **FFN**: 어텐션 출력을 비선형 변환
- **Residual Connection**: 그래디언트 소실 방지
- **RoPE**: 상대적 위치를 회전 행렬로 인코딩. Gemma 4는 Dual RoPE 사용.

## 진화 방향

| 세대 | 특징 | 예시 |
|------|------|------|
| 원본 (2017) | Encoder-Decoder | BERT, T5 |
| GPT 계열 | Decoder-only | GPT-4, Claude |
| 효율화 | SWA, MoE, [양자화]({{ site.baseurl }}/concepts/quantization/) | Gemma 4, Mistral |
| 멀티모달 | Vision/Audio Encoder | Gemma 4, GPT-4o |

---

**관련:** [어텐션]({{ site.baseurl }}/concepts/attention/) · [토큰화]({{ site.baseurl }}/concepts/tokenization/) · [임베딩]({{ site.baseurl }}/concepts/embedding/) · [양자화]({{ site.baseurl }}/concepts/quantization/) · [SWA]({{ site.baseurl }}/concepts/sliding-window-attention/)

**← [Gemma 4를 이해하는 과정]({{ site.baseurl }}/posts/gemma4-understanding/)으로 돌아가기**
