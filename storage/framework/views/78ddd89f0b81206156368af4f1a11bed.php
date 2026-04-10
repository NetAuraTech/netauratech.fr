<?php
    $options = $options ?? [];
    $site_name = $options['site_name'] ?? config('app.name');
    $openGraphLogo = $openGraphLogo ?? '';
    $logo = url('/') . str_replace('&amp;', '&', image_url($openGraphLogo->id ?? ''));

    $description = ($isHomepage ?? false) ? ($options['description'] ?? '') : ($content->description ?? '');
?>



<?php $__env->startSection('title', $content->title); ?>

<?php $__env->startSection('description'); ?>
    <meta property='og:description' content="<?php echo e($description); ?>"/>
    <meta name='twitter:description' content="<?php echo e($description); ?>"/>
    <meta name="description" content="<?php echo e($description); ?>"/>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('meta'); ?>
    <?php echo \Illuminate\View\Factory::parentPlaceholder('meta'); ?>

    <?php
        $regionCodesByCountry = [
            'FR' => [
                'Auvergne-Rhône-Alpes' => 'FR-ARA',
                'Bourgogne-Franche-Comté' => 'FR-BFC',
                'Bretagne' => 'FR-BRE',
                'Centre-Val de Loire' => 'FR-CVL',
                'Corse' => 'FR-COR',
                'Grand Est' => 'FR-GES',
                'Hauts-de-France' => 'FR-HDF',
                'Île-de-France' => 'FR-IDF',
                'Normandie' => 'FR-NOR',
                'Nouvelle-Aquitaine' => 'FR-NAQ',
                'Occitanie' => 'FR-OCC',
                'Pays de la Loire' => 'FR-PDL',
                "Provence-Alpes-Côte d'Azur" => 'FR-PAC',
            ],
        ];

        $userCountry = strtoupper($options['address_country'] ?? 'FR');
        $userRegion = $options['address_region'] ?? '';

        $normalizedInput = strtolower(str_replace([' ', '-', "'", 'ü', 'ö', 'ä', 'ß'], ['', '', '', 'u', 'o', 'a', 'ss'], $userRegion));

        $regionCode = null;
        if (isset($regionCodesByCountry[$userCountry])) {
            foreach ($regionCodesByCountry[$userCountry] as $name => $code) {
                $normalizedName = strtolower(str_replace([' ', '-', "'", 'ü', 'ö', 'ä', 'ß'], ['', '', '', 'u', 'o', 'a', 'ss'], $name));
                if ($normalizedInput === $normalizedName) {
                    $regionCode = $code;
                    break;
                }
            }
        }
    ?>

    <?php if($isHomepage && !empty($options['address_city'])): ?>
        <meta property="og:type" content="business.business"/>
        <meta property="business:contact_data:street_address" content="<?php echo e($options['address'] ?? ''); ?>"/>
        <meta property="business:contact_data:locality" content="<?php echo e($options['address_city']); ?>"/>
        <meta property="business:contact_data:region" content="<?php echo e($options['address_region']); ?>"/>
        <meta property="business:contact_data:postal_code" content="<?php echo e($options['address_postal-code']); ?>"/>
        <meta property="business:contact_data:country_name" content="<?php echo e($options['address_country']); ?>"/>
        <?php if(!empty($options['phone'])): ?>
            <meta property="business:contact_data:phone_number" content="<?php echo e($options['phone']); ?>"/>
        <?php endif; ?>
        <?php if(!empty($options['contact-email'])): ?>
            <meta property="business:contact_data:email" content="<?php echo e($options['contact-email']); ?>"/>
        <?php endif; ?>
        <?php if($regionCode): ?>
            <meta name="geo.region" content="<?php echo e($regionCode); ?>">
        <?php endif; ?>
        <meta name="geo.placename" content="<?php echo e($options['address_city']); ?>"/>
        <meta name="geo.position" content="<?php echo e($options['address_latitude']); ?>;<?php echo e($options['address_longitude']); ?>"/>
        <meta name="ICBM" content="<?php echo e($options['address_latitude']); ?>, <?php echo e($options['address_longitude']); ?>"/>
    <?php endif; ?>

    <?php $__currentLoopData = $metas; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $meta): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php echo $__env->make($meta['template'], ['content' => $content, 'openGraphLogo' => $openGraphLogo], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('jsonLd'); ?>
    <?php echo \Illuminate\View\Factory::parentPlaceholder('jsonLd'); ?>
    <?php if($isHomepage): ?>
        <?php
            $areaServedNames = !empty($options['area_served']) ? explode(", ", $options['area_served']) : [];
            $areaServedObjects = [];

            if (!empty($options['address_region'])) {
                $areaServedObjects[] = [
                    "@type" => "State",
                    "name" => $options['address_region']
                ];
            }

            foreach ($areaServedNames as $cityName) {
                if (!empty(trim($cityName))) {
                    $areaServedObjects[] = [
                        "@type" => "City",
                        "name" => trim($cityName)
                    ];
                }
            }

            $jsonLdLocalBusiness = [
                "@context" => "https://schema.org",
                "@type" => "ProfessionalService",
                "name" => $site_name,
                "legalName" => $site_name,
                "image" => $logo,
                "url" => Request::url(),
                "email" => $options['contact-email'],
                "description" => $description,
                "contactPoint" => [
                    "@type" => "ContactPoint",
                    "contactType" => "customer service",
                    "telephone" => $options['phone'],
                    "email" => $options['contact-email'],
                    "availableLanguage" => ["French"],
                    "areaServed" => "FR"
                ]
            ];

            if (!empty($options['phone'])) {
                $jsonLdLocalBusiness["telephone"] = $options['phone'];
            }

            if (!empty($options['price_range'])) {
                $jsonLdLocalBusiness["priceRange"] = $options['price_range'];
            } else {
                $jsonLdLocalBusiness["priceRange"] = "€€";
            }

            $address = [
                "@type" => "PostalAddress",
            ];

            if (!empty($options['address'])) {
                $address["streetAddress"] = $options['address'];
            }

            if (!empty($options['address_city'])) {
                $address["addressLocality"] = $options['address_city'];
            }

            if (!empty($options['address_postal-code'])) {
                $address["postalCode"] = $options['address_postal-code'];
            }

            if (!empty($options['address_region'])) {
                $address["addressRegion"] = $options['address_region'];
            }

            if (!empty($options['address_country'])) {
                $address["addressCountry"] = $options['address_country'];
            }

            if (!empty($options['address_city'])) {
                $jsonLdLocalBusiness["address"] = $address;
            }

            if (!empty($options['address_latitude']) && !empty($options['address_longitude'])) {
                $jsonLdLocalBusiness["location"] = [
                    "type" => "Place",
                    "geo" => [
                        "@type" => "GeoCoordinates",
                        "latitude" => $options['address_latitude'],
                        "longitude" => $options['address_longitude'],
                        "address" => [
                            "@type" => "PostalAddress",
                            "addressCountry" => $options['address_country']
                        ]
                    ],
                    "hasMap" => "https://www.google.com/maps/search/?api=1&query={$options['address_latitude']},{$options['address_longitude']}"
                ];
            }

            if (!empty($areaServedObjects)) {
                $jsonLdLocalBusiness["areaServed"] = $areaServedObjects;
            }

            $daysMapping = [
                'monday' => 'Monday',
                'tuesday' => 'Tuesday',
                'wednesday' => 'Wednesday',
                'thursday' => 'Thursday',
                'friday' => 'Friday',
                'saturday' => 'Saturday',
                'sunday' => 'Sunday'
            ];

            $openingHoursSpecification = [];

            foreach ($daysMapping as $dayKey => $dayName) {
                $schedule = $options["schedule_{$dayKey}"] ?? '';

                if (empty($schedule)) {
                    continue;
                }

                $slots = explode('/', $schedule);

                foreach ($slots as $slot) {
                    $times = explode('-', trim($slot));

                    if (count($times) === 2) {
                        $openingHoursSpecification[] = [
                            "@type" => "OpeningHoursSpecification",
                               "dayOfWeek" => $dayName,
                               "opens" => trim($times[0]),
                               "closes" => trim($times[1]),
                           ];
                    }
                }
            }

            if (!empty($openingHoursSpecification)) {
                $jsonLdLocalBusiness["openingHoursSpecification"] = $openingHoursSpecification;
            }

            if (!empty($sameAs)) {
                $jsonLdLocalBusiness["sameAs"] = $sameAs;
            }
        ?>

        <?php if(!empty($options['address_city'])): ?>
            <script type="application/ld+json">
                <?php echo json_encode($jsonLdLocalBusiness, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT); ?>

            </script>
        <?php endif; ?>
    <?php endif; ?>
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

<?php $__env->startSection('stylesheets'); ?>
    <?php
        $contents = [$content, $options['header'], $options['footer']];
    ?>
    <?php $__currentLoopData = $contents; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php
            $cacheBuster = substr(md5(json_encode($item->updated_at)), 0, 8);
            $cssPath = 'css/' . $item->slug . '.css';
        ?>
        <link rel="preload" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript>
            <link rel="stylesheet" href="<?php echo e(route('assets.show', ['path' => $cssPath])); ?>?v=<?php echo e($cacheBuster); ?>">
        </noscript>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php $__env->stopSection(true); ?>

<?php $__env->startSection('body'); ?>
    <?php $__currentLoopData = $content->getContent(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $block): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php if ($__env->exists('core-cms::shared.blocks.renderer', ['block' => $block, 'content' => $content])) echo $__env->make('core-cms::shared.blocks.renderer', ['block' => $block, 'content' => $content], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('core-cms::base', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/vendor/netauratech/core-cms/src/resources/views/front/page.blade.php ENDPATH**/ ?>