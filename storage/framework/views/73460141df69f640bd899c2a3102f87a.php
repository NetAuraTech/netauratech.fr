<?php
    $imageHeight = $imageHeight ?? null;
?>


<?php if($content->media_id): ?>
    <?php echo image_tag($content->media_id, null, $imageHeight, "media_{$content->slug}_{$content->media_id}"); ?>

<?php endif; ?><?php /**PATH /var/www/vendor/netauratech/media-manager/src/resources/views/content/media.blade.php ENDPATH**/ ?>