---
layout: page
title: "토큰화 (Tokenization)"
description: "텍스트를 의미를 가진 최소 단위(토큰)로 분할하는 전처리 과정. BPE 알고리즘 상세 해설."
tags: [개념, NLP, LLM, BPE]
---

# 토큰화 (Tokenization)

텍스트를 의미를 가진 최소 단위(토큰)로 분할하는 전처리 과정. LLM 입력 파이프라인의 첫 단계.

## Kernel

컴퓨터는 0과 1만 이해한다. "오늘 날씨가 참 좋다"를 곧장 처리할 수 없으므로, 텍스트를 숫자로 변환하는 전처리가 필수. 토큰화는 이 변환의 첫 관문.

## BPE (Byte Pair Encoding)

현대 LLM의 표준 토큰화 알고리즘. 원래 텍스트 압축 알고리즘에서 유래.

### 동작 원리

1. 초기 분할: 각 단어를 개별 문자로 분할 → 초기 어휘 = 고유 문자 집합
2. 반복 병합: 가장 빈도 높은 인접 문자 쌍을 찾아 하나의 토큰으로 병합
3. 어휘 확장: 병합 규칙을 반복 적용하여 서브워드 어휘를 점진적으로 확장
4. 종료: 목표 어휘 크기에 도달하면 중단

### 예시

```
"hugs" → BPE 학습 후 → ["hug", "s"]
"unhappiness" → ["un", "happ", "iness"]
```

### 핵심 키워드

- **서브워드 (Subword)**: 단어보다 작고 문자보다 큰 중간 단위.
- **어휘 (Vocabulary)**: 모델이 인식하는 토큰의 전체 집합. GPT-4는 ~100K 토큰.
- **OOV (Out-of-Vocabulary)**: 어휘에 없는 미등록 단어. BPE는 서브워드 조합으로 해결.

## Gemma 4에서의 적용

Gemma 4는 BPE 기반 토크나이저를 사용. 멀티모달 입력(이미지, 오디오)은 별도 인코더가 토큰화한 뒤 텍스트 토큰과 합류.

---

**관련:** [임베딩]({{ site.baseurl }}/concepts/embedding/) · [트랜스포머]({{ site.baseurl }}/concepts/transformer/)

**← [Gemma 4를 이해하는 과정]({{ site.baseurl }}/posts/gemma4-understanding/)으로 돌아가기**
