<?php if($paginator->hasPages()): ?>
    <ul class="flex-group align-items-center">
        
        <?php if($paginator->onFirstPage()): ?>
            <li class="padding-3" aria-disabled="true">
                <span>«</span>
            </li>
        <?php else: ?>
            <li>
                <a class="button padding-3" data-type="paginator" href="<?php echo e($paginator->previousPageUrl()); ?>"
                   rel="prev">«</a>
            </li>
        <?php endif; ?>
        
        <?php $__currentLoopData = $elements; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $element): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            
            <?php if(is_string($element)): ?>
                <li aria-disabled="true"><span><?php echo e($element); ?></span></li>
            <?php endif; ?>

            
            <?php if(is_array($element)): ?>
                <?php $__currentLoopData = $element; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $page => $url): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php if($page == $paginator->currentPage()): ?>
                        <li class="button is-active padding-3" data-type="primary" aria-current="page">
                            <span><?php echo e($page); ?></span></li>
                    <?php else: ?>
                        <li><a class="button padding-3" data-type="paginator" href="<?php echo e($url); ?>"><?php echo e($page); ?></a></li>
                    <?php endif; ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            <?php endif; ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        
        <?php if($paginator->hasMorePages()): ?>
            <li>
                <a class="button padding-3" data-type="paginator" href="<?php echo e($paginator->nextPageUrl()); ?>"
                   rel="next">»</a>
            </li>
        <?php else: ?>
            <li class="padding-3" aria-disabled="true">
                <span>»</span>
            </li>
        <?php endif; ?>
    </ul>
<?php endif; ?>
<?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/shared/partials/paginator.blade.php ENDPATH**/ ?>