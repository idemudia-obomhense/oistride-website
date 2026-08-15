// OIStride — shared interactivity

document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle — full-screen overlay menu, driven entirely by CSS
  // classes (see .nav-links.mobile-open) so it never fights inline styles.
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    const closeMenu = () => {
      links.classList.remove('mobile-open');
      toggle.classList.remove('active');
      document.body.style.overflow = '';
    };
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('mobile-open');
      toggle.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Any link navigates away, so close the whole menu behind it.
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', closeMenu);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    });
  }

  // Sticky mobile Enroll CTA — appears once the hero has scrolled past,
  // so converting doesn't require scrolling back up.
  const stickyCta = document.querySelector('.sticky-mobile-cta');
  if (stickyCta) {
    const hero = document.querySelector('.page-hero, .hero');
    document.body.classList.add('has-sticky-cta');
    const toggleSticky = () => {
      if (!hero) return;
      stickyCta.classList.toggle('visible', hero.getBoundingClientRect().bottom < 0);
    };
    toggleSticky();
    window.addEventListener('scroll', toggleSticky, { passive: true });
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Price toggle (Pay in Full / Pay Monthly)
  document.querySelectorAll('[data-price-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.pricing-card') || document;
      group.querySelectorAll('[data-price-tab]').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('[data-price-panel]').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = group.querySelector(`[data-price-panel="${btn.dataset.priceTab}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        if (o !== item) { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  // Multi-step application form
  const form = document.querySelector('[data-multistep]');
  if (form) {
    const steps = [...form.querySelectorAll('.form-step')];
    const dots = [...form.querySelectorAll('.step-dot')];
    let current = 0;

    function show(i) {
      steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
      dots.forEach((d, idx) => d.classList.toggle('active', idx <= i));
      current = i;
    }

    form.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const activeStep = steps[current];
        const requiredFields = activeStep.querySelectorAll('[required]');
        let valid = true;
        requiredFields.forEach(f => { if (!f.value.trim()) { valid = false; f.style.borderColor = '#E5484D'; } else { f.style.borderColor = ''; } });
        if (!valid) return;
        if (current < steps.length - 1) show(current + 1);
      });
    });
    form.querySelectorAll('[data-prev]').forEach(btn => {
      btn.addEventListener('click', () => { if (current > 0) show(current - 1); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Honeypot check
      const honey = form.querySelector('.honeypot input');
      if (honey && honey.value) return; // silently drop bot submissions
      window.location.href = 'thank-you.html?type=application';
    });

    show(0);
  }

  // Simple checkout / brochure / consultation forms (front-end demo only)
  document.querySelectorAll('[data-demo-form]').forEach(f => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const honey = f.querySelector('.honeypot input');
      if (honey && honey.value) return;
      const dest = f.getAttribute('data-demo-form') || 'thank-you.html';
      window.location.href = dest;
    });
  });

  // Hero cursor glow + visual tilt (homepage only — heroEl/glow only exist there)
  const heroEl = document.getElementById('heroEl');
  const glow = document.getElementById('glow');
  const heroVisual = document.getElementById('heroVisual');
  if (heroEl && glow) {
    heroEl.addEventListener('mousemove', (e) => {
      const r = heroEl.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      glow.style.left = x + 'px';
      glow.style.top = y + 'px';
      if (heroVisual) {
        const cx = (x / r.width - 0.5) * 14;
        const cy = (y / r.height - 0.5) * 14;
        heroVisual.style.transform = `rotateY(${cx}deg) rotateX(${-cy}deg)`;
      }
    });
  }

  // Programs catalog filter pills — show/hide track sections, scroll to the
  // chosen one (skipped for "all", which just un-hides everything in place).
  const catFilterPills = document.querySelectorAll('.cat-filter-pill');
  if (catFilterPills.length) {
    const catSections = document.querySelectorAll('[data-track]');
    catFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter;
        catSections.forEach(sec => {
          sec.classList.toggle('hidden', !(filter === 'all' || sec.dataset.track === filter));
        });
        if (filter !== 'all') {
          const target = document.querySelector(`[data-track="${filter}"]`);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // Newsletter forms
  document.querySelectorAll('.newsletter-form').forEach(f => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = f.querySelector('button');
      const original = btn.textContent;
      btn.textContent = 'Subscribed ✓';
      setTimeout(() => { btn.textContent = original; f.reset(); }, 2400);
    });
  });

});
