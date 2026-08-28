// The site's one script. Hand-written, no dependencies. Everything here
// is an enhancement: with JS off the site is complete and readable.
// All motion respects prefers-reduced-motion.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // --- Reveal on scroll: week stops on the trail, photos in a post ---
  var reveals = document.querySelectorAll('.week-stop, .snap');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (records) {
      records.forEach(function (r) {
        if (r.isIntersecting) {
          r.target.classList.add('seen');
          io.unobserve(r.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (s) { io.observe(s); });
  } else {
    reveals.forEach(function (s) { s.classList.add('seen'); });
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

  // --- Photos: click or tap a snap to see it properly ----------------
  // Built here rather than in the template so it simply doesn't exist
  // without JS — where the photos are already perfectly readable inline.
  var photos = document.querySelectorAll('.snap img');
  if (photos.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Close photo">×</button>' +
      '<img alt=""><p class="lightbox-caption"></p>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lightbox-caption');
    var lbClose = lb.querySelector('.lightbox-close');
    var lastFocused = null;

    function openLightbox(img) {
      lastFocused = img;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      var fig = img.closest('figure');
      var cap = fig && fig.querySelector('figcaption');
      lbCap.textContent = cap ? cap.textContent : '';
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }

    function closeLightbox() {
      lb.hidden = true;
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    photos.forEach(function (img) {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'View photo larger' + (img.alt ? ': ' + img.alt : ''));
      img.addEventListener('click', function () { openLightbox(img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(img);
        }
      });
    });

    lb.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lb.hidden) closeLightbox();
      // Keep focus inside the dialog while it's open.
      if (e.key === 'Tab' && !lb.hidden) {
        e.preventDefault();
        lbClose.focus();
      }
    });
  }
})();
