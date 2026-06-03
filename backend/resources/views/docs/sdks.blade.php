@extends('layouts.docs')

@section('title', 'SDKs & Libraries')

@section('content')
<div class="page-header">
    <p class="page-header__eyebrow">SDKs &amp; Libraries</p>
    <h1 id="sdks">Client libraries</h1>
    <p class="page-header__lead">
        The API is a plain JSON-over-HTTPS service &mdash; any HTTP client can talk to it.
        Below are minimal examples using the most common languages and their standard libraries.
    </p>
</div>

<section class="section">
    <div class="callout callout--info">
        <strong>No SDK is required.</strong>
        The Pasona Finance Tracker API is a thin REST layer over Laravel Sanctum. The code samples
        in the right-hand panel of every endpoint page are designed to be copy-pasteable into
        your project.
    </div>
</section>

<section class="section">
    <div class="cards">
        <div class="card">
            <div class="card__icon card__icon--blue"><span class="sdk-icon">PHP</span></div>
            <h3>PHP (cURL)</h3>
            <p>Works with PHP 7.4+ using the bundled <code>curl</code> and <code>json</code> extensions.</p>
            @include('partials.code-block', [
                'id'       => 'sdk-php-curl',
                'language' => 'php',
                'title'    => 'EXAMPLE',
                'code'     => "\$ch = curl_init('{$base}/summary');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_TOKEN',
        'Accept: application/json',
    ],
]);
\$summary = json_decode(curl_exec(\$ch), true);",
            ])
        </div>

        <div class="card">
            <div class="card__icon card__icon--green"><span class="sdk-icon">JS</span></div>
            <h3>JavaScript / TypeScript</h3>
            <p>Uses the built-in <code>fetch</code> API &mdash; works in browsers, Node 18+, Deno, and Bun.</p>
            @include('partials.code-block', [
                'id'       => 'sdk-js-fetch',
                'language' => 'js',
                'title'    => 'EXAMPLE',
                'code'     => "const res = await fetch('{$base}/summary', {
  headers: { 'Authorization': `Bearer \${token}` },
});
const summary = await res.json();",
            ])
        </div>

        <div class="card">
            <div class="card__icon card__icon--purple"><span class="sdk-icon">PY</span></div>
            <h3>Python (requests)</h3>
            <p>Install with <code>pip install requests</code>. Works on Python 3.7+.</p>
            @include('partials.code-block', [
                'id'       => 'sdk-py-requests',
                'language' => 'python',
                'title'    => 'EXAMPLE',
                'code'     => "import requests

summary = requests.get(
    '{$base}/summary',
    headers={'Authorization': f'Bearer {token}'},
).json()",
            ])
        </div>

        <div class="card">
            <div class="card__icon card__icon--orange"><span class="sdk-icon">RB</span></div>
            <h3>Ruby (net/http)</h3>
            <p>Uses the stdlib <code>net/http</code> &mdash; no gem required.</p>
            @include('partials.code-block', [
                'id'       => 'sdk-rb-nethttp',
                'language' => 'ruby',
                'title'    => 'EXAMPLE',
                'code'     => "require 'net/http'
require 'json'
require 'uri'

uri = URI('{$base}/summary')
req = Net::HTTP::Get.new(uri)
req['Authorization'] = 'Bearer YOUR_TOKEN'
res = Net::HTTP.start(uri.hostname, uri.port) { |h| h.request(req) }
summary = JSON.parse(res.body)",
            ])
        </div>

        <div class="card">
            <div class="card__icon card__icon--cyan"><span class="sdk-icon">GO</span></div>
            <h3>Go (net/http)</h3>
            <p>Standard library only &mdash; no third-party packages needed.</p>
            @include('partials.code-block', [
                'id'       => 'sdk-go-nethttp',
                'language' => 'go',
                'title'    => 'EXAMPLE',
                'code'     => "req, _ := http.NewRequest(\"GET\", \"{$base}/summary\", nil)
req.Header.Set(\"Authorization\", \"Bearer YOUR_TOKEN\")
res, _ := http.DefaultClient.Do(req)
defer res.Body.Close()
io.Copy(os.Stdout, res.Body)",
            ])
        </div>

        <div class="card">
            <div class="card__icon card__icon--pink"><span class="sdk-icon">CS</span></div>
            <h3>C# (HttpClient)</h3>
            <p>Works on .NET 6+ and .NET Framework 4.6.1+.</p>
            @include('partials.code-block', [
                'id'       => 'sdk-cs-httpclient',
                'language' => 'cs',
                'title'    => 'EXAMPLE',
                'code'     => "using var client = new HttpClient();
client.DefaultRequestHeaders.Add(\"Authorization\", \"Bearer YOUR_TOKEN\");
var json = await client.GetStringAsync(\"{$base}/summary\");",
            ])
        </div>
    </div>
</section>

<section class="section">
    <h2 id="community-sdks">Community libraries</h2>
    <p class="muted">
        We don't ship official SDK packages yet. If you build a reusable client for the
        Pasona Finance Tracker API, open a pull request and we'll link it here.
    </p>
</section>
@endsection
