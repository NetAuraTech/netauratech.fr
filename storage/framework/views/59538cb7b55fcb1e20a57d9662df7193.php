<?php
    $label ??= null;
    $name ??= '';
    $value ??= '';
    $errorLocation ??= null;
    $displayError ??= true;
    $help ??= null;
?>

<div class="form-media form-group m-bottom-6" style="align-self:stretch;">
    <label for="<?php echo e($name); ?>"><?php echo e($label); ?></label>
    <input type="text" id="<?php echo e($name); ?>" name="<?php echo e($name); ?>"
           is="input-media"
           data-endpoint="/api/media"
           overwrite="overwrite"
           class="form-control"
           value="<?php echo e($value); ?>"
           style="display: none;"
    >
    <?php if($displayError): ?>
        <?php $__errorArgs = [$name, $errorLocation];
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
    <?php endif; ?>
    <?php if($help): ?>
        <div class="clr-neutral-600 margin-block-start-2">
            <?php echo e($help); ?>

        </div>
    <?php endif; ?>
</div>
<?php /**PATH /var/www/vendor/netauratech/media-manager/src/resources/views/form/media.blade.php ENDPATH**/ ?>