/* =============================================================
   MMA Training Log — /workout/ 독립 사이트 스크립트
   블로그의 site.js 와 공유하는 것이 없다. 별도 도메인으로 옮길 때 그대로 이동.
   ============================================================= */

/* ===== 테마 토글 =====
   저장 키가 블로그(sit-theme)와 달라 두 사이트의 테마 설정이 섞이지 않는다. */
(function () {
  var STORAGE_KEY = 'workout-theme';
  var root = document.documentElement;
  var btn = document.querySelector('.wk-theme-toggle');
  if (!btn) return;

  function label(theme) {
    btn.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  }

  function effective() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  label(effective());

  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    root.setAttribute('data-theme', next);
    label(next);
  });
})();

/* ===== 종목 필터 ===== */
(function () {
  var chips = document.querySelectorAll('.wk-chip[data-filter]');
  var list = document.getElementById('wk-log-list');
  var empty = document.getElementById('wk-log-empty');
  if (!chips.length || !list) return;

  var cards = list.querySelectorAll('.wk-log');

  function apply(filter) {
    var shown = 0;
    cards.forEach(function (card) {
      var slugs = (card.getAttribute('data-categories') || '').split(/\s+/);
      var match = filter === 'all' || slugs.indexOf(filter) !== -1;
      card.hidden = !match;
      if (match) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      apply(chip.getAttribute('data-filter'));
    });
  });
})();

/* ===== 본문 표 가로 스크롤 =====
   kramdown 은 표를 감싸 주지 않아, 좁은 화면에서 넓은 표가 페이지를 밀어낸다. */
(function () {
  document.querySelectorAll('.wk-content table').forEach(function (table) {
    if (table.parentElement.classList.contains('wk-table-scroll')) return;
    var wrap = document.createElement('div');
    wrap.className = 'wk-table-scroll';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
})();

/* ===== 최근 4주 훈련 블록 (일~토 x 4주 = 28칸) =====
   빌드 시점이 아니라 '보는 시점'의 오늘을 기준으로 창을 잡기 위해 런타임에 그린다.
   주 경계(일요일)에 맞춰 그리므로 빈 칸 없는 7x4 직사각형이 된다. */
(function () {
  var root = document.getElementById('wk-activity');
  var grid = document.getElementById('wk-activity-grid');
  var dataEl = document.getElementById('wk-session-data');
  if (!root || !grid || !dataEl) return;

  var sessions;
  try {
    sessions = JSON.parse(dataEl.textContent) || [];
  } catch (e) {
    return;
  }

  var WEEKS = parseInt(root.getAttribute('data-weeks'), 10) || 4;
  var DAYS = WEEKS * 7;
  var WD = ['일', '월', '화', '수', '목', '금', '토'];

  // 날짜별로 합산 (하루에 두 세션을 한 경우 포함)
  var byDay = {};
  sessions.forEach(function (s) {
    var rec = byDay[s.date];
    if (!rec) {
      rec = byDay[s.date] = { count: 0, minutes: 0, url: s.url };
    }
    rec.count += 1;
    rec.minutes += (s.minutes || 0);
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(dt) {
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  }

  // 훈련 시간에 따라 4단계. 시간을 안 적은 날도 훈련은 했으므로 최소 1단계.
  function levelOf(rec) {
    if (!rec || rec.count === 0) return 0;
    if (rec.minutes <= 60) return 1;
    if (rec.minutes <= 90) return 2;
    if (rec.minutes <= 120) return 3;
    return 4;
  }

  function formatMinutes(total) {
    if (total <= 0) return '';
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (h === 0) return m + '분';
    return h + '시간' + (m > 0 ? ' ' + m + '분' : '');
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var todayKey = ymd(today);

  // 달력처럼 일요일이 주의 시작. 이번 주 일요일에서 (WEEKS-1)주 더 거슬러 올라간다
  var start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  var frag = document.createDocumentFragment();
  var trainedDays = 0;
  var totalMinutes = 0;

  for (var i = 0; i < DAYS; i++) {
    var dt = new Date(start);
    dt.setDate(start.getDate() + i);

    var key = ymd(dt);
    var isFuture = dt > today;
    var rec = isFuture ? null : byDay[key];

    if (rec) {
      trainedDays += 1;
      totalMinutes += rec.minutes;
    }

    var label = key + ' (' + WD[dt.getDay()] + ') · ';
    if (isFuture) {
      label += '아직';
    } else if (rec) {
      label += rec.count + '세션';
      var mins = formatMinutes(rec.minutes);
      if (mins) label += ' · ' + mins;
    } else {
      label += '훈련 없음';
    }

    // 그날 기록이 하나면 바로 그 일지로 넘어갈 수 있게 링크로 만든다
    var cell;
    if (rec && rec.count === 1 && rec.url) {
      cell = document.createElement('a');
      cell.href = rec.url;
      cell.setAttribute('aria-label', label);
    } else {
      cell = document.createElement('span');
    }

    var cls = 'wk-cell wk-cell--' + levelOf(rec);
    if (isFuture) cls += ' wk-cell--future';
    if (key === todayKey) cls += ' wk-cell--today';
    cell.className = cls;
    cell.title = label;
    frag.appendChild(cell);
  }

  grid.textContent = '';
  grid.appendChild(frag);

  var summary = document.getElementById('wk-activity-summary');
  if (summary) {
    var time = formatMinutes(totalMinutes);
    summary.textContent = WEEKS + '주간 ' + trainedDays + '일 훈련'
      + (time ? ' · 총 ' + time : '');
  }
})();

/* ===== 원클릭 복사 ([data-copy]) =====
   버튼은 CSS 에서 기본 숨김이고 여기서 켜 준다. JS 가 없으면 죽은 버튼이 남지 않는다. */
(function () {
  var buttons = document.querySelectorAll('[data-copy]');
  if (!buttons.length) return;

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  function flash(btn, cls) {
    btn.classList.remove('is-copied', 'is-failed');
    // 리플로우를 강제해 연속 클릭에도 애니메이션이 다시 걸리게 한다
    void btn.offsetWidth;
    btn.classList.add(cls);
    clearTimeout(btn._copyTimer);
    btn._copyTimer = setTimeout(function () { btn.classList.remove(cls); }, 1600);
  }

  buttons.forEach(function (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var text = btn.getAttribute('data-copy') || '';
      if (!text) return;

      // clipboard API 는 보안 컨텍스트(https/localhost)에서만 동작한다
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { flash(btn, 'is-copied'); },
          function () { flash(btn, legacyCopy(text) ? 'is-copied' : 'is-failed'); }
        );
      } else {
        flash(btn, legacyCopy(text) ? 'is-copied' : 'is-failed');
      }
    });
  });
})();

/* ===== 일지 본문 목차 =====
   본문 절은 규칙 5 에 따라 3개로 고정이지만, 헤딩을 읽어 만들기 때문에
   절 이름이 바뀌어도 따라간다. 절이 2개 미만이면 목차를 통째로 지운다. */
(function () {
  var toc = document.getElementById('wk-toc');
  var list = document.getElementById('wk-toc-list');
  var content = document.querySelector('.wk-content');
  if (!toc || !list || !content) return;

  var headings = content.querySelectorAll('h2');
  // 절이 하나뿐인 짧은 일지는 목차가 의미 없으므로 지운다.
  if (headings.length < 2) {
    toc.remove();
    return;
  }

  function slugify(text, i) {
    var base = text.trim().replace(/\s+/g, '-').replace(/[^\wㄱ-ㅎ가-힣-]/g, '');
    return base ? 'sec-' + base : 'sec-' + (i + 1);
  }

  var frag = document.createDocumentFragment();
  headings.forEach(function (h, i) {
    if (!h.id) h.id = slugify(h.textContent, i);

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    frag.appendChild(li);
  });

  list.appendChild(frag);
  toc.hidden = false;

  // 현재 보고 있는 절을 표시
  if (!('IntersectionObserver' in window)) return;
  var links = list.querySelectorAll('a');
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id);
      });
    });
  }, { rootMargin: '-72px 0px -65% 0px', threshold: 0 });
  headings.forEach(function (h) { seen.observe(h); });
})();
