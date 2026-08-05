# /workout/ — MMA Training Log

이 저장소는 **하나의 GitHub Pages 도메인에서 두 개의 독립된 사이트**를 서비스합니다.

| 주소 | 용도 | 테마 |
|------|------|------|
| `mengro1102.github.io/` | AI 엔지니어 개인 블로그 · 공부/이력 정리 | Aurora Purple |
| `mengro1102.github.io/workout/` | 개인기록 (훈련 로그) | Cage Red (MMA) |
| `mengro1102.github.io/workout/gym/` | 체육관 정보 (팀금천) | Cage Red (MMA) |

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
assets/workout/js/workout.js → 테마 토글 + 카테고리 필터 + 표 스크롤 + 4주 그래프
assets/workout/img/         → 체육관 로고 등 이미지
workout/index.html          → 개인기록 (로그 목록 + 통계 + 필터)
workout/gym/index.html      → 체육관 정보 (체육관 카드 + 활동 타임라인)
```

모든 CSS 클래스는 `wk-` 접두사를 씁니다. 블로그 클래스와 겹치지 않습니다.
테마 설정 저장 키도 다릅니다 (블로그 `sit-theme` / 운동 `workout-theme`).

### 훈련 로그와 체육관 정보의 분리

개인기록 페이지(`/workout/`)에는 이름·스탠스·체육관 같은 신상 정보를 넣지 않습니다.
순수하게 훈련 기록만 남기는 자리입니다.

체육관 정보는 **`/workout/gym/` 한 페이지에만** 모읍니다
(`_config.yml` 의 `workout.gym` + `_data/gym_history.yml`).

---

## 2. 훈련 일지 추가하기

### 제목 규칙

제목은 front matter 에 쓰지 않습니다. 사이트가 날짜에서 **`YYYY-MM-DD 운동 기록`**
형식으로 자동 생성합니다. `subtitle` 에 적은 한 줄이 그 아래 부제로 표시됩니다.

```
2026-07-30 운동 기록          ← 자동 생성 (고정 형식)
발기술은 넘기려고 쓰는 게 아니다   ← subtitle
```

`title` 키를 넣어도 하위 호환으로 부제 자리에 들어가지만, 새 일지는 `subtitle` 을 씁니다.

### 파일 생성 규칙

| 항목 | 규칙 |
|------|------|
| 위치 | `_workouts/` 폴더 |
| 파일명 | `YYYY-MM-DD-영문-슬러그.md` (예: `2026-08-03-bjj-halfguard.md`) |
| URL | `/workout/log/YYYY-MM-DD-영문-슬러그/` (파일명이 그대로 URL) |
| 레이아웃 | 지정 불필요 — `_config.yml` 기본값으로 `layout: workout-log` 자동 적용 |

### Front matter

```yaml
---
subtitle: "그날 배운 것 한 줄로"   # 필수. 제목 아래 부제로 표시된다
date: 2026-08-03                  # 필수. 정렬·통계 기준
category: ["그래플링"]            # 필수. 아래 표의 이름과 정확히 일치해야 함
duration: 90                      # 필수(통계용). 분 단위 정수
intensity: 3                      # 1~5. 게이지와 색상에 사용
rounds: 4                         # 선택. 스파링 라운드 수 (누적 통계에 합산)
location: "본관 매트"             # 선택
condition: "양호"                 # 선택. 그날 몸 상태 한 단어
weight: 74.2                      # 선택. kg
tags: [주짓수, 가드, 스파링]        # 선택. 세부 종목·기술 키워드
summary: "카드에 보일 2줄 요약"    # 목록 카드 요약 + 상세 페이지 meta description
focus:                            # 선택. 상단 '오늘의 포커스' 체크리스트
  - "오늘 의식적으로 신경 쓴 것 1"
  - "오늘 의식적으로 신경 쓴 것 2"
---
```

파일 하나만 추가하면 상단 스코어보드(누적 세션/매트 타임/스파링 라운드/이번 달),
카테고리 분포 바, 필터 칩 개수, 최근 4주 그래프가 **전부 자동으로 갱신됩니다.**

`duration` 을 적지 않으면 그 세션은 Mat Time 합계에 0분으로 잡히고 4주 그래프에서
가장 옅은 칸으로 표시됩니다. 시간 통계를 쓰려면 매번 넣어 주세요.

메모를 일지로 정리하는 LLM 프롬프트 명세는 `WORKOUT-PROMPT.md` 에 따로 있습니다.
로컬 자동화를 붙일 수 있도록 출력 형식을 기계가 파싱 가능한 계약으로 고정해 두었습니다.

### category — 타격 / 그래플링 축

세부 종목(주짓수·무에타이·레슬링…)이 아니라 **타격 / 그래플링** 축으로 나눕니다.
세부 종목명은 `tags` 나 본문에 적습니다.

| 값 | 해당하는 훈련 | 색상 |
|----|---------------|------|
| `타격` | 복싱, 무에타이, 킥복싱, 미트, 스탠딩 스파링 | `#E11D48` |
| `그래플링` | 주짓수, 레슬링, 클린치, 그라운드, 서브미션 | `#3B82F6` |
| `컨디셔닝` | 웨이트, 인터벌, 체력 훈련, 회복 세션 | `#EAB308` |

한 세션이 두 축에 걸치면 둘 다 적습니다: `category: ["타격", "그래플링"]`

축을 바꾸거나 늘리려면 `_config.yml` 의 `workout.categories` 를 수정하면
필터 칩과 분포 바에 자동 반영됩니다.

### 최근 4주 그래프

`/workout/` 의 Training Balance 는 2컬럼입니다. 왼쪽이 카테고리별 세션 기록,
오른쪽이 최근 4주 훈련 블록입니다.

왼쪽·오른쪽 패널은 세로 높이가 같게 맞춰져 있습니다.

블록은 **일~토 7칸 × 4주 = 28칸 정배열**입니다. 달력처럼 일요일이 주의 시작이고,
요일 머리글의 일요일은 붉은색, 토요일은 푸른색입니다. 주 경계(일요일)에 맞춰 그리므로
깃허브 잔디와 달리 빈 칸 없는 직사각형이 됩니다. 칸 색은 그날 훈련 시간으로 정합니다.

| 단계 | 기준 |
|------|------|
| 0 | 훈련 없음 |
| 1 | 60분 이하 (`duration` 미기재 포함) |
| 2 | 61~90분 |
| 3 | 91~120분 |
| 4 | 121분 이상 |

- 오늘 칸은 테두리로 표시됩니다.
- 이번 주의 아직 오지 않은 날은 빈 테두리 칸(`아직`)으로 둡니다.
- 칸에 마우스를 올리면 날짜·세션 수·훈련 시간이 뜹니다.
- 그날 기록이 하나면 눌러서 바로 그 일지로 갈 수 있습니다.

#### 언제 갱신되나

그래프는 **보는 사람의 브라우저 시각**을 기준으로 매번 새로 그립니다.
사이트를 다시 빌드하지 않아도, 페이지를 열 때마다 그 시점의 오늘로 맞춰집니다.

| 시점 | 달라지는 것 |
|------|-------------|
| 매일 | 오늘 표시가 다음 칸으로 이동하고, 어제까지가 과거 칸이 됩니다 |
| 매주 일요일 | 창 전체가 한 주 밀립니다 (가장 오래된 주가 빠지고 새 주가 들어옴) |

주 단위 정배열이라 **창이 통째로 밀리는 것은 일요일마다** 일어납니다.
날짜가 하루 지날 때마다 칸 하나씩 밀리게 하려면 주 정렬을 포기해야 하는데,
그러면 앞뒤에 빈 칸이 생겨 직사각형이 깨집니다.

Liquid 로 미리 그리지 않는 이유도 같습니다. 빌드 시점에 그리면 창이 **마지막 푸시
날짜**에 고정되어, 한동안 글을 안 올리면 "최근 4주"가 실제로는 몇 주 전 구간을
가리키게 됩니다.

기간을 바꾸려면 `workout/index.html` 의 `data-weeks="4"` 값만 고치면 됩니다
(`8` 로 하면 8주 × 7일 = 56칸).

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
- `subtitle` 은 날짜가 아니라 그날의 결론으로 (`가드 리텐션이 무너지는 순간을 찾다`).

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

`_data/gym_history.yml` 에 항목을 추가하면 `/workout/gym/` 타임라인에 반영됩니다.
항목이 하나도 없으면 빈 상태 안내가 대신 표시됩니다.
날짜 기준으로 자동 정렬되므로 파일 안의 순서는 상관없습니다.

```yaml
- date: 2026-02-15
  type: belt            # join(등록) | belt(승급) | competition(대회) | seminar(세미나) | milestone(기록)
  title: "주짓수 블루벨트 승급"
  detail: "한 줄 설명. 생략 가능."
```

`type` 별로 타임라인 마커 색이 달라집니다.

---

## 4. 글 쓰고 고치는 방법

VSCode 를 열고 저장소를 클론하는 것 말고도, 상황에 따라 더 가벼운 방법이 있습니다.
전부 같은 git 저장소를 건드리므로 섞어 써도 충돌하지 않습니다.

### 추천 순서

| 상황 | 방법 | 준비물 |
|------|------|--------|
| 문장 몇 줄 고치기 | **GitHub 웹 편집기** | 없음 |
| 새 일지 작성 / 여러 파일 | **github.dev** (브라우저 VSCode) | 없음 |
| 폰에서 급하게 | GitHub 모바일 앱 | 앱 설치 |
| 매일 쓰는 습관을 들이고 싶을 때 | Obsidian + Git 플러그인 | 앱 + 플러그인 |

### 1) GitHub 웹 편집기 — 한두 줄 고칠 때

고칠 파일을 GitHub 에서 연 다음 연필 아이콘(`Edit this file`)을 누르면 바로 수정됩니다.
`Commit changes` 를 누르면 끝. 푸시하면 1~2분 뒤 사이트에 반영됩니다.

가장 빠르지만 미리보기가 없어서 마크다운 표처럼 형식이 복잡한 부분에는 불편합니다.

### 2) github.dev — 사실상 브라우저에서 도는 VSCode (추천)

저장소 페이지에서 **키보드로 `.` (마침표) 한 번**만 누르면 됩니다.
주소창의 `github.com` 을 `github.dev` 로 바꿔도 같습니다.

```
https://github.dev/mengro1102/mengro1102.github.io
```

- 설치·클론 없이 브라우저에서 VSCode 가 그대로 열립니다
- 파일 트리, 검색, 마크다운 미리보기(`Ctrl/Cmd + Shift + V`) 다 됩니다
- 왼쪽 소스 제어 탭에서 커밋 + 푸시까지 한 번에
- 아이패드에서도 동작합니다

빌드나 터미널은 못 돌리지만, 마크다운 글쓰기에는 부족한 게 없습니다.
**일지 작성은 이 방법을 기본으로 쓰는 걸 권합니다.**

### 3) 브랜치를 쓰면 발행 전에 검토할 수 있습니다

바로 `main` 에 커밋하면 곧장 사이트에 올라갑니다.
개인적인 생각을 적은 글을 한 번 더 보고 올리고 싶다면, 웹 편집기에서 커밋할 때
`Create a new branch` 를 고르고 PR 을 열면 됩니다. 마음에 들 때 머지하면 그때 발행됩니다.

### 4) 초안을 숨겨 두기

front matter 에 `published: false` 를 넣으면 파일은 저장소에 있되 사이트에는 나오지 않습니다.

```yaml
---
title: "아직 정리 중인 일지"
date: 2026-08-03
published: false
---
```

다 쓰고 그 줄만 지우면 발행됩니다. 통계에도 잡히지 않습니다.

### 5) 로컬에서 미리 보고 싶을 때만 VSCode

레이아웃이나 CSS 를 건드릴 때는 로컬이 편합니다. 글만 쓸 때는 필요 없습니다.

```bash
bundle exec jekyll serve --livereload
```

### 참고 — CMS 는 권하지 않습니다

Decap CMS(구 Netlify CMS) 같은 걸 붙이면 관리자 화면에서 글을 쓸 수 있지만,
GitHub Pages 는 서버가 없어서 **OAuth 중계 서버를 따로 띄워야 합니다.**
글 몇 편 쓰자고 유지할 인프라가 늘어나므로, github.dev 로 충분합니다.

---

## 5. 나중에 별도 도메인으로 분리하기

운동 사이트를 자체 도메인(예: `mma.example.com`)으로 떼어낼 때의 절차입니다.
경계가 이미 분리되어 있으므로 파일을 옮기고 설정 몇 줄만 바꾸면 됩니다.

### 1) 새 저장소로 파일을 옮깁니다

경로에서 `workout/` 층만 걷어내면 됩니다.

| 현재 위치 | 새 저장소 위치 |
|-----------|----------------|
| `workout/index.html` | `index.html` |
| `workout/gym/index.html` | `gym/index.html` |
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
    permalink: /log/:name/        # 기존 /workout/log/:name/ 에서 workout 층 제거

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

## 6. 검색 노출 차단 (원할 경우)

현재는 검색엔진 색인을 허용하고 있습니다. 주소를 아는 사람만 들어오게 하려면
`_layouts/workout-base.html` 의 `<head>` 에 아래를 추가하고,

```html
<meta name="robots" content="noindex, nofollow">
```

`workout/index.html` front matter 와 `_config.yml` 의 workouts defaults 에
`sitemap: false` 를 넣으면 sitemap.xml 에서도 빠집니다.

---

## 7. 로컬 확인

```bash
bundle install
bundle exec jekyll serve
# 블로그      → http://localhost:4000/
# 개인기록    → http://localhost:4000/workout/
# 체육관 정보 → http://localhost:4000/workout/gym/
```
