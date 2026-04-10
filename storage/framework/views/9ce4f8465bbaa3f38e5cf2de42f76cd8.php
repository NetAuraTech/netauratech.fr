<?php use Illuminate\Support\Str; ?>


<?php
    $block = $block ??  [];
    $useContainer = $useContainer ?? $block['use-container'] ?? true;
    $section = $section ?? 'section';
    $classes = ['form'];
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
                action="<?php echo e(route('forms.submit', ['slug' => $content->slug, 'formType' => 'form'])); ?>"
            >
                <?php echo csrf_field(); ?>

                <?php $__currentLoopData = $block['sections']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $section): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php if(key_exists('visible', $section) && $section['visible']): ?>
                        <div class="grid margin-block-end-6">
                            <?php if(key_exists('title', $section)  && $section['title'] !== ""): ?>
                                <?php echo $__env->make('core-cms::shared.blocks.components.title', ['block' => $section], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                            <?php endif; ?>
                            <?php $__currentLoopData = $section['fields']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $field): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <?php
                                    $id = Str::slug($field['label'])
                                ?>
                                <?php switch($field['type']):
                                    case ('text'): ?>
                                            <?php echo $__env->make('core-cms::shared.form-field', ['label' => $field['label'], 'name' => $id, 'type' => 'text', 'help' => $field['help']], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                                        <?php break; ?>
                                    <?php case ('textarea'): ?>
                                            <?php echo $__env->make('core-cms::shared.form-field', ['label' => $field['label'], 'name' => $id, 'type' => 'textarea', 'help' => $field['help']], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                                        <?php break; ?>
                                    <?php case ('select'): ?>
                                        <?php
                                            $selectOptions = collect([]);
                                            if (array_key_exists('options', $field)) {
                                                $selectOptions = collect($field['options']);
                                            }
                                        ?>
                                            <?php echo $__env->make('core-cms::shared.form-field', ['type' => 'select', 'label' => $field['label'], 'name' => $id, 'selectOptions' => $selectOptions->map(fn($s) => (object)['key' => Str::slug($s['option']),'label' => $s['option']])], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                                        <?php break; ?>
                                    <?php case ('checkbox'): ?>
                                            <?php echo $__env->make('core-cms::shared.form-field', ['type' => 'checkbox', 'label' => $field['label'], 'name' => $id, 'help' => $field['help']], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                                        <?php break; ?>
                                <?php endswitch; ?>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </div>
                    <?php endif; ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <div class="form-switch">
                    <input type="checkbox" id="consentement" name="consentement" role="switch" required class="form-control">
                    <label for="consentement"><span class="switch"></span><span><?php echo e(__('core-cms::core.form.consentement')); ?> <a href="<?php echo e(route('page.show', $options['privacy-policy']->slug)); ?>" target="_blank"><?php echo e(__('core-cms::core.privacy-policy')); ?></a>.</span></label>
                </div>
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

<?php echo $__env->make('core-cms::shared.blocks.layouts.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/form.blade.php ENDPATH**/ ?>