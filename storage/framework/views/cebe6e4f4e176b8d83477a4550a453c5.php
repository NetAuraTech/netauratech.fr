<?php $__env->startSection('title'); ?>
    <?php echo e(__('core-cms::admin.manage')); ?> <?php echo e(trans_choice('core-cms::admin.content.category.value', 2)); ?>

<?php $__env->stopSection(); ?>

<?php $__env->startSection('body'); ?>
    <section class="grid">
        <div class="flex-group justify-content-space-between align-items-center" style="width: initial">
            <h2 class="heading-2 flex-group align-items-center">
                <?php echo icon('category', 'small'); ?>

                <?php echo e(__('core-cms::admin.manage')); ?> <?php echo e(trans_choice('core-cms::admin.content.category.value', 2)); ?>

            </h2>
            <a class="button" href="<?php echo e(route('admin.categories.create')); ?>" data-type="primary">
                <?php echo e(__('core-cms::admin.add')); ?> <?php echo e(trans_choice('core-cms::admin.content.category.value', 1)); ?>

            </a>
        </div>
        <div class="card">
            <table class="table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th><?php echo e(__('core-cms::admin.content.name')); ?></th>
                    <th><?php echo e(__('core-cms::admin.actions')); ?></th>
                </tr>
                </thead>
                <tbody>
                <?php $__currentLoopData = $categories; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $category): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <tr>
                    <td>
                        <a href="<?php echo e(route('admin.categories.edit', $category)); ?>"><?php echo e($category->id); ?></a>
                    </td>
                    <td>
                        <a href="<?php echo e(route('admin.categories.edit', $category)); ?>"><?php echo e($category->name); ?></a>
                    </td>
                    <td>
                        <div class="flex-group align-items-center justify-content-flex-end" style="width: initial">
                            <a href="<?php echo e(route('admin.categories.edit', $category)); ?>" class="button padding-0" data-type="transparent" title="<?php echo e(__('core-cms::admin.edit')); ?> <?php echo e($category->name); ?>"><?php echo icon('edit', 'small'); ?></a>
                            <form
                                    class="clr-red-300"
                                    action="<?php echo e(route('admin.categories.destroy', $category)); ?>"
                                    method="post"
                                    onsubmit="return confirm('<?php echo e(__('core-cms::admin.delete.confirm')); ?>')">
                                <?php echo csrf_field(); ?>
                                <?php echo method_field('delete'); ?>
                                <button type="submit" class="button padding-0" data-type="transparent" title="<?php echo e(__('core-cms::admin.delete.value')); ?> <?php echo e($category->name); ?>">
                                    <?php echo icon('trash', 'small'); ?>

                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </tbody>
            </table>
            <?php echo e($categories->links()); ?>

        </div>
    </section>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('core-cms::admin.base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/admin/categories/index.blade.php ENDPATH**/ ?>