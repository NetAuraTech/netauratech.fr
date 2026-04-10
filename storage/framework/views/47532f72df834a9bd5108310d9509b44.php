<?php
    $block = $block ??  [];
    $useContainer = $useContainer ?? $block['use-container'] ?? true;
    $section = $section ?? 'section';
    $classes = ['links'];
?>


<?php $__env->startSection('class'); ?>
    <?php echo e(join(' ', $classes)); ?>

<?php $__env->stopSection(true); ?>

<?php $__env->startSection('element'); ?>
    <?php echo e($section); ?>

<?php $__env->stopSection(true); ?>

<?php $__env->startSection('content'); ?>
    <?php
        $linksClasses = [];

        if($useContainer) {
            $linksClasses[] = 'container';
        }
    ?>
    <div class="<?php echo e(join(" ", $linksClasses)); ?>">
        <?php if(key_exists('title', $block)  && $block['title'] !== ""): ?>
            <?php echo $__env->make('core-cms::shared.blocks.components.title', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endif; ?>
        <ul>
            <?php if(key_exists('links', $block)): ?>
                <?php $__currentLoopData = $block['links']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $link): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php
                        if($link['type'] == 'internal' && $link['url'] !== "") {
                            $json = json_decode($link['url'], true);
                            $path = key_exists('slug', $json) ? route($json['path'], $json['slug']) : route($json['path']);
                            $label = $link['label'] !== '' ? $link['label'] :  $json['label'];
                        } else {
                            $path = $link['url'];
                            $label = $link['label'];
                        }

                    ?>
                    <li><a href="<?php echo e($path); ?>" <?php echo e(menu_active($path)); ?>><?php echo e($label); ?></a></li>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            <?php endif; ?>
        </ul>
    </div>
<?php $__env->stopSection(true); ?>

<?php echo $__env->make('core-cms::shared.blocks.layouts.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/links.blade.php ENDPATH**/ ?>