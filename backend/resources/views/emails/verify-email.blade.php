<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify your Pasona email</title>
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

  .wrapper { max-width: 560px; margin: 0 auto; }

  .header { text-align: center; padding-bottom: 24px; }
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

  .card {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e0dbd4;
  }

  .hero { padding: 40px 40px 0; border-bottom: 1px solid #f0ebe4; }
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

  .cta-wrap { padding: 0 40px 8px; }
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

  .fineprint {
    padding: 12px 40px 32px;
    font-size: 12px;
    color: #9e9288;
    text-align: center;
  }

  .divider { border: none; border-top: 1px solid #f0ebe4; margin: 0; }

  .panel-wrap { padding: 28px 40px 8px; }
  .panel {
    background: #FAF8F5;
    border: 1px solid #e8e2da;
    border-radius: 12px;
    padding: 20px 24px;
  }
  .panel-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #9e8f5e;
    margin-bottom: 12px;
  }
  .panel p { font-size: 14px; color: #3d3830; line-height: 1.6; }
  .panel p + p { margin-top: 8px; }

  .signoff {
    padding: 24px 40px 32px;
    font-size: 14px;
    color: #6b6560;
    line-height: 1.8;
  }
  .signoff strong { color: #111; }

  .subcopy {
    background: #FAF8F5;
    border-top: 1px solid #f0ebe4;
    padding: 20px 40px;
    font-size: 12px;
    color: #9e9288;
    line-height: 1.6;
    word-break: break-all;
  }
  .subcopy a { color: #6b6560; text-decoration: underline; }

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

    <div class="hero">
      <p class="hero-eyebrow">One last step</p>
      <h1>Hey {{ $firstName }}, let's verify your email.</h1>
      <p>You're one click away from full access to Pasona. Confirm <strong>{{ $email }}</strong> and you're set.</p>
    </div>

    <div class="cta-wrap">
      <a href="{{ $actionUrl }}" class="cta-btn">Verify my email &rarr;</a>
    </div>

    <p class="fineprint">This link is good for 60 minutes. After that, you can always request a fresh one from your Pasona settings.</p>

    <hr class="divider">

    <div class="panel-wrap">
      <div class="panel">
        <p class="panel-label">What you get</p>
        <p><strong>Track every naira.</strong> Income, expenses, transfers — all in one place.</p>
        <p><strong>All your accounts, unified.</strong> GTBank, OPay, Kuda, cash in your wallet.</p>
        <p><strong>Drop in a bank statement.</strong> We'll handle the parsing and flag duplicates.</p>
        <p><strong>Reports that make sense.</strong> Monthly summaries and category breakdowns.</p>
      </div>
    </div>

    <div class="signoff">
      Didn't sign up for Pasona? No worries — just ignore this message and nothing happens to your inbox.<br><br>
      Talk soon,<br>
      <strong>The Pasona team</strong>
    </div>

    <div class="subcopy">
      Having trouble with the button? Paste this URL into your browser:<br>
      <a href="{{ $actionUrl }}">{{ $actionUrl }}</a>
    </div>

  </div>

  <div class="footer-mark">Pasona &mdash; know your naira</div>

</div>
</body>
</html>
