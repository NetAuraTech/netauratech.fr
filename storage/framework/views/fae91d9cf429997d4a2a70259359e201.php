<?php
    $label ??= null;
    $type ??= 'button';
    $color ??= null;
    $icon ??= null;
    $form ??= null;
    $value ??= null;
    $name ??= null;
    $class ??= null;
?>

<button class="button flex-group align-items-center <?php echo e($class); ?>" type="<?php echo e($type); ?>" <?php if($form): ?> form="<?php echo e($form); ?>" <?php endif; ?> <?php if($value): ?> value="<?php echo e($value); ?>" <?php endif; ?> <?php if($name): ?> name="<?php echo e($name); ?>" <?php endif; ?> data-type="<?php echo e($color); ?>">
    <?php if($icon): ?>
        <?php echo icon($icon, 'small'); ?>

    <?php endif; ?>
    <?php echo e($label); ?>

</button>
<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/button.blade.php ENDPATH**/ ?>