<?php
    $options = $options ?? [];
    $site_name = $options['site_name'] ?? config('app.name');
    $openGraphLogo = $openGraphLogo ?? '';
    $logo = url('/') . str_replace('&amp;', '&', image_url($openGraphLogo->id ?? ''));
?>

<?php $__env->startSection('jsonLd'); ?>
    <?php echo \Illuminate\View\Factory::parentPlaceholder('jsonLd'); ?>
    <?php
        $breadcrumbs = [
            "@context" => "https://schema.org",
            "@type" => "BreadcrumbList",
            "itemListElement" => [
                [
                    "@type" => "ListItem",
                    "position" => 1,
                    "name" => __('core-cms::core.home'),
                    "item" => route('home')
                ],
                [
                    "@type" => "ListItem",
                    "position" => 2,
                    "name" => "Portfolio",
                    "item" => Request::url()
                ]
            ]
        ];

        $portfolioItems = [];

        if (isset($projects) && $projects->isNotEmpty()) {
            foreach ($projects as $index => $project) {
                $projectImage = isset($project->media_id) ? image_url($project->media_id) : image_url($openGraphLogo->id ?? '');
                $projectImageUrl = url('/') . str_replace('&amp;', '&', $projectImage);

                $projectCategories = $project->categories->pluck('name')->toArray();

                $projectUrl = route('portfolio.show', ['post' => $project]);

                $portfolioItems[] = [
                    "@type" => "CreativeWork",
                    "position" => $index + 1,
                    "name" => $project->title ?? '',
                    "description" => $project->description ?? '',
                    "image" => [
                        "@type" => "ImageObject",
                        "url" => $projectImageUrl,
                        "width" => $project->media?->width ?? 1200,
                        "height" => $project->media?->height ?? 630
                    ],
                    "dateCreated" => isset($project->created_at)
                        ? $project->created_at->toIso8601String()
                        : null,
                    "dateModified" => isset($project->updated_at)
                        ? $project->updated_at->toIso8601String()
                        : null,
                    "creator" => [
                        "@type" => "Organization",
                        "name" => $site_name,
                    ],
                    "url" => $projectUrl,
                    ...(!empty($projectCategories) ? ["genre" => implode(', ', $projectCategories)] : []),
                    "inLanguage" => app()->getLocale(),
                ];
            }
        }

        $jsonLdPortfolio = [
            "@context" => "https://schema.org",
            "@type" => "CollectionPage",
            "name" => "Portfolio - " . $site_name,
            "url" => Request::url(),
            "publisher" => [
                "@type" => "Organization",
                "name" => $site_name,
                "logo" => [
                    "@type" => "ImageObject",
                    "url" => $logo,
                ]
            ],
            "inLanguage" => app()->getLocale(),
        ];

        if (isset($projects) && method_exists($projects, 'total')) {
            $jsonLdPortfolio["numberOfItems"] = $projects->total();
        }

        if (!empty($portfolioItems)) {
            $jsonLdPortfolio["hasPart"] = $portfolioItems;
        }
    ?>
    <script type="application/ld+json">
        <?php echo json_encode($breadcrumbs, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT); ?>

    </script>
    <script type="application/ld+json">
        <?php echo json_encode($jsonLdPortfolio, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT); ?>

    </script>
<?php $__env->stopSection(); ?>

<div class="portfolio">
    <?php if($showFilters && $categories->isNotEmpty()): ?>
        <nav class="portfolio__filters margin-block-end-10" aria-label="<?php echo e(__('portfolio-manager::core.portfolio.project.filter')); ?>">
            <a
                href="<?php echo e(request()->url()); ?>"
                class="border-radius-2 padding-inline-4 padding-block-2 bg-neutral-300"
                <?php echo e(is_null($currentCategory) ? 'aria-current=page' : ''); ?>

            >
            <?php echo e(__('portfolio-manager::core.portfolio.project.all')); ?>

            </a>

            <?php $__currentLoopData = $categories; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $category): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <a
                    href="<?php echo e(request()->url()); ?>?category=<?php echo e($category->slug); ?>"
                    class="border-radius-2 padding-inline-4 padding-block-2 bg-neutral-300"
                    <?php echo e($currentCategory === $category->slug ? 'aria-current=page' : ''); ?>

                >
                    <?php echo e($category->name); ?>

                    <?php if($category->count > 0): ?>
                        <span>(<?php echo e($category->count); ?>)</span>
                    <?php endif; ?>
                </a>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </nav>
    <?php endif; ?>

    <div class="grid-auto-fit" style="--min-item-size: 400px">
        <?php $__empty_1 = true; $__currentLoopData = $projects; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $project): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
            <article class="portfolio__item block card padding-block-0 padding-inline-0" style="--background-color: var(--neutral-200);">
                <div class="portfolio__item-image border-radius-top-left-1 border-radius-top-right-1">
                    <?php $__currentLoopData = $medias; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $media): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php echo $__env->make($media['template'], ['content' => $project, 'imageHeight' => 280], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    <?php if($project->categories->isNotEmpty()): ?>
                        <span class="portfolio__item-category border-radius-2 padding-inline-4 padding-block-2 bg-accent-500 clr-neutral-1000">
                            <?php echo e($project->categories->first()->name); ?>

                        </span>
                    <?php endif; ?>
                </div>
                <div class="padding-block-8 padding-inline-8">
                    <h3 class="heading-3 margin-block-end-3"><?php echo e($project->title); ?></h3>
                    <p>
                        <?php echo Str::limit($project->description, 280); ?>

                    </p>
                    <div class="portfolio__item-cta text-center margin-block-4">
                        <a href="<?php echo e(route('portfolio.show', $project->slug)); ?>" class="button" data-type="primary">
                            <?php echo e(__('portfolio-manager::core.portfolio.project.see.value')); ?>

                        </a>
                    </div>
                    <?php if($project->tags->isNotEmpty()): ?>
                        <div class="portfolio__item-tags">
                            <?php $__currentLoopData = $project->tags; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $tag): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <span class="border-radius-1 padding-inline-4 padding-block-2 bg-neutral-300">
                                    <?php echo e($tag->name); ?>

                                </span>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </div>
                    <?php endif; ?>
                </div>
            </article>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
            <div class="block card padding-block-10 text-center" style="--background-color: var(--neutral-200);">
                <p class="clr-neutral-800 margin-block-end-8"><?php echo e(__('portfolio-manager::core.portfolio.project.empty')); ?></p>
                <div>
                    <a href="<?php echo e(request()->url()); ?>" class="button" data-type="accent">
                        ← <?php echo e(__('portfolio-manager::core.portfolio.project.see.all')); ?>

                    </a>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <?php if($projects instanceof \Illuminate\Pagination\LengthAwarePaginator && $projects->hasPages()): ?>
        <nav class="margin-block-start-10 flex justify-content-center" aria-label="<?php echo e(__('portfolio-manager::core.portfolio.project.pagination')); ?>">
            <?php echo e($projects->appends(['category' => $currentCategory])->links()); ?>

        </nav>
    <?php endif; ?>
</div><?php /**PATH /var/www/vendor/netauratech/portfolio-manager/src/resources/views/shortcodes/portfolio.blade.php ENDPATH**/ ?>