<?php if(count($failed_jobs) > 0): ?>
    <section class="grid margin-block-end-8">
        <h2 class="heading-2 clr-red-300 flex-group align-items-center">
            <?php echo icon('warning', 'small'); ?> <?php echo e(__('core-cms::admin.job.failed')); ?>

        </h2>
        <div class="card">
            <table class="table">
                <thead>
                <tr>
                    <th><?php echo e(__('core-cms::admin.job.date')); ?></th>
                    <th><?php echo e(__('core-cms::admin.job.message')); ?></th>
                    <th><?php echo e(__('core-cms::admin.actions')); ?></th>
                </tr>
                </thead>
                <tbody>
                <?php $__currentLoopData = $failed_jobs; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $job): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <tr>
                        <td style="white-space: nowrap">
                            <small><?php echo ago(new \Carbon\Carbon($job->failed_at)); ?></small>
                        </td>
                        <td width="75%">
                            <h4 class="margin-block-end-3"><strong><?php echo e($job->uuid); ?></strong></h4>
                            <p class="clr-red-300"
                               style="font-size: .6rem;"><?php echo e(shortened_exception($job->exception)); ?></p>
                        </td>
                        <td>
                            <div class="flex-group align-items-center justify-content-flex-end"
                                 style="width: initial">
                                <form action="<?php echo e(route('admin.retry_job', $job)); ?>" method="post">
                                    <?php echo csrf_field(); ?>
                                    <button class="button padding-0"
                                            data-type="transparent"
                                            title="<?php echo e(__('core-cms::admin.job.relaunch.value')); ?> <?php echo e(trans_choice('core-cms::admin.job.value', 1)); ?>"
                                    ><?php echo icon('sync', 'small'); ?></button>
                                </form>
                                <form
                                        class="clr-red-300"
                                        action="<?php echo e(route('admin.destroy_job', $job)); ?>"
                                        method="post"
                                        onsubmit="<?php echo e('return confirm("' . __('core-cms::admin.job.delete.confirm') . '")'); ?>">
                                    <?php echo csrf_field(); ?>
                                    <?php echo method_field('delete'); ?>
                                    <button class="button padding-0"
                                            data-type="transparent"
                                            title="<?php echo e(__('core-cms::admin.delete.value')); ?> <?php echo e(trans_choice('core-cms::admin.job.value', 1)); ?>"
                                    ><?php echo icon('trash', 'small'); ?></button>
                                </form>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </tbody>
            </table>
        </div>
    </section>
<?php endif; ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/widgets/tasks.blade.php ENDPATH**/ ?>