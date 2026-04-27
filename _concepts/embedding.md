---
layout: post
title: "임베딩 (Embedding)"
description: "단어의 의미를 고차원 벡터 공간의 좌표로 변환하는 기술."
tags: [개념, NLP, LLM]
---

# 임베딩 (Embedding)

단어의 의미를 고차원 벡터 공간의 좌표로 변환하는 기술. 언어 모델이 세상을 인식하는 기저 감각 기관.

## Kernel

토큰에 부여된 ID는 그 자체로 의미가 없다. 임베딩은 이 ID를 수천 차원의 벡터 공간 상의 좌표로 변환하여, 의미가 비슷한 단어는 가까이, 다른 단어는 멀리 배치한다.

## 벡터 공간 표현

```
[King] - [Man] + [Woman] ≈ [Queen]
```

임베딩 공간에서 "성별" 방향과 "왕족" 방향이 독립적인 축으로 인코딩되어 있기 때문.

### 핵심 키워드

- **벡터 공간 (Vector Space)**: 단어가 배치되는 고차원 좌표계.
- **코사인 유사도 (Cosine Similarity)**: 두 벡터 간 각도로 의미적 거리 측정.
- **임베딩 테이블**: 토큰 ID → 벡터 매핑 룩업 테이블. 학습 가능한 파라미터.
- **PLE (Per-Layer Embeddings)**: Gemma 4의 혁신. 레이어별 토큰 특화 신호 주입.

## Gemma 4에서의 적용

표준 임베딩 + PLE. 레이어별로 토큰 특화 잔차 신호를 주입하여, 단일 임베딩에 모든 정보를 압축하는 한계를 극복.

---

**관련:** [토큰화]({{ site.baseurl }}/concepts/tokenization/) · [어텐션]({{ site.baseurl }}/concepts/attention/) · [트랜스포머]({{ site.baseurl }}/concepts/transformer/)

{% assign referencing_posts = site.posts | where_exp: "post", "post.content contains '/concepts/embedding/'" %}
{% if referencing_posts.size > 0 %}
**이 개념을 참조하는 글:**
{% for post in referencing_posts %}
- [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}
{% endif %}
