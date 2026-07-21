/* Noteplay — shared front-end behaviour */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Mobile nav ---- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  }

  /* ---- Generate hero waveform bars ---- */
  document.querySelectorAll('.waveform').forEach(wf => {
    const barCount = 46;
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('span');
      const h = 14 + Math.round(Math.random() * 50);
      bar.style.height = h + 'px';
      bar.style.animationDelay = (Math.random() * 1.4).toFixed(2) + 's';
      bar.style.animationDuration = (1.1 + Math.random() * 1).toFixed(2) + 's';
      wf.appendChild(bar);
    }
  });

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---- Cookie notice ---- */
  const cookieBar = document.getElementById('cookieBar');
  if (cookieBar) {
    const KEY = 'noteplay_cookie_choice';
    if (!localStorage.getItem(KEY)) {
      setTimeout(() => cookieBar.classList.add('show'), 900);
    }
    cookieBar.querySelectorAll('[data-cookie]').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem(KEY, btn.dataset.cookie);
        cookieBar.classList.remove('show');
      });
    });
  }

  /* ---- Sticky nav shadow on scroll ---- */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.boxShadow = window.scrollY > 8 ? '0 10px 30px -20px rgba(0,0,0,.6)' : 'none';
    }, { passive: true });
  }
});
