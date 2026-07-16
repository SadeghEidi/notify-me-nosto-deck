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
