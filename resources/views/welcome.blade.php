<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name', 'Haraj Maareb') }} — API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: #0d1117; color: #e6edf3;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; text-align: center;
        }
        .container { max-width: 500px; padding: 40px; }
        h1 { font-size: 2rem; margin-bottom: 12px; }
        p { color: #8b949e; margin-bottom: 24px; line-height: 1.6; }
        a {
            display: inline-block; padding: 10px 24px;
            background: #58a6ff; color: #fff; text-decoration: none;
            border-radius: 8px; font-weight: 600; transition: 0.2s;
        }
        a:hover { background: #79c0ff; }
        code { background: #161b22; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 {{ config('app.name', 'Haraj Maareb') }}</h1>
        <p>API Server is running.<br>
        Base URL: <code>{{ url('/api/v1') }}</code></p>
        <a href="/api/documentation">📋 API Documentation</a>
    </div>
</body>
</html>
