<?php $__env->startSection('title'); ?>
    <?php echo e(__('core-cms::admin.manage')); ?> <?php echo e(trans_choice('core-cms::admin.option.value', 2)); ?>

<?php $__env->stopSection(); ?>

<?php $__env->startSection('body'); ?>
    <section class="grid">
        <div class="flex-group justify-content-space-between align-items-center" style="width: initial">
            <h2 class="heading-2 flex-group align-items-center"><?php echo icon('option', 'small'); ?> <?php echo e(__('core-cms::admin.manage')); ?> <?php echo e(trans_choice('core-cms::admin.option.value', 2)); ?></h2>
            <a class="button" href="<?php echo e(route('admin.option.create')); ?>"
               data-type="primary"><?php echo e(__('core-cms::admin.add')); ?> <?php echo e(trans_choice('core-cms::admin.option.value', 1)); ?></a>
        </div>
        <?php $__currentLoopData = $groupedOptions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $group): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <div class="card">
                <h2 class="heading-2 margin-block-end-6"><?php echo e($group->label); ?></h2>
                <table class="table" style="table-layout: fixed;">
                    <thead>
                    <tr>
                        <th><?php echo e(__('core-cms::admin.option.key')); ?></th>
                        <th><?php echo e(__('core-cms::admin.option.type.value')); ?></th>
                        <th><?php echo e(__('core-cms::admin.value')); ?></th>
                        <th><?php echo e(__('core-cms::admin.actions')); ?></th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php
                        $scheduleOrder = [
                            'schedule_monday',
                            'schedule_tuesday',
                            'schedule_wednesday',
                            'schedule_thursday',
                            'schedule_friday',
                            'schedule_saturday',
                            'schedule_sunday'
                        ];

                        $scheduleOptions = collect($group->options)->filter(function($item) {
                            return str_starts_with($item->key, 'schedule_');
                        })->sortBy(function($item) use ($scheduleOrder) {
                            return array_search($item->key, $scheduleOrder);
                        });

                        $otherOptions = collect($group->options)->filter(function($item) {
                            return !str_starts_with($item->key, 'schedule_');
                        });

                        $sortedOptions = $otherOptions->concat($scheduleOptions);
                    ?>

                    <?php $__currentLoopData = $sortedOptions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <tr>
                            <td>
                                <a href="<?php echo e(route('admin.option.edit', $item->key)); ?>">
                                    <?php
                                        $translationKey = 'core-cms::admin.option.keys.' . $item->key;
                                        $translatedKey = __($translationKey);

                                        if ($translatedKey === $translationKey) {
                                            $translatedKey = $item->key;
                                        }
                                    ?>
                                    <?php echo e($translatedKey); ?>

                                </a>
                            </td>
                            <td>
                                <?php echo e(__('core-cms::admin.option.type.' . $item->type)); ?>

                            </td>
                            <td>
                                <a href="<?php echo e(route('admin.option.edit', $item->key)); ?>">
                                    <?php switch($item->type):
                                        case ('content'): ?>
                                        <?php case ('template'): ?>
                                            <?php
                                                $contentProvider = app(Netauratech\CoreCms\Contracts\ContentProviderInterface::class);
                                                $content = null;

                                                if($item->value !== "") {
                                                    $content = $contentProvider->getContentById($item->value);
                                                }
                                            ?>

                                            <?php if($content): ?>
                                                <?php echo e($content->title); ?>

                                            <?php else: ?>
                                                <?php echo e($item->value); ?>

                                            <?php endif; ?>
                                            <?php break; ?>

                                        <?php default: ?>
                                            <?php
                                                $formFields = $formFields ?? [];
                                                $field = collect($formFields)->firstWhere('type', $item->type);
                                            ?>

                                            <?php if($field): ?>
                                                <?php echo $__env->make($field['renderer'], [...$field['props'] ?? [], 'value' => $item->value], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                                            <?php else: ?>
                                                <?php if(str_starts_with($item->key, 'schedule_') && !empty($item->value)): ?>
                                                    <?php
                                                        $slots = explode('/', $item->value);
                                                        $formatted = [];
                                                        foreach ($slots as $slot) {
                                                            $times = explode('-', trim($slot));
                                                            if (count($times) === 2) {
                                                                $formatted[] = substr($times[0], 0, 5) . ' - ' . substr($times[1], 0, 5);
                                                            }
                                                        }
                                                        echo implode(' / ', $formatted);
                                                    ?>
                                                <?php else: ?>
                                                    <?php echo e($item->value ?: '—'); ?>

                                                <?php endif; ?>
                                            <?php endif; ?>
                                    <?php endswitch; ?>
                                </a>
                            </td>
                            <td>
                                <div class="flex-group align-items-center justify-content-flex-end" style="width: initial">
                                    <a href="<?php echo e(route('admin.option.edit', $item->key)); ?>" class="button padding-0"
                                       data-type="transparent"
                                       title="<?php echo e(__('core-cms::admin.edit')); ?> <?php echo e($item->key); ?>"><?php echo icon('edit', 'small'); ?></a>
                                    <?php if($item->category === 'custom'): ?>
                                        <form
                                                class="clr-red-300"
                                                action="<?php echo e(route('admin.option.destroy', $item->key)); ?>"
                                                method="post"
                                                onsubmit="return confirm('<?php echo e(__('core-cms::admin.delete.confirm')); ?>')">
                                            <?php echo csrf_field(); ?>
                                            <?php echo method_field('delete'); ?>
                                            <button type="submit" class="button padding-0" data-type="transparent"
                                                    title="<?php echo e(__('core-cms::admin.delete.value')); ?> <?php echo e($item->key); ?>">
                                                <?php echo icon('trash', 'small'); ?>

                                            </button>
                                        </form>
                                    <?php else: ?>
                                        <button type="button" class="button padding-0" data-type="transparent"
                                                title="<?php echo e(__('core-cms::admin.delete.unable')); ?> <?php echo e($item->key); ?>">
                                            <?php echo icon('ban', 'small'); ?>

                                        </button>
                                    <?php endif; ?>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </tbody>
                </table>
            </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </section>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('core-cms::admin.base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/admin/option/index.blade.php ENDPATH**/ ?>