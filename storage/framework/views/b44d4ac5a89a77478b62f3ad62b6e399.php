<?php
    $cacheBuster = $cacheBuster ?? substr(md5(json_encode(now())), 0, 8);
?>


<script src="<?php echo e(route('assets.show', ['path' => 'js/app.js'])); ?>?v=<?php echo e($cacheBuster); ?>" type="module" defer=""></script><?php /**PATH /var/www/storage/app/private/themes/netauratech/views/assets/js.blade.php ENDPATH**/ ?>