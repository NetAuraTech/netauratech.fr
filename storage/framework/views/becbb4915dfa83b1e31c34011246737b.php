<?php
    $label ??= null;
    $name ??= '';
?>

<div class="<?php echo \Illuminate\Support\Arr::toCssClasses(['form-group']); ?>">
    <label for="<?php echo e($name); ?>" class="required"><?php echo e($label); ?></label>
    <?php
        $key = generate_challenge();
    ?>
    <puzzle-captcha
        name="<?php echo e($name); ?>"
        width="350"
        height="200"
        piece-width="80"
        piece-height="50"
        src="<?php echo e(route('captcha.image', ['key' => $key])); ?>"
    >
        <input type="hidden" name="captcha-challenge" id="captcha-challenge" value="<?php echo e($key); ?>">
        <input type="hidden" name="captcha-answer" id="captcha-answer">
    </puzzle-captcha>
    <div class="clr-neutral-600">
        <?php echo e(__('core-cms::core.captcha.help')); ?>

    </div>
</div>
<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/captcha.blade.php ENDPATH**/ ?>