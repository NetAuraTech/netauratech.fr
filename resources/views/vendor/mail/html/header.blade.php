@props(['url', 'logo', 'sitename'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if ($logo !== '')
<img src="{{ $url }}{{ image_url($logo) }}" class="logo" alt="{{ $sitename }} Logo">
@else
<h1 style="font-size: 40px">{{ $sitename }}</h1>
@endif
</a>
</td>
</tr>
