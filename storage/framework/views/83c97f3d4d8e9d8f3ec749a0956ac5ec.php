<?php
    $options = $options ?? [];
    $site_name = $options['site_name'] ?? config('app.name');
    $openGraphLogo = $openGraphLogo ?? '';
    $logo = url('/') . str_replace('&amp;', '&', image_url($openGraphLogo->id ?? ''));
?>

<!DOCTYPE html>
<html lang="<?php echo e(Lang::locale()); ?>">
    <head>
        <meta charset="UTF-8">
        <title><?php echo $__env->yieldContent('title'); ?> | <?php echo e($site_name); ?></title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <script src="<?php echo e(route('translations')); ?>"></script>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/ts/app.ts']); ?>
        <?php if ($__env->exists('theme::assets.css', ['header' => $options['header'], 'footer' => $options['footer']])) echo $__env->make('theme::assets.css', ['header' => $options['header'], 'footer' => $options['footer']], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?> 
        <?php if ($__env->exists('theme::assets.js')) echo $__env->make('theme::assets.js', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?> 
        <?php echo $__env->yieldContent('stylesheets'); ?> 
        <?php echo $__env->yieldContent('meta'); ?> 
        <?php echo $__env->yieldContent('description'); ?> 
        <meta name="csrf-token" content="">
        <meta name="view-transition" content="same-origin">
        
        <?php if($favicon): ?>
            <link rel="apple-touch-icon" sizes="128x128" href="<?php echo e($favicon); ?>">
            <link rel="icon" type="image/webp" href="<?php echo e($favicon); ?>"/>
        <?php endif; ?>

        
        <meta property='og:locale' content='<?php echo e(Lang::locale()); ?>'/>
        <meta property='og:type' content='website'/> 
        <meta property="og:title" content="<?php echo $__env->yieldContent('title'); ?>"/>
        <meta property="og:site_name" content="<?php echo e($site_name); ?>"/>
        <meta property="og:language" content="fr"/>
        <meta property='og:url' content="<?php echo e(Request::url()); ?>"/>

        <meta name='twitter:card' content='summary_large_image'/>
        <meta name='twitter:site' content="<?php echo e(Request::url()); ?>"/>
        <meta name='twitter:title' content="<?php echo $__env->yieldContent('title'); ?> | <?php echo e($site_name); ?>"/>

        <style>
            @view-transition {
                navigation: auto;
            }
        </style>
        <link rel='canonical' href="<?php echo e(Request::url()); ?>"/>
        <?php
            $alternateNames = array_values(array_filter(generateNameVariants($site_name), fn($v) => strtolower($v) !== strtolower($site_name)));

            $sameAs = [];
            $links = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'];

            foreach ($links as $link) {
                if (!empty($options[$link] ?? '')) {
                    $sameAs[] = $options[$link];
                }
            }

            $jsonLdOrganization = [
                "@context" => "https://schema.org",
                "@type" => "Organization",
                "name" => $site_name,
                "url" => Request::url(),
                "logo" => $logo,
                "contactPoint" => [
                    "@type" => "ContactPoint",
                    "contactType" => "customer service",
                    "telephone" => $options['phone'],
                    "email" => $options['contact-email'],
                ],
            ];

            if (!empty($alternateNames)) {
                $jsonLdOrganization["alternateName"] = $alternateNames;
            }

            if (!empty($sameAs)) {
                $jsonLdOrganization["sameAs"] = $sameAs;
            }
        ?>
        <script type="application/ld+json">
            <?php echo json_encode($jsonLdOrganization, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT); ?>

        </script>
        <?php echo $__env->yieldContent('jsonLd'); ?>
    </head>
    <body id="page-wrapper">
        <?php if (! (isset($hideHeaderFooter) && $hideHeaderFooter)): ?>
            <?php echo $__env->yieldContent('header'); ?>
        <?php endif; ?>
        <main class="body">
            <?php echo $__env->yieldContent('body'); ?>
        </main>
        <?php if (! (isset($hideHeaderFooter) && $hideHeaderFooter)): ?>
            <footer class="site-footer">
                <?php echo $__env->yieldContent('footer'); ?>
            </footer>
        <?php endif; ?>
        <script>
            <?php use Illuminate\Support\Facades\Auth; ?>
            window.auth = {
                ...(window.auth || {}),
                USER: <?php echo e(Auth::user() ? Auth::user()->id : 'null'); ?>,
                NOTIFICATION: new Date(<?php echo e((Auth::user() and Auth::user()->notifications_read_at) ? Auth::user()->getNotificationsReadAtTimestamp() : 0); ?>)
            };
        </script>
        <?php
            $assetManager = app(\Netauratech\CoreCms\Services\AssetManager::class);
        ?>
        <?php $__currentLoopData = $assetManager->getViewAssets(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $asset): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if ($__env->exists($asset)) echo $__env->make($asset, array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </body>
</html><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/base.blade.php ENDPATH**/ ?>