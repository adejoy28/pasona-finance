{{--
    Reusable HTTP method badge.
    Usage: @include('partials.method-badge', ['method' => 'POST'])
--}}
@php
    $method = strtoupper($method ?? 'GET');
    $classMap = [
        'GET'    => 'method-badge--get',
        'POST'   => 'method-badge--post',
        'PUT'    => 'method-badge--put',
        'PATCH'  => 'method-badge--put',
        'DELETE' => 'method-badge--delete',
    ];
    $cls = $classMap[$method] ?? 'method-badge--get';
@endphp
<span class="method-badge {{ $cls }}">{{ $method }}</span>
