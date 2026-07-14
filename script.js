(function(){
  "use strict";

  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var progressFill = document.getElementById('progressFill');
  var slideNow = document.getElementById('slideNow');
  var slideTotal = document.getElementById('slideTotal');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var fsBtn = document.getElementById('fsBtn');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentIndex = 0;
  var animatedSlides = {};

  slideTotal.textContent = pad(total);

  function pad(n){ return n < 10 ? '0' + n : '' + n; }

  /* ---------------- active slide tracking ---------------- */
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var idx = slides.indexOf(entry.target);
      if(entry.isIntersecting && entry.intersectionRatio > 0.55){
        entry.target.classList.add('is-active');
        currentIndex = idx;
        updateChrome(idx);
        if(!animatedSlides[idx]){
          animatedSlides[idx] = true;
          runSlideAnimations(entry.target);
        }
      } else if(entry.intersectionRatio < 0.15){
        entry.target.classList.remove('is-active');
      }
    });
  }, { root: deck, threshold: [0, 0.15, 0.55, 1] });

  slides.forEach(function(s){ observer.observe(s); });

  function updateChrome(idx){
    slideNow.textContent = pad(idx + 1);
    progressFill.style.width = ((idx) / (total - 1) * 100) + '%';
  }

  /* ---------------- navigation ---------------- */
  function goTo(idx){
    if(idx < 0 || idx >= total) return;
    slides[idx].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function next(){ goTo(currentIndex + 1); }
  function prev(){ goTo(currentIndex - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  window.addEventListener('keydown', function(e){
    if(e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown'){
      e.preventDefault(); next();
    } else if(e.key === 'ArrowLeft' || e.key === 'PageUp'){
      e.preventDefault(); prev();
    } else if(e.key === 'Home'){
      e.preventDefault(); goTo(0);
    } else if(e.key === 'End'){
      e.preventDefault(); goTo(total - 1);
    }
  });

  /* touch swipe */
  var touchStartY = null;
  deck.addEventListener('touchstart', function(e){
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  deck.addEventListener('touchend', function(e){
    if(touchStartY === null) return;
    var dy = touchStartY - e.changedTouches[0].clientY;
    if(Math.abs(dy) > 60){ dy > 0 ? next() : prev(); }
    touchStartY = null;
  }, { passive: true });

  /* ---------------- fullscreen ---------------- */
  fsBtn.addEventListener('click', function(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  });

  /* ---------------- number counters ---------------- */
  function formatNumber(val, format, suffix, approx){
    var out;
    if(format === 'comma'){
      out = Math.round(val).toLocaleString('en-US');
    } else {
      out = (val % 1 === 0) ? String(Math.round(val)) : val.toFixed(1);
    }
    if(suffix) out += suffix;
    if(approx) out = '~' + out;
    return out;
  }

  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var format = el.getAttribute('data-format');
    var suffix = el.getAttribute('data-suffix') || '';
    var approx = el.getAttribute('data-approx') === 'true';
    if(reducedMotion){
      el.textContent = formatNumber(target, format, suffix, approx);
      return;
    }
    var duration = 1400;
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = target * eased;
      el.textContent = formatNumber(val, format, suffix, approx);
      if(progress < 1) requestAnimationFrame(step);
      else el.textContent = formatNumber(target, format, suffix, approx);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- percentage rings ---------------- */
  function animateRing(circle){
    var pct = parseFloat(circle.getAttribute('data-pct'));
    var circumference = 2 * Math.PI * 104;
    circle.style.strokeDasharray = circumference;
    var offset = circumference * (1 - pct / 100);
    requestAnimationFrame(function(){
      circle.style.strokeDashoffset = reducedMotion ? offset : circumference;
      requestAnimationFrame(function(){
        circle.style.strokeDashoffset = offset;
      });
    });
  }

  /* ---------------- per-slide animation trigger ---------------- */
  function runSlideAnimations(slideEl){
    var counters = slideEl.querySelectorAll('.stat-num[data-count]');
    counters.forEach(function(c){ animateCount(c); });

    var rings = slideEl.querySelectorAll('.ring-fill[data-pct]');
    rings.forEach(function(r){ animateRing(r); });
  }

  /* run animation for the first visible slide immediately */
  window.addEventListener('load', function(){
    updateChrome(0);
    if(slides[0]){
      slides[0].classList.add('is-active');
      animatedSlides[0] = true;
      runSlideAnimations(slides[0]);
    }
  });

})();
