<?php
    $value = $value ?? null;
?>

<template x-if="type === 'media'">
    <?php echo $__env->make('media-manager::form.media', ['label' => __('core-cms::admin.value'), 'name' => 'value', 'value' => $value], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
</template><?php /**PATH /var/www/vendor/netauratech/media-manager/src/resources/views/option/media.blade.php ENDPATH**/ ?>