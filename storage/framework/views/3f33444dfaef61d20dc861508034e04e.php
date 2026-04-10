<?php
    $block = $block ?? [];
    $key = $key ?? '_name';
    $props = $props ?? [];
    $options = $options ?? [];
    $css = $css ?? null;

    $theme = $options['theme'] ?? 'default';
    $viewName = $block[$key] ?? $view ?? 'missing';

    $sharedPath = "core-cms::shared.blocks.$viewName";
    $themePath = "theme::$viewName";
    $extensionPath = "extensions::$viewName";

    $commonView = [
        'automatic-gallery',
        'carousel',
        'contact',
        'media',
        'links',
        'section',
        'theme-switcher',
        'form'
    ];

    $resolvedView =
        View::exists($themePath)
            ? $themePath
        : (View::exists($extensionPath)
            ? $extensionPath
        : (View::exists($sharedPath)
            ? $sharedPath
        : 'core-cms::shared.blocks.missing'));
?>

<?php if($css): ?>
    <div>
        <style><?php echo $css; ?></style>
        <?php endif; ?>

        <?php echo $__env->make($resolvedView, ['block' => $block, 'key' => $key, ...$props], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

        <?php if($css): ?>
    </div>
<?php endif; ?>
<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/renderer.blade.php ENDPATH**/ ?>