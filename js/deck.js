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
  // DWELL is the human at the stage. It is deliberately IDENTICAL on both rails: that wait is
  // what never changed, and it is the bottleneck the slide is about. Only TRAVEL differs.
  // TRAVEL is halved again here (the progress between stages), while DWELL holds at 1.9s.
  // Side effect, and a good one: with the movement this slow, the fast rail now spends ~70%
  // of its run standing still, which is precisely the claim.
  var DWELL  = 1900;
  var TRAVEL = { slow: 5600, fast: 960 };  // per gap
  var CYCLE  = 48000;                      // slow needs 46900, then a beat before the loop
  var FREEZE_AT = 15500;                   // both dwelling: slow at Design, fast at Documentation

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
        travel: TRAVEL[el.dataset.speed] || TRAVEL.slow
      };
    });
    if (!rails.length) return;

    // where the work is at time t: dwell at a station, then ease across the gap
    function stateAt(r, t) {
      var seg = DWELL + r.travel;
      var last = r.n - 1;
      if (t >= last * seg + DWELL) return { p: 1, at: last, moving: false };
      var i = Math.floor(t / seg);
      var into = t - i * seg;
      if (into <= DWELL) return { p: i / last, at: i, moving: false };
      var k = (into - DWELL) / r.travel;
      var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // easeInOutQuad
      return { p: (i + e) / last, at: i, moving: true };
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
