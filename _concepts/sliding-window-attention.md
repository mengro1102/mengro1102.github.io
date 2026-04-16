---
layout: page
title: "Sliding Window Attention (SWA)"
description: "고정 크기 윈도우 내에서만 어텐션을 수행하여 효율성을 높이는 기법. RAttention 해설 포함."
tags: [개념, Transformer, 효율성]
---

# Sliding Window Attention (SWA)

고정 크기 윈도우 내에서만 [어텐션]({{ site.baseurl }}/concepts/attention/)을 수행하여 메모리/연산 비용을 줄이는 기법.

## Kernel

Full Attention의 O(N²) → SWA의 O(N×W). 디코딩 시 일정한 메모리 소비. 단, 윈도우 밖 토큰 정보를 완전히 무시하는 것이 근본 한계.

## Local-Global Hybrid Attention

```
Layer 1: SWA (윈도우 512)    ← 로컬 문맥
Layer 2: Full Attention       ← 글로벌 문맥
Layer 3: SWA (윈도우 512)    ← 로컬 문맥
...
```

### 핵심 키워드

- **윈도우 크기 (W)**: Gemma 4는 512/1024
- **KV Cache 절감**: SWA는 W개만 저장
- **Pareto 트레이드오프**: 윈도우 ↑ → 성능 ↑ but 효율 ↓

## RAttention: SWA의 한계 극복

Apple의 RAttention 논문은 SWA에 Residual Linear Attention(RLA)을 통합:

- RLA: 윈도우 밖 토큰 정보를 선형 어텐션의 recurrent 상태로 캡처
- 결과: 윈도우 512로도 Full Attention 성능 매칭 (3B, 12B 스케일)
- 추가 이점: 장문맥 일반화 성능 향상

## Gemma 4에서의 적용

- 소형 dense: 윈도우 512 / 대형: 윈도우 1024
- Dual RoPE: sliding 레이어는 표준, global 레이어는 proportional
- Shared KV Cache: 마지막 N개 레이어가 이전 레이어의 KV 재사용

---

**관련:** [어텐션]({{ site.baseurl }}/concepts/attention/) · [트랜스포머]({{ site.baseurl }}/concepts/transformer/)

{% assign referencing_posts = site.posts | where_exp: "post", "post.content contains '/concepts/sliding-window-attention/'" %}
{% if referencing_posts.size > 0 %}
**이 개념을 참조하는 글:**
{% for post in referencing_posts %}
- [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}
{% endif %}
