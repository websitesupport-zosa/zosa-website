/* ============================================================
   ZOSA AGENTIC — shared behaviour for every page
   Loaded by index.html and each product / contact page.
   ============================================================ */

/* ---------- old hash links still work ----------
   Before the site had real URLs everything lived at /#supper, /#scribe and
   so on. Anyone holding one of those links lands here, so send them on. */
(function(){
  var map = {
    '#supper': '/supper/',
    '#graceabides': '/graceabides/',
    '#covenant': '/graceabides/',      /* the product's earlier name */
    '#scribe': '/scribe/',
    '#contact': '/contact/',
    '#about': '/'
  };
  var to = map[location.hash];
  if (to && location.pathname === '/' && to !== '/'){
    location.replace(to);
  } else if (location.hash === '#about' && location.pathname === '/'){
    history.replaceState(null, '', '/');
  }
})();

/* ---------- where each page sits in the menu ----------
   Used to decide which way the circle spins on the way out. */
var ZOSA_ORDER = ['/', '/supper/', '/graceabides/', '/scribe/', '/contact/'];
function zosaIndex(path){
  path = path.replace(/index\.html$/, '');
  if (path.length > 1 && path.slice(-1) !== '/') path += '/';
  var i = ZOSA_ORDER.indexOf(path);
  return i === -1 ? 0 : i;             /* unknown paths behave like home */
}

/* ============================================================
   THE STEEL CURTAIN (home page only)

   One canvas, three acts, all drawn from the same set of digits:

     steel mark -> every point of it becomes a 0 or a 1
                -> they gather into concentric rings of binary
                -> the rings shrink into the nav logo, innermost first

   Because the digits carry through rather than being four separate clips,
   the transitions are continuous — and it fits any viewport and downloads
   as a few kilobytes instead of megabytes of GIF.
   ============================================================ */
window.ZOSA_INTRO_PENDING = !!document.getElementById('intro') &&
                            document.documentElement.className.indexOf('intro-on') > -1;

(function(){
  var intro = document.getElementById('intro');
  if (!intro || !window.ZOSA_INTRO_PENDING){
    if (intro) intro.parentNode.removeChild(intro);
    return;
  }

  var canvas = document.getElementById('introArt');
  var ctx    = canvas.getContext('2d');
  var PTS    = window.ZOSA_MARK_POINTS || [];

  /* ---------- the score, in milliseconds ---------- */
  var T = {
    convert: 900,     /* steel hands over to digits            */
    hold:   1200,     /* the mark sits there, complete         */
    rings:  2500,     /* gathered into concentric rings        */
    turn:   2800,     /* the rings turn briefly                */
    drain:  4600      /* the last of them reaches the logo     */
  };
  var LIVE_AT = 4900, GONE_AT = 5100, OUT_AT = 5400;
  var HANDOFF_AT = 2500;   /* the header steps out in front of the curtain */
  /* How long it will wait to be started before starting itself. Someone who
     arrived from a search result is here to read, not to discover that the
     page wants a gesture first — so this is short. */
  var WAIT_MAX = 3200;
  var LAND_AT = 4450;   /* the mark takes the hit, with the digits still arriving */

  var BLACK  = ['#0b0b12', '#16161f', '#24242f'];
  var SILVER = ['#9aa0b4', '#aeb4c4', '#c2c7d4'];
  var RING_COUNT = 14;

  var W = 0, H = 0, cx = 0, cy = 0, markHalf = 0, dpr = 1;
  var landX = 0, landY = 0, landR = 18;   /* the nav logo, measured from the live page */
  var c1x = 0, c1y = 0, c2x = 0, c2y = 0; /* the two controls of the wave up to it */
  var bits = [], steel = new Image(), steelReady = false;
  steel.onload = function(){ steelReady = true; };
  steel.src = 'intro-still.png';

  function rnd(a, b){ return a + Math.random() * (b - a); }

  /* ---------- lay out every state the digits will pass through ---------- */
  function layout(){
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    markHalf = Math.min(W, H) * 0.5;

    /* The page is laid out behind the curtain, so the logo can be measured
       rather than guessed — it stays right through a resize or a switch to
       the mobile header. */
    var logo = document.querySelector('.brand .mark');
    if (logo){
      var lr = logo.getBoundingClientRect();
      landX = lr.left + lr.width  / 2;
      landY = lr.top  + lr.height / 2;
      /* the drawn circle sits a little inside its box, so the rings come to
         rest on the outline itself rather than hovering off it */
      landR = Math.max(7, Math.min(lr.width, lr.height) * 0.44);
    } else {
      landX = cx; landY = cy; landR = 18;
    }

    /* The wave the pattern rides into the mark. Two controls, each a third of
       the way along: the first lifted well above the line so the pattern
       climbs as it sets off, the second dropped below it so it crosses over,
       falls away, and comes up into the mark from underneath.

       The offsets are vertical rather than perpendicular to the line. Waving
       perpendicular pushes the curve leftward as well, and on anything
       narrower than a desktop that ran the digits off the left edge long
       before the S looked like much. Straight up and down, x stays a clean
       run from centre to the mark and all the shape lives in y — which also
       means the curve can never leave the screen sideways, however deep the
       wave gets. Scaled by height, so it reads the same on any window. */
    var vx = landX - cx, vy = landY - cy;
    var RISE = H * 0.72;   /* the climb out */
    var FALL = H * 1.08;   /* the deeper swing back down before it comes in */
    c1x = cx + vx / 3;
    c1y = cy + vy / 3 - RISE;
    c2x = cx + 2 * vx / 3;
    c2y = cy + 2 * vy / 3 + FALL;

    var n = Math.floor(PTS.length / 2);
    if (!n) return;

    /* The rings span the full width of the screen — the outermost reaches
       past the left and right edges, so on a landscape window the top and
       bottom of the widest rings fall outside it and are simply cut off.
       That is deliberate: the pattern should fill the width.

       Population grows with the square root of the radius while the digits
       are sized from the gap that leaves between them, which is what gives
       the reference its look: tiny and tightly packed in the middle, large
       and open at the rim. */
    var maxR = W * 0.52;
    var ringR = [], ringN = [], ringS = [], total = 0, k;
    for (k = 0; k < RING_COUNT; k++){
      var f = (k + 1.6) / (RING_COUNT + 1.6);
      ringR.push(maxR * f);
      total += Math.sqrt(ringR[k]);
    }
    for (k = 0; k < RING_COUNT; k++){
      ringN.push(Math.max(8, Math.round(n * Math.sqrt(ringR[k]) / total)));
      var gap = (2 * Math.PI * ringR[k]) / ringN[k];
      ringS.push(Math.max(7, Math.min(gap * 0.72, W * 0.055)));
    }

    var ring = 0, inRing = 0;
    for (var i = 0; i < n; i++){
      var b = bits[i] || (bits[i] = {});

      /* where it sits on the mark */
      b.lx = cx + PTS[i * 2]     * markHalf;
      b.ly = cy + PTS[i * 2 + 1] * markHalf;
      b.lsize = Math.max(9, markHalf * 0.038);

      /* and its place in the rings */
      while (ring < RING_COUNT - 1 && inRing >= ringN[ring]){ ring++; inRing = 0; }
      b.ring  = ring;
      b.rr    = ringR[ring];
      b.rang  = (inRing / Math.max(1, ringN[ring])) * Math.PI * 2 + (ring * 0.21);
      b.rsize = ringS[ring];
      /* What it shrinks to when it reaches the mark. The logo's circle is only
         ~116px around, and the outer rings carry three times the digits of the
         inner ones, so a single landing size would pile them up. Sizing each
         ring from its own population lets a crowded ring arrive as fine
         texture tracing the outline instead. */
      b.fsize = Math.max(1.8, Math.min(3.4,
                  (2 * Math.PI * landR) / Math.max(1, ringN[ring]) * 1.2));
      inRing++;

      if (b.glyph === undefined){
        /* colour on one parity and glyph on the other, so each split is
           exactly half and the two do not line up */
        b.col   = (i % 2 === 0) ? BLACK[(Math.random()*3)|0] : SILVER[(Math.random()*3)|0];
        b.glyph = (Math.floor(i / 2) % 2 === 0) ? '0' : '1';
        b.flip  = rnd(600, 1500);
        b.born  = (1 - Math.abs(PTS[i*2+1])) * 120 + Math.random() * 380;
      }
    }
    bits.length = n;
  }

  /* ---------- the phases ---------- */
  function ease(t){ return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  function mix(a, b, t){ return a + (b - a) * t; }

  function draw(ms){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* transparent, not white: .intro-ground supplies the backdrop, so when it
       fades the page shows through and the digits keep flying over it */
    ctx.clearRect(0, 0, W, H);

    /* the steel, handing over */
    if (steelReady && ms < T.convert + 120){
      var sa = 1 - ms / (T.convert + 120);
      if (sa > 0){
        ctx.globalAlpha = sa;
        ctx.drawImage(steel, cx - markHalf, cy - markHalf, markHalf * 2, markHalf * 2);
        ctx.globalAlpha = 1;
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < bits.length; i++){
      var b = bits[i], x, y, size, alpha = 1;

      if (ms < b.born){ continue; }

      if (ms < T.hold){
        /* on the mark */
        x = b.lx; y = b.ly; size = b.lsize;
        alpha = Math.min(1, (ms - b.born) / 220);
      } else if (ms < T.rings){
        /* leaving the mark and opening out into the rings */
        var g = ease((ms - T.hold) / (T.rings - T.hold));
        var tx = cx + Math.cos(b.rang) * b.rr;
        var ty = cy + Math.sin(b.rang) * b.rr;
        x = mix(b.lx, tx, g);
        y = mix(b.ly, ty, g);
        size = mix(b.lsize, b.rsize, g);
      } else {
        /* The rings turn, then close one at a time from the inside out. A
           closing ring does three things at once: its radius runs down to the
           mark's own, its centre rides a wave up to the mark, and it keeps
           turning as it goes — so the pattern spirals into the logo rather
           than sliding at it in a straight line. */
        var spin = (ms - T.rings) / 1000 * 0.10;
        var rr = b.rr, ox = cx, oy = cy, swirl = 0;
        size = b.rsize;
        var st = T.turn + b.ring * 85;
        if (ms > st){
          var d = ease((ms - st) / 1000);
          /* down to the mark's own radius, not to nothing: each ring comes to
             rest as the logo's circle before it lets go, so they are seen
             fitting into it rather than vanishing at a point */
          rr = mix(b.rr, landR, d);

          /* a cubic through both controls: up, across, and in from below */
          var u = 1 - d, uu = u * u, dd = d * d;
          ox = uu * u * cx + 3 * uu * d * c1x + 3 * u * dd * c2x + dd * d * landX;
          oy = uu * u * cy + 3 * uu * d * c1y + 3 * u * dd * c2y + dd * d * landY;

          /* and the ring keeps winding as it closes, so each digit traces its
             own spiral in rather than falling straight down its radius */
          swirl = d * 1.7;

          size = mix(b.rsize, b.fsize, d);
          /* held until they are on the circle, then gone quickly */
          if (d > 0.88) alpha = 1 - (d - 0.88) / 0.12;
        }
        x = ox + Math.cos(b.rang + spin + swirl) * rr;
        y = oy + Math.sin(b.rang + spin + swirl) * rr;
      }

      if (alpha <= 0.02) continue;
      if (x < -size || y < -size || x > W + size || y > H + size) continue;

      var ch = b.glyph;
      if (Math.floor(ms / b.flip) % 2 === 1) ch = ch === '0' ? '1' : '0';

      ctx.globalAlpha = alpha;
      ctx.fillStyle = b.col;
      ctx.font = '700 ' + size.toFixed(1) + 'px "IBM Plex Mono", ui-monospace, Consolas, monospace';
      ctx.fillText(ch, x, y);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- run ---------- */
  var going = false, t0 = 0, raf = 0, timers = [];
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }

  function frame(now){
    var ms = now - t0;
    draw(ms);
    if (ms < T.drain + 400) raf = requestAnimationFrame(frame);
  }

  /* Brings the header out in front of the curtain so the mark is on screen
     while the digits are still flying at it. Only the header: the page body
     stays behind the ground, because full-width rings over live copy look
     like a mistake rather than an effect. */
  function handoff(){
    document.documentElement.classList.add('intro-handoff');
  }

  /* the mark absorbs them: one spin, on the real logo, under the canvas */
  function land(){
    var img = document.querySelector('.brand .mark img');
    if (!img) return;
    img.classList.remove('lands');
    void img.offsetWidth;            /* so it restarts if it is already playing */
    img.classList.add('lands');
    img.addEventListener('animationend', function once(){
      img.classList.remove('lands');
      img.removeEventListener('animationend', once);
    });
  }

  function live(){
    document.documentElement.className =
      document.documentElement.className.replace(/\bintro-on\b/, '');
    window.ZOSA_INTRO_PENDING = false;
    window.dispatchEvent(new CustomEvent('zosa:intro-done'));
  }

  function dismiss(){
    if (going) return;
    going = true;
    /* stamped when it actually runs, so a visitor who leaves without moving
       the cursor still gets it next time */
    try { localStorage.setItem('zosa:intro', String(Date.now())); } catch (e) {}

    /* drop ?intro=1 from the address bar once it has done its job */
    if (location.search.indexOf('intro') > -1 && window.history && history.replaceState){
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }

    intro.classList.add('is-out');
    t0 = performance.now();
    raf = requestAnimationFrame(frame);

    later(handoff, HANDOFF_AT);
    later(land, LAND_AT);
    later(live, LIVE_AT);
    later(function(){ intro.classList.add('is-gone'); }, GONE_AT);
    later(function(){
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('intro-handoff');
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, OUT_AT);
  }

  function rush(){
    if (!going || intro.className.indexOf('is-rushed') > -1) return;
    intro.classList.add('is-rushed');
    timers.forEach(clearTimeout);
    timers = [];
    later(handoff, 120);
    later(land, 380);
    later(live, 520);
    later(function(){ intro.classList.add('is-gone'); }, 900);
    later(function(){
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('intro-handoff');
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 1250);
  }

  function trigger(){ if (going) rush(); else dismiss(); }

  layout();
  draw(0);
  steel.onload = function(){ steelReady = true; if (!going) draw(0); };
  if (steel.complete) { steelReady = true; draw(0); }
  window.addEventListener('resize', function(){ layout(); if (!going) draw(0); });

  /* Moving the cursor anywhere on the screen starts it, after a few pixels
     of travel so a stationary mouse nudged by the page load does not. */
  var seenX = null, seenY = null;
  function onMove(e){
    if (going) return;
    if (seenX === null){ seenX = e.clientX; seenY = e.clientY; return; }
    if (Math.abs(e.clientX - seenX) + Math.abs(e.clientY - seenY) < 10) return;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('mousemove', onMove);
    dismiss();
  }
  window.addEventListener('pointermove', onMove);
  window.addEventListener('mousemove', onMove);

  intro.addEventListener('click', trigger);
  intro.addEventListener('touchstart', trigger, {passive:true});
  window.addEventListener('keydown', trigger);
  window.addEventListener('wheel', trigger, {passive:true});

  later(dismiss, WAIT_MAX);
})();

/* ---------- mobile menu ----------
   Below 940px the tab row is a panel; this opens and closes it. */
(function(){
  var toggle = document.getElementById('navToggle');
  var menu   = document.getElementById('menu');
  if (!toggle || !menu) return;

  function setOpen(open){
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function(e){
    e.stopPropagation();
    setOpen(!document.body.classList.contains('nav-open'));
  });

  document.addEventListener('click', function(e){
    if (!document.body.classList.contains('nav-open')) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')){
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', function(){
    if (window.innerWidth > 940) setOpen(false);
  });
})();

/* ---------- logo: hand the mark over to hover once the load spin ends ---------- */
(function(){
  var mark = document.querySelector('.brand .mark img');
  if (!mark) return;
  mark.addEventListener('animationend', function(){ mark.classList.add('spun'); }, {once:true});
  setTimeout(function(){ mark.classList.add('spun'); }, 1600);
})();

/* ---------- logo: replays the curtain when you are already home ----------
   On every other page the logo is the way back, so it is left alone. Here it
   links to the page you are standing on and is free to do something better —
   which also makes the intro demonstrable without typing a URL. */
(function(){
  var brand = document.querySelector('.brand');
  if (!brand) return;
  var here = location.pathname.replace(/index\.html$/, '');
  if (here !== '/' && here !== './' && here !== '') return;

  brand.setAttribute('title', 'Replay the intro');
  brand.addEventListener('click', function(e){
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;  /* open-in-new-tab still works */
    e.preventDefault();
    location.href = location.pathname + '?intro=1';
  });
})();

/* ---------- reveal on scroll (About / Contact) ---------- */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items  = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!items.length) return;
  if (reduce || !('IntersectionObserver' in window)){
    items.forEach(function(el){ el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) e.target.classList.add('in'); });
  }, {rootMargin:'0px 0px -8% 0px', threshold:.05});

  var watching = false;
  function watch(){
    if (watching) return;
    watching = true;
    items.forEach(function(el){ io.observe(el); });
  }

  /* hold off while the steel curtain is up, or the hero would reveal itself
     behind it and be finished by the time anyone sees the page */
  if (window.ZOSA_INTRO_PENDING){
    window.addEventListener('zosa:intro-done', watch, {once:true});
    /* Safety net. The curtain waits to be started, and anything that never
       starts it — a crawler taking a render snapshot, a link-preview bot, a
       tab left in the background — would otherwise leave every .reveal in the
       hero sitting at opacity:0 in whatever it captured. Revealing early
       behind an opaque curtain costs nothing on screen, and it means the
       page's own copy is never the thing that goes missing. */
    setTimeout(watch, 2200);
  } else {
    watch();
  }
})();

/* ---------- scroll progress (doc pages) ---------- */
(function(){
  var bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  var queued = false;
  function paint(){
    queued = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pos = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
    bar.style.transform = 'scaleX(' + pos + ')';
  }
  function onScroll(){ if (!queued){ queued = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  paint();
})();

/* ============================================================
   THE CIRCLE — geometry, entrance, and the warp out on navigation
   ============================================================ */
(function(){
  var page = document.querySelector('.page');
  var wrap = document.querySelector('.stage-wrap');

  /* ---------- fit the circle and the six cards to the free space ----------
     The cards sit on an arc: each carries data-fx, its share of the arc's
     horizontal reach. Each column of three is packed by real card heights
     with equal gaps, and --fs (the card font size everything inside is an em
     of) is solved until those gaps are comfortable. */
  var PHONE = 900;
  function fit(){
    if (window.innerWidth < PHONE){
      document.body.classList.add('flow');
      document.documentElement.style.removeProperty('--stage');
      return;
    }
    document.body.classList.remove('flow');
    if (!wrap) return;

    var wrapW = wrap.clientWidth, wrapH = wrap.clientHeight;
    var root  = document.documentElement.style;
    var cards = wrap.querySelectorAll('.node');
    if (!cards.length) return;

    var cardW = Math.max(200, Math.floor(Math.min(360, wrapW * 0.19)));
    root.setProperty('--cardw', cardW + 'px');

    var EDGE = 8, GAP_MIN = 20;
    var avail = wrapH - 2 * EDGE;
    var room  = wrapH - 2 * GAP_MIN - 14;
    var fs = 1, slot, colTop, gap, i;

    function pack(){
      slot = [];
      for (i = 0; i < cards.length && i < 6; i++) slot[i] = cards[i].offsetHeight;
      colTop = Math.max(slot[0] + slot[1] + slot[2], slot[3] + slot[4] + slot[5]);
      gap = (avail - colTop) / 2;
      return gap;
    }

    for (var pass = 0; pass < 2; pass++){
      root.setProperty('--fs', fs.toFixed(3));
      if (pack() >= GAP_MIN) break;
      var want = avail - 2 * GAP_MIN;
      fs = Math.max(0.7, fs * (want > 0 ? want / colTop : 1));
    }
    root.setProperty('--fs', fs.toFixed(3));
    pack();

    /* even at the smallest card size they cannot sit clear — unroll the list */
    if (gap < 6){
      document.body.classList.add('flow');
      document.documentElement.style.removeProperty('--stage');
      return;
    }

    /* the row each card occupies, its column centred in the free height */
    var yOf = [], cursor;
    [[0,1,2],[3,4,5]].forEach(function(col){
      cursor = -avail / 2;
      col.forEach(function(idx){
        yOf[idx] = cursor + slot[idx] / 2;
        cursor += slot[idx] + gap;
      });
    });

    var reachX = Math.max(120, wrapW / 2 - cardW / 2 - 10);
    var nearest = Infinity, all = [];
    for (i = 0; i < cards.length && i < 6; i++){
      var el = cards[i];
      var tx = (parseFloat(el.getAttribute('data-fx')) || 0) * reachX;
      var ty = yOf[i];
      var rad = Math.sqrt(tx * tx + ty * ty);
      el.style.setProperty('--rad', Math.round(rad) + 'px');
      el.style.setProperty('--ang', (Math.atan2(ty, tx) * 180 / Math.PI).toFixed(2) + 'deg');
      nearest = Math.min(nearest, rad);
      all.push({el: el, rad: rad});
    }

    /* the idle float gets a third of the gap at most, so it can never close
       the space between two cards */
    var budget = gap / 3;
    all.forEach(function(g){
      var deg = g.rad > 0 ? Math.min(1.4, budget / g.rad * 180 / Math.PI) : 0;
      g.el.style.setProperty('--sway', deg.toFixed(2) + 'deg');
    });

    var clear = 2 * (nearest - cardW / 2 - 12);
    root.setProperty('--stage', Math.max(260, Math.floor(Math.min(1400, wrapH, clear))) + 'px');
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  requestAnimationFrame(fit);

  /* ---------- the warp in ----------
     The direction is whatever the previous page handed over, so moving right
     through the menu still spins one way and left the other. */
  var ENTER_MS = 900;
  var dir = parseFloat(sessionStorage.getItem('zosa:dir'));
  if (isNaN(dir)) dir = 1;
  document.documentElement.style.setProperty('--dir', dir);

  if (page){
    requestAnimationFrame(function(){
      page.classList.add('is-entering');
      setTimeout(function(){ page.classList.remove('is-entering'); }, ENTER_MS);
    });
  }

  /* ---------- the warp out ----------
     Internal links play the exit first, then navigate, so the circle and its
     cards are drawn in before the page changes. Falls back to a plain link if
     anything here is unavailable. */
  var EXIT_MS = wrap ? 620 : 300;
  var leaving = false;

  document.addEventListener('click', function(e){
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;

    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '/') return;          /* internal paths only */
    if (zosaIndex(href) === zosaIndex(location.pathname) &&
        href.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '')) return;
    if (leaving) { e.preventDefault(); return; }

    e.preventDefault();
    leaving = true;

    var d = zosaIndex(href) > zosaIndex(location.pathname) ? 1 : -1;
    try { sessionStorage.setItem('zosa:dir', d); } catch (err) {}
    document.documentElement.style.setProperty('--dir', d);

    if (page) page.classList.add('is-leaving');
    document.body.classList.add('is-leaving-page');
    setTimeout(function(){ location.href = href; }, EXIT_MS);
  });
})();

/* ---------- contact form ----------
   Submits through FormSubmit.co — no account and no API key: the destination
   is simply CONTACT_EMAIL, POSTed as JSON so the visitor never leaves.

   ONE-TIME STEP: the first submission after this goes live triggers an
   "Activate Form" confirmation email to CONTACT_EMAIL. Someone has to click
   that link once; every submission after it lands straight in the inbox. */
(function(){
  var CONTACT_EMAIL = 'info@zosa-agentic.ai';

  var form = document.getElementById('contactForm');
  if (!form) return;
  var btn    = document.getElementById('formSend');
  var status = document.getElementById('formStatus');
  var note   = document.getElementById('formNote');

  function fail(t){ if (status){ status.className = 'd-status bad'; status.textContent = t; status.hidden = false; } }
  function ok(t){   if (status){ status.className = 'd-status ok';  status.textContent = t; status.hidden = false; } }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var d = new FormData(form);
    var name = ((d.get('first') || '') + ' ' + (d.get('last') || '')).trim();
    var email = (d.get('email') || '').trim();

    if (!name){ return fail('Please add your name.'); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ return fail('Please enter a valid email address.'); }
    if (!(d.get('message') || '').trim()){ return fail('Please add a line or two about what you need.'); }
    if (!d.get('terms')){ return fail('Please give consent so we can reply.'); }

    var local = ['localhost', '127.0.0.1', ''].indexOf(location.hostname) > -1 ||
                location.protocol === 'file:';
    if (local){
      return ok('Looks good — this will send for real once the site is deployed ' +
                'and the inbox is connected.');
    }

    if (btn){ btn.disabled = true; }
    ok('Sending…');

    fetch('https://formsubmit.co/ajax/' + CONTACT_EMAIL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify({
        _subject:  'Zosa Agentic enquiry — ' + (d.get('subject') || ''),
        _template: 'table',
        _captcha:  'false',
        _replyto:  email,
        Name:      name,
        Email:     email,
        Enquiry:   d.get('subject') || '',
        Message:   d.get('message') || '',
        Consent:   'yes'
      })
    })
    .then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.reset();
      if (note) note.hidden = true;
      ok('Thank you — your message is on its way. We reply to every one.');
      window.dispatchEvent(new CustomEvent('zosa:lead',
        {detail: {enquiry: d.get('subject') || ''}}));
    })
    .catch(function(){
      fail('Something went wrong. Please email ' + CONTACT_EMAIL + ' instead.');
    })
    .finally(function(){ if (btn) btn.disabled = false; });
  });
})();

/* ---------- analytics (GA4) ----------
   Paste your Measurement ID into GA_ID below (Google Analytics → Admin →
   Data streams → your web stream → "G-XXXXXXXXXX"). Until then this block
   loads nothing at all: no script, no cookies, no requests.

   Each page is now a real URL, so GA's own page views are accurate and are
   left switched on. */
(function(){
  var GA_ID = 'G-XXXXXXXXXX';

  if (!GA_ID || GA_ID.indexOf('X') > -1) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID);

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(tag);

  /* a completed enquiry is the one conversion this site has */
  window.addEventListener('zosa:lead', function(ev){
    gtag('event', 'generate_lead', {
      method:  'contact_form',
      enquiry: (ev.detail && ev.detail.enquiry) || ''
    });
  });

  /* and someone mailing us directly counts too */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    gtag('event', 'contact_email_click', {
      link_url: a.getAttribute('href').replace('mailto:', '')
    });
  }, true);
})();
