# 블로그 포스트 작성 템플릿 (context-post-template)

이 문서는 `mengro1102.github.io` Jekyll 블로그에 새 포스트를 작성할 때 참고하는 일관된 양식입니다.
다른 LLM이나 작성자가 이 템플릿을 따르면 블로그 전체의 톤, 구조, 기술적 형식이 통일됩니다.

---

## 1. 파일 생성 규칙

| 항목 | 규칙 |
|------|------|
| 위치 | `_posts/` 폴더 |
| 파일명 | `YYYY-MM-DD-영문-제목.md` (소문자, 하이픈 구분) |
| 예시 | `2026-05-07-llm-wiki-second-brain.md` |

---

## 2. Front Matter (YAML 헤더)

```yaml
---
layout: post
title: "한글 제목: 부제목이 있으면 콜론으로 구분"
date: YYYY-MM-DD
categories: [대분류, 소분류]
tags: [태그1, 태그2, 태그3, ...]
description: "1~2문장으로 포스트 핵심 요약 (SEO용)"
---
```

### 필드 설명

| 필드 | 필수 | 설명 |
|------|------|------|
| `layout` | ✅ | 항상 `post` |
| `title` | ✅ | 한글 제목. 구체적이고 검색 가능한 키워드 포함 |
| `date` | ✅ | `YYYY-MM-DD` 형식 (시간 생략 가능) |
| `categories` | ✅ | 배열. 대분류 예: `study`, `project`, `review` |
| `tags` | ✅ | 배열. 기술 키워드 3~7개 |
| `description` | 권장 | SEO 메타 설명. 120자 이내 |
| `cover` | 선택 | 커버 이미지 경로 (예: `/assets/img/posts/cover.png`) |
| `author` | 선택 | 작성자명 |
| `read_time` | 선택 | 예상 읽기 시간 (분) |

### categories 예시
- `[study, LLM]` — 학습/연구 기록
- `[project, 자율주행]` — 프로젝트 기록
- `[review, 논문]` — 논문 리뷰
- `[devlog, 인프라]` — 개발 환경 구축

### tags 예시
- 모델: `Gemma4`, `LLaMA`, `GPT`
- 기술: `Transformer`, `양자화`, `강화학습`, `어텐션`
- 도구: `vLLM`, `PyTorch`, `Docker`, `CARLA`

---

## 3. 본문 구조

### 3.1. 도입부 (서론)

- Front Matter 바로 아래에 2~3문장으로 배경과 목적을 서술
- `---` 수평선으로 본문과 구분

```markdown
2026년 4월, Gemma 4가 Hugging Face에 등장했다. Google DeepMind가 개발한 오픈소스 멀티모달 SLM이다.

본 글은 Gemma 4의 아키텍처를 분석하고 로컬 배포 가능성을 탐구한다.

---
```

### 3.2. 본문 절 구조

- `## N. 절 제목` (h2) — 대주제
- `### N.M. 소절 제목` (h3) — 세부 주제
- 각 절은 **최소 3~5문장 이상**의 설명을 포함해야 함
- 빈약한 절(제목만 있고 내용 1줄)은 허용하지 않음

```markdown
## 1. 언어 모델의 기원과 본질

우리는 최신 AI와 대화를 나눌 때... (설명 3문장 이상)

### 1.1. Next Token Prediction

언어 모델의 본질은... (설명 3문장 이상)
```

### 3.3. 결론

- 마지막 절은 `## N. 결론: ...` 형태
- 핵심 인사이트 요약 + 향후 방향 제시
- 최소 2~3개 문단

---

## 4. 수식 작성 규칙

이 블로그는 **KaTeX**를 사용하며, 4가지 구분자를 지원합니다.

### 인라인 수식
```markdown
여기서 $L$은 손실(loss)이다.
또는 \(L\)은 손실이다.
```

### 블록(디스플레이) 수식
```markdown
$$L(N,D) \approx \frac{A}{N^\alpha} + \frac{B}{D^\beta}$$

또는

\[L(N,D) \approx \frac{A}{N^\alpha} + \frac{B}{D^\beta}\]
```

### 수식 작성 원칙
- 블록 수식 전후에 빈 줄을 넣어야 렌더링됨
- 수식 직후에 변수 설명을 반드시 포함
- 예: "여기서 $S$는 스케일 팩터, $Z$는 제로 포인트이다."

---

## 5. 코드 블록

````markdown
```python
# 언어 태그 필수
import torch
model = AutoModelForCausalLM.from_pretrained("google/gemma-4-9b")
```
````

- 언어 태그 명시: `python`, `bash`, `yaml`, `json` 등
- 의사코드(pseudocode)는 언어 태그 없이 사용 가능
- 짧은 인라인 코드: `` `model.generate()` ``

---

## 6. 표 (Table)

```markdown
| 기법 | 타겟 | 핵심 전략 | 호환성 |
|------|------|----------|--------|
| GPTQ | GPU | 열 단위 순차 보상 | vLLM, TGI |
| AWQ | GPU | 활성화 기반 채널 보존 | vLLM, TGI |
```

- 헤더 행 필수
- 각 셀은 간결하되 핵심 정보 포함

---

## 7. 내부 링크 (Cross-reference)

### 개념 포스트 링크
```markdown
[어텐션 (Attention)]({{ site.baseurl }}/concepts/attention/)
[양자화 (Quantization)]({{ site.baseurl }}/concepts/quantization/)
```

### 관련 포스트 링크 (글 하단)
```markdown
---

**관련 개념 포스트:**
- [토큰화 (Tokenization)]({{ site.baseurl }}/concepts/tokenization/)
- [임베딩 (Embedding)]({{ site.baseurl }}/concepts/embedding/)
```

---

## 8. 이미지

```markdown
![설명 텍스트](/assets/img/posts/파일명.png)
```

- 이미지는 `/assets/img/posts/` 또는 `/assets/img/rnd/`에 저장
- alt 텍스트 필수 (접근성)
- 큰 이미지는 가로 최대 800px 권장

---

## 9. 문체 및 톤

| 항목 | 규칙 |
|------|------|
| 문체 | 해요체 ❌, **이다/한다** 체 (학술적 서술) |
| 톤 | 객관적이되 개인 의견 허용 ("~라고 본다") |
| 강조 | `**볼드**`는 핵심 용어 첫 등장 시, 남용 금지 |
| 약어 | 첫 등장 시 풀네임 병기: "BPE(Byte Pair Encoding)" |
| 한영 혼용 | 기술 용어는 영문 유지, 설명은 한글 |

---

## 10. 목차 자동 생성 참고

이 블로그는 JavaScript로 h2/h3 헤딩을 자동 수집하여 목차를 생성합니다.
따라서:
- h2/h3에 번호를 붙이면 목차에서 계층이 명확해짐
- 헤딩 텍스트는 간결하게 (목차에 그대로 표시됨)
- h4 이하는 목차에 포함되지 않음

---

## 11. 전체 포스트 예시 골격

```markdown
---
layout: post
title: "제목: 부제목"
date: 2026-05-07
categories: [study, 머신러닝]
tags: [키워드1, 키워드2, 키워드3]
description: "이 글은 ~에 대해 분석한다."
---

도입 문장 2~3줄. 배경과 목적.

---

## 1. 첫 번째 대주제

설명 문단 (3문장 이상)

### 1.1. 소주제 A

상세 설명...

### 1.2. 소주제 B

상세 설명...

---

## 2. 두 번째 대주제

...

---

## N. 결론: 요약 키워드

핵심 인사이트 정리 (2~3문단)

---

**관련 개념 포스트:**
- [링크1](URL)
- [링크2](URL)
```

---

## 12. 체크리스트 (작성 완료 전 확인)

- [ ] Front matter의 모든 필수 필드 작성됨
- [ ] 각 절(h2)에 최소 3문장 이상의 설명 포함
- [ ] 수식은 `$$...$$` 또는 `\[...\]`로 감싸고, 변수 설명 포함
- [ ] 코드 블록에 언어 태그 명시
- [ ] 내부 링크는 `{{ site.baseurl }}` 사용
- [ ] 결론 절에 핵심 요약 + 향후 방향 포함
- [ ] 관련 포스트 링크 하단에 추가
