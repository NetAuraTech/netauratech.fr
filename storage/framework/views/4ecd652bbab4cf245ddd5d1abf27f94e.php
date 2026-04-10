<?php
    use Illuminate\Support\ViewErrorBag;

    $label ??= null;
    $type ??= 'text';
    $class ??= null;
    $name ??= '';
    $id ??= $name;
    $value ??= '';
    $displayError ??= true;
    $errorLocation ??= 'default';
    $disabled ??= false;
    $help ??= null;
    $defaultOption ??= __('core-cms::core.select.option.choose');
    $placeholder ??= '';


    $selectOptions ??= [];

    $current ??= 1;

    $getOldValue = function() use ($name, $value, $type) {
        $default = $value;
        if($type === "checkbox") {
            $default = $value ?? false;
        }

        return old($name, $default);
    };

    $hasError = function($name, $errorLocation = null) {
        /** @var ViewErrorBag $errors */
        $errors = session('errors');

        if(!$errors) {
            return false;
        }

        return $errorLocation
        ? $errors->getBag($errorLocation)->has($name)
        : $errors->has($name);
    };

    $getErrorMessage = function($name, $errorLocation = null) {
        /** @var ViewErrorBag $errors */
        $errors = session('errors');

        if(!$errors) {
            return "";
        }

        return $errorLocation
        ? $errors->getBag($errorLocation)->first($name)
        : $errors->first($name);
    };
?>

<div class="<?php echo \Illuminate\Support\Arr::toCssClasses(['form-group', $class]); ?>">
    <?php if($type === 'textarea'): ?>
        <label for="<?php echo e($id); ?>" class="required"><?php echo e($label); ?></label>
        <textarea
                id="<?php echo e($id); ?>"
                name="<?php echo e($name); ?>"
                class="form-control <?php if($displayError && $hasError($name, $errorLocation)): ?> is-invalid <?php endif; ?>"
                placeholder="<?php echo e($placeholder); ?>"
                <?php if($disabled): ?>
                    disabled="disabled"
                <?php endif; ?>
        ><?php echo e($getOldValue()); ?></textarea>
    <?php elseif($type === 'datepicker'): ?>
        <label for="<?php echo e($id); ?>" class="required"><?php echo e($label); ?></label>
        <input
                type="hidden"
                id="<?php echo e($id); ?>"
                name="<?php echo e($name); ?>" is="date-picker"
                class="form-control flatpickr-input <?php if($displayError && $hasError($name, $errorLocation)): ?> is-invalid <?php endif; ?>"
                value="<?php echo e($getOldValue()); ?>"
                <?php if($disabled): ?>
                    disabled="disabled"
                <?php endif; ?>
        >
    <?php elseif($type === "select"): ?>
        <label for="<?php echo e($id); ?>" class="required"><?php echo e($label); ?></label>
        <select id="<?php echo e($id); ?>"
                name="<?php echo e($name); ?>"
                class="form-control <?php if($displayError && $hasError($name, $errorLocation)): ?> is-invalid <?php endif; ?>">
            <option value=""><?php echo e($defaultOption); ?></option>
            <?php $__currentLoopData = $selectOptions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $option): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <option <?php if($getOldValue() === $option->key): echo 'selected'; endif; ?> value="<?php echo e($option->key); ?>"><?php echo e($option->label); ?></option>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </select>
    <?php elseif($type === "checkbox"): ?>
        <div class="form-switch">
            <input type="checkbox"
                   id="<?php echo e($id); ?>"
                   name="<?php echo e($name); ?>"
                   role="switch"
                   value="<?php echo e($current); ?>"
                   <?php if( $getOldValue()): echo 'checked'; endif; ?>
                   class="form-control <?php if($displayError && $hasError($name, $errorLocation)): ?> is-invalid <?php endif; ?>">
            <label class="form-check-label" for="<?php echo e($id); ?>"><span class="switch"></span><?php echo e($label); ?></label>
        </div>
    <?php else: ?>
        <label for="<?php echo e($id); ?>" class="required"><?php echo e($label); ?></label>
        <input
                type="<?php echo e($type); ?>"
                id="<?php echo e($id); ?>"
                name="<?php echo e($name); ?>"
                value="<?php echo e($getOldValue()); ?>"
                class="form-control <?php if($displayError && $hasError($name, $errorLocation)): ?> is-invalid <?php endif; ?>"
                placeholder="<?php echo e($placeholder); ?>"
                <?php if($disabled): ?>
                    disabled="disabled"
                <?php endif; ?>
        >
    <?php endif; ?>

    <?php if($displayError && $hasError($name, $errorLocation)): ?>
        <div class="invalid-feedback">
            <?php echo e($getErrorMessage($name, $errorLocation)); ?>

        </div>
    <?php endif; ?>

    <?php if($help): ?>
        <div class="clr-neutral-600 margin-block-start-2">
            <?php echo e($help); ?>

        </div>
    <?php endif; ?>
</div><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/form-field.blade.php ENDPATH**/ ?>