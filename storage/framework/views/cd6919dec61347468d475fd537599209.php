<?php $__env->startSection('title'); ?>
    <?php echo e(__('core-cms::admin.dashboard')); ?>

<?php $__env->stopSection(); ?>

<?php $__env->startSection('body'); ?>
    <div>
        <?php $__currentLoopData = $widgets; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $widgetClass): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php
                $widget = new $widgetClass();
            ?>
            <?php echo e($widget->render()); ?>

        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('core-cms::admin.base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/admin/dashboard.blade.php ENDPATH**/ ?>