<?php
    $block = $block ??  [];
    $useContainer = $useContainer ?? $block['use-container'] ?? true;
    $section = $section ?? 'section';
    $classes = ['contact'];
?>


<?php $__env->startSection('class'); ?>
    <?php echo e(join(' ', $classes)); ?>

<?php $__env->stopSection(true); ?>

<?php $__env->startSection('element'); ?>
    <?php echo e($section); ?>

<?php $__env->stopSection(true); ?>

<?php $__env->startSection('content'); ?>
    <?php
        $contactClasses = [];

        if($useContainer) {
            $contactClasses[] = 'container';
        }
    ?>
    <div class="<?php echo e(join(" ", $contactClasses)); ?>">
        <?php if(key_exists('title', $block)  && $block['title'] !== ""): ?>
            <?php echo $__env->make('core-cms::shared.blocks.components.title', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endif; ?>
        <?php if(key_exists('content', $block)  && $block['content'] !== ""): ?>
                <?php echo $__env->make('core-cms::shared.blocks.components.content', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endif; ?>
        <div class="card margin-block-start-6">
            <form
                class="grid"
                method="post"
                action="<?php echo e(route('forms.submit', ['slug' => $content->slug, 'formType' => 'contact'])); ?>"
            >
                <?php echo csrf_field(); ?>
                <div class="grid-auto-fit align-items-center" style="width: initial;">
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::core.form.contact.lastname'), 'name' => 'lastname',], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::core.form.contact.firstname'), 'name' => 'firstname',], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                </div>
                <div class="grid-auto-fit align-items-center" style="width: initial;">
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::core.form.contact.email'), 'name' => 'email', 'type' => 'email',], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::core.form.contact.phone'), 'name' => 'phone'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                </div>
                <?php
                    $subjects = collect([]);

                    if (array_key_exists('subjects', $block)) {
                        $subjects = collect($block['subjects']);
                    }

                ?>
                <?php echo $__env->make('core-cms::shared.form-field', ['type' => 'select', 'label' => __('core-cms::core.form.contact.subject'), 'name' => 'subject', 'selectOptions' => $subjects->map(fn($s) => (object)['key' => $s['option'],'label' => $s['option']])], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::core.form.contact.message'), 'name' => 'content', 'type' => 'textarea'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                <?php echo $__env->make('core-cms::shared.captcha', ['label' => __('core-cms::core.captcha.value'), 'name' => 'captcha'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

                <div class="flex-group">
                    <button
                        class="button"
                        data-type="primary"
                        type="submit"
                    >
                        <?php echo e(__('core-cms::core.form.send')); ?>

                    </button>
                </div>
            </form>
        </div>
    </div>
<?php $__env->stopSection(true); ?>

<?php echo $__env->make('core-cms::shared.blocks.layouts.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/contact.blade.php ENDPATH**/ ?>