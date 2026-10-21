import app from '@adonisjs/core/services/app';
import { defineConfig } from '@adonisjs/lucid';

/**
 * PostgreSQL connection options. The host/credential fields are typed by
 * AdonisJS; the TCP keepalive options are driver-specific and forwarded as-is
 * to node-postgres.
 */
const pgConnection = {
	host: process.env.PG_HOST,
	port: Number(process.env.PG_PORT || 5432),
	user: process.env.PG_USER,
	password: process.env.PG_PASSWORD,
	database: process.env.PG_DB_NAME,
	/**
	 * TCP keepalive — the database (or the proxy in front of it) terminates
	 * idle connections after a few minutes, but the pool keeps its warm
	 * connections forever. Without keepalive the first query sent over a
	 * dead connection fails with ECONNRESET (Sentry issue 155127311). The
	 * OS starts probing 1 minute after idle, then every 75s (OS default);
	 * a reset connection is detected and replaced before user traffic hits
	 * it. Requires node-postgres >= 8.9.
	 */
	keepAlive: true,
	keepAliveInitialDelayMillis: 60_000,
};

const dbConfig = defineConfig({
	/**
	 * Default connection used for all queries.
	 */
	connection: 'pg',

	connections: {
		/**
		 * SQLite connection (default).
		 */
		sqlite: {
			client: 'better-sqlite3',

			connection: {
				/**
				 * Database file location.
				 */
				filename: app.tmpPath('db.sqlite3'),
			},

			/**
			 * Required by Knex for SQLite defaults.
			 */
			useNullAsDefault: true,

			migrations: {
				/**
				 * Sort migration files naturally by filename.
				 */
				naturalSort: true,

				/**
				 * Paths containing migration files. The `inertia` flavor prunes the
				 * CMS module, so `database/migrations/cms` is absent.
				 */
				paths: ['database/migrations'],
			},
		},

		/**
		 * PostgreSQL connection.
		 * Install package to switch: npm install pg
		 */
		pg: {
			client: 'pg',
			connection: pgConnection,
			/**
			 * Pool tuning. Only `min` connections are kept warm around the
			 * clock — the rest are reaped by the pool after a short idle
			 * window. One warm connection is enough for a low-traffic site
			 * and halves the idle TCP connections exposed to upstream idle
			 * timeouts.
			 */
			pool: {
				min: 1,
				max: 10,
			},
			migrations: {
				naturalSort: true,
				paths: ['database/migrations'],
			},
			debug: app.inDev,
		},

		/**
		 * MySQL / MariaDB connection.
		 * Install package to switch: npm install mysql2
		 */
		// mysql: {
		//   client: "mysql2",
		//   connection: {
		//     host: process.env.MYSQL_HOST,
		//     port: Number(process.env.MYSQL_PORT || 3306),
		//     user: process.env.MYSQL_USER,
		//     password: process.env.MYSQL_PASSWORD,
		//     database: process.env.MYSQL_DB_NAME,
		//   },
		//   migrations: {
		//     naturalSort: true,
		//     paths: ["database/migrations"],
		//   },
		//   debug: app.inDev,
		// },

		/**
		 * Microsoft SQL Server connection.
		 * Install package to switch: npm install tedious
		 */
		// mssql: {
		//   client: "mssql",
		//   connection: {
		//     server: process.env.MSSQL_SERVER,
		//     port: Number(process.env.MSSQL_PORT || 1433),
		//     user: process.env.MSSQL_USER,
		//     password: process.env.MSSQL_PASSWORD,
		//     database: process.env.MSSQL_DB_NAME,
		//   },
		//   migrations: {
		//     naturalSort: true,
		//     paths: ["database/migrations"],
		//   },
		//   debug: app.inDev,
		// },

		/**
		 * libSQL (Turso) connection.
		 * Install package to switch: npm install @libsql/client
		 */
		// libsql: {
		//   client: "libsql",
		//   connection: {
		//     url: process.env.LIBSQL_URL,
		//     authToken: process.env.LIBSQL_AUTH_TOKEN,
		//   },
		//   useNullAsDefault: true,
		//   migrations: {
		//     naturalSort: true,
		//     paths: ["database/migrations"],
		//   },
		//   debug: app.inDev,
		// },
	},
});

export default dbConfig;
