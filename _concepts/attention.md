---
layout: post
title: "어텐션 (Attention)"
description: "문장 내 특정 단어를 이해할 때 어떤 단어에 얼마나 집중할지를 수학적으로 계산하는 메커니즘."
tags: [개념, AI, Transformer]
---

# 어텐션 (Attention)

트랜스포머의 심장. 문장 내 특정 단어를 이해할 때 어떤 단어에 얼마나 집중할지를 수학적으로 계산한다.

## Scaled Dot-Product Attention

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

### 핵심 키워드

| 요소 | 역할 | 비유 |
|------|------|------|
| Query (Q) | 기준 단어 벡터 | 검색어 |
| Key (K) | 다른 단어들의 특징 | 문서 키워드 |
| Value (V) | 다른 단어들의 실제 의미 | 문서 내용 |
| QK^T | 유사도 계산 | 검색 매칭 |
| √d_k | 스케일링 | 학습 안정성 |
| softmax | 확률 변환 | 가중치 분배 |
| KV Cache | 이전 토큰의 K,V 저장 | 생성 속도 향상 |

### 연산 복잡도

Full Attention: **O(N²)** — 토큰 2배 → 연산 4배. Context Window 한계와 OOM의 근본 원인.

## 변형

| 변형 | 특징 | 사용 모델 |
|------|------|----------|
| Self-Attention | 문장 내 모든 단어가 서로 참조 | 모든 Transformer |
| Multi-Head | 여러 "관점"에서 동시 수행 | 모든 Transformer |
| [SWA]({{ site.baseurl }}/concepts/sliding-window-attention/) | 고정 윈도우 내에서만 → O(N×W) | Gemma, Mistral |
| Cross-Attention | 서로 다른 모달리티 간 | 멀티모달 모델 |
| Linear Attention | 커널 트릭으로 O(N) | RAttention의 RLA |

## Gemma 4에서의 적용

- Local-Global Attention: [SWA]({{ site.baseurl }}/concepts/sliding-window-attention/)(512/1024) + Full Context 교대
- Dual RoPE: sliding 레이어는 표준 RoPE, global 레이어는 proportional RoPE
- Shared KV Cache: 마지막 N개 레이어가 이전 레이어의 KV 재사용

---

**관련:** [트랜스포머]({{ site.baseurl }}/concepts/transformer/) · [SWA]({{ site.baseurl }}/concepts/sliding-window-attention/) · [임베딩]({{ site.baseurl }}/concepts/embedding/)

{% assign referencing_posts = site.posts | where_exp: "post", "post.content contains '/concepts/attention/'" %}
{% if referencing_posts.size > 0 %}
**이 개념을 참조하는 글:**
{% for post in referencing_posts %}
- [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}
{% endif %}
