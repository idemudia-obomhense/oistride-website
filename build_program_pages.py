import json

NAV = '''          <div class="track-label">Career Acceleration</div>
          <a href="program-career.html">Land Your First Tech Job</a>
          <a href="program-career.html">Interview Mastery &amp; Job Search Strategy</a>
          <a href="program-career.html">Find Your Path in Tech</a>
          <div class="track-label">Agile Project Management</div>
          <a href="program-agile-project-management.html">Agile Project Management</a>
          <div class="track-label">Product School</div>
          <a href="program-product-management.html">Product Management</a>
          <a href="program-ai-product-management.html">AI Product Management</a>
          <div class="track-label">AI Fluency &amp; Building</div>
          <a href="program-ai.html">Understanding AI in Today's World</a>
          <a href="program-ai.html">From Idea to Validated Business</a>
          <a href="program-ai.html">Build &amp; Test Your Idea Fast with AI</a>
'''

HEAD_NAV = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{title}} — OIStride</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="{{track_class}}">

<nav class="nav">
  <div class="container">
    <a href="index.html" class="nav-logo"><img src="assets/img/logo.png" alt="OIStride"></a>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <div class="dropdown">
        <a href="index.html#programs" class="active">Programs</a>
        <div class="dropdown-panel">
{NAV}        </div>
      </div>
      <a href="consulting.html">Consulting</a>
      <a href="about.html">About</a>
      <a href="faq.html">FAQ</a>
    </div>
    <div class="nav-cta">
      <div data-auth-slot></div>
      <a href="contact.html" class="btn btn-outline btn-sm">Contact</a>
      <a href="book-a-call.html" class="btn btn-primary btn-sm">Book a Free Consultation</a>
    </div>
    <button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</nav>
'''

FOOTER = '''
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-logo"><img src="assets/img/logo-dark.png" alt="OIStride"></div>
        <p style="font-size:14px; max-width:260px;">A practice-led home for project &amp; product management training, career coaching, and AI-powered building.</p>
      </div>
      <div><h5>Programs</h5><ul>
        <li><a href="program-career.html">Career Acceleration</a></li>
        <li><a href="program-agile-project-management.html">Agile Project Management</a></li>
        <li><a href="program-product-management.html">Product Management</a></li>
        <li><a href="program-ai-product-management.html">AI Product Management</a></li>
        <li><a href="program-ai.html">AI Fluency &amp; Building</a></li>
        <li><a href="consulting.html">Consulting</a></li>
      </ul></div>
      <div><h5>Company</h5><ul>
        <li><a href="about.html">About</a></li>
        <li><a href="faq.html">FAQ</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="book-a-call.html">Book a Call</a></li>
      </ul></div>
      <div><h5>Contact</h5><ul>
        <li><a href="mailto:oistride12@gmail.com">oistride12@gmail.com</a></li>
        <li><a href="https://wa.me/2347043202407" target="_blank" rel="noopener">WhatsApp: 07043202407</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 OIStride. All rights reserved.</span>
      <span><a href="#">Privacy Policy</a> &nbsp;·&nbsp; <a href="#">Terms of Service</a></span>
    </div>
  </div>
</footer>

<div class="sticky-mobile-cta">
  <a href="#notify" class="btn btn-primary">Join the Waitlist</a>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/js/supabase-config.js"></script>
<script src="assets/js/auth.js"></script>
<script src="assets/js/main.js"></script>
</body>
</html>'''


def module_block(week, idx):
    bullets_prose = " ".join(b.rstrip(".") + "." for b in week["bullets"])
    app = week["application"].replace("APPLICATION: ", "").replace("CASE STUDY: ", "").title()
    return f'''
          <div class="module">
            <div class="m-num">{idx}</div>
            <div><h4>{week["title"]}</h4><p>{bullets_prose} Applied work: {app}.</p></div>
          </div>'''


def fit_grid(personas):
    yes_items = "".join(f"<li>{p['desc']}</li>" for p in personas[:4])
    return f'''
        <div class="fit-grid" style="margin-top:24px;">
          <div class="fit-card fit-yes">
            <h4>This is for you if:</h4>
            <ul>
              {yes_items}
            </ul>
          </div>
          <div class="fit-card fit-no">
            <h4>This may not be the right fit if:</h4>
            <ul>
              <li>You want a fully self-paced, no-live-session experience.</li>
              <li>You can't commit roughly two hours a week for three months.</li>
            </ul>
          </div>
        </div>'''


def build_page(cfg, track_class, title, breadcrumb, eyebrow, out_path):
    modules = "".join(module_block(w, i + 1) for i, w in enumerate(cfg["weeks"]))
    fit = fit_grid(cfg["personas"])
    walk_away_items = "".join(f'<li><span class="num">&rarr;</span> {c}</li>' for c in cfg["walk_away"])

    phase_summary = "".join(
        f'<div class="job-pill"><span class="dot"></span>{ph["title"]} &middot; Weeks {ph["weeks"]}</div>'
        for ph in cfg["phases"]
    )

    html = HEAD_NAV.format(title=title, track_class=track_class) + f'''
<header class="page-hero">
  <div class="container">
    <div class="breadcrumb"><a href="index.html">Home</a> / <a href="index.html#programs">Programs</a> / {breadcrumb}</div>
    <span class="eyebrow">{eyebrow}</span>
    <h1>{cfg["hero_title"]}</h1>
    <p class="lead">{cfg["hero_sub"]}</p>
    <div class="hero-actions" style="margin-top:30px;">
      <a href="#notify" class="btn btn-primary">Join the Waitlist</a>
      <a href="mailto:oistride12@gmail.com" class="btn btn-ghost-dark">Ask a Question</a>
    </div>
  </div>
</header>

<section class="section">
  <div class="container two-col">
    <div>

      <div class="reveal">
        <span class="eyebrow">What You'll Walk Away With</span>
        <h2 style="font-size:28px;">Real capability, not just notes</h2>
        <ul class="deepdive-list" style="margin-top:26px;">
          {walk_away_items}
        </ul>
      </div>

      <div class="reveal" style="margin-top:64px;">
        <span class="eyebrow">Program Structure</span>
        <h2 style="font-size:28px;">Three phases, twelve weeks</h2>
        <div class="job-grid" style="margin-top:24px;">
          {phase_summary}
        </div>
      </div>

      <div class="reveal" id="curriculum" style="margin-top:64px; scroll-margin-top:100px;">
        <span class="eyebrow">Curriculum</span>
        <h2 style="font-size:28px;">Twelve weeks, module by module</h2>
        <div style="margin-top:28px;">{modules}
        </div>
      </div>

      <div class="reveal" style="margin-top:64px;">
        <span class="eyebrow">Who This Is For</span>
        {fit}
      </div>

      <div class="reveal" style="margin-top:64px;">
        <span class="eyebrow">A Note on Facilitation</span>
        <p style="color:var(--grey); margin-top:14px; font-size:15.5px; line-height:1.7; max-width:640px;">Every cohort is led by an OIStride-trained facilitator, delivering the curriculum, case studies and standards set by our founder, Obomhense Idemudia (&ldquo;Jed&rdquo;) &mdash; a Senior Product Manager whose work spans fintech, healthcare and travel-tech. <a href="about.html" style="color:var(--indigo); font-weight:600;">Read more about OIStride</a>.</p>
      </div>

    </div>

    <div class="sticky-side">
      <div class="pricing-card reveal" id="notify" style="scroll-margin-top:100px;">
        <span class="badge-soft">Coming Soon</span>
        <h3 style="font-size:20px; margin-top:14px;">Be the first to know when applications open.</h3>
        <p style="color:var(--grey); font-size:14px; margin-top:10px; line-height:1.6;">We're building this properly rather than rushing it out. Leave your email and we'll reach out the moment cohorts open.</p>
        <form class="notify-form-light" style="margin-top:20px; display:flex; flex-direction:column; gap:10px;">
          <input type="email" placeholder="you@email.com" required style="width:100%; padding:14px 16px; border-radius:10px; border:1px solid var(--border); background:#fff; color:var(--navy); font-family:'Inter',sans-serif; font-size:14px;">
          <button type="submit" class="btn btn-primary btn-block">Notify Me</button>
        </form>
        <table class="fact-table" style="margin-top:20px;">
          <tr><td>Format</td><td>Live, weekly</td></tr>
          <tr><td>Duration</td><td>12 weeks</td></tr>
          <tr><td>Time commitment</td><td>~2 hrs/week + pre-reads</td></tr>
          <tr><td>Mentorship</td><td>Direct access throughout</td></tr>
        </table>
        <div class="soft-alt">Prefer to talk it through? <a href="book-a-call.html">Book a free consultation</a></div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container final-cta reveal">
    <p style="color:var(--grey);">In the meantime, our Agile Project Management cohort is open now, if that's closer to what you need.</p>
    <div class="hero-actions">
      <a href="program-agile-project-management.html" class="btn btn-outline">View Agile Project Management</a>
    </div>
  </div>
</section>
''' + FOOTER

    with open(out_path, "w") as f:
        f.write(html)
    print("wrote", out_path)


if __name__ == "__main__":
    pm = json.load(open("brochure-configs/pm.json"))
    aipm = json.load(open("brochure-configs/aipm.json"))

    build_page(pm, "track-product", "Product Management", "Product Management", "Product School · Coming Soon",
               "program-product-management.html")
    build_page(aipm, "track-ai", "AI Product Management", "AI Product Management", "Product School · Coming Soon",
               "program-ai-product-management.html")
