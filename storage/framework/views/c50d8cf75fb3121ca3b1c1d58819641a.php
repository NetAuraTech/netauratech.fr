<?php
    $cacheBuster = $cacheBuster ?? substr(md5(json_encode(now())), 0, 8);
    $header = $header ?? null;
    $footer = $footer ?? null;
?>


<link rel="preload" href="<?php echo e(route('assets.show', ['path' => 'css/critical.css'])); ?>?v=<?php echo e($cacheBuster); ?>" as="style">
<link rel="preload" href="<?php echo e(route('assets.show', ['path' => 'css/app.css'])); ?>?v=<?php echo e($cacheBuster); ?>" as="style">

<link rel="stylesheet" href="<?php echo e(route('assets.show', ['path' => 'css/critical.css'])); ?>?v=<?php echo e($cacheBuster); ?>">
<link rel="stylesheet" href="<?php echo e(route('assets.show', ['path' => 'css/app.css'])); ?>?v=<?php echo e($cacheBuster); ?>">

<?php if($header): ?>
    <?php
        $cacheBuster = substr(md5(json_encode($header->updated_at)), 0, 8);
        $cssPath = 'css/' . $header->slug . '.css';
    ?>
    <link rel="preload" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>">
    </noscript>
<?php endif; ?>

<?php if($footer): ?>
    <?php
        $cacheBuster = substr(md5(json_encode($footer->updated_at)), 0, 8);
        $cssPath = 'css/' . $footer->slug . '.css';
    ?>
    <link rel="preload" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>">
    </noscript>
<?php endif; ?>
<?php /**PATH /var/www/storage/app/private/themes/netauratech/views/assets/css.blade.php ENDPATH**/ ?>