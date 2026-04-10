<x-mail::layout>
    {{-- Header --}}
    <x-slot:header>
        <x-mail::header :url="$url" :sitename="$sitename" :logo="$logo">
            {{ $sitename }}
        </x-mail::header>
    </x-slot:header>

    {{-- Body --}}
    {{ $slot }}

    {{-- Subcopy --}}
    @isset($subcopy)
        <x-slot:subcopy>
            <x-mail::subcopy>
                {{ $subcopy }}
            </x-mail::subcopy>
        </x-slot:subcopy>
    @endisset

    {{-- Footer --}}
    <x-slot:footer>
        <x-mail::footer>
            © {{ date('Y') }} {{ $sitename }}. @lang('core-cms::mail.rights')
        </x-mail::footer>
    </x-slot:footer>
</x-mail::layout>
