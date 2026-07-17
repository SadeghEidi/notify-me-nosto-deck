// QA mode (?qa) reveals all fragments and freezes motion for stable screenshots
var QA = new URLSearchParams(location.search).has('qa');
if (QA) document.documentElement.classList.add('qa');

Reveal.initialize({
  width: 1920,
  height: 1080,
  margin: 0,
  minScale: 0.2,
  maxScale: 2.0,
  hash: true,
  controls: false,                    // hide edge nav chevrons
  progress: !QA,
  slideNumber: QA ? false : 'c/t',
  transition: QA ? 'none' : 'fade',   // quick cross-fade; entrance anims carry the motion
  transitionSpeed: 'fast',
  backgroundTransition: QA ? 'none' : 'fade',
  fragments: !QA,                     // show everything at once in QA
  fragmentInURL: false,
  overview: true,
  center: false,
  disableLayout: false,
});

/* ---------------------------------------------------------------------
   Product-bento auto-play driver (slide 08). Each storefront mockup
   steps a [data-*] attribute through its scene script on per-beat
   timers; the loop runs only while the bento slide is the current one
   (started/stopped on Reveal slide changes) and never in QA / reduced
   motion, where every card renders its static first scene. Animations
   are ported as-is from the Notify Me! site. */
(function () {
  var reduce = QA || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function makeStory(stage, attr, beats, hold) {
    if (!stage) return null;
    var timer = null, on = false;
    function run(i) {
      if (i === 0) stage.removeAttribute(attr);
      else stage.setAttribute(attr, beats[i]);
      timer = setTimeout(function () { run((i + 1) % beats.length); }, hold[i]);
    }
    return {
      start: function () { if (on) return; on = true; run(0); },
      stop:  function () { on = false; clearTimeout(timer); timer = null; stage.removeAttribute(attr); }
    };
  }

  function wire() {
    var bento = document.querySelector('.nm-bento');
    if (!bento) return;

    var stories = [
      makeStory(bento.querySelector('.nm-shop'), 'data-shop',
        ['idle', 'tapA', 'form', 'tapB', 'lock', 'lockn', 'tapN', 'done'],
        [  900,   360,    2000,   360,    1100,   1600,    360,    2400 ]),
      makeStory(bento.querySelector('.nm-preshop'), 'data-pshop',
        ['idle', 'tapA', 'checkout', 'tapB', 'done'],
        [  900,   360,    2200,      360,    2400 ]),
      makeStory(bento.querySelector('.nm-wishshop'), 'data-wshop',
        ['idle', 'tapW', 'email', 'tapB', 'done'],
        [  900,   1100,   3800,    360,    2400 ]),
      makeStory(bento.querySelector('.nm-hue'), 'data-hue',
        ['idle', 'ask', 'answer', 'chart', 'rec', 'apply', 'done'],
        [ 1500,  1500,   1700,     1600,    1700,   400,    2800 ])
    ];

    function bentoIsCurrent() {
      var cur = Reveal.getCurrentSlide();
      return !!(cur && cur.contains(bento));
    }
    function update() {
      var live = bentoIsCurrent();
      bento.classList.toggle('is-playing', live && !reduce);
      stories.forEach(function (s) {
        if (!s) return;
        if (live && !reduce) s.start(); else s.stop();
      });
    }

    Reveal.on('slidechanged', update);
    update();
  }

  if (Reveal.isReady()) wire();
  else Reveal.on('ready', wire);
})();

/* ---------------------------------------------------------------------
   Process-line driver (the reframe slide). Two rails run the same seven
   stations. DWELL is identical on both; only TRAVEL differs. That is the
   argument the slide makes: the doing got ~4x faster, the total barely
   moved, because the stops are the process. Both rails share one cycle so
   they restart together, and the fast one visibly waits at Launch.
   Runs only while the slide is current; QA / reduced-motion paint one
   static frame instead (see FREEZE_AT).
   --------------------------------------------------------------------- */
(function () {
  // Two different motions now:
  //   BEFORE AI (slow rail) flows CONTINUOUSLY end to end, one long eased sweep, no stops.
  //   WITH AI  (fast rail)  jumps fast between stages but STOPS at each (DWELL) - that pause
  //   is the human-in-the-loop bottleneck, the point of the slide. Slow finishes well after
  //   fast, so it still reads as the slower process.
  var DWELL      = 3400;                   // fast rail only: the wait at each stage (the bottleneck)
  var TRAVEL     = { fast: 1920 };         // fast rail per-gap travel (halved speed = 2x duration)
  var SWEEP_SLOW = 40000;                  // slow rail: one continuous sweep, tip to tip
  var CYCLE      = 44000;                  // slow finishes at 40s (fast ~32s), ~4s hold, then loop
  var FREEZE_AT  = 17000;                  // slow mid-flow past Design, fast stopped at Coding

  function wire() {
    var slide = document.querySelector('.pl-slide');
    if (!slide) return;

    var reduce = QA || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rails = [].slice.call(slide.querySelectorAll('.pl-line')).map(function (el) {
      var steps = [].slice.call(el.querySelectorAll('.pl-step'));
      return {
        el: el,
        fill: el.querySelector('.pl-fill'),
        orb: el.querySelector('.pl-orb'),
        steps: steps,
        n: steps.length,
        continuous: el.dataset.speed === 'slow',
        travel: TRAVEL[el.dataset.speed] || TRAVEL.fast
      };
    });
    if (!rails.length) return;

    function easeInOut(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

    // where the work is at time t. Continuous rail: one eased sweep, never stops, stations
    // just light as the head passes them. Stepped rail: dwell at a station, then ease to next.
    function stateAt(r, t) {
      var last = r.n - 1;
      if (r.continuous) {
        var k = Math.min(t / SWEEP_SLOW, 1);
        var p = easeInOut(k);
        var at = Math.min(Math.floor(p * last + 1e-6), last);
        return { p: p, at: at, moving: k < 1 };   // moving until it lands, so no is-at mid-flow
      }
      var seg = DWELL + r.travel;
      if (t >= last * seg + DWELL) return { p: 1, at: last, moving: false };
      var i = Math.floor(t / seg);
      var into = t - i * seg;
      if (into <= DWELL) return { p: i / last, at: i, moving: false };
      return { p: (i + easeInOut((into - DWELL) / r.travel)) / last, at: i, moving: true };
    }

    function paint(t) {
      rails.forEach(function (r) {
        var s = stateAt(r, t);
        var pct = (s.p * 100).toFixed(3) + '%';
        r.fill.style.width = pct;
        r.orb.style.left = pct;
        r.el.classList.toggle('is-moving', s.moving);
        for (var i = 0; i < r.n; i++) {
          r.steps[i].classList.toggle('is-done', i <= s.at);
          r.steps[i].classList.toggle('is-at', i === s.at && !s.moving);
        }
      });
    }

    // setTimeout, not rAF: rAF only ticks for a visible, compositing tab, which makes the
    // animation impossible to verify in a headless render and freezes it in a background
    // tab. Date.now() keeps it wall-clock accurate. Same approach as the bento driver above.
    var timer = null, t0 = 0;
    function tick() {
      paint((Date.now() - t0) % CYCLE);
      timer = setTimeout(tick, 16);
    }
    function start() { if (timer) return; t0 = Date.now(); tick(); }
    function stop()  { clearTimeout(timer); timer = null; }

    function update() {
      var cur = Reveal.getCurrentSlide();
      var live = !!(cur && cur === slide);
      if (live && !reduce) start();
      else { stop(); if (live) paint(FREEZE_AT); }
    }

    Reveal.on('slidechanged', update);
    update();
    if (reduce) paint(FREEZE_AT);   // QA renders the slide without a slidechange
  }

  if (Reveal.isReady()) wire();
  else Reveal.on('ready', wire);
})();

/* czb numbered focus-list ("Why the speed disappears"): the focused row advances by CLICK, not a
   timer. Each lower row carries an empty .fx fragment marker, so a click just steps reveal's
   fragment pointer; here we count how many markers are shown and move .is-active to that row
   (row 0 on entry, +1 per click). CSS transitions animate the hand-off. In QA, fragments render
   all-shown and CSS pins row 01, so we skip. Pure-CSS :has() was tried first and dropped: this
   engine doesn't re-style the ancestor row when reveal moves .current-fragment. */
(function () {
  function wire() {
    var items = [].slice.call(document.querySelectorAll('.czb-item'));
    if (!items.length) return;
    if (document.documentElement.classList.contains('qa')) return;   // QA: CSS pins row 01
    function update() {
      var shown = document.querySelectorAll('.czb-item .fx.visible').length;   // 0, 1 or 2
      items.forEach(function (it, i) { it.classList.toggle('is-active', i === shown); });
    }
    Reveal.on('fragmentshown', update);
    Reveal.on('fragmenthidden', update);
    Reveal.on('slidechanged', update);
    update();
  }
  if (Reveal.isReady()) wire();
  else Reveal.on('ready', wire);
})();

/* Diagnosis slide (the three friction cards, "Still wasn't the outcome we were hoping for"): only the
   LAST-revealed card keeps animating; once a card is passed it freezes at its initial resting state.
   We mark every card that is NOT the current frontier fragment with .dg-rest; the slide's inline CSS
   then stops that card's loops (comet / +1 / agent / X hidden, bars left settled, roads steady). A
   card also carries .dg-rest until it is first revealed, so REMOVING it on reveal applies the card's
   animation fresh from frame 0 - each card restarts cleanly as it becomes live (the race bars are
   actually seen growing, the agent drives from the start). QA renders every card frozen via the .qa
   rules, so skip it. Same fragment-driven shape as the czb list above. */
(function () {
  function wire() {
    var wrap = document.querySelector('.reveal .slides .dg-wrap');
    if (!wrap) return;
    if (document.documentElement.classList.contains('qa')) return;   // QA: .qa rules freeze a static frame
    var cards = [].slice.call(wrap.querySelectorAll('.dg-card'));
    if (!cards.length) return;
    function update() {
      // frontier = the visible card with the highest fragment index (reveal renumbers to a 0-based run)
      var live = null, max = -1;
      cards.forEach(function (c) {
        if (!c.classList.contains('visible')) return;
        var n = parseInt(c.getAttribute('data-fragment-index'), 10);
        if (isNaN(n)) n = cards.indexOf(c);
        if (n > max) { max = n; live = c; }
      });
      cards.forEach(function (c) { c.classList.toggle('dg-rest', c !== live); });
    }
    Reveal.on('fragmentshown', update);
    Reveal.on('fragmenthidden', update);
    Reveal.on('slidechanged', update);
    update();
  }
  if (Reveal.isReady()) wire();
  else Reveal.on('ready', wire);
})();
