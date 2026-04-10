<?php

use Netauratech\CoreCms\Contracts\ThemeMiddlewareInterface;
use Netauratech\CoreCms\Http\Middlewares\BackupSessionForEsi;
use Netauratech\CoreCms\Http\Middlewares\SmartCacheControlMiddleware;

return [
    'admin' => [
        'middleware' => [
            'auth',
            'web',
            'lscache:no-cache',
            ThemeMiddlewareInterface::class,
            BackupSessionForEsi::class,
            SmartCacheControlMiddleware::class
        ],
        'prefix' => 'admin',
        'name' => 'admin.',
    ],
    'media' => [
        'model' => null
    ]
];