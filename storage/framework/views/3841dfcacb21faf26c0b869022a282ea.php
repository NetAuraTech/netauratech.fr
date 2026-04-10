<?php $__env->startSection('title'); ?>
    <?php if($option->exists): ?>
        <?php echo e(__('core-cms::admin.edit')); ?> <?php echo e(trans_choice('core-cms::admin.option.value', 1)); ?>

    <?php else: ?>
        <?php echo e(__('core-cms::admin.create')); ?> <?php echo e(trans_choice('core-cms::admin.option.value', 1)); ?>

    <?php endif; ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('meta'); ?>
    <script src="//unpkg.com/alpinejs" defer></script>
    <meta name="turbolinks-visit-control" content="reload">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('body'); ?>
    <section class="grid">
        <h2 class="heading-2 flex-group align-items-center">
            <?php if($option->exists): ?>
                <?php echo icon('cog', 'small'); ?> <?php echo e(__('core-cms::admin.edit')); ?> <?php echo e(trans_choice('core-cms::admin.option.value', 1)); ?>

            <?php else: ?>
                <?php echo icon('cog', 'small'); ?> <?php echo e(__('core-cms::admin.create')); ?> <?php echo e(trans_choice('core-cms::admin.option.value', 1)); ?>

            <?php endif; ?>
        </h2>
        <div class="card">
            <form class="grid"
                  action="<?php echo e(route($option->exists ? 'admin.option.update' : 'admin.option.store', $option->exists ? $option->key : [])); ?>"
                  method="POST">
                <?php echo csrf_field(); ?>
                <?php echo method_field($option->exists ? 'put' : 'post'); ?>
                <div class="grid" x-data="{ type: '<?php echo e(old('type', $option->type)); ?>', category: '<?php echo e(old('category', $option->category)); ?>' }">
                    <?php echo $__env->make('core-cms::shared.form-field', [
                        'label' => __('core-cms::admin.option.key'),
                        'name' => 'key',
                        'value' => $option->key,
                        'disabled' => $option->category !== 'custom'
                    ], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <div class="form-group">
                        <label for="type" class="required"><?php echo e(__('core-cms::admin.option.type.value')); ?></label>
                        <select id="type"
                                name="type"
                                class="form-control <?php $__errorArgs = ["type"];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>"
                                x-model="type"
                                <?php if($option->category !== 'custom'): ?>
                                    disabled="disabled"
                                <?php endif; ?>
                        >
                            <option value=""><?php echo e(__('core-cms::core.select.option.choose')); ?></option>
                            <option <?php if(old("type", $option->type) === "text"): echo 'selected'; endif; ?> value="text"><?php echo e(__('core-cms::admin.option.type.text')); ?></option>
                            <option <?php if(old("type", $option->type) === "content"): echo 'selected'; endif; ?> value="content"><?php echo e(__('core-cms::admin.option.type.content')); ?></option>
                            <option <?php if(old("type", $option->type) === "template"): echo 'selected'; endif; ?> value="template"><?php echo e(__('core-cms::admin.option.type.template')); ?></option>
                            <option <?php if(old("type", $option->type) === "number"): echo 'selected'; endif; ?> value="number"><?php echo e(__('core-cms::admin.option.type.number')); ?></option>
                            <option <?php if(old("type", $option->type) === "boolean"): echo 'selected'; endif; ?> value="boolean"><?php echo e(__('core-cms::admin.option.type.boolean')); ?></option>
                            <?php $__currentLoopData = $formFields; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $field): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <option <?php if(old("type", $option->type) === $field['type']): echo 'selected'; endif; ?> value="<?php echo e($field['type']); ?>"><?php echo e($field['label']); ?></option>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </select>
                        <?php $__errorArgs = ["type"];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                        <div class="invalid-feedback">
                            <?php echo e($message); ?>

                        </div>
                        <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>

                    <template x-if="type === 'text'">
                        <div>
                            <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::admin.value'), 'name' => 'value', 'value' => $option->value, 'type' => 'textarea'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                            <?php if(str_starts_with($option->key, 'schedule_')): ?>
                                <div class="margin-block-start-3 padding-4 border-radius-1" style="background-color: var(--neutral-100); border-left: 4px solid var(--accent-400);">
                                    <p class="margin-block-end-2"><strong><?php echo e(__('core-cms::admin.option.schedule.format_hint')); ?></strong></p>
                                    <p class="margin-block-end-2"><?php echo e(__('core-cms::admin.option.schedule.examples')); ?></p>
                                    <ul style="margin-left: 1.5rem; margin-bottom: 0;">
                                        <li><?php echo e(__('core-cms::admin.option.schedule.continuous')); ?></li>
                                        <li><?php echo e(__('core-cms::admin.option.schedule.with_break')); ?></li>
                                        <li><?php echo e(__('core-cms::admin.option.schedule.closed')); ?></li>
                                    </ul>
                                </div>
                            <?php endif; ?>
                        </div>
                    </template>

                    <template x-if="type === 'number'">
                        <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::admin.value'), 'name' => 'value', 'value' => $option->value, 'type' => 'number'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    </template>
                    <template x-if="type === 'boolean'">
                        <?php echo $__env->make('core-cms::shared.form-field', ['type' => 'checkbox', 'label' => __('core-cms::admin.value'), 'name' => 'value', 'value' => $option->value], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    </template>
                    <template x-if="type === 'content'">
                        <div class="form-group">
                            <label for="value" class="required"><?php echo e(__('core-cms::admin.value')); ?></label>
                            <select id="value"
                                    name="value"
                                    class="form-control <?php $__errorArgs = ["type"];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>"
                            >
                                <option value=""><?php echo e(__('core-cms::core.select.option.choose')); ?></option>
                                <optgroup label="<?php echo e(__('core-cms::admin.option.content.article')); ?>">
                                    <?php $__currentLoopData = $articles; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $post): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <option value="<?php echo e($post->id); ?>"
                                                <?php if($option->value== $post->id): ?> selected <?php endif; ?>><?php echo e($post->title); ?></option>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                </optgroup>
                                <optgroup label="<?php echo e(__('core-cms::admin.option.content.post')); ?>">
                                    <?php $__currentLoopData = $pages; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $post): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <option value="<?php echo e($post->id); ?>"
                                                <?php if($option->value== $post->id): ?> selected <?php endif; ?>><?php echo e($post->title); ?></option>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                </optgroup>
                            </select>
                            <?php $__errorArgs = ["type"];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="invalid-feedback">
                                <?php echo e($message); ?>

                            </div>
                            <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                        </div>
                    </template>
                    <template x-if="type === 'template'">
                        <div class="form-group">
                            <label for="value" class="required"><?php echo e(__('core-cms::admin.value')); ?></label>
                            <select id="value"
                                    name="value"
                                    class="form-control <?php $__errorArgs = ["type"];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> is-invalid <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>"
                            >
                                <option value=""><?php echo e(__('core-cms::core.select.option.choose')); ?></option>
                                <?php $__currentLoopData = $templates; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $post): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                    <option value="<?php echo e($post->id); ?>"
                                            <?php if($option->value== $post->id): ?> selected <?php endif; ?>><?php echo e($post->title); ?></option>
                                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                            </select>
                            <?php $__errorArgs = ["type"];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="invalid-feedback">
                                <?php echo e($message); ?>

                            </div>
                            <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                        </div>
                    </template>
                    <?php $__currentLoopData = $formFields; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $field): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php
                            $fieldValue = old('value', $option->value ?? null);
                        ?>
                        <?php echo $__env->make($field['template'], [...$field['props'] ?? [], 'value' => $fieldValue], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    <div class="text-center">
                        <button type="submit" class="button" data-type="primary"><?php echo e(__('core-cms::admin.save')); ?></button>
                    </div>
                </div>
            </form>
        </div>
    </section>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('core-cms::admin.base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/admin/option/form.blade.php ENDPATH**/ ?>