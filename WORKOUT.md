# /workout/ — MMA Training Log

이 저장소는 **하나의 GitHub Pages 도메인에서 두 개의 독립된 사이트**를 서비스합니다.

| 주소 | 용도 | 테마 |
|------|------|------|
| `mengro1102.github.io/` | AI 엔지니어 개인 블로그 · 공부/이력 정리 | Aurora Purple |
| `mengro1102.github.io/workout/` | 개인 운동 기록 · 체육관 활동 히스토리 | Cage Red (MMA) |

두 사이트는 **레이아웃, CSS, JS, 설정, 헤더/푸터를 하나도 공유하지 않습니다.**
블로그 어디에도 `/workout/` 으로 가는 링크가 없으므로, 주소를 직접 아는 사람만 들어올 수 있습니다.
(검색엔진 색인은 막지 않았습니다. 막으려면 아래 "검색 노출 차단" 참고.)

---

## 1. 파일 경계

`/workout/` 사이트에 속하는 파일은 전부 아래 목록에 들어갑니다.
**이 목록 밖의 파일은 블로그 것이므로 건드리지 않습니다.**

```
_config.yml                 → workout: 블록 + workouts 컬렉션 정의 (이 부분만)
_data/gym_history.yml       → 체육관 활동 타임라인 데이터
_workouts/                  → 훈련 일지 (마크다운)
_layouts/workout-base.html  → 최상위 셸 (head/헤더/푸터/스크립트)
_layouts/workout-log.html   → 일지 상세 페이지
_includes/workout/          → header, footer, log-card, badge, intensity
assets/workout/css/main.scss → 자립형 스타일시트 (리셋부터 전부 포함)
assets/workout/js/workout.js → 테마 토글 + 종목 필터 + 표 스크롤
assets/workout/img/         → 체육관 로고 등 이미지
workout/index.html          → 목록 + 통계 + 체육관 히스토리
```

모든 CSS 클래스는 `wk-` 접두사를 씁니다. 블로그 클래스와 겹치지 않습니다.
테마 설정 저장 키도 다릅니다 (블로그 `sit-theme` / 운동 `workout-theme`).

### 훈련 로그와 체육관 정보의 분리

훈련 로그 화면(헤더 / 히어로 / 세션 목록 / 푸터)에는 이름·스탠스·체육관 같은
신상 정보를 넣지 않습니다. 순수하게 훈련 기록만 남기는 자리입니다.

체육관 정보는 **`Gym History` 섹션 한 곳에만** 모읍니다
(`_config.yml` 의 `workout.gym` + `_data/gym_history.yml`).

---

## 2. 훈련 일지 추가하기

### 파일 생성 규칙

| 항목 | 규칙 |
|------|------|
| 위치 | `_workouts/` 폴더 |
| 파일명 | `YYYY-MM-DD-영문-슬러그.md` (예: `2026-08-03-bjj-halfguard.md`) |
| URL | `/workout/YYYY-MM-DD-영문-슬러그/` (파일명이 그대로 URL) |
| 레이아웃 | 지정 불필요 — `_config.yml` 기본값으로 `layout: workout-log` 자동 적용 |

### Front matter

```yaml
---
title: "그날 배운 것 한 줄로"      # 필수. 날짜가 아니라 '깨달은 것'을 제목으로
date: 2026-08-03                  # 필수. 정렬·통계 기준
discipline: ["주짓수", "MMA"]     # 필수. 아래 표의 이름과 정확히 일치해야 함
duration: 90                      # 필수(통계용). 분 단위 정수
intensity: 3                      # 1~5. 게이지와 색상에 사용
rounds: 4                         # 선택. 스파링 라운드 수 (누적 통계에 합산)
location: "본관 매트"             # 선택
condition: "양호"                 # 선택. 그날 몸 상태 한 단어
weight: 74.2                      # 선택. kg
tags: [BJJ, 가드, 스파링]          # 선택. 하단 태그 칩
summary: "카드에 보일 2줄 요약"    # 목록 카드 요약 + 상세 페이지 meta description
focus:                            # 선택. 상단 '오늘의 포커스' 체크리스트
  - "오늘 의식적으로 신경 쓴 것 1"
  - "오늘 의식적으로 신경 쓴 것 2"
---
```

파일 하나만 추가하면 상단 스코어보드(누적 세션/매트 타임/스파링 라운드/이번 달),
종목 분포 바, 필터 칩 개수가 **전부 자동으로 갱신됩니다.**

### discipline 에 쓸 수 있는 값

`_config.yml` 의 `workout.disciplines` 에 정의된 이름만 배지 색상과 필터가 붙습니다.

| 이름 | 슬러그 | 색상 |
|------|--------|------|
| MMA | `mma` | `#E11D48` |
| 주짓수 | `bjj` | `#3B82F6` |
| 무에타이 | `muaythai` | `#F97316` |
| 레슬링 | `wrestling` | `#10B981` |
| 복싱 | `boxing` | `#A855F7` |
| 컨디셔닝 | `strength` | `#EAB308` |

종목을 새로 추가하려면 `workout.disciplines` 에 `{ name, slug, color }` 한 줄을 추가하면
필터 칩과 분포 바에 자동 반영됩니다.

### intensity 등급

| 값 | 라벨 | 색상 변수 |
|----|------|-----------|
| 1 | 회복 | `--lvl-1` |
| 2 | 가벼움 | `--lvl-2` |
| 3 | 보통 | `--lvl-3` |
| 4 | 높음 | `--lvl-4` |
| 5 | 한계 | `--lvl-5` |

### 본문 구조 (권장)

기술 블로그 포스트와 달리, 운동일지는 **짧고 솔직하게**. 4개 섹션이면 충분합니다.

```markdown
## 드릴
그날 반복한 동작을 목록으로. 세트/횟수까지 적어 두면 나중에 비교가 됩니다.

## 스파링 N라운드
표로 정리하면 스코어카드처럼 렌더링됩니다. (좁은 화면에서는 가로 스크롤)

| 라운드 | 상대 | 결과 | 메모 |
|---|---|---|---|
| 1 | 블루벨트 A | 패스 허용 2회 | 니 슬라이스에 계속 당함 |

## 오늘의 결론
왜 그렇게 됐는지 한 문단. 인용문(`>`)은 그날의 핵심 한 줄에만 씁니다.

## 다음 세션까지
다음 훈련 전까지 고칠 것. 구체적인 동작 단위로.
```

### 작성 톤

- 잘한 것보다 **깨진 지점**을 남깁니다. 나중에 다시 읽을 때 쓸모 있는 건 그쪽입니다.
- "열심히 했다" 같은 감상 대신, 어떤 동작의 어떤 각도가 문제였는지 적습니다.
- 제목은 날짜가 아니라 그날의 결론으로 (`가드 리텐션이 무너지는 순간을 찾다`).

---

## 3. 체육관 정보 · 활동 히스토리

체육관 관련 내용은 전부 여기서만 관리합니다. 훈련 로그 쪽에는 노출되지 않습니다.

### 체육관 정보 (`_config.yml`)

```yaml
workout:
  gym:
    name: "Team Geumcheon"    # 영문 정식 명칭
    short: "TGC"              # 약칭
    name_ko: "팀 금천 MMA"     # 한글 명칭
    logo: ""                  # 로고 경로. 비우면 TGC 옥타곤 마크가 대신 표시됨
    since: 2024-03-01         # 등록 시점
```

### 로고 넣기

1. 로고 파일을 `assets/workout/img/` 에 저장합니다 (정사각형 PNG, 512×512 이상 권장).
2. `workout.gym.logo` 에 경로를 적습니다.

```yaml
    logo: "/assets/workout/img/tgc-logo.png"
```

값이 비어 있으면 `TGC` 글자가 들어간 옥타곤 SVG 마크가 폴백으로 렌더링되므로,
로고 파일이 없어도 화면이 깨지지 않습니다.

### 활동 내역 (`_data/gym_history.yml`)

`_data/gym_history.yml` 에 항목을 추가하면 `/workout/#gym-history` 타임라인에 반영됩니다.
날짜 기준으로 자동 정렬되므로 파일 안의 순서는 상관없습니다.

```yaml
- date: 2026-02-15
  type: belt            # join(등록) | belt(승급) | competition(대회) | seminar(세미나) | milestone(기록)
  title: "주짓수 블루벨트 승급"
  detail: "한 줄 설명. 생략 가능."
```

`type` 별로 타임라인 마커 색이 달라집니다.

---

## 4. 나중에 별도 도메인으로 분리하기

운동 사이트를 자체 도메인(예: `mma.example.com`)으로 떼어낼 때의 절차입니다.
경계가 이미 분리되어 있으므로 파일을 옮기고 설정 몇 줄만 바꾸면 됩니다.

### 1) 새 저장소로 파일을 옮깁니다

경로에서 `workout/` 층만 걷어내면 됩니다.

| 현재 위치 | 새 저장소 위치 |
|-----------|----------------|
| `workout/index.html` | `index.html` |
| `_layouts/workout-base.html` | `_layouts/default.html` |
| `_layouts/workout-log.html` | `_layouts/workout-log.html` (그대로) |
| `_includes/workout/*` | `_includes/*` |
| `assets/workout/css/main.scss` | `assets/css/main.scss` |
| `assets/workout/js/workout.js` | `assets/js/workout.js` |
| `_workouts/`, `_data/gym_history.yml` | 그대로 |

### 2) 새 저장소의 `_config.yml` 을 만듭니다

현재 `_config.yml` 의 `workout:` 블록 내용을 최상위로 올리고, 컬렉션 permalink 에서
`/workout` 층을 뺍니다.

```yaml
title: "MMA Training Log"
url: "https://mma.example.com"
baseurl: ""                       # 도메인 루트로 서비스하므로 비움
lang: ko-KR
timezone: Asia/Seoul

collections:
  workouts:
    output: true
    permalink: /log/:name/        # 기존 /workout/:name/ 에서 workout 층 제거

defaults:
  - scope: { path: "", type: "workouts" }
    values:
      layout: workout-log
      collection_label: "훈련일지"
      collection_url: "/"

workout:
  # 기존 workout: 블록을 그대로 유지 (url/baseurl/nav 만 새 도메인 기준으로 수정)
```

### 3) 참조 경로를 새 위치에 맞춰 고칩니다

- `_layouts/default.html`(구 `workout-base.html`)
  - `assets/workout/css/main.css` → `assets/css/main.css`
  - `assets/workout/js/workout.js` → `assets/js/workout.js`
  - `include workout/header.html` → `include header.html` (footer 도 동일)
- `_includes/log-card.html`, `_layouts/workout-log.html`
  - `include workout/badge.html` → `include badge.html` (intensity 도 동일)
- `workout.nav` 의 URL 을 새 구조에 맞게 수정

모든 링크가 `relative_url` 을 거치므로, 이것만 바꾸면 나머지 경로는 `baseurl` 설정을 따라갑니다.

### 4) 원래 저장소에서 위 파일들을 삭제합니다

`_config.yml` 의 `workout:` 블록, `workouts` 컬렉션 정의, `workouts` 타입 defaults 도 함께 지웁니다.
**블로그 쪽 파일은 하나도 건드릴 필요가 없습니다.**

### 5) (선택) 기존 주소에서 리다이렉트

`workout/index.html` 자리에 새 도메인을 가리키는 메타 리프레시 페이지만 남겨 둡니다.

---

## 5. 검색 노출 차단 (원할 경우)

현재는 검색엔진 색인을 허용하고 있습니다. 주소를 아는 사람만 들어오게 하려면
`_layouts/workout-base.html` 의 `<head>` 에 아래를 추가하고,

```html
<meta name="robots" content="noindex, nofollow">
```

`workout/index.html` front matter 와 `_config.yml` 의 workouts defaults 에
`sitemap: false` 를 넣으면 sitemap.xml 에서도 빠집니다.

---

## 6. 로컬 확인

```bash
bundle install
bundle exec jekyll serve
# 블로그   → http://localhost:4000/
# 운동일지 → http://localhost:4000/workout/
```
