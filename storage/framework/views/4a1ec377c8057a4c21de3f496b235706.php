<?php
    $classes = [];
?>


<?php $__env->startSection('class'); ?>
    <?php echo e(join(' ', $classes)); ?>

<?php $__env->stopSection(true); ?>

<?php $__env->startSection('element'); ?>
    header
<?php $__env->stopSection(true); ?>

<?php $__env->startSection('content'); ?>
    <a href="<?php echo e(route('home')); ?>" class="site-header__logo fs-600">
        <?php echo e($options['site_name']); ?>

    </a>
    <ul class="nav fs-600">
        <?php $__currentLoopData = $block['links']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $link): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if($link['url'] !== ''): ?>
                <?php
                    if($link['type'] == 'internal') {
                        $json = json_decode($link['url'], true);
                        $path = key_exists('slug', $json) ? route($json['path'], $json['slug']) : route($json['path']);
                        $label = $link['label'] !== '' ? $link['label'] :  $json['label'];
                    } else {
                        $path = $link['url'];
                        $label = $link['label'];
                    }
                ?>
                <li><a href="<?php echo e($path); ?>" <?php if($loop->last): ?>class="button padding-inline-3" data-type="<?php echo e(menu_active($path) === 'aria-current=page' ? 'accent' : 'primary'); ?>" <?php else: ?> <?php echo e(menu_active($path)); ?><?php endif; ?>><?php echo e($label); ?></a></li>
            <?php endif; ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </ul>
    <button
        id="js-burger"
        class="site-header__burger"
        aria-controls="primary-navigation"
        aria-expanded="false"
        data-state="closed"
        aria-label="Menu"
    >
        <svg
            stroke="currentColor"
            fill="none"
            class="hamburger"
            viewBox="-10 -10 120 120"
            width="50"
        >
            <path
                class="line"
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m 20 40 h 60 a 1 1 0 0 1 0 20 h -60 a 1 1 0 0 1 0 -40 h 30 v 70"
            ></path>
        </svg>
    </button>
<?php $__env->stopSection(true); ?>

<?php echo $__env->make('core-cms::shared.blocks.layouts.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/storage/app/private/themes/netauratech/views/header.blade.php ENDPATH**/ ?>