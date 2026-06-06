<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Pasona</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background-color: #F0EDE8;
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #1a1a1a;
    padding: 40px 16px;
    -webkit-font-smoothing: antialiased;
  }

  .wrapper {
    max-width: 560px;
    margin: 0 auto;
  }

  /* Header */
  .header {
    text-align: center;
    padding-bottom: 24px;
  }
  .logo {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #6b6560;
    border: 1px solid #d4cfc9;
    padding: 6px 16px;
    border-radius: 100px;
    background: #F0EDE8;
  }

  /* Card */
  .card {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e0dbd4;
  }

  /* Hero */
  .hero {
    padding: 40px 40px 0;
    border-bottom: 1px solid #f0ebe4;
  }
  .hero-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #9e8f5e;
    margin-bottom: 12px;
  }
  .hero h1 {
    font-size: 26px;
    font-weight: 600;
    line-height: 1.3;
    color: #111;
    margin-bottom: 12px;
  }
  .hero p {
    color: #6b6560;
    font-size: 15px;
    margin-bottom: 32px;
    max-width: 440px;
  }

  /* Steps */
  .steps-block {
    margin: 0 40px 32px;
    background: #FAF8F5;
    border: 1px solid #e8e2da;
    border-radius: 12px;
    padding: 20px 24px;
  }
  .steps-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #9e8f5e;
    margin-bottom: 16px;
  }
  .step-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 12px;
  }
  .step-row:last-child { margin-bottom: 0; }
  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #111;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
    font-family: 'DM Mono', monospace;
  }
  .step-text {
    font-size: 14px;
    color: #3d3830;
    line-height: 1.6;
  }

  /* CTA */
  .cta-wrap {
    padding: 0 40px 32px;
  }
  .cta-btn {
    display: block;
    text-align: center;
    background: #111;
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  /* Divider */
  .divider {
    border: none;
    border-top: 1px solid #f0ebe4;
    margin: 0;
  }

  /* Features */
  .features {
    padding: 28px 40px;
  }
  .features-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #9e8f5e;
    margin-bottom: 16px;
  }
  .feature-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }
  .feature-row:last-child { margin-bottom: 0; }
  .feature-icon {
    width: 32px;
    height: 32px;
    background: #FAF8F5;
    border: 1px solid #e8e2da;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 15px;
  }
  .feature-content strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #111;
    margin-bottom: 1px;
  }
  .feature-content span {
    font-size: 13px;
    color: #6b6560;
    line-height: 1.5;
  }

  /* Verify */
  .verify {
    margin: 0 40px;
    background: #FFFBF0;
    border: 1px solid #EDD98A;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 28px;
  }
  .verify-top {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #8a6d00;
    margin-bottom: 6px;
    font-family: 'DM Mono', monospace;
  }
  .verify p {
    font-size: 13px;
    color: #5a4a00;
    line-height: 1.6;
  }
  .verify strong { color: #3a3000; }

  /* Sign-off */
  .signoff {
    padding: 0 40px 32px;
    font-size: 14px;
    color: #6b6560;
    line-height: 1.8;
  }
  .signoff strong { color: #111; }

  /* Subcopy */
  .subcopy {
    background: #FAF8F5;
    border-top: 1px solid #f0ebe4;
    padding: 20px 40px;
    font-size: 12px;
    color: #9e9288;
    line-height: 1.6;
  }
  .subcopy a {
    color: #6b6560;
    text-decoration: underline;
  }

  /* Footer brand mark */
  .footer-mark {
    text-align: center;
    padding-top: 24px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #b0a89e;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <span class="logo">Pasona</span>
  </div>

  <div class="card">

    <!-- Hero -->
    <div class="hero">
      <p class="hero-eyebrow">Welcome aboard</p>
      <h1>Hey {{ $firstName }},<br>your finances just got clearer.</h1>
      <p>You made a small but mighty decision today — from here, you'll always know exactly where your naira goes.</p>
    </div>

    <!-- Steps -->
    <div class="steps-block">
      <p class="steps-label">Your first two minutes</p>
      <div class="step-row">
        <div class="step-num">1</div>
        <div class="step-text">Add your first account — cash, bank, or mobile money, all welcome</div>
      </div>
      <div class="step-row">
        <div class="step-num">2</div>
        <div class="step-text">Log a transaction or two — even the small ₦500 ones count</div>
      </div>
      <div class="step-row">
        <div class="step-num">3</div>
        <div class="step-text">Open the dashboard and watch your money's story take shape</div>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="{{ $dashboardUrl }}" class="cta-btn">Take me to my dashboard &rarr;</a>
    </div>

    <hr class="divider">

    <!-- Features -->
    <div class="features">
      <p class="features-label">What you can do with Pasona</p>

      <div class="feature-row">
        <div class="feature-icon">₦</div>
        <div class="feature-content">
          <strong>Track every naira</strong>
          <span>Income, expenses, transfers — logged in one place, nothing slipping through.</span>
        </div>
      </div>

      <div class="feature-row">
        <div class="feature-icon">🏦</div>
        <div class="feature-content">
          <strong>All your accounts, unified</strong>
          <span>GTBank, OPay, Kuda, cash in your wallet — see the full picture at once.</span>
        </div>
      </div>

      <div class="feature-row">
        <div class="feature-icon">📥</div>
        <div class="feature-content">
          <strong>Drop in a bank statement</strong>
          <span>Export from your banking app, paste it in — Pasona handles the parsing and flags duplicates.</span>
        </div>
      </div>

      <div class="feature-row">
        <div class="feature-icon">📊</div>
        <div class="feature-content">
          <strong>Reports that actually make sense</strong>
          <span>Monthly summaries and category breakdowns — no spreadsheet skills required.</span>
        </div>
      </div>
    </div>

    <hr class="divider">

    <!-- Verify -->
    <div style="padding: 28px 40px 0;">
      <div class="verify">
        <p class="verify-top">One step left</p>
        <p>We sent a verification email to <strong>{{ $email }}</strong>. Click the link in that email to fully unlock your account. If it doesn't land within two minutes, check your spam folder or use the <strong>resend verification</strong> link in your Pasona settings.</p>
      </div>
    </div>

    <!-- Sign-off -->
    <div class="signoff">
      Got a question, a problem, or just want to say hi? Hit reply — a real human reads every one of these (mostly John, the founder).<br><br>
      Welcome to the crew,<br>
      <strong>The Pasona team</strong>
    </div>

    <!-- Subcopy -->
    <div class="subcopy">
      This is your welcome email — the only automated message we'll send that isn't a transaction reminder or a security alert. You can manage notification preferences anytime in your <a href="{{ $settingsUrl }}">Pasona account settings</a>.
    </div>

  </div>

  <div class="footer-mark">Pasona &mdash; know your naira</div>

</div>
</body>
</html>
