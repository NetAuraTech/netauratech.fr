<?php
$sitename = $sitename ?? env('APP_NAME');
$logo = $logo ?? '';
$url = $url ?? '';
?>

<x-mail::message :sitename="$sitename" :logo="$logo" :url="$url">
    {{-- Greeting --}}
    @if (! empty($greeting))
        # {{ $greeting }}
    @else
        @if ($level === 'error')
            # @lang('Whoops!')
        @else
            # {{ __('core-cms::mail.hello') }}
        @endif
    @endif

    {{-- Intro Lines --}}
    @foreach ($introLines as $line)
        {{ $line }}

    @endforeach

    {{-- Action Button --}}
    @isset($actionText)
            <?php
            $color = match ($level) {
                'success', 'error' => $level,
                default => 'primary',
            };
            ?>
        <x-mail::button :url="$actionUrl" :color="$color">
            {{ $actionText }}
        </x-mail::button>
    @endisset

    {{-- Outro Lines --}}
    @foreach ($outroLines as $line)
        {{ $line }}

    @endforeach

    {{-- Salutation --}}
    @if (! empty($salutation))
        {{ $salutation }}
    @else
        {{ __('core-cms::mail.regards') }}<br>
        {{ $sitename }}
    @endif

    {{-- Subcopy --}}
    @isset($actionText)
        <x-slot:subcopy>
            {{ __('core-cms::mail.help', ['actionText' => $actionText]) }}
            <span class="break-all">[{{ $displayableActionUrl }}]({{ $actionUrl }})</span>
        </x-slot:subcopy>
    @endisset
</x-mail::message>
