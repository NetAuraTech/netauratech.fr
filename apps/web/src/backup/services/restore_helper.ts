/**
 * Restore preparation for SQL dumps.
 *
 * The stored artifact stays a plain CREATE + data script so it remains
 * portable to a fresh database; making a restore work against a database
 * that is not empty is owned by the restore step, which:
 *
 * - rewrites the dump with {@link makeDumpIdempotent} so replayed
 *   statements replace existing objects instead of colliding;
 * - generates a reset prelude with {@link generateRestorePrelude} that
 *   drops everything the dump is about to re-create. The prelude and the
 *   dump are replayed through the same `psql` transaction, so reset and
 *   replay are atomic.
 *
 * Pure SQL text transforms — no I/O, no framework deps.
 */

import type { BackupType } from '#backup/types/backup';

/**
 * The application schemas the backup module manages.
 *
 * These are the schemas the pipeline dumps and inspects, and the schemas a
 * restore resets. A restore replaces their data, but never the schemas
 * themselves, their ACLs, or their extensions. Platform event triggers are
 * never destroyed: a full restore re-creates the ones its dump carries, in
 * place (see {@link makeDumpIdempotent}).
 */
export const MANAGED_SCHEMAS: readonly string[] = ['public'];

/**
 * Make a plain pg_dump replayable against a database that is not empty.
 *
 * Rewrites the dump's creation statements so the replay succeeds when the
 * objects already exist:
 * - `CREATE FUNCTION ...` becomes `CREATE OR REPLACE FUNCTION ...`, so a
 *   function is replaced in place (its identity is preserved, keeping
 *   references such as event triggers valid) instead of colliding;
 * - `CREATE SCHEMA x;` becomes `CREATE SCHEMA IF NOT EXISTS x;`, so an
 *   existing schema — with its ACLs, extensions, and platform event
 *   triggers — is left untouched;
 * - `CREATE EVENT TRIGGER x ...;` is preceded by `DROP EVENT TRIGGER IF
 *   EXISTS x;`, so an existing trigger (a platform RLS trigger, for
 *   instance) is re-created in place instead of colliding — PostgreSQL 16
 *   has no `CREATE OR REPLACE EVENT TRIGGER`.
 *
 * All rewrites are dollar-quote aware (`$$` / `$tag$` ... `$$;` / `$tag$;`):
 * lines inside a function body are never touched. COPY data sections — the
 * rows between a `COPY ... FROM stdin;` line and its `\.` terminator — are
 * raw payload, not SQL, and pass through untouched as well. The dump stays
 * a pure CREATE + data script, so it remains portable to a fresh database.
 *
 * @param input - Raw dump content.
 * @returns The idempotent dump content.
 *
 * @example
 * const safe = makeDumpIdempotent(rawDump)
 */
export function makeDumpIdempotent(input: string): string {
	const state: DumpScanState = { activeDollarQuote: null, inCopySection: false };
	const out: string[] = [];

	for (const line of input.split('\n')) {
		// Inside a COPY data section: raw payload, never SQL — pass every
		// row through untouched, ending the section at the `\.` row.
		if (state.inCopySection) {
			if (line === '\\.') state.inCopySection = false;
			out.push(line);
			continue;
		}

		if (line.startsWith('COPY ') && line.includes('FROM stdin;')) {
			state.inCopySection = true;
			state.activeDollarQuote = null;
			out.push(line);
			continue;
		}

		if (state.activeDollarQuote !== null) {
			// Inside a dollar-quoted body: pass the line through untouched,
			// resyncing the state at the closing delimiter.
			const delimiter = state.activeDollarQuote;
			const closeAt = line.indexOf(delimiter);
			if (closeAt === -1) {
				out.push(line);
				continue;
			}
			state.activeDollarQuote = null;
			scanDollarQuotes(line.slice(closeAt + delimiter.length), state);
			out.push(line);
			continue;
		}

		// Backslash command lines (`\.`, `\restrict`, ...) outside a COPY
		// section: resync the scan and pass through.
		if (line.startsWith('\\')) {
			state.activeDollarQuote = null;
			out.push(line);
			continue;
		}

		const rewritten = rewriteStatementStart(line);
		scanDollarQuotes(rewritten, state);
		// The event-trigger drop precedes its create and is the only rewrite
		// that emits an extra line; a second pass must not emit it twice.
		const dropLine = eventTriggerDropLine(rewritten);
		if (dropLine !== null && out[out.length - 1] !== dropLine) {
			out.push(dropLine);
		}
		out.push(rewritten);
	}

	return out.join('\n');
}

/**
 * Input to {@link generateRestorePrelude}: the artifact kind, and — for a
 * differential artifact — the tables its manifest lists.
 */
export type RestorePreludeInput =
	| {
			/** A full artifact: the prelude resets every object the dump re-creates. */
			type: Exclude<BackupType, 'differential'>;
	  }
	| {
			/** A differential artifact: the prelude resets only the manifest tables. */
			type: Extract<BackupType, 'differential'>;
			/** The tables listed by the artifact's manifest. */
			tables: string[];
	  };

/**
 * Generate the reset prelude for a restore: the SQL that drops everything
 * the dump is about to re-create, to be replayed through the same `psql`
 * transaction as the dump so reset and replay are atomic.
 *
 * - `full`: a `DO` block over the catalogs drops, in each managed schema,
 *   every table — plain or partitioned parent —, view, materialized view,
 *   and sequence (relkind `r`/`p`/`v`/`m`/`S`) and every
 *   base/composite/domain/enum type (typtype `b`/`c`/`d`/`e`), except
 *   extension-owned objects (`pg_depend` deptype `e`) which a drop would
 *   reject; sweeping the partitioned parent alongside its partitions keeps
 *   the dump's `CREATE TABLE … PARTITION BY` replay clean against a live
 *   database;
 * - `differential`: one `DROP TABLE` per table listed in the artifact's
 *   manifest, without `CASCADE` — a manifest table that other objects
 *   depend on aborts the restore atomically instead of having those
 *   dependents destroyed without being re-created by the dump.
 *
 * The schemas themselves, their ACLs, extensions, and platform event
 * triggers stay untouched.
 *
 * @param input - What to reset: the artifact kind, and the manifest tables
 *   for a differential artifact.
 * @returns The prelude SQL script.
 *
 * @example
 * const prelude = generateRestorePrelude({ type: 'full' })
 */
export function generateRestorePrelude(input: RestorePreludeInput): string {
	if (input.type === 'differential') {
		return [
			'-- Restore prelude (differential): reset the tables the dump re-creates.',
			...dropStatementsForTables(input.tables),
		].join('\n');
	}

	return [
		'-- Restore prelude (full): reset every object the dump re-creates.',
		...MANAGED_SCHEMAS.flatMap((schema) => fullResetBlock(quoteLiteral(schema))),
	].join('\n');
}

/**
 * Scan state for {@link makeDumpIdempotent}.
 */
interface DumpScanState {
	/** The open dollar-quote delimiter (`$$` or `$tag$`), or `null` outside a quote. */
	activeDollarQuote: string | null;
	/** Whether the scan is inside a `COPY ... FROM stdin;` data section. */
	inCopySection: boolean;
}

/**
 * A dollar-quote delimiter: `$$` or `$identifier$`.
 */
const DOLLAR_QUOTE_PATTERN = /\$([A-Za-z_][A-Za-z0-9_]*)?\$/g;

/**
 * Rewrite the start of a dump statement line in place. Dump statements
 * always start at the beginning of a line, so the rewrites are line
 * anchors. Already-rewritten statements are left alone (idempotent).
 */
function rewriteStatementStart(line: string): string {
	if (/^CREATE FUNCTION /i.test(line)) {
		return line.replace(/^CREATE FUNCTION /i, 'CREATE OR REPLACE FUNCTION ');
	}
	if (/^CREATE SCHEMA (?!\s*IF NOT EXISTS\b)/i.test(line)) {
		return line.replace(/^CREATE SCHEMA /i, 'CREATE SCHEMA IF NOT EXISTS ');
	}
	return line;
}

/**
 * The `CREATE EVENT TRIGGER` statement start, as pg_dump emits it:
 * `CREATE EVENT TRIGGER <name> ON <events> ...` (the `EXECUTE FUNCTION`
 * clause may follow on the next line).
 */
const CREATE_EVENT_TRIGGER_PATTERN = /^CREATE EVENT TRIGGER (\S+) ON\b/i;

/**
 * The drop that makes a `CREATE EVENT TRIGGER` replay idempotent — the
 * trigger name is taken verbatim from the create, quoted names stay quoted
 * — or `null` for any other statement.
 *
 * @param line - A dump statement line, outside quotes and COPY data.
 */
function eventTriggerDropLine(line: string): string | null {
	const match = CREATE_EVENT_TRIGGER_PATTERN.exec(line);
	return match ? `DROP EVENT TRIGGER IF EXISTS ${match[1]};` : null;
}

/**
 * Fold the dollar-quote openings and closings of `text` (scanned from
 * outside a quote) into `state`, which ends up holding the delimiter open
 * at the end of the text, if any.
 */
function scanDollarQuotes(text: string, state: DumpScanState): void {
	let position = 0;
	while (position < text.length) {
		DOLLAR_QUOTE_PATTERN.lastIndex = position;
		const match = DOLLAR_QUOTE_PATTERN.exec(text);
		if (!match) return;

		const delimiter = match[0];
		position = match.index + delimiter.length;
		if (state.activeDollarQuote === null) {
			state.activeDollarQuote = delimiter;
		} else if (state.activeDollarQuote === delimiter) {
			state.activeDollarQuote = null;
		} else {
			// A different delimiter while another is open cannot happen in
			// valid SQL (dollar quotes do not nest); trust the latest one.
			state.activeDollarQuote = delimiter;
		}
	}
}

/**
 * Build the `DO` block that resets one schema from the catalogs: every
 * table (plain or partitioned parent), view, materialized view, and
 * sequence, then every base/composite/domain/enum type, each dropped with
 * `IF EXISTS ... CASCADE` so objects already removed by a previous drop
 * (e.g. a table's composite type) are no-ops instead of errors.
 *
 * Extension-owned objects — those carrying a `pg_depend` entry of deptype
 * `e` — are never swept: dropping one aborts with `cannot drop ... because
 * extension ... requires it`, and a restore must not destroy platform
 * objects (the citext type, PostGIS's `spatial_ref_sys`, ...). Array
 * companion types (`typelem` set, e.g. `_citext`) are skipped as well:
 * each one dies with its element type's `CASCADE` drop, and the companion
 * of an extension-owned type cannot be dropped at all.
 *
 * @param schemaLiteral - The schema name as a quoted SQL string literal.
 */
function fullResetBlock(schemaLiteral: string): string[] {
	return [
		'DO',
		'$$',
		'    DECLARE',
		'        object RECORD;',
		'    BEGIN',
		'        FOR object IN',
		'            SELECT c.relkind AS kind,',
		'                   n.nspname AS nsp,',
		'                   c.relname AS relname',
		'            FROM pg_class c',
		'            JOIN pg_namespace n ON n.oid = c.relnamespace',
		`            WHERE n.nspname = ${schemaLiteral}`,
		"              AND c.relkind IN ('r', 'p', 'v', 'm', 'S')",
		'              AND NOT EXISTS (',
		'                  SELECT 1 FROM pg_depend d',
		"                  WHERE d.classid = 'pg_class'::regclass",
		'                    AND d.objid = c.oid',
		"                    AND d.deptype = 'e')",
		'        LOOP',
		"            IF object.kind IN ('r', 'p') THEN",
		"                EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', object.nsp, object.relname);",
		"            ELSIF object.kind = 'v' THEN",
		"                EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', object.nsp, object.relname);",
		"            ELSIF object.kind = 'm' THEN",
		"                EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', object.nsp, object.relname);",
		"            ELSIF object.kind = 'S' THEN",
		"                EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE', object.nsp, object.relname);",
		'            END IF;',
		'        END LOOP;',
		'',
		'        FOR object IN',
		'            SELECT n.nspname AS nsp,',
		'                   t.typname AS typname',
		'            FROM pg_type t',
		'            JOIN pg_namespace n ON n.oid = t.typnamespace',
		`            WHERE n.nspname = ${schemaLiteral}`,
		"              AND t.typtype IN ('b', 'c', 'd', 'e')",
		'              AND t.typelem = 0',
		'              AND NOT EXISTS (',
		'                  SELECT 1 FROM pg_depend d',
		"                  WHERE d.classid = 'pg_type'::regclass",
		'                    AND d.objid = t.oid',
		"                    AND d.deptype = 'e')",
		'        LOOP',
		"            EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', object.nsp, object.typname);",
		'        END LOOP;',
		'    END',
		'$$;',
	];
}

/**
 * Build the reset statements for the manifest tables: one
 * `DROP TABLE IF EXISTS` per managed schema per table, without
 * `CASCADE`.
 *
 * Manifest tables are named bare, so each is dropped from every managed
 * schema — an absent target is a no-op. The drops are `RESTRICT`: when an
 * out-of-manifest object (a view, a foreign key from another table) depends
 * on a manifest table, the drop fails and the whole restore aborts before
 * touching the database, instead of the `CASCADE` alternative, which would
 * destroy those dependents without the dump re-creating them.
 *
 * @param tables - The manifest table names.
 */
function dropStatementsForTables(tables: string[]): string[] {
	return MANAGED_SCHEMAS.flatMap((schema) =>
		tables.map((table) => `DROP TABLE IF EXISTS ${quoteIdentifier(schema)}.${quoteIdentifier(table)};`),
	);
}

/**
 * Quote an SQL identifier (double quotes, embedded quotes doubled).
 */
function quoteIdentifier(name: string): string {
	return `"${name.replaceAll('"', '""')}"`;
}

/**
 * Quote an SQL string literal (single quotes, embedded quotes doubled).
 *
 * @param name - The raw value to quote.
 */
export function quoteLiteral(name: string): string {
	return `'${name.replaceAll("'", "''")}'`;
}
