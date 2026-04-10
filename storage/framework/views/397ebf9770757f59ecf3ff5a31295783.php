<?php
    $blockKey = $blockKey ?? 'title';
    $block = $block ?? [];

    $titleClasses = ["margin-block-end-6", "block__" . substr(md5(json_encode($block)), 0, 8) . "-{$blockKey}"];
    $titleStyles = [];

    if(key_exists("{$blockKey}_animation", $block) && $block["{$blockKey}_animation"] !== '') {
        $titleClasses[] = $block["{$blockKey}_animation"];

        if(key_exists("{$blockKey}_delay", $block) && $block["{$blockKey}_delay"] !== "0") {
            $titleStyles[] = '--delay: ' . $block["{$blockKey}_delay"] . 's;';
        }
    }
?>

<?php if(key_exists("{$blockKey}-level", $block) && $block["{$blockKey}-level"] === 'h1'): ?>
    <?php
        $titleClasses[] = 'heading-1'
    ?>
    <h1
        class="<?php echo e(join(" ", $titleClasses)); ?>"
        <?php if(count($titleStyles) > 0): ?>style="<?php echo e(implode(";", $titleStyles)); ?>"<?php endif; ?>
    >
        <?php echo e($block[$blockKey]); ?>

    </h1>
<?php elseif(key_exists("{$blockKey}-level", $block) && $block["{$blockKey}-level"] === 'h2'): ?>
    <?php
        $titleClasses[] = 'heading-2'
    ?>
    <h2
        class="<?php echo e(join(" ", $titleClasses)); ?>"
        <?php if(count($titleStyles) > 0): ?>style="<?php echo e(implode(";", $titleStyles)); ?>"<?php endif; ?>
    >
        <?php echo e($block[$blockKey]); ?>

    </h2>
<?php elseif(key_exists("{$blockKey}-level", $block) && $block["{$blockKey}-level"] === 'h3'): ?>
    <?php
        $titleClasses[] = 'heading-3'
    ?>
    <h3
        class="<?php echo e(join(" ", $titleClasses)); ?>"
        <?php if(count($titleStyles) > 0): ?>style="<?php echo e(implode(";", $titleStyles)); ?>"<?php endif; ?>
    >
        <?php echo e($block[$blockKey]); ?>

    </h3>
<?php elseif(key_exists("{$blockKey}-level", $block) && $block["{$blockKey}-level"] === 'h4'): ?>
    <?php
        $titleClasses[] = 'heading-4'
    ?>
    <h4
        class="<?php echo e(join(" ", $titleClasses)); ?>"
        <?php if(count($titleStyles) > 0): ?>style="<?php echo e(implode(";", $titleStyles)); ?>"<?php endif; ?>
    >
        <?php echo e($block[$blockKey]); ?>

    </h4>
<?php else: ?>
    <?php
        $titleClasses[] = 'heading-5'
    ?>
    <h5
        class="<?php echo e(join(" ", $titleClasses)); ?>"
        <?php if(count($titleStyles) > 0): ?>style="<?php echo e(implode(";", $titleStyles)); ?>"<?php endif; ?>
    >
        <?php echo e($block[$blockKey]); ?>

    </h5>
<?php endif; ?>
<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/blocks/components/title.blade.php ENDPATH**/ ?>