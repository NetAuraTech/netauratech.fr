---
order: 6
cover: 6
rubrique: Application web
title: AdonisJS Foundry
note: Boilerplate production-ready AdonisJS v7
metaTitle: AdonisJS Foundry — Boilerplate AdonisJS v7
metaDescription: Boilerplate de production pour AdonisJS v7 : authentification, back-office, CMS, stockage de fichiers et déploiement. Une base production-ready et extensible.
---

Un boilerplate de référence pour lancer rapidement des applications
production-ready avec AdonisJS v7 : authentification sécurisée, back-office,
stockage de fichiers et déploiement simple.

## Un boilerplate qui ne vous enferme pas

AdonisJS Foundry est né d'un constat simple : chaque nouveau projet
recommence toujours par les mêmes fondations. Authentification, gestion des
rôles, emails, backups, gestion de contenu, autant de briques indispensables
qui prennent des semaines à construire correctement. Ce projet offre une
architecture domain-driven avec une séparation stricte entre services,
repositories et contrôleurs, pour fournir une base si solide que le
développeur n'a plus qu'à se concentrer sur ce qui différencie réellement son
produit.

## Les trois piliers

:::features
**Solidité.** Une architecture domain-driven stricte : des contrôleurs fins qui
délèguent aux services, des repositories dédiés à l'accès base de données, des
exceptions typées avec codes i18n, des events et listeners pour découpler les
effets de bord. Le code se lit comme une intention métier, sans raccourci
architectural.

**Complétude.** Authentification complète avec OAuth (GitHub, Google,
Facebook), CMS visuel avec éditeur par blocs et collaboration temps réel,
système de templates réutilisables, gestion de fichiers multi-disque avec
optimisation d'images, RBAC granulaire, backups automatiques chiffrés,
préférences utilisateur, SEO natif et internationalisation backend et
frontend.

**Liberté.** Une stack standard : AdonisJS, React, TypeScript, Tailwind.
Chaque partie peut être remplacée, étendue ou ignorée. Les alias de chemins
Node.js garantissent une résolution de modules propre, et la licence MIT
laisse toute liberté sur le projet final.
:::

:::gallery
id:7
id:8
id:9
:::

## Un écosystème complet

Foundry n'est pas une collection de snippets. Chaque fonctionnalité est
architecturée, testée et câblée avec les autres.

- **Authentification** : inscription, connexion, vérification d'email, reset
  de mot de passe, OAuth, invitation par l'admin et changement d'email avec
  double confirmation.
- **CMS et éditeur visuel** : un panel d'administration complet sur /admin
  avec un éditeur de pages par blocs et 12 types de blocs pré-configurés,
  accompagné d'un système de templates réutilisables.
- **Collaboration temps réel** : édition collaborative via AdonisJS Transmit
  (SSE) sans WebSocket ni dépendance externe, avec verrouillage optimiste des
  champs, suivi de présence et synchronisation des drafts via Redis.
- **Gestion de fichiers** : stockage multi-disque (local, S3, R2), variantes
  WebP responsive et extraction des dimensions originales pour prévenir le
  CLS.
- **Rôles et permissions** : contrôle d'accès granulaire sans librairie
  externe, guards React côté frontend et middleware backend dédiés.
- **Backups automatiques** : sauvegardes complètes et différentielles, avec
  un pipeline pg_dump puis gzip puis chiffrement AES-256-CBC puis Drive, et
  une politique de rétention configurable.
- **Pages multi-locales et SEO** : traductions par locale, slugs dédiés,
  historique de révisions, sitemap.xml dynamique et métadonnées Open Graph.
- **Paramètres utilisateur** : profil, préférences avec thème clair ou sombre,
  suppression de compte et gestion des connexions OAuth.
- **Formulaire de contact** : bloc dynamique avec liste de champs
  configurable et notification par email pilotée par un événement.
- **Cache Redis** : service de cache avec espaces de noms et synchronisation
  temps réel de l'éditeur.
- **Logging et sécurité** : service de logs centralisé, intégration Sentry,
  sanitization HTML, CSRF, rate limiting et protection des comptes non
  vérifiés.
- **Déploiement Docker** : environnements de développement et de production
  fournis, avec un build multi-étages et un reverse proxy Nginx.

## Les choix techniques

Au-delà des fonctionnalités, Foundry intègre des choix d'architecture qui le
distinguent d'un simple assemblage de packages.

- **Architecture domain-driven** : la séparation entre contrôleurs, services
  et repositories permet au projet de grandir sans s'effondrer. Chaque
  fichier a une responsabilité unique et chaque test cible une couche précise.
- **Inertia.js sans boilerplate API** : plus besoin de concevoir une API
  REST. Les données arrivent directement dans les composants React comme des
  props, avec un routing type-safe, l'expérience d'une SPA et un SSR activé
  par défaut pour les performances et le SEO.
- **Temps réel sans WebSocket** : AdonisJS Transmit implémente la
  collaboration via SSE, avec des locks et drafts gérés dans Redis. La
  déconnexion est gérée proprement, aucune donnée fantôme ne persiste.
- **Stack moderne et cohérente** : AdonisJS v7, TypeScript bout en bout,
  Tailwind CSS v4 et Vite 7 pour un build rapide et un hot-reload instantané.

## Mis à jour dans le temps

Foundry évolue régulièrement. Grâce au système de remote Git, vous pouvez
tirer les mises à jour dans votre projet à tout moment via un simple
git merge foundry/main, en conservant tout votre code métier. L'architecture
modulaire permet d'ajouter continuellement de nouvelles fonctionnalités sans
compromettre la stabilité de l'existant.

Le dépôt est décliné en trois variantes d'une même base : une version
complète avec le CMS et l'éditeur visuel, une version légère sans CMS, et une
API headless pour les clients frontend externes. Le passage d'une variante à
l'autre reste possible à tout moment.

Le résultat : un boilerplate solide, complet et agréable à faire évoluer, qui
fait exactement ce qu'on attend de lui. La preuve qu'avec des choix réfléchis,
on peut livrer quelque chose de durable dès le premier commit.
