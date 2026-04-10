<?php
    $cacheBuster = $cacheBuster ?? substr(md5(json_encode(now())), 0, 8);
?>

<link rel="stylesheet" href="<?php echo e(route('assets.show', ['path' => 'css/admin.css'])); ?>?v=<?php echo e($cacheBuster); ?>">
<?php /**PATH /var/www/storage/app/private/themes/netauratech/views/assets/admin/css.blade.php ENDPATH**/ ?>