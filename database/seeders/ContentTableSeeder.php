<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Netauratech\CoreCms\Models\Content;
use Netauratech\CoreCms\Models\Option;
use Netauratech\CoreCms\Models\User;

class ContentTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $owner = [
            'name' => '',
            'status' => '',
            'email' => '',
            'address' => '',
            'siret' => '',
        ];

        $adminUser = User::find(1);

        $now = now();

        $common = [
            'status' => 'published',
            'published_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $defaultSection = [
            "media" => [
                "id" => "",
                "alt" => "",
                "height" => "",
                "opacity" => "1",
            ],
            "title" => "",
            "title-level" => "h2",
            "title-color" => "transparent",
            "title-border-style" => "",
            "title-border-line" => "underline",
            "title-border-color" => "transparent",
            "content" => "",
            "ctas" => [],
            "general_animation" => "",
            "general_delay" => "0",
            "general-transition-name" => "",
            "media_animation" => "",
            "media_delay" => "0",
            "media-transition-name" => "",
            "title_animation" => "",
            "title_delay" => "0",
            "title-transition-name" => "",
            "content_animation" => "",
            "content_delay" => "0",
            "content-transition-name" => "",
            "background-color" => "transparent",
            "background-image" => "",
            "background-image-opacity" => "1",
            "background-image-size" => "auto",
            "background-image-repeat" => "auto",
            "background-image-position-x" => "center",
            "background-image-position-y" => "center",
            "use-container" => true,
            "additional-classes" => "",
            "id" => "",
            "padding-block" => "6",
            "padding-inline" => "0",
            "border-top-left-radius" => "0",
            "border-top-right-radius" => "0",
            "border-bottom-left-radius" => "0",
            "border-bottom-right-radius" => "0",
        ];

        $header = Content::firstOrCreate(array_merge($common, [
            'title' => 'Header',
            'slug' => 'header',
            'type' => 'template',
            'content' => json_encode([
                array_merge($defaultSection, [
                    '_name' => 'header',
                    'links' => [
                        [
                            'label' => 'Administration',
                            'type' => 'external',
                            'url' => '/admin',
                        ]
                    ],
                ]),
            ]),
        ]));

        $footer = Content::firstOrCreate(array_merge($common, [
            'title' => 'Footer',
            'slug' => 'footer',
            'type' => 'template',
            'content' => json_encode([
                array_merge($defaultSection, [
                    '_name' => 'layouts.even-columns',
                    'title' => 'Informations',
                    'layout-items' => [
                        [
                            'item-type' => 'links',
                            'title' => 'Informations',
                            'links' => [
                                [ 'label' => 'Support', 'type' => 'external', 'url' => 'mailto:contact@netauratech.fr' ],
                                [ 'label' => '', 'type' => 'internal', 'url' => json_encode(['path' => 'page.show', 'label' => 'Mentions légales', 'slug' => 'mentions-legales']) ],
                            ],
                        ],
                    ],
                    'background-color' => 'var(--neutral-700)',
                    'row-height' => '350',
                    'gap' => '1',
                    'items-per-page' => '4',
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    'content' => '<p style="text-align: center"><span style="color: var(--neutral-100)">Propulsé par </span><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.netauratech.fr"><span style="color: var(--primary-400)">NetAuraTech</span></a></p>',
                    'background-color' => 'var(--neutral-700)',
                ]),
            ]),
        ]));

        $home = Content::firstOrCreate(array_merge($common, [
            'title' => 'Accueil',
            'slug' => 'accueil',
            'type' => 'page',
            'content' => json_encode([
                array_merge($defaultSection, [
                    '_name' => 'section',
                    'title' => 'Bienvenue',
                    'title-level' => 'h1',
                    'content' => '<p>Ce site est maintenant prêt à être configuré. Voici un résumé des options disponibles :</p>',
                    'padding-block' => '12',
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    'title' => '🔑 Accès à l\'administration',
                    'content' => '<ul><li><p>Utilisateur initial: ' . e($adminUser->email) . '</p></li><li><p>Mot de passe: Défini lors de la création (par défaut: password)</p></li></ul>',
                    'padding-block' => '8',
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    'title' => '🚀 Démarrage rapide',
                    'content' => '<ul><li><p>Connectez-vous à l’administration via <a target="_blank" rel="noopener noreferrer nofollow" href="/admin">/admin</a></p></li><li><p>Ajoutez vos premiers contenus : pages, articles, médias</p></li><li><p>Personnalisez le thème de votre site</p></li><li><p>Invitez d’autres utilisateurs si besoin</p></li></ul>',
                    'padding-block' => '8',
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    'title' => '📞 Besoin d’aide ?',
                    'content' => '<p>Consultez notre documentation ou contactez le support à <a target="_blank" rel="noopener noreferrer nofollow" href="mailto:contact@netauratech.fr">contact@netauratech.fr</a></p>',
                    'padding-block' => '8',
                ]),
            ]),
        ]));

        Content::firstOrCreate(array_merge($common, [
            'title' => 'Mentions légales',
            'slug' => 'mentions-legales',
            'type' => 'page',
            'content' => json_encode([
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "Mentions légales",
                    "title-level" => "h1",
                    "content" => "<p>Conformément aux dispositions des articles 6-III et 19 de la Loi n°2004-575 du 21 juin 2004 pour la Confiance dans l’économie numérique (LCEN), il est porté à la connaissance des utilisateurs et visiteurs du site les présentes mentions légales.</p>",
                    "padding-block" => "12",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "1. Éditeur du site",
                    "title-level" => "h2",
                    "content" => "<p><strong>Nom de l’auto-entrepreneur</strong> : {$owner['name']}<br><strong>Statut</strong> : {$owner['status']}<br><strong>Adresse</strong> : {$owner['address']}<br><strong>Numéro SIRET</strong> : {$owner['siret']}<br><strong>Adresse e-mail</strong> : <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"mailto:{$owner['email']}\">{$owner['email']}</a><br><strong>Directeur de la publication</strong> : {$owner['name']}</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "2. Hébergeur du site",
                    "title-level" => "h2",
                    "content" => "<p><strong>Nom de l’hébergeur</strong> : [option key='host-name']<br><strong>Adresse</strong> : [option key='host-address']<br><strong>Téléphone</strong> : [option key='host-phone']<br><strong>Site web</strong> : <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"[option key='host-website']\">[option key='host-website']</a></p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "3. Propriété intellectuelle",
                    "title-level" => "h2",
                    "content" => "<p>Le contenu du site (textes, images, graphismes, logo, icônes, etc.) est la propriété exclusive de <span style=\"color: var(--primary-400)\"><strong>[option key='site_name']</strong></span>, sauf mention contraire. Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, est strictement interdite sans l’accord écrit préalable.</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "4. Données personnelles",
                    "title-level" => "h2",
                    "content" => "<p>Pour plus d’informations sur la collecte et le traitement de vos données personnelles, veuillez consulter notre <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/politique-de-confidentialite\">Politique de confidentialité</a>.</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "5. Cookies",
                    "title-level" => "h2",
                    "content" => "<p>Le site peut utiliser des cookies à des fins de fonctionnement (sessions). En poursuivant la navigation, l’utilisateur accepte l’utilisation des cookies. Il est possible de modifier les préférences via les paramètres du navigateur.</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "6. Responsabilité",
                    "title-level" => "h2",
                    "content" => "<p>L’éditeur s’efforce de fournir sur le site des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable des omissions, inexactitudes ou carences dans la mise à jour</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "",
                    "title-level" => "h2",
                    "content" => "<p>Le présent site est soumis au droit français. En cas de litige, et après tentative de recherche d’une solution amiable, les tribunaux français seront seuls compétents.</p>",
                    "padding-block" => "12",
                ]),
            ]),
        ]));

        $privacy_policy = Content::firstOrCreate(array_merge($common, [
            'title' => 'Politique de confidentialité',
            'slug' => 'politique-de-confidentialite',
            'type' => 'page',
            'content' => json_encode([
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "Politique de confidentialité",
                    "title-level" => "h1",
                    "content" => "<p>Dernière mise à jour : " . $now->format('d/m/Y') . "</p><p>Le présent document a pour but d’informer les utilisateurs du site <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/\">[option key='site_name']</a> de la manière dont leurs données personnelles sont collectées, utilisées et protégées, conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> et à la loi « Informatique et Libertés ».</p>",
                    "padding-block" => "12",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "1. Responsable du traitement",
                    "title-level" => "h2",
                    "content" => "<p><strong>Nom</strong> : {$owner['name']}<br><strong>Statut</strong> : {$owner['status']}<br><strong>Adresse</strong> : {$owner['address']}<br><strong>Email de contact</strong> : <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"mailto:{$owner['email']}\">{$owner['email']}</a></p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "2. Données collectées",
                    "title-level" => "h2",
                    "content" => "<h4 class=\"heading-4\">A. Via les formulaires de contact</h4><p>Les données suivantes peuvent être collectées lorsque vous remplissez un formulaire de contact :</p><ul><li><p>- Nom</p></li><li><p>- Prénom</p></li><li><p>- Adresse e-mail</p></li><li><p>- Numéro de téléphone</p></li></ul><p>Ces informations sont nécessaires pour pouvoir répondre à vos demandes.</p><h4 class=\"heading-4\">B. À des fins statistiques</h4><p>Lorsque vous naviguez sur le site, nous collectons automatiquement certaines données techniques à des fins de mesure d’audience, notamment :</p><ul><li><p>- Pages visitées</p></li><li><p>- Date et heure de la visite</p></li><li><p>- Adresse IP (anonymisée avant enregistrement)</p></li></ul><p>Ces données sont utilisées <strong>uniquement à des fins statistiques anonymes</strong> et ne permettent pas l’identification directe des visiteurs.</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "3. Finalités du traitement",
                    "title-level" => "h2",
                    "content" => "<p>Les données collectées sont utilisées pour :</p><ul><li><p>- Répondre aux demandes envoyées via le formulaire de contact</p></li><li><p>- Vous recontacter si nécessaire</p></li><li><p>- Établir des statistiques de fréquentation anonymes du site</p></li></ul>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "4. Base légale du traitement",
                    "title-level" => "h2",
                    "content" => "<p>Les traitements sont réalisés sur la base :</p><ul><li><p>- Du <strong>consentement explicite</strong> de l’utilisateur pour le formulaire de contact</p></li><li><p>- De <strong>l’intérêt légitime</strong> du responsable du site pour la mesure d’audience</p></li></ul>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "5. Durée de conservation",
                    "title-level" => "h2",
                    "content" => "<ul><li><p>Données issues des formulaires de contact : conservées <strong>3 ans</strong> maximum à compter du dernier contact</p></li><li><p>Données statistiques anonymisées : conservées pendant <strong>13 mois</strong> maximum</p></li></ul>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "6. Partage des données",
                    "title-level" => "h2",
                    "content" => "<p>Les données collectées ne sont en aucun cas revendues ni partagées à des tiers. Elles sont exclusivement traitées par l’éditeur du site</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "7. Sécurité",
                    "title-level" => "h2",
                    "content" => "<p>Toutes les données personnelles sont stockées de manière sécurisée. Des mesures techniques et organisationnelles sont mises en place pour protéger les informations contre tout accès non autorisé, altération ou destruction.</p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "8. Droits des utilisateurs",
                    "title-level" => "h2",
                    "content" => "<p>Conformément au RGPD, vous disposez des droits suivants :</p><ul><li><p>- Droit d’accès</p></li><li><p>- Droit de rectification</p></li><li><p>- Droit à l’effacement</p></li><li><p>- Droit à la limitation du traitement</p></li><li><p>- Droit d’opposition</p></li><li><p>- Droit à la portabilité</p></li></ul><p>Pour exercer vos droits, vous pouvez nous contacter par email à l’adresse suivante : <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"mailto:{$owner['email']}\">{$owner['email']}</a></p><p>Si vous estimez, après nous avoir contactés, que vos droits Informatique et Libertés ne sont pas respectés, vous avez la possibilité d’introduire une réclamation auprès de la Commission Nationale de l’Informatique et des Libertés (CNIL) : <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://www.cnil.fr\">https://www.cnil.fr</a></p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "9. Cookies",
                    "title-level" => "h2",
                    "content" => "<p>Ce site utilise des cookies. Les cookies sont de petits fichiers texte placés sur votre appareil (ordinateur, tablette, mobile) lorsque vous visitez un site web. Ils nous permettent d'améliorer votre expérience de navigation et de comprendre comment vous interagissez avec notre site.</p><p>Nous distinguons plusieurs catégories de cookies :</p><ul><li><strong>Cookies strictement nécessaires :</strong> Ces cookies sont indispensables au bon fonctionnement du site (par exemple, pour gérer votre session, la sécurité). Ils ne nécessitent pas votre consentement.</li><li><strong>Cookies de mesure d'audience (statistiques) :</strong> Ces cookies nous aident à comprendre comment les visiteurs utilisent le site, les pages les plus visitées, etc. Ils nous permettent d'améliorer le contenu et l'ergonomie du site. Les données collectées sont anonymisées (votre adresse IP est tronquée) et ne permettent pas de vous identifier directement. Leur utilisation est soumise à votre consentement préalable via le bandeau de cookies.</li></ul><p>Lors de votre première visite sur le site, un bandeau de consentement vous est présenté, vous offrant la possibilité d'accepter ou de refuser le dépôt des cookies non essentiels. Votre choix est conservé pour une durée de <strong>treize (13) mois</strong>.</p><p>Vous pouvez à tout moment modifier vos préférences ou retirer votre consentement via le lien de gestion des cookies généralement disponible en pied de page du site, ou en ajustant les paramètres de votre navigateur :</p><ul><li><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://support.google.com/chrome/answer/95647?hl=en\">Chrome</a></li><li><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://support.mozilla.org/fr/kb/activer-desactiver-cookies-preferences\">Firefox</a></li><li><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://support.apple.com/fr-fr/guide/safari/sfri11471/mac\">Safari</a></li><li><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://support.microsoft.com/fr-fr/windows/supprimer-et-g%C3%A9rer-les-cookies-168dab11-0753-043d-7c16-ede5947fc64d\">Edge</a></li></ul><p>Pour plus d'informations sur les cookies, vous pouvez consulter le site de la CNIL : <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser\">https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser</a></p>",
                    "padding-block" => "8",
                ]),
                array_merge($defaultSection, [
                    '_name' => 'section',
                    "title" => "",
                    "title-level" => "h2",
                    "content" => "<p>Pour toute question concernant cette politique de confidentialité ou vos données personnelles, vous pouvez nous contacter à : <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"mailto:{$owner['email']}\">{$owner['email']}</a></p>",
                    "padding-block" => "12",
                ]),
            ]),
        ]));

        Option::firstOrCreate(
            ['key' => 'homepage'],
            [
                'value' => $home->id,
                'category' => 'content_settings',
                'type' => 'content',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'header'],
            [
                'value' => $header->id,
                'category' => 'content_settings',
                'type' => 'template',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'footer'],
            [
                'value' => $footer->id,
                'category' => 'content_settings',
                'type' => 'template',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'privacy-policy'],
            [
                'value' => $privacy_policy->id,
                'category' => 'legals',
                'type' => 'content',
            ]
        );
    }
}
