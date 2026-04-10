<?php
    $menuManager = app(\Netauratech\CoreCms\Services\Admin\MenuManager::class);
    $menuItems = $menuManager->getMenuItems();
?>
<!DOCTYPE html>
<html lang="<?php echo e(Lang::locale()); ?>">
    <head>
        <meta charset="UTF-8">
        <title><?php echo $__env->yieldContent('title'); ?> | <?php echo e($options['site_name']); ?></title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimal-ui"/>
        <script defer src="<?php echo e(route('translations')); ?>"></script>
        <meta name="csrf-token" content="">
        <?php echo $__env->yieldContent('meta'); ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/ts/app.ts']); ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/ts/admin.ts']); ?>
        <?php if ($__env->exists('theme::assets.css')) echo $__env->make('theme::assets.css', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php if ($__env->exists('theme::assets.admin.css')) echo $__env->make('theme::assets.admin.css', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php if ($__env->exists('theme::assets.js')) echo $__env->make('theme::assets.js', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php if ($__env->exists('theme::assets.admin.js')) echo $__env->make('theme::assets.admin.js', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <meta name="csrf-token" content="">
        <?php if($favicon): ?>
            <link rel="apple-touch-icon" sizes="128x128" href="<?php echo e($favicon); ?>">
            <link rel="icon" type="image/webp" href="<?php echo e($favicon); ?>"/>
        <?php endif; ?>
    </head>
    <body>
        <div class="admin">
            <nav class="bg-neutral-200">
                <!-- TODO: Add condition if we have a logo, else write sitename -->
                <h2 class="heading-2 text-center padding-block-8"><?php echo e($options['site_name']); ?></h2>
                <ul>
                    <?php $__currentLoopData = $menuItems; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php if(isset($item['children'])): ?>
                            <h4 class="heading-4 padding-inline-4 padding-block-2"><?php echo e($item['label']); ?></h4>
                            <?php $__currentLoopData = $item['children']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $child): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <?php
                                    $childIconName = is_array($child['icon']) ? ($child['icon']['icon'] ?? '') : $child['icon'];
                                    $childIconPath = is_array($child['icon']) ? ($child['icon']['path'] ?? null) : null;
                                ?>
                                <li>
                                    <a href="<?php echo e(route($child['route'], $child['params'] ?? [])); ?>" <?php echo e(menu_active(route($child['route'], $child['params'] ?? []))); ?>><?php echo icon($childIconName, 'small', $childIconPath); ?>

                                        <?php echo e($child['label']); ?>

                                    </a>
                                </li>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        <?php else: ?>
                            <?php
                                $itemIconName = is_array($item['icon']) ? ($item['icon']['icon'] ?? '') : $item['icon'];
                                $itemIconPath = is_array($item['icon']) ? ($item['icon']['path'] ?? null) : null;
                            ?>
                            <li>
                                <a href="<?php echo e(route($item['route'], $item['params'] ?? [])); ?>" <?php echo e(menu_active(route($item['route'], $item['params'] ?? []))); ?>><?php echo icon($itemIconName, 'small', $itemIconPath); ?>

                                    <?php echo e($item['label']); ?>

                                </a>
                            </li>
                        <?php endif; ?>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </ul>
            </nav>
            <header style="padding-inline: 2rem">
                <div class="flex-group align-items-center justify-content-space-between" style="width: 100%">
                    <site-notifications></site-notifications>
                    <div class="flex-group align-items-center">
                        <form class="clr-red-300" action="<?php echo e(route('admin.cache')); ?>" method="post">
                            <?php echo csrf_field(); ?>
                            <?php echo method_field('delete'); ?>
                            <button class="button flex-group align-items-center" data-type="transparent" type="submit" title="<?php echo e(__('core-cms::admin.cache.clear')); ?>" style="background-color: transparent">
                                <?php echo icon('cache', 'small'); ?>

                            </button>
                        </form>
                        <form action="<?php echo e(route('logout')); ?>" method="post">
                            <?php echo csrf_field(); ?>
                            <button class="button padding-0" data-type="transparent"><?php echo icon('logout', 'small'); ?></button>
                        </form>
                    </div>
                </div>
            </header>
            <main>
                <?php echo $__env->yieldContent('body'); ?>
            </main>
        </div>
    </body>
    <spotlight-bar></spotlight-bar>
    <script>
        window.cms = {
            ...(window.cms || {}),
            USER: <?php echo e(Auth::user() ? Auth::user()->id : 'null'); ?>,
            NOTIFICATION: new Date(<?php echo e((\Illuminate\Support\Facades\Auth::user() and \Illuminate\Support\Facades\Auth::user()->notifications_read_at) ? \Illuminate\Support\Facades\Auth::user()->getNotificationsReadAtTimestamp() : 0); ?> * 1000)
        };
    </script>
    <?php echo $__env->yieldContent('javascripts_footer'); ?>
</html><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/admin/base.blade.php ENDPATH**/ ?>