# NetAuraCMS

A comprehensive, modular Laravel-based Content Management System designed for modern web applications. NetAuraCMS provides a complete ecosystem of interconnected packages that work seamlessly together to create powerful, scalable websites and applications.

## Description

NetAuraCMS is built on Laravel 12 and offers a modular architecture that allows you to choose exactly the components you need. Whether you're building a simple website, a complex multi-tenant application, or anything in between, NetAuraCMS provides the foundation and tools to get you there quickly and efficiently.

## 🚀 Key Features

- **🏗️ Modular Architecture** - Install only what you need with our component-based system
- **⚡ Laravel 12 Foundation** - Built on the latest Laravel framework for maximum performance
- **🎨 Modern Asset Management** - Vite-powered build system with automatic asset discovery
- **🔐 Complete Authentication** - User management with roles, permissions, and social login
- **📝 Content Management** - Flexible page and content creation system
- **📁 Media Management** - Advanced file and image handling with automatic optimization
- **🌐 Multi-tenancy Ready** - Scale to multiple sites and organizations
- **📊 Analytics Integration** - Built-in website analytics and tracking
- **🛡️ GDPR Compliant** - Privacy tools and consent management
- **📱 Mobile-First Design** - Responsive admin interface and frontend themes
- **🔧 Developer-Friendly** - Extensive APIs, hooks, and customization options

## 📦 Available Packages

For detailed information about each package, please visit their individual repositories:

- **[core-cms](https://github.com/NetAuraTech/core-cms)** - Essential CMS functionality, authentication, and admin interface
- **[theme-manager](https://github.com/NetAuraTech/theme-manager)** - Theme system with live preview and customization
- **[user-management](https://github.com/NetAuraTech/user-management)** - Advanced user roles, permissions, and profile management
- **[content-manager](https://github.com/NetAuraTech/content-manager)** - Page builder with drag-and-drop interface
- **[media-manager](https://github.com/NetAuraTech/media-manager)** - File management with image optimization and CDN support
- **[blog-manager](https://github.com/NetAuraTech/blog-manager)** - Complete blogging system with categories and comments
- **[multi-tenancy](https://github.com/NetAuraTech/multi-tenancy)** - Multi-site management from single installation
- **[analytics-manager](https://github.com/NetAuraTech/analytics-manager)** - Website analytics with custom dashboards
- **[gdpr-consent](https://github.com/NetAuraTech/gdpr-consent)** - Privacy compliance and consent management

Each package repository contains detailed installation instructions, configuration options, and usage examples.

## ⚡ Quick Start

### Requirements

- **PHP** ^8.2
- **Laravel** ^12.0
- **Node.js** ^18.0 (for asset compilation)
- **Database** MySQL 8.0+, PostgreSQL 13+, or SQLite 3.35+

### Installation

Get started with NetAuraCMS using our interactive installer:

```bash
# Clone the NetAuraCMS repository
git clone https://github.com/NetAuraTech/NetAuraCMS.git
cd NetAuraCMS

# Install dependencies
composer install

# Run the interactive installer
php artisan netauracms:install
```

The installer will guide you through:

1. **Package Selection** - Choose which components to install
2. **Environment Configuration** - Database, mail, and application settings
3. **Automated Installation** - Dependencies, migrations, and asset compilation
4. **Initial Setup** - Admin user creation and basic configuration

## 🔧 Configuration

### Environment Setup

NetAuraCMS extends Laravel's environment configuration with additional options:

```env
# Application
APP_NAME="My NetAuraCMS Site"
APP_ENV=production
APP_URL=https://mysite.com
APP_LOCALE=fr
APP_FALLBACK_LOCALE=en

# Node.js Path (for production deployments)
NODE_PATH=/usr/local/bin

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=netauracms
DB_USERNAME=root
DB_PASSWORD=your_secure_password

# Cache (recommended for production)
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# LiteSpeed Cache (if using LiteSpeed)
LSCACHE_DEFAULT_TTL=604800
LSCACHE_DEFAULT_CACHEABILITY=public
```

### Asset Management

NetAuraCMS includes an advanced asset discovery system:

```bash
# Discover all package assets
php artisan assets:discover

# Build for development
npm run dev

# Build for production
npm run build
```

### Admin Interface

Access the admin interface at `/admin` (configurable).

## 🎨 Theming System

NetAuraCMS uses a powerful theming system that allows complete customization. For detailed information about theme development, customization options, and examples, please visit the **[theme-manager](https://github.com/NetAuraTech/theme-manager)** repository.

## 📝 Content Management

NetAuraCMS includes a comprehensive content management system with page builder, custom blocks, and shortcodes. For detailed documentation, examples, and usage instructions, please visit the **[content-manager](https://github.com/NetAuraTech/content-manager)** repository.

## 👥 User Management

Advanced user management with roles, permissions, and multiple authentication methods. For complete documentation on user roles, permissions, and authentication options, please visit the **[user-management](https://github.com/NetAuraTech/user-management)** repository.

## 📊 Analytics

Built-in analytics tracking features. For detailed information about analytics setup, custom event tracking, please visit the **[analytics-manager](https://github.com/NetAuraTech/analytics-manager)** repository.

## 🌐 Multi-Tenancy

Manage multiple sites from a single installation with our multi-tenancy system. For complete setup instructions and configuration examples, please visit the **[multi-tenancy](https://github.com/NetAuraTech/multi-tenancy)** repository.

## 🛡️ Security & Privacy

NetAuraCMS includes comprehensive security and privacy features. For detailed information about GDPR compliance, consent management, and security configurations, please visit the **[gdpr-consent](https://github.com/NetAuraTech/gdpr-consent)** repository.

## 🤝 Contributing

We welcome contributions from the community!

### Development Setup

```bash
# Clone the repository
git clone https://github.com/NetAuraTech/netauracms.git
cd netauracms

# Install dependencies
composer install

# Install CMS
php artisan netauracms:install

# Set up development environment
npm run dev
```

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for detailed information.

## 📋 Changelog

### v1.0.0 (Latest)

- ✅ Initial release
- ✅ Complete modular architecture
- ✅ Interactive installer
- ✅ Admin interface
- ✅ Theme system
- ✅ Content management
- ✅ User management
- ✅ Media management
- ✅ Blog system
- ✅ Multi-tenancy support
- ✅ GDPR compliance
- ✅ Analytics integration

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## 🆘 Support

### Professional Support

- **Enterprise Support** - Priority support for business customers
- **Custom Development** - Bespoke features and integrations
- **Training & Consulting** - Expert guidance and best practices
- **Managed Hosting** - Fully managed NetAuraCMS hosting

Contact us at [support@netauratech.fr](mailto:support@netauratech.fr) for professional support options.

## 📄 License

NetAuraCMS is open-source software licensed under the [MIT License](LICENSE).

## 🏢 About NetAuraTech

NetAuraTech is a French technology company specializing in modern web solutions. We build tools that help developers and businesses create exceptional web experiences.

- **Website:** [https://netauratech.fr](https://netauratech.fr)
- **Email:** [contact@netauratech.fr](mailto:contact@netauratech.fr)
- **GitHub:** [@NetAuraTech](https://github.com/NetAuraTech)

## 🙏 Acknowledgments

NetAuraCMS builds upon the excellent work of:

- **[Laravel Framework](https://laravel.com)** - The foundation of our CMS
- **[Vite](https://vitejs.dev)** - Modern asset bundling

Special thanks to all our contributors and the Laravel community.

---

**Made with ❤️ in France by [NetAuraTech](https://netauratech.fr)**

© 2025 NetAuraTech. All rights reserved.