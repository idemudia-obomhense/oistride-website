// OIStride — Auth (Supabase)
// Requires supabase-config.js and the Supabase CDN script to load first.

(function () {
  'use strict';

  if (typeof window.supabase === 'undefined' || typeof SUPABASE_URL === 'undefined') {
    console.error('OIStride auth: Supabase client or config missing.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const PENDING_PROGRAM_KEY = 'oistride_pending_program';
  const FROM_ENROLL_KEY = 'oistride_pending_from_enroll';

  window.OIStrideAuth = { client };

  // ---------------------------------------------------------------------
  // Session state — single source of truth, kept current via
  // onAuthStateChange rather than re-querying getSession() ad hoc from
  // each call site. Everything that needs "is there a session right now"
  // (nav, the Enroll gate, the checkout guard) reads through
  // getCurrentSession() below, so there's exactly one place that can be
  // wrong instead of several that can drift out of sync with each other.
  // ---------------------------------------------------------------------
  let currentSession = null;
  let sessionReady = null;

  function initSessionTracking() {
    sessionReady = client.auth.getSession().then(({ data }) => {
      currentSession = data.session;
      refreshNavState();
      return currentSession;
    });

    client.auth.onAuthStateChange((_event, session) => {
      currentSession = session;
      refreshNavState();
    });
  }

  async function getCurrentSession() {
    if (sessionReady) await sessionReady;
    return currentSession;
  }

  // ---------------------------------------------------------------------
  // Modal DOM (injected once per page)
  // ---------------------------------------------------------------------
  let overlay, modal;

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-modal" role="dialog" aria-modal="true">
        <button type="button" class="auth-close" aria-label="Close">&times;</button>

        <div class="auth-screen active" data-screen="signup">
          <h2>Create your account to enroll</h2>
          <p class="auth-sub">Takes less than a minute. You'll finish enrolling right after.</p>
          <form data-form="signup">
            <div class="form-row"><label>First name</label><input type="text" name="firstName" autocomplete="given-name" required></div>
            <div class="form-row"><label>Last name</label><input type="text" name="lastName" autocomplete="family-name" required></div>
            <div class="form-row"><label>Email</label><input type="email" name="email" autocomplete="email" required></div>
            <div class="form-row"><label>Phone number <span class="auth-optional">(optional)</span></label><input type="tel" name="phone" autocomplete="tel"></div>
            <div class="form-row"><label>Password</label>
              <div class="password-field">
                <input type="password" name="password" autocomplete="new-password" minlength="6" required>
                <button type="button" class="password-toggle" data-password-toggle aria-label="Show password">
                  <svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg class="icon-eye-off hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>
            <div class="auth-error" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">Continue</button>
          </form>
          <div class="auth-footer">Already have an account? <a href="#" data-switch="signin">Log in</a></div>
        </div>

        <div class="auth-screen" data-screen="signin">
          <h2>Log in to OIStride</h2>
          <form data-form="signin">
            <div class="form-row"><label>Email</label><input type="email" name="email" autocomplete="email" required></div>
            <div class="form-row"><label>Password</label>
              <div class="password-field">
                <input type="password" name="password" autocomplete="current-password" required>
                <button type="button" class="password-toggle" data-password-toggle aria-label="Show password">
                  <svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg class="icon-eye-off hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>
            <div class="auth-forgot"><a href="#" data-switch="forgot">Forgot password?</a></div>
            <div class="auth-error" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">Log In</button>
          </form>
          <div class="auth-footer">New here? <a href="#" data-switch="signup">Create an account</a></div>
        </div>

        <div class="auth-screen" data-screen="forgot">
          <h2>Reset your password</h2>
          <p class="auth-sub">Enter the email on your account and we'll send you a reset link.</p>
          <form data-form="forgot">
            <div class="form-row"><label>Email</label><input type="email" name="email" autocomplete="email" required></div>
            <div class="auth-error" hidden></div>
            <div class="auth-success" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
          </form>
          <div class="auth-footer"><a href="#" data-switch="signin">Back to log in</a></div>
        </div>

        <div class="auth-screen" data-screen="transition">
          <div class="auth-transition-msg">Account created. Let's finish enrolling.</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    modal = overlay.querySelector('.auth-modal');

    overlay.querySelector('.auth-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    overlay.querySelectorAll('[data-switch]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        clearErrors();
        showScreen(el.getAttribute('data-switch'));
      });
    });

    overlay.querySelector('[data-form="signup"]').addEventListener('submit', handleSignUp);
    overlay.querySelector('[data-form="signin"]').addEventListener('submit', handleSignIn);
    overlay.querySelector('[data-form="forgot"]').addEventListener('submit', handleForgotPassword);
  }

  function showScreen(name) {
    overlay.querySelectorAll('.auth-screen').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-screen') === name);
    });
  }

  function clearErrors() {
    overlay.querySelectorAll('.auth-error').forEach((el) => { el.hidden = true; el.textContent = ''; });
  }

  function showError(form, message) {
    const el = form.querySelector('.auth-error');
    el.textContent = message;
    el.hidden = false;
  }

  function openModal(screen) {
    clearErrors();
    showScreen(screen || 'signup');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ---------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------
  async function handleSignUp(e) {
    e.preventDefault();
    const form = e.target;
    clearErrors();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Creating account…';

    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const password = form.password.value;

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName, phone: phone || null } }
    });

    btn.disabled = false; btn.textContent = original;

    if (error) { showError(form, error.message); return; }

    currentSession = data.session;
    refreshNavState();

    const pendingProgram = sessionStorage.getItem(PENDING_PROGRAM_KEY);
    if (pendingProgram && data.user) {
      await markEnrollmentStarted(data.user.id, pendingProgram);
    }

    if (pendingProgram) {
      showScreen('transition');
      setTimeout(() => { window.location.href = 'checkout.html?program=' + encodeURIComponent(pendingProgram); }, 900);
    } else {
      closeModal();
      window.location.href = 'index.html';
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    const form = e.target;
    clearErrors();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Logging in…';

    const email = form.email.value.trim();
    const password = form.password.value;

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    btn.disabled = false; btn.textContent = original;

    if (error) { showError(form, error.message); return; }

    currentSession = data.session;
    refreshNavState();

    const pendingProgram = sessionStorage.getItem(PENDING_PROGRAM_KEY);
    const fromEnroll = sessionStorage.getItem(FROM_ENROLL_KEY) === '1';

    if (fromEnroll && pendingProgram) {
      closeModal();
      window.location.href = 'checkout.html?program=' + encodeURIComponent(pendingProgram);
      return;
    }

    // Top-nav sign-in: route to an incomplete enrollment if one exists,
    // otherwise home. This is the most valuable redirect case — a
    // returning user who started but never finished checkout.
    const incompleteSlug = await getIncompleteEnrollment(data.user.id);
    closeModal();
    window.location.href = incompleteSlug
      ? 'checkout.html?program=' + encodeURIComponent(incompleteSlug)
      : 'index.html';
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const form = e.target;
    clearErrors();
    const successEl = form.querySelector('.auth-success');
    successEl.hidden = true;
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';

    const email = form.email.value.trim();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: new URL('reset-password.html', window.location.href).toString()
    });

    btn.disabled = false; btn.textContent = original;

    if (error) { showError(form, error.message); return; }
    successEl.textContent = 'Check your email for a reset link.';
    successEl.hidden = false;
    form.reset();
  }

  async function signOut() {
    await client.auth.signOut();
    currentSession = null;
    // checkout.html requires a session to make sense, so redirect away from
    // it; everywhere else, just re-render the nav back to "Sign In" in place.
    if (/checkout\.html$/.test(window.location.pathname)) {
      window.location.href = 'index.html';
      return;
    }
    refreshNavState();
  }

  // ---------------------------------------------------------------------
  // Enrollment tracking (drives the "incomplete enrollment" redirect)
  // ---------------------------------------------------------------------
  async function markEnrollmentStarted(userId, programSlug) {
    await client.from('enrollments').upsert(
      { user_id: userId, program_slug: programSlug, status: 'started' },
      { onConflict: 'user_id,program_slug', ignoreDuplicates: false }
    );
  }

  async function getIncompleteEnrollment(userId) {
    const { data } = await client
      .from('enrollments')
      .select('program_slug')
      .eq('user_id', userId)
      .eq('status', 'started')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? data.program_slug : null;
  }

  // Exposed so checkout.html's existing demo submit handler can mark the
  // enrollment complete once payment (currently still a demo) "succeeds".
  window.OIStrideAuth.markEnrollmentCompleted = async function (programSlug) {
    const session = await getCurrentSession();
    if (!session) return;
    await client.from('enrollments').update({ status: 'completed' })
      .eq('user_id', session.user.id).eq('program_slug', programSlug);
  };

  // ---------------------------------------------------------------------
  // Nav state (Sign In link <-> "Hi, Name ▾" menu). Driven purely by
  // currentSession — called on initial load and on every auth state
  // change (see initSessionTracking), never only once.
  // ---------------------------------------------------------------------
  function refreshNavState() {
    const slots = document.querySelectorAll('[data-auth-slot]');
    slots.forEach((slot) => renderAuthSlot(slot, currentSession));
  }

  function renderAuthSlot(slot, session) {
    if (session) {
      const meta = session.user.user_metadata || {};
      const firstName = meta.first_name || (session.user.email || '').split('@')[0];
      slot.innerHTML = `
        <div class="user-menu">
          <button type="button" class="user-menu-trigger">Hi, ${escapeHtml(firstName)} <span>▾</span></button>
          <div class="user-menu-panel">
            <button type="button" data-action="signout">Log out</button>
          </div>
        </div>`;
      const trigger = slot.querySelector('.user-menu-trigger');
      const menu = slot.querySelector('.user-menu');
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', () => menu.classList.remove('open'));
      slot.querySelector('[data-action="signout"]').addEventListener('click', signOut);
    } else {
      slot.innerHTML = `<a href="#" class="nav-signin" data-auth-trigger="signin">Sign In</a>`;
      slot.querySelector('[data-auth-trigger="signin"]').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem(PENDING_PROGRAM_KEY);
        sessionStorage.removeItem(FROM_ENROLL_KEY);
        openModal('signin');
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Enroll Now / Enroll & Pay interception (the actual gate)
  // ---------------------------------------------------------------------
  function wireEnrollLinks() {
    document.querySelectorAll('a[href^="checkout.html?program="]').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        const url = new URL(el.getAttribute('href'), window.location.href);
        const slug = url.searchParams.get('program');
        const session = await getCurrentSession();
        if (session) {
          window.location.href = el.getAttribute('href');
          return;
        }
        sessionStorage.setItem(PENDING_PROGRAM_KEY, slug);
        sessionStorage.setItem(FROM_ENROLL_KEY, '1');
        openModal('signup');
      });
    });
  }

  // ---------------------------------------------------------------------
  // checkout.html guard — Step 2 requires a session. A visitor who lands
  // here directly (bookmark, shared link) without one gets the sign-up
  // screen instead of a broken/empty checkout page, with intent preserved.
  // ---------------------------------------------------------------------
  async function guardCheckout() {
    if (!/checkout\.html$/.test(window.location.pathname)) return;
    const session = await getCurrentSession();
    if (session) return;
    const slug = new URLSearchParams(window.location.search).get('program');
    if (slug) {
      sessionStorage.setItem(PENDING_PROGRAM_KEY, slug);
      sessionStorage.setItem(FROM_ENROLL_KEY, '1');
    }
    openModal('signup');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSessionTracking();
    buildModal();
    wireEnrollLinks();
    guardCheckout();
  });
})();
