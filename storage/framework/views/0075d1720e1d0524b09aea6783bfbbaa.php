<?php $__env->startSection('stylesheets'); ?>
    <?php if ($__env->exists('theme::assets.admin.css')) echo $__env->make('theme::assets.admin.css', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <style>
        <?php echo e($css); ?>

    </style>
    <?php
        $contents = [$options['header'], $options['footer']];
    ?>
    <?php $__currentLoopData = $contents; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php
            $cacheBuster = substr(md5(json_encode($item->updated_at)), 0, 8);
            $cssPath = 'css/' . $item->slug . '.css';
        ?>
        <link rel="preload" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript>
            <link rel="stylesheet" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>">
        </noscript>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php $__env->stopSection(true); ?>

<?php $__env->startSection('header'); ?>
    <?php if($options['header'] !== ""): ?>
        <?php $__currentLoopData = $options['header']->getContent(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $block): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if ($__env->exists('core-cms::shared.blocks.renderer', ['block' => $block])) echo $__env->make('core-cms::shared.blocks.renderer', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    <?php endif; ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('footer'); ?>
    <?php if($options['footer'] !== ""): ?>
        <?php $__currentLoopData = $options['footer']->getContent(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $block): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if ($__env->exists('core-cms::shared.blocks.renderer', ['block' => $block])) echo $__env->make('core-cms::shared.blocks.renderer', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    <?php endif; ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('body'); ?>
    <div id="ve-components">
        <?php $__currentLoopData = $blocks; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $block): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if ($__env->exists('core-cms::shared.blocks.renderer', ['bloc' => $block, 'css' => null])) echo $__env->make('core-cms::shared.blocks.renderer', ['bloc' => $block, 'css' => null], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
<?php $__env->stopSection(true); ?>

<?php echo $__env->make('core-cms::base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/admin/contents/preview.blade.php ENDPATH**/ ?>