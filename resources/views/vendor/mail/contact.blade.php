<x-mail::message :sitename="$sitename" :logo="$logo" :url="$url">
    # {{ __('core-cms::mail.contact.request.value') }}

    - {{ __('cms.lastname') }}: {{ $data['lastname'] }}
    - {{ __('cms.firstname') }}: {{ $data['firstname'] }}
    - {{ __('cms.email') }}: {{ $data['email'] }}
    - {{ __('cms.phone') }}: {{ $data['phone'] }}

    {{ $data['content'] }}
</x-mail::message>
