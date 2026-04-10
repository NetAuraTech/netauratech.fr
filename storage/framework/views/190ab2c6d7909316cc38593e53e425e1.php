<?php
    $contentType = $contentType ?? "";
    $transKey = "$contentType-manager::admin.content.$contentType.value";

    if (trans()->has("core-cms::admin.content.$contentType.value")) {
        $transKey = "core-cms::admin.content.$contentType.value";
    }
?>

<?php $__env->startSection('title'); ?>
    <?php if($content->exists): ?>
        <?php echo e(__('core-cms::admin.edit')); ?> <?php echo e(trans_choice($transKey, 1)); ?>

    <?php else: ?>
        <?php echo e(__('core-cms::admin.create')); ?> <?php echo e(trans_choice($transKey, 1)); ?>

    <?php endif; ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('javascripts_footer'); ?>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const options = [
                    <?php $__currentLoopData = array_merge($pages->items(), $articles->items()); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $post): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                {
                    label: "<?php echo e($post->type); ?> - <?php echo e($post->title); ?>",
                    value: JSON.stringify(<?php echo json_encode([
                        'path'  => $post->type . '.show',
                        'label' => $post->title,
                        'slug'  => $post->slug,
                    ], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE); ?>)
                }<?php if(!$loop->last): ?>,<?php endif; ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            ];
            if (window.editor && typeof window.editor.initializeTheme === 'function') {
                window.editor.initializeTheme(options);
            }
        });
    </script>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('body'); ?>
    <section class="grid">
        <h2 class="heading-2 flex-group align-items-center">
            <?php echo icon($contentType, 'small'); ?>

            <?php if($content->exists): ?>
                <?php echo e(__('core-cms::admin.edit')); ?> <?php echo e(trans_choice($transKey, 1)); ?>

            <?php else: ?>
                <?php echo e(__('core-cms::admin.create')); ?> <?php echo e(trans_choice($transKey, 1)); ?>

            <?php endif; ?>
        </h2>
        <div class="card">
            <form class="grid"
                  action="<?php echo e(route($content->exists ? 'admin.contents.update' : 'admin.contents.store', $content->exists ? $content : ['type' => $contentType])); ?>"
                  method="POST">
                <?php echo csrf_field(); ?>
                <?php echo method_field($content->exists ? 'put' : 'post'); ?>
                <div class="grid">
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::admin.content.title'), 'name' => 'title', 'value' => $content->title], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::admin.content.slug'), 'name' => 'slug', 'value' => $content->slug], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::admin.content.description'), 'name' => 'description', 'value' => $content->description, 'type' => 'textarea'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <editor-builder
                            id="content"
                            name="content"
                            value="<?php echo e($content->content ?: '[]'); ?>"
                            preview="<?php echo e(route('admin.contents.preview', ['type' => $content->type])); ?>"
                    ></editor-builder>
                    <input type="hidden" name="type" value="<?php echo e($contentType); ?>">
                    <?php echo $__env->make('core-cms::shared.form-field', [
                        'type' => 'select',
                        'label' => __('core-cms::admin.content.status.value'),
                        'name' => 'status',
                        'value' => old('status', $content->status),
                        'selectOptions' => [
                            (object)['key' => 'draft', 'label' => __('core-cms::admin.content.status.draft')],
                            (object)['key' => 'published', 'label' => __('core-cms::admin.content.status.published')],
                            (object)['key' => 'archived', 'label' => __('core-cms::admin.content.status.archived')],
                        ]
                    ], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php $__currentLoopData = $formFields; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $field): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php
                            $fieldValue = old($field['props']['name'], $content->{$field['props']['name']} ?? null);
                        ?>
                        <?php echo $__env->make($field['template'], [...$field['props'], 'value' => $fieldValue, 'content' => $content], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::admin.content.published_at'), 'name' => 'published_at', 'value' => $content->published_at?->format('Y-m-d H:i:s'), 'type' => 'datepicker'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <div class="text-center">
                        <button type="submit" class="button" data-type="primary"><?php echo e(__('core-cms::admin.save')); ?></button>
                    </div>
                </div>
            </form>
        </div>
    </section>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('core-cms::admin.base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/admin/contents/form.blade.php ENDPATH**/ ?>