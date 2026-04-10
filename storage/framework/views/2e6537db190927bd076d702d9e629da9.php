<?php
    $blockKey = $blockKey ?? 'content';
    $block = $block ?? [];

    $contentClasses = $contentClasses ?? [];
    $contentClasses[] = "block__" . substr(md5(json_encode($block)), 0, 8) . "-{$blockKey}";

    $contentStyles = [];

    if(key_exists("{$blockKey}_animation", $block) && $block["{$blockKey}_animation"] !== '') {
        $contentClasses[] = $block["{$blockKey}_animation"];

        if(key_exists("{$blockKey}_delay", $block) && $block["{$blockKey}_delay"] !== "0") {
            $contentStyles[] = '--delay: ' . $block["{$blockKey}_delay"] . 's;';
        }
    }
?>

<div
    class="<?php echo e(join(" ", $contentClasses)); ?>"
    <?php if(count($contentStyles) > 0): ?>style="<?php echo e(implode(";", $contentStyles)); ?>"<?php endif; ?>
>
    <?php echo app(Netauratech\CoreCms\Services\Shortcode\ShortcodeParser::class)->parse($block[$blockKey], ['content' => $content ?? '', 'options' => $options ?? []]); ?>
</div>
<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/components/content.blade.php ENDPATH**/ ?>