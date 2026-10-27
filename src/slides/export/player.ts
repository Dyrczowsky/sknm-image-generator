// Odtwarzacz samodzielnego pliku HTML z prezentacją. To zwykły tekst (ES5),
// bo trafia do pliku działającego offline w dowolnej przeglądarce - bez
// bundlera, bez Reacta. Dane (slajdy, klatki przejść) czyta z <script
// type="application/json" id="deck-data">, który składa html.ts.
//
// Semantyka nawigacji jak w present.ts: kroki „pokazuj po kolei" najpierw,
// cofnięcie z kroku 0 wraca na poprzedni slajd w pełni odsłonięty.

export const PLAYER_CSS = `
html, body { margin: 0; height: 100%; overflow: hidden; }
body {
  background: #fff;
  transition: background .4s;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.stage {
  position: absolute; left: 50%; top: 50%;
  transform-origin: 50% 50%;
  overflow: hidden;
  display: none;
}
.stage.on { display: block; }
.slide { position: absolute; left: 0; top: 0; visibility: hidden; }
.slide.on { visibility: visible; }
.progress {
  position: fixed; left: 0; top: 0; height: 5px; width: 0;
  background: currentColor;
  transition: width .4s ease, color .4s;
  z-index: 10;
}
@media (prefers-reduced-motion: reduce) {
  body, .progress { transition: none; }
}
@media print {
  .progress { display: none; }
}
`

export const PLAYER_SCRIPT = `
(function () {
  'use strict';
  var data = JSON.parse(document.getElementById('deck-data').textContent);
  var meta = data.slides;
  var n = meta.length;
  var stages = {
    wide: document.getElementById('stage-wide'),
    square: document.getElementById('stage-square')
  };
  var progress = document.getElementById('progress');
  var reducedQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var pos = { slide: 0, step: 0 };
  var aspect = null;
  // Po ręcznym przełączeniu (A) format nie zmienia się już przy zmianie okna.
  var manual = false;
  var running = null;
  // Granica wyboru formatu: średnia geometryczna proporcji 1:1 i 16:9.
  var SQUARE_BELOW = Math.sqrt(16 / 9);

  function slidesOf(name) {
    var list = [];
    var children = stages[name].children;
    for (var i = 0; i < children.length; i++) list.push(children[i]);
    return list;
  }
  var slideEls = { wide: slidesOf('wide'), square: slidesOf('square') };

  function reduced() { return !!(reducedQuery && reducedQuery.matches); }

  function clampPos(p) {
    if (n === 0) return { slide: 0, step: 0 };
    var s = Math.max(0, Math.min(n - 1, p.slide));
    return { slide: s, step: Math.max(0, Math.min(meta[s].steps, p.step)) };
  }
  function next(p) {
    if (p.step < meta[p.slide].steps) return { slide: p.slide, step: p.step + 1 };
    if (p.slide < n - 1) return { slide: p.slide + 1, step: 0 };
    return p;
  }
  function prev(p) {
    if (p.step > 0) return { slide: p.slide, step: p.step - 1 };
    if (p.slide > 0) return { slide: p.slide - 1, step: meta[p.slide - 1].steps };
    return p;
  }

  // Elementy [data-step] o numerze <= krok są widoczne. Bez animacji (zmiana
  // slajdu, ruch ograniczony) przejście CSS wyłączamy na moment.
  function applySteps(el, i, step, instant) {
    if (!meta[i].steps) return;
    var items = el.querySelectorAll('[data-step]');
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      if (item._transition === undefined) item._transition = item.style.transition;
      var visible = parseInt(item.getAttribute('data-step'), 10) <= step;
      if (instant) item.style.transition = 'none';
      item.style.opacity = visible ? '1' : '0';
      item.style.transform = visible ? 'none' : 'translateY(24px)';
    }
    if (!instant) return;
    void el.offsetWidth;
    for (var j = 0; j < items.length; j++) items[j].style.transition = items[j]._transition;
  }

  function settle() {
    if (!running) return;
    var r = running;
    running = null;
    for (var i = 0; i < r.anims.length; i++) {
      try { r.anims[i].cancel(); } catch (e) {}
    }
    r.done();
  }

  // Bez animacji: tylko bieżący slajd widoczny, kroki ustawione.
  function sync(name) {
    var els = slideEls[name];
    for (var i = 0; i < els.length; i++) {
      els[i].style.zIndex = '';
      if (i === pos.slide) {
        els[i].classList.add('on');
        applySteps(els[i], i, pos.step, true);
      } else {
        els[i].classList.remove('on');
      }
    }
  }

  function accentOf(el) {
    var root = el && el.firstElementChild;
    return (root && root.style.getPropertyValue('--s-accent')) || '#3C459B';
  }

  function chrome() {
    var s = meta[pos.slide];
    if (!s) return;
    document.body.style.background = s.bg;
    progress.style.width = ((pos.slide + 1) / n * 100) + '%';
    progress.style.color = accentOf(slideEls[aspect][pos.slide]);
    try { history.replaceState(null, '', '#' + (pos.slide + 1)); } catch (e) {}
  }

  function animateChange(from, to, dir) {
    var els = slideEls[aspect];
    var inEl = els[to.slide];
    var outEl = els[from];
    var key = meta[to.slide].transition;
    var scale = 1;
    if (reduced()) {
      var eff = data.reduced[key] || { key: 'brak', durationScale: 1 };
      key = eff.key;
      scale = eff.durationScale;
    }
    var table = data.transitions[key];
    var frames = table && table[String(dir)];
    applySteps(inEl, to.slide, to.step, true);
    if (!frames || !frames.enter.length || !inEl.animate) {
      sync(aspect);
      return;
    }
    inEl.classList.add('on');
    inEl.style.zIndex = frames.enterOnTop ? '2' : '1';
    outEl.style.zIndex = frames.enterOnTop ? '1' : '2';
    var timing = { duration: data.duration * scale, easing: frames.easing, fill: 'both' };
    var anims = [inEl.animate(frames.enter, timing)];
    if (frames.exit.length) anims.push(outEl.animate(frames.exit, timing));
    var token = {
      anims: anims,
      done: function () { sync(aspect); }
    };
    running = token;
    anims[0].onfinish = function () { if (running === token) settle(); };
  }

  function go(target) {
    if (n === 0) return;
    target = clampPos(target);
    if (target.slide === pos.slide && target.step === pos.step) return;
    // Trwające przejście kończymy od razu, zanim zacznie się następne.
    settle();
    var from = pos.slide;
    pos = target;
    if (target.slide === from) {
      applySteps(slideEls[aspect][from], from, target.step, reduced());
    } else {
      animateChange(from, target, target.slide > from ? 1 : -1);
      // Nieaktywny format trzyma tę samą pozycję (przełącznik A).
      sync(aspect === 'wide' ? 'square' : 'wide');
    }
    chrome();
  }

  function fit() {
    var auto = window.innerWidth / Math.max(1, window.innerHeight) < SQUARE_BELOW ? 'square' : 'wide';
    if (!manual && auto !== aspect) setAspect(auto);
    var stage = stages[aspect];
    var w = parseInt(stage.getAttribute('data-w'), 10);
    var h = parseInt(stage.getAttribute('data-h'), 10);
    var s = Math.min(window.innerWidth / w, window.innerHeight / h);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  function setAspect(name) {
    settle();
    aspect = name;
    stages.wide.classList.toggle('on', name === 'wide');
    stages.square.classList.toggle('on', name === 'square');
    sync(name);
    chrome();
  }

  function toggleFullscreen() {
    var doc = document;
    var root = doc.documentElement;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    } else if (root.requestFullscreen) {
      root.requestFullscreen();
    } else if (root.webkitRequestFullscreen) {
      root.webkitRequestFullscreen();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Spacebar': case 'Enter':
        e.preventDefault(); go(next(pos)); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); go(prev(pos)); break;
      case 'Home':
        e.preventDefault(); go({ slide: 0, step: 0 }); break;
      case 'End':
        e.preventDefault(); go({ slide: n - 1, step: n ? meta[n - 1].steps : 0 }); break;
      case 'f': case 'F':
        toggleFullscreen(); break;
      case 'a': case 'A':
        manual = true;
        setAspect(aspect === 'wide' ? 'square' : 'wide');
        fit();
        break;
    }
  });

  document.addEventListener('click', function (e) {
    if (e.button !== 0) return;
    go(e.clientX < window.innerWidth * 0.3 ? prev(pos) : next(pos));
  });

  var tx = null;
  var swiped = false;
  document.addEventListener('touchstart', function (e) {
    tx = e.touches[0].clientX;
    swiped = false;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    tx = null;
    if (Math.abs(dx) > 40) {
      swiped = true;
      e.preventDefault();
      go(dx < 0 ? next(pos) : prev(pos));
    }
  });
  // Po przesunięciu palcem przeglądarka może jeszcze wysłać „click".
  document.addEventListener('click', function (e) {
    if (swiped) { swiped = false; e.stopImmediatePropagation(); }
  }, true);

  function fromHash() {
    var k = parseInt(location.hash.slice(1), 10);
    return isNaN(k) ? null : { slide: k - 1, step: 0 };
  }
  window.addEventListener('hashchange', function () {
    var target = fromHash();
    if (target && clampPos(target).slide !== pos.slide) go(target);
  });

  window.addEventListener('resize', fit);
  pos = clampPos(fromHash() || { slide: 0, step: 0 });
  fit();
})();
`
