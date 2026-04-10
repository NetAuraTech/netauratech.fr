<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class NetAuraCMSInstallCommand extends Command
{
    protected $signature = 'netauracms:install {--force : Force installation even if already configured}';
    protected $description = 'Install NetAuraCMS with all components';

    private array $availablePackages = [
        'core-cms' => [
            'name' => 'Core CMS',
            'description' => 'Essential CMS functionality (Required)',
            'required' => true,
            'default' => true,
            'composer_name' => 'netauratech/core-cms'
        ],
        'theme-manager' => [
            'name' => 'Theme Manager',
            'description' => 'Theme management system',
            'required' => false,
            'default' => true,
            'composer_name' => 'netauratech/theme-manager'
        ],
        'media-manager' => [
            'name' => 'Media Manager',
            'description' => 'File and media management',
            'required' => false,
            'default' => true,
            'composer_name' => 'netauratech/media-manager'
        ],
        'blog-manager' => [
            'name' => 'Blog Manager',
            'description' => 'Blog and article system',
            'required' => false,
            'default' => false,
            'composer_name' => 'netauratech/blog-manager'
        ],
        'multi-tenancy' => [
            'name' => 'Multi-Tenancy',
            'description' => 'Multi-tenant support',
            'required' => false,
            'default' => false,
            'composer_name' => 'netauratech/multi-tenancy'
        ],
        'gdpr-consent' => [
            'name' => 'GDPR Consent',
            'description' => 'GDPR compliance tools',
            'required' => false,
            'default' => true,
            'composer_name' => 'netauratech/gdpr-consent'
        ],
        'analytics-manager' => [
            'name' => 'Analytics Manager',
            'description' => 'Website analytics',
            'required' => false,
            'default' => false,
            'composer_name' => 'netauratech/analytics-manager'
        ]
    ];

    private array $selectedPackages = [];
    private array $envConfig = [];

    public function handle(): int
    {
        $this->displayHeader();

        if (!$this->checkPrerequisites()) {
            return self::FAILURE;
        }

        $this->selectPackages();

        $this->configureEnvironment();

        if (!$this->confirmInstallation()) {
            $this->info('🚫 Installation cancelled');
            return self::SUCCESS;
        }

        return $this->performInstallation();
    }

    private function displayHeader(): void
    {
        $this->info('');
        $this->info('╔══════════════════════════════════════════════════════════════════════════════╗');
        $this->info('║                           🚀 NetAuraCMS Installer                            ║');
        $this->info('║                                                                              ║');
        $this->info('║                Welcome to the NetAuraCMS installation wizard                 ║');
        $this->info('╚══════════════════════════════════════════════════════════════════════════════╝');
        $this->info('');
    }

    private function checkPrerequisites(): bool
    {
        $this->info('📋 Checking prerequisites...');

        if (version_compare(PHP_VERSION, '8.2.0', '<')) {
            $this->error('❌ PHP 8.2 or higher is required. Current version: ' . PHP_VERSION);
            return false;
        }
        $this->line('✅ PHP version: ' . PHP_VERSION);

        if (!$this->commandExists('composer')) {
            $this->error('❌ Composer is not installed or not in PATH');
            return false;
        }
        $this->line('✅ Composer is available');

        if ($this->commandExists('node') && $this->commandExists('npm')) {
            $this->line('✅ Node.js and npm are available in PATH');
        } else {
            $this->warn('⚠️  Node.js/npm not found in default PATH');
            $this->line('   → You can configure a custom NODE_PATH during setup');
        }

        if (File::exists(base_path('composer.json'))) {
            $composer = json_decode(File::get(base_path('composer.json')), true);
            $hasNetAuraPackages = false;

            foreach ($this->availablePackages as $package) {
                if (isset($composer['require'][$package['composer_name']])) {
                    $hasNetAuraPackages = true;
                    break;
                }
            }

            if ($hasNetAuraPackages && !$this->option('force')) {
                $this->warn('⚠️  NetAuraFlow seems to already be installed.');
                if (!$this->confirm('Do you want to continue anyway?', false)) {
                    return false;
                }
            }
        }

        $this->info('✅ Basic prerequisites met!');
        $this->info('');

        return true;
    }

    private function selectPackages(): void
    {
        $this->info('📦 Package Selection');
        $this->info('Please select the packages you want to install:');
        $this->info('');

        foreach ($this->availablePackages as $key => $package) {
            if ($package['required']) {
                $this->selectedPackages[$key] = true;
                $this->line("✅ {$package['name']} - {$package['description']} (Required)");
            } else {
                $default = $package['default'];
                $install = $this->confirm(
                    "Install {$package['name']} - {$package['description']}?",
                    $default
                );
                $this->selectedPackages[$key] = $install;

                if ($install) {
                    $this->line("✅ {$package['name']} - Selected");
                } else {
                    $this->line("⏭️  {$package['name']} - Skipped");
                }
            }
        }

        $this->info('');
        $selectedCount = count(array_filter($this->selectedPackages));
        $this->info("📋 Selected {$selectedCount} packages for installation");
        $this->info('');
    }

    private function configureEnvironment(): void
    {
        $this->info('🔧 Environment Configuration');
        $this->info('');

        $this->envConfig = [
            'APP_NAME' => $this->ask('Application Name', 'NetAuraFlow'),
            'APP_ENV' => $this->choice('Environment', ['dev', 'local', 'staging', 'production'], 'dev'),
            'APP_DEBUG' => $this->choice('Debug Mode', ['true', 'false'], 'true'),
            'APP_URL' => $this->ask('Application URL', 'http://localhost'),
            'APP_LOCALE' => $this->choice('Default Locale', ['en', 'fr'], 'fr'),
        ];

        $this->info('');
        $this->info('🗄️ Database Configuration');

        $this->envConfig += [
            'DB_CONNECTION' => $this->choice('Database Type', ['mysql', 'pgsql', 'sqlite'], 'mysql'),
        ];

        if ($this->envConfig['DB_CONNECTION'] !== 'sqlite') {
            $this->envConfig += [
                'DB_HOST' => $this->ask('Database Host', '127.0.0.1'),
                'DB_PORT' => $this->ask('Database Port', $this->envConfig['DB_CONNECTION'] === 'mysql' ? '3306' : '5432'),
                'DB_DATABASE' => $this->ask('Database Name', 'netaura_flow'),
                'DB_USERNAME' => $this->ask('Database Username', 'root'),
                'DB_PASSWORD' => $this->secret('Database Password'),
            ];
        } else {
            $this->envConfig['DB_DATABASE'] = $this->ask('SQLite Database Path', 'database/database.sqlite');
        }

        $this->info('');
        $this->info('📧 Mail Configuration');

        $configureEmail = $this->confirm('Configure email settings now?', true);

        if ($configureEmail) {
            $this->envConfig += [
                'MAIL_MAILER' => $this->choice('Mail Driver', ['smtp', 'mailgun', 'ses', 'log'], 'smtp'),
            ];

            if ($this->envConfig['MAIL_MAILER'] === 'smtp') {
                $this->envConfig += [
                    'MAIL_HOST' => $this->ask('SMTP Host', '127.0.0.1'),
                    'MAIL_PORT' => $this->ask('SMTP Port', '1025'),
                    'MAIL_USERNAME' => $this->ask('SMTP Username', 'hello@example.com'),
                    'MAIL_PASSWORD' => $this->secret('SMTP Password'),
                    'MAIL_FROM_ADDRESS' => $this->ask('From Address', 'hello@example.com'),
                    'MAIL_FROM_NAME' => $this->ask('From Name', $this->envConfig['APP_NAME']),
                ];
            }
        } else {
            $this->envConfig += [
                'MAIL_MAILER' => 'smtp',
                'MAIL_HOST' => '127.0.0.1',
                'MAIL_PORT' => '1025',
                'MAIL_USERNAME' => 'hello@example.com',
                'MAIL_PASSWORD' => 'null',
                'MAIL_FROM_ADDRESS' => 'hello@example.com',
                'MAIL_FROM_NAME' => $this->envConfig['APP_NAME'],
                'APP_FALLBACK_LOCALE' => 'en',
                'APP_FAKER_LOCALE' => 'en_US'
            ];
        }

        $this->info('');
        $this->info('🔧 Node.js Configuration');

        $configureNodePath = $this->confirm('Configure Node.js PATH for production environment?', false);

        if ($configureNodePath) {
            $this->envConfig['NODE_PATH'] = $this->ask('Node.js PATH (e.g., /usr/local/bin)', '');
        }

        $this->info('✅ Configuration completed!');
        $this->info('');
    }

    private function confirmInstallation(): bool
    {
        $this->info('📋 Installation Summary');
        $this->info('');

        $this->info('Selected Packages:');
        foreach ($this->selectedPackages as $key => $selected) {
            if ($selected) {
                $package = $this->availablePackages[$key];
                $this->line("  ✅ {$package['name']}");
            }
        }

        $this->info('');
        $this->info('Configuration:');
        $this->line("  • App Name: {$this->envConfig['APP_NAME']}");
        $this->line("  • Environment: {$this->envConfig['APP_ENV']}");
        $this->line("  • URL: {$this->envConfig['APP_URL']}");
        $this->line("  • Database: {$this->envConfig['DB_CONNECTION']}");
        if (isset($this->envConfig['DB_HOST'])) {
            $this->line("  • DB Host: {$this->envConfig['DB_HOST']}:{$this->envConfig['DB_PORT']}");
        }
        if (isset($this->envConfig['NODE_PATH']) && !empty($this->envConfig['NODE_PATH'])) {
            $this->line("  • Node PATH: {$this->envConfig['NODE_PATH']}");
        }

        $this->info('');
        return $this->confirm('🚀 Proceed with installation?', true);
    }

    private function performInstallation(): int
    {
        $this->info('🚀 Starting NetAuraFlow installation...');
        $this->info('');

        try {
            $this->createEnvFile();

            if (!$this->verifyNodeJsAccess()) {
                return self::FAILURE;
            }

            $this->installComposerPackages();

            $this->publishAssets();

            $this->createSqliteDatabase();

            $this->runMigrations();

            $this->runSeeders();

            $this->discoverAssets();

            $this->installNodeDependencies();

            $this->buildAssets();

            $this->generateAppKey();

            $this->displaySuccessMessage();

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Installation failed: {$e->getMessage()}");
            return self::FAILURE;
        }
    }

    private function verifyNodeJsAccess(): bool
    {
        $this->info('🔍 Verifying Node.js access...');

        $testCommand = $this->buildNodeCommand('node --version');

        try {
            $result = Process::run($testCommand);
            if ($result->successful()) {
                $version = trim($result->output());
                $this->line("✅ Node.js accessible: {$version}");

                $npmTestCommand = $this->buildNodeCommand('npm --version');
                $npmResult = Process::run($npmTestCommand);
                if ($npmResult->successful()) {
                    $npmVersion = trim($npmResult->output());
                    $this->line("✅ npm accessible: {$npmVersion}");
                    return true;
                }
            }
        } catch (\Exception $e) {
        }

        $this->error('❌ Node.js/npm not accessible with current configuration');

        if (isset($this->envConfig['NODE_PATH']) && !empty($this->envConfig['NODE_PATH'])) {
            $this->line("   Current NODE_PATH: {$this->envConfig['NODE_PATH']}");
        }

        $this->line('   Please check your Node.js installation or NODE_PATH configuration');

        return $this->confirm('Continue anyway? (You can install Node.js dependencies manually later)', false);
    }

    private function createEnvFile(): void
    {
        $this->info('📝 Creating .env file...');

        $envTemplate = $this->getEnvTemplate();

        foreach ($this->envConfig as $key => $value) {
            $formattedValue = $this->formatEnvValue($value);
            $envTemplate = preg_replace(
                "/^{$key}=.*$/m",
                "{$key}={$formattedValue}",
                $envTemplate
            );
        }

        File::put(base_path('.env'), $envTemplate);
        $this->line('✅ .env file created');
    }

    private function formatEnvValue($value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $value = (string) $value;

        if (preg_match('/[\s"\'#$]/', $value)) {
            $escapedValue = str_replace('"', '\\"', $value);
            return '"' . $escapedValue . '"';
        }

        return $value;
    }

    private function installComposerPackages(): void
    {
        $this->info('📦 Installing Composer packages...');

        $packages = [];
        foreach ($this->selectedPackages as $key => $selected) {
            if ($selected) {
                $packages[] = $this->availablePackages[$key]['composer_name'] . ':^1.0';
            }
        }

        if (!empty($packages)) {
            $command = 'composer require ' . implode(' ', $packages);
            $this->executeCommand($command, 'Composer packages installed');
        }
    }

    private function generateAppKey(): void
    {
        $this->info('🔐 Generating application key...');
        $this->executeCommand('php artisan key:generate --ansi', 'Application key generated');
    }

    private function publishAssets(): void
    {
        $this->info('📂 Publishing assets and configurations...');

        $publishCommands = [
            'php artisan vendor:publish --tag=core-cms-config --ansi',
            'php artisan vendor:publish --tag=core-cms-assets --ansi',
            'php artisan vendor:publish --tag=core-cms-migrations --ansi',
            'php artisan vendor:publish --tag=core-cms-seeders --ansi',
            'php artisan vendor:publish --tag=core-cms-views --ansi',
        ];

        foreach ($publishCommands as $command) {
            try {
                $this->executeCommand($command, null, false);
            } catch (\Exception $e) {
                $this->line("⚠️  Skipped: " . basename($command));
            }
        }

        $this->line('✅ Assets published');
    }

    private function createSqliteDatabase(): void
    {
        if ($this->envConfig['DB_CONNECTION'] === 'sqlite') {
            $this->info('📁 Creating SQLite database...');

            $dbPath = base_path($this->envConfig['DB_DATABASE']);
            $dbDir = dirname($dbPath);

            if (!File::isDirectory($dbDir)) {
                File::makeDirectory($dbDir, 0755, true);
            }

            if (!File::exists($dbPath)) {
                File::put($dbPath, '');
            }

            $this->line('✅ SQLite database created');
        }
    }

    private function runMigrations(): void
    {
        $this->info('🗄️ Running database migrations...');

        try {
            $this->executeCommand('php artisan migrate --force --ansi', 'Database migrations completed');
        } catch (\Exception $e) {
            $this->warn('⚠️  Migration failed, but continuing installation...');
            $this->line('You may need to run "php artisan migrate" manually later.');
        }
    }

    private function runSeeders(): void
    {
        $this->info('🗄️ Running database seeders...');

        try {
            $this->executeCommand('php artisan db:seed --force --ansi', 'Database migrations completed');
        } catch (\Exception $e) {
            $this->warn('⚠️  Seed failed, but continuing installation...');
            $this->line('You may need to run "php artisan db:seed" manually later.');
        }
    }

    private function discoverAssets(): void
    {
        $this->info('🔍 Discovering assets...');

        try {
            $this->executeCommand('php artisan assets:discover --ansi', 'Assets discovered');
        } catch (\Exception $e) {
            $this->line('⚠️  Assets discovery skipped (command not available)');
        }
    }

    private function installNodeDependencies(): void
    {
        $this->info('📦 Installing Node.js dependencies...');

        $npmCommand = $this->buildNodeCommand('npm install');
        $this->executeCommand($npmCommand, 'Node.js dependencies installed');
    }

    private function buildAssets(): void
    {
        $this->info('🏗️ Building frontend assets...');

        $buildCommand = $this->buildNodeCommand('npm run build');
        $this->executeCommand($buildCommand, 'Frontend assets built');
    }

    private function buildNodeCommand(string $baseCommand): string
    {
        if ($this->envConfig['APP_ENV'] === 'dev' || empty($this->envConfig['NODE_PATH'])) {
            return $baseCommand;
        }

        $nodePath = $this->envConfig['NODE_PATH'];
        return "export PATH={$nodePath}:\$PATH && {$baseCommand}";
    }

    private function displaySuccessMessage(): void
    {
        $this->info('');
        $this->info('🎉 NetAuraFlow CMS installed successfully!');
        $this->info('');
        $this->info('Next steps:');
        $this->line('1. 🌐 Visit your application: ' . $this->envConfig['APP_URL']);
        $this->line('2. 👤 Create an admin user: php artisan make:user');
        $this->line('3. 🚀 Start developing: php artisan serve');
        $this->info('');
        $this->info('📚 Documentation: https://docs.netauratech.fr');
        $this->info('🐛 Support: https://github.com/NetAuraTech/netaura-flow/issues');
        $this->info('');
    }

    private function executeCommand(string $command, ?string $successMessage = null, bool $showOutput = true): void
    {
        if ($showOutput) {
            $this->line("Running: {$command}");
        }

        $result = Process::run($command);

        if ($result->failed()) {
            throw new \RuntimeException("Command failed: {$command}\nOutput: {$result->output()}\nError: {$result->errorOutput()}");
        }

        if ($successMessage) {
            $this->line("✅ {$successMessage}");
        }
    }

    private function commandExists(string $command): bool
    {
        $result = Process::run("which {$command}");
        return $result->successful();
    }

    private function getEnvTemplate(): string
    {
        return 'APP_NAME=Laravel
APP_ENV=dev
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

NODE_PATH=

APP_LOCALE=fr
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

PHP_CLI_SERVER_WORKERS=4

BCRYPT_ROUNDS=12

LSCACHE_DEFAULT_TTL=604800
LSCACHE_DEFAULT_CACHEABILITY=public

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=package
DB_USERNAME=root
DB_PASSWORD=password

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=hello@example.com
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="${APP_NAME}"';
    }
}