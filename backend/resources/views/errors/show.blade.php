@extends('errors.layout')

@section('title', $action['title'])

@section('content')
    <div class="error-code">{{ $statusCode }}</div>
    <div class="error-divider"></div>
    <div class="error-title">{{ $action['title'] }}</div>
    <p class="error-message">{{ $action['message'] }}</p>

    <div class="btn-group">
        <a href="{{ $action['primary_action']['url'] }}" class="btn btn-primary">
            {{ $action['primary_action']['label'] }}
        </a>

        @if ($action['secondary_action'])
            <a href="{{ $action['secondary_action']['url'] }}" class="btn btn-secondary">
                {{ $action['secondary_action']['label'] }}
            </a>
        @endif
    </div>
@endsection
