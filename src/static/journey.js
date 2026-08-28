// The site's one script. Hand-written, no dependencies. Everything here
// is an enhancement: with JS off the site is complete and readable.
// All motion respects prefers-reduced-motion.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // --- Week stops reveal as they scroll into view -------------------
  var stops = document.querySelectorAll('.week-stop');
  if (stops.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (records) {
      records.forEach(function (r) {
        if (r.isIntersecting) {
          r.target.classList.add('seen');
          io.unobserve(r.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    stops.forEach(function (s) { io.observe(s); });
  } else {
    stops.forEach(function (s) { s.classList.add('seen'); });
  }

  // --- The pup: trots while you scroll the trail, rests when you stop
  var pup = document.querySelector('.pup');
  var onTrail = !!document.querySelector('.trail');
  if (pup && (onTrail || document.body.classList.contains('page-home'))) {
    pup.hidden = false;
    if (onTrail && !reduceMotion) {
      var lastY = window.scrollY;
      var restTimer = null;
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        if (y > lastY + 1) pup.classList.remove('facing-left');
        else if (y < lastY - 1) pup.classList.add('facing-left');
        lastY = y;
        pup.classList.add('trotting');
        clearTimeout(restTimer);
        restTimer = setTimeout(function () { pup.classList.remove('trotting'); }, 220);
      }, { passive: true });
    }
  }

  // --- Gentle hills parallax ---------------------------------------
  var back = document.querySelector('.hills-back');
  var front = document.querySelector('.hills-front');
  if (back && front && !reduceMotion) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        back.style.transform = 'translateY(' + Math.min(40, y * 0.03) + 'px)';
        front.style.transform = 'translateY(' + Math.min(24, y * 0.015) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }

  // --- Random day: roll an entry from the manifest, filter by month -
  var box = document.querySelector('[data-random]');
  if (box) {
    fetch('/static/entries.json')
      .then(function (res) { return res.json(); })
      .then(function (entries) {
        if (!entries.length) return; // nothing to roll yet; stay hidden
        var select = box.querySelector('[data-random-month]');
        var months = [];
        entries.forEach(function (e) {
          var key = e.date.slice(0, 7);
          if (months.indexOf(key) === -1) months.push(key);
        });
        months.sort().reverse().forEach(function (key) {
          var opt = document.createElement('option');
          opt.value = key;
          opt.textContent = new Date(key + '-01T00:00:00Z').toLocaleDateString('en-GB', {
            month: 'long', year: 'numeric', timeZone: 'UTC'
          });
          select.appendChild(opt);
        });
        box.querySelector('[data-random-go]').addEventListener('click', function () {
          var pool = select.value
            ? entries.filter(function (e) { return e.date.slice(0, 7) === select.value; })
            : entries;
          if (!pool.length) return;
          var pick = pool[Math.floor(Math.random() * pool.length)];
          window.location.href = '/journal/' + pick.slug + '/';
        });
        box.hidden = false;
      })
      .catch(function () { /* manifest unavailable; button stays hidden */ });
  }
})();
