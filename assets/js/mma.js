/* MMA skin — 운동일지 종목 필터 */
(function () {
  var chips = document.querySelectorAll('.mma-chip[data-filter]');
  var list = document.getElementById('mma-log-list');
  var empty = document.getElementById('mma-log-empty');
  if (!chips.length || !list) return;

  var cards = list.querySelectorAll('.mma-log');

  function apply(filter) {
    var shown = 0;
    cards.forEach(function (card) {
      var slugs = (card.getAttribute('data-disciplines') || '').split(/\s+/);
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
