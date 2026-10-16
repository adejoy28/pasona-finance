<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribed &middot; Pasona</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: #ffffff;
            max-width: 480px;
            width: 100%;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.05);
            padding: 40px 32px;
            text-align: center;
        }
        .icon-circle {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #16a34a;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
            margin-bottom: 12px;
        }
        .description {
            font-size: 15px;
            line-height: 1.6;
            color: #64748b;
            margin-bottom: 28px;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: #ffffff;
            font-weight: 700;
            font-size: 14px;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 12px;
            transition: background 0.15s ease;
        }
        .btn:hover {
            background: #1d4ed8;
        }
        .footer-note {
            margin-top: 24px;
            font-size: 13px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-circle">&#10003;</div>
        <h1 class="title">Preferences Updated</h1>
        <p class="description">{{ $message }}</p>
        <div>
            <a href="{{ $settingsUrl }}" class="btn">Manage Notification Settings</a>
        </div>
        <p class="footer-note">
            Need help? Reach out to support at <a href="mailto:pasona@adebayosystems.com.ng" style="color: #64748b; text-decoration: underline;">pasona@adebayosystems.com.ng</a>.
        </p>
    </div>
</body>
</html>
