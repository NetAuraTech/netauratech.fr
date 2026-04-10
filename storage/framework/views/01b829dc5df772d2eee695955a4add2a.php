<?php
    $block = $block ?? [];
?>

<?php $__env->startSection('content'); ?>
    <?php if(key_exists('title', $block) && $block['title'] !== ""): ?>
        <?php echo $__env->make('core-cms::shared.blocks.components.title', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php endif; ?>
    <?php if(key_exists('content', $block) && $block['content'] !== ""): ?>
        <?php echo $__env->make('core-cms::shared.blocks.components.content', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php endif; ?>
    <?php
        $classes = ['grid-auto-fit', 'block__' . substr(md5(json_encode($block)), 0, 8) . '-layout', $block['additional-classes'] ?? ""];
        if(key_exists('content', $block) && $block['content'] !== "" || key_exists('title', $block) && $block['title'] !== "") {
            $classes[] = 'margin-block-start-10';
        }
    ?>
    <div class="<?php echo e(join(" ", $classes)); ?>">
        <?php $__currentLoopData = $block['layout-items']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if ($__env->exists('core-cms::shared.blocks.renderer', ['block' => $item, 'key' => 'item-type', 'props' => ['useContainer' => false, 'section' => 'div']])) echo $__env->make('core-cms::shared.blocks.renderer', ['block' => $item, 'key' => 'item-type', 'props' => ['useContainer' => false, 'section' => 'div']], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
<?php $__env->stopSection(true); ?>

<?php echo $__env->make('core-cms::shared.blocks.components.base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/layouts/grid-auto-fit.blade.php ENDPATH**/ ?>