<?php
    $block = $block ?? [];

    if($block['type'] == 'internal' && $block['url'] !== "") {
        $json = json_decode($block['url'], true);
        $path = key_exists('slug', $json) ? route($json['path'], $json['slug']) : route($json['path']);
        $label = $block['label'] !== '' ? $block['label'] :  $json['label'];
    } else {
        $path = $block['url'];
        $label = $block['label'];
    }

    $ctaClasses = [];
    $ctaStyles = [];

    if(key_exists("general_animation", $block) && $block["general_animation"] !== '') {
        $ctaClasses[] = $block["general_animation"];

        if(key_exists("general_delay", $block) && ($block["general_delay"] !== "0" && $block["general_delay"] !== "")) {
            $ctaStyles[] = '--delay: ' . $block["general_delay"] . 's;';
        }
    }
?>

<div
    class="<?php echo e(join(" ", $ctaClasses)); ?>"
    <?php if(count($ctaStyles) > 0): ?>style="<?php echo e(implode(";", $ctaStyles)); ?>"<?php endif; ?>
>
    <a
            class="button"
            data-type="<?php echo e($block['cta_type']); ?>" href="<?php echo e($path); ?>"
            title="<?php echo e($label); ?>"
    >
        <?php echo e($label); ?>

    </a>
</div>
<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/components/cta.blade.php ENDPATH**/ ?>