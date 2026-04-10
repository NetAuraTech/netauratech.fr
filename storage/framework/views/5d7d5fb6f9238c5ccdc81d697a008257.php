<?php
    $name = $name ?? '';
    $value = $value ?? '';
    $label = $label ?? '';
    $dataRemote = $dataRemote ?? '';
    $content = $content ?? null;

    if($content) {
        $data = $content->$name()->get()->toArray();

        if(is_array($data)) {
            $value = implode(',', array_map(fn ($item): ?string => $item['name'], $data));
        }
    }
?>

<?php if($content->type === 'portfolio'): ?>
    <div class="form-group" style="position: relative">
        <label for="<?php echo e($name); ?>" id="post_form_<?php echo e($name); ?>-ts-label"><?php echo e($label); ?></label>
        <input type="text"
               id="<?php echo e($name); ?>"
               name="<?php echo e($name); ?>"
               is="input-choices"
               data-remote="<?php echo e($dataRemote); ?>"
               data-value="name"
               data-label="name"
               value="<?php echo e($value); ?>"
        >
    </div>
<?php endif; ?><?php /**PATH /var/www/vendor/netauratech/portfolio-manager/src/resources/views/form/input.blade.php ENDPATH**/ ?>