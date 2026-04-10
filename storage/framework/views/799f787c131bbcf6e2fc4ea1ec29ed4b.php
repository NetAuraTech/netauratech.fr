<?php $__env->startSection('title', __('core-cms::auth.login.value')); ?>

<?php $__env->startSection('description'); ?>
    <?php echo \Illuminate\View\Factory::parentPlaceholder('description'); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('header'); ?>
    <?php if($options['header'] !== ""): ?>
        <?php $__currentLoopData = $options['header']->getContent(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $block): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if ($__env->exists('core-cms::shared.blocks.renderer', ['block' => $block])) echo $__env->make('core-cms::shared.blocks.renderer', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    <?php endif; ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('footer'); ?>
    <?php if($options['footer'] !== ""): ?>
        <?php $__currentLoopData = $options['footer']->getContent(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $block): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if ($__env->exists('core-cms::shared.blocks.renderer', ['block' => $block])) echo $__env->make('core-cms::shared.blocks.renderer', ['block' => $block], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    <?php endif; ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('body'); ?>
    <section class="container padding-block-6">
        <div class="card margin-block-end-6">
            <form class="grid" method="post" action="<?php echo e(route('login')); ?>">
                <h1 class="heading-1 text-center"><?php echo e(__('core-cms::auth.login.value')); ?></h1>
                <?php echo csrf_field(); ?>
                <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::auth.account.email'), 'name' => 'email', 'value' => old('email'), 'displayError' => false], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                <?php echo $__env->make('core-cms::shared.form-field', ['label' => __('core-cms::auth.account.password.value'), 'name' => 'password', 'type' => 'password', 'displayError' => false], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                <div class="flex-group justify-content-space-between" style="width: initial">
                    <div class="form-group">
                        <div class="form-switch">
                            <input type="checkbox"
                                   id="checkbox-remember"
                                   name="remember"
                                   role="switch"
                                <?php echo e(old('remember') ? 'checked' : ''); ?>

                            >
                            <label class="form-check-label" for="checkbox-remember"><span class="switch"></span>
                                <?php echo e(__('core-cms::auth.remember.value')); ?>

                            </label>
                        </div>
                    </div>
                    <a href="<?php echo e(route('password.request')); ?>"><?php echo e(__('core-cms::auth.account.password.forgotten.value')); ?></a>
                </div>
                <?php echo $__env->make('core-cms::shared.button', ['type' => 'submit', 'label' => __('core-cms::auth.login.value'), 'color' => 'primary'], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                <div class="auth-actions">
                    <a href="<?php echo e(route('register')); ?>"><?php echo e(__('core-cms::auth.account.no')); ?> <?php echo e(__('core-cms::auth.register.value')); ?></a>
                </div>
            </form>
        </div>
            <?php
                $hasSSO = config('services.facebook.client_id')
                    || config('services.google.client_id');
            ?>
            <?php if($hasSSO): ?>
                <div class="card">
                    <div
                        class="grid"
                        style="grid-template-columns: 375px; justify-content: center;"
                    >
                        <h2 class="heading-2 text-center"><?php echo e(__('core-cms::auth.social')); ?></h2>
                        <?php if(config('services.facebook.client_id')): ?>
                            <a href="<?php echo e(route('oauth.connect', 'facebook')); ?>"
                               title="<?php echo e(__('core-cms::auth.login.with')); ?> Facebook"
                               class="button flex-group align-items-center"
                               data-type="facebook"
                               style="width: initial"
                            >
                                <svg class="icon small">
                                    <use xlink:href="/social.svg#facebook"></use>
                                </svg>
                                <?php echo e(__('core-cms::auth.login.with')); ?> Facebook
                            </a>
                        <?php endif; ?>
                        <?php if(config('services.google.client_id')): ?>
                            <a href="<?php echo e(route('oauth.connect', 'google')); ?>"
                               title="<?php echo e(__('core-cms::auth.login.with')); ?> Google"
                               class="button flex-group align-items-center"
                               data-type="google"
                               style="width: initial"
                            >
                                <svg class="icon small">
                                    <use xlink:href="/social.svg#google"></use>
                                </svg>
                                <?php echo e(__('core-cms::auth.login.with')); ?> Google
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endif; ?>
    </section>
<?php $__env->stopSection(); ?>


<?php echo $__env->make('core-cms::base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/auth/login.blade.php ENDPATH**/ ?>