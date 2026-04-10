<?php
    $block = $block ??  [];
    $useContainer = $useContainer ?? $block['use-container'] ?? true;
    $section = $section ?? 'section';
    $classes = ['section'];
?>


<?php $__env->startSection('class'); ?>
    <?php echo e(join(' ', $classes)); ?>

<?php $__env->stopSection(true); ?>

<?php $__env->startSection('element'); ?>
    <?php echo e($section); ?>

<?php $__env->stopSection(true); ?>

<?php $__env->startSection('content'); ?>
    <?php
        $sectionClasses = [];

        if($useContainer) {
            $sectionClasses[] = 'container';
        }

        $transitionName = null;
        if (key_exists('media-transition-name', $block) && $block['media-transition-name'] !== "") {
            $transitionName = $block['media-transition-name'];
        }
    ?>
    <div class="<?php echo e(join(" ", $sectionClasses)); ?>">
        <?php if(key_exists('media', $block) && $block['media']['id'] !== ""): ?>
            <div class="margin-block-end-6 text-center">
                <?php echo image_tag($block['media']['id'], $block['media']['alt'] ?: null, $block['media']['height'] ?: null, $transitionName, 'block__' . substr(md5(json_encode($block)), 0, 8) . '-media'); ?>

            </div>
        <?php endif; ?>
        <?php if(key_exists('title', $block)  && $block['title'] !== ""): ?>
            <?php echo $__env->make('core-cms::shared.blocks.components.title', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endif; ?>
        <?php if(key_exists('content', $block)  && $block['content'] !== ""): ?>
            <?php echo $__env->make('core-cms::shared.blocks.components.content', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endif; ?>
        <?php if(key_exists('ctas', $block) && count($block['ctas']) > 0): ?>
            <div class="flex-group align-items-center margin-block-start-4">
                <?php $__currentLoopData = $block['ctas']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $cta): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php echo $__env->make('core-cms::shared.blocks.components.cta', ['block' => $cta], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
        <?php endif; ?>
    </div>
<?php $__env->stopSection(true); ?>

<?php echo $__env->make('core-cms::shared.blocks.layouts.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/section.blade.php ENDPATH**/ ?>