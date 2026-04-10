<?php
    $defaultImage = $openGraphLogo ?? (object)['id' => '', 'width' => '', 'height' => '', 'alt' => ''];

    $image = image_url($defaultImage->id);
    $width = $defaultImage->width;
    $height = $defaultImage->height;

    $alt = method_exists($defaultImage, 'getDefaultAlt') ? $defaultImage->getDefaultAlt() : $defaultImage->alt;

    $contentMedia = $content->media ?? null;

    if ($contentMedia) {
        $image = image_url($contentMedia->id ?? '');
        $width = $contentMedia->width ?? '';
        $height = $contentMedia->height ?? '';
        $alt = $contentMedia->getDefaultAlt() ?? '';
    }
?>

<?php if($image): ?>
    <meta property='og:image' content="<?php echo e($image); ?>"/>
    <meta name='twitter:image' content="<?php echo e($image); ?>"/>
    <meta property="og:image:width" content="<?php echo e($width); ?>"/>
    <meta property="og:image:height" content="<?php echo e($height); ?>"/>
    <meta property="og:image:alt" content="<?php echo e($alt); ?>"/>
    <meta property="og:image:type" content="image/webp"/>
<?php endif; ?><?php /**PATH /var/www/vendor/netauratech/media-manager/src/resources/views/content/meta.blade.php ENDPATH**/ ?>