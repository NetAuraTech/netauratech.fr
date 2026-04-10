<?php
$block = $block ?? [];
$element = trim(View::yieldContent('element', ''));
/**
 * Classes management
 */
$classes = [];
if ($element === 'header') {
    $classes[] = 'site-header';
} elseif ($element === 'footer') {
    $classes[] = 'site-footer';
} else {
    $classes[] = 'block';
    $classes[] = 'block__' . substr(md5(json_encode($block)), 0, 8);
    $wrapperClasses = [''];
    $layoutStyles = [];

    if (key_exists('general_animation', $block) && $block['general_animation'] !== "") {
        $wrapperClasses[] = $block['general_animation'];

        if(key_exists("general_delay", $block) && $block["general_delay"] !== "0") {
            $layoutStyles[] = '--delay: ' . $block["general_delay"] . 's;';
        }
    }

    if (key_exists('background-image', $block) && $block['background-image'] != "") {
        $classes[] = 'block__background-image';
    }

    if (key_exists('padding-block', $block)) {
        $classes[] = 'padding-block-' . $block['padding-block'];
    }

    if (key_exists('padding-inline', $block)) {
        $classes[] = 'padding-inline-' . $block['padding-inline'];
    }

    if (key_exists('border-top-left-radius', $block) && $block['border-top-left-radius'] > 0) {
        $classes[] = 'border-radius-top-left-' . $block['border-top-left-radius'];
    }

    if (key_exists('border-top-right-radius', $block) && $block['border-top-right-radius'] > 0) {
        $classes[] = 'border-radius-top-right-' . $block['border-top-right-radius'];
    }

    if (key_exists('border-bottom-left-radius', $block) && $block['border-bottom-left-radius'] > 0) {
        $classes[] = 'border-radius-bottom-left-' . $block['border-bottom-left-radius'];
    }

    if (key_exists('border-bottom-right-radius', $block) && $block['border-bottom-right-radius'] > 0) {
        $classes[] = 'border-radius-bottom-right-' . $block['border-bottom-right-radius'];
    }
}

if (trim(View::yieldContent('class'))) {
    $classes[] = trim(View::yieldContent('class'));
}

$id = null;
if(key_exists('id', $block) && $block['id'] !== "") {
    $id = $block['id'];
}
?>

<?php if($element === 'section'): ?>
    <section
            class="<?php echo e(join(" ", [...$classes, ...$wrapperClasses])); ?>"
            <?php if($id): ?>id="<?php echo e($id); ?>" <?php endif; ?>
    >
        <?php echo $__env->yieldContent('content'); ?>
    </section>
<?php elseif($element === 'header'): ?>
    <header
            class="<?php echo e(join(" ", $classes)); ?>"
            id="header"
    >
        <?php echo $__env->yieldContent('content'); ?>
    </header>
<?php elseif($element === 'footer'): ?>
    <footer
            class="<?php echo e(join(" ", $classes)); ?>"
            <?php if(key_exists('id', $block)): ?>id="<?php echo e($block['id']); ?>"<?php endif; ?>
    >
        <?php echo $__env->yieldContent('content'); ?>
    </footer>
<?php else: ?>
    <div
            class="<?php echo e(join(" ", $wrapperClasses)); ?>"
            <?php if(count($layoutStyles) > 0): ?>style="<?php echo e(implode(";", $layoutStyles)); ?>"<?php endif; ?>
    >
        <div
                class="<?php echo e(join(" ", $classes)); ?>"
                <?php if(key_exists('id', $block)): ?>id="<?php echo e($block['id']); ?>" <?php endif; ?>
        >
            <?php echo $__env->yieldContent('content'); ?>
        </div>
    </div>
<?php endif; ?>



<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/layouts/layout.blade.php ENDPATH**/ ?>