import type { MailClientMessage } from '#core/contracts/mail_client';

/**
 * Data passed to a token mail template when rendering the HTML body.
 *
 * The i18n slots (subject, greeting, ...) are filled from the flow's
 * {@link TokenMailI18nKeys}, the link slot from the flow's candidate routes,
 * and flow-specific slots (e.g. the notification mail's support address) are
 * supplied per dispatch through {@link TokenMailBuildInput.data}. The
 * rendering locale is stamped into the data by the kernel
 * `MailService`, not carried here.
 */
export interface TokenMailData {
	/** Application name (subject line and greeting context). */
	app_name: string;
	/** Translated subject line, duplicated from the envelope for templates. */
	subject: string;
	/** Opening line. */
	greeting?: string;
	/** Body paragraph(s). */
	intro?: string;
	/** Button / call-to-action label. */
	action?: string;
	/** Closing line. */
	outro?: string;
	/** Token expiry warning. */
	expiry?: string;
	/** Footer line and fallback link label. */
	footer?: string;
	/** Warning box text (notification-style mails). */
	warning?: string;
	/** Support contact for the mailto box (notification-style mails). */
	support?: string;
	/** Flow-specific data slots (link slots, extra mail content), keyed by slot name. */
	[slot: string]: string | undefined;
}

/**
 * The kernel envelope of a token mail: the recipient, subject and edge
 * template, plus the {@link TokenMailData} render data.
 */
export interface TokenMailMessage extends MailClientMessage {
	data: TokenMailData;
}

/**
 * The flat i18n key block of a token mail flow.
 *
 * Each entry names the translation of one data slot; a slot left undefined is
 * absent from the mail (the flow does not use it).
 */
export interface TokenMailI18nKeys {
	/** Subject line (envelope and template data). */
	subject: string;
	/** Opening line. */
	greeting: string;
	/** Body paragraph(s). */
	intro: string;
	/** Button / call-to-action label. */
	action: string;
	/** Closing line. */
	outro?: string;
	/** Token expiry warning. */
	expiry?: string;
	/** Footer line and fallback link label. */
	footer?: string;
	/** Warning box text (notification-style mails). */
	warning?: string;
}

/**
 * The spec of one token mail flow.
 *
 * Everything a mail of the flow needs in one entry — i18n key block,
 * flavor-aware candidate routes of the mail link, token TTL and template — so
 * adding a flow is a spec row, not a hand-assembled payload block. The
 * assembly is the shared `MailService.buildTokenMail` step.
 */
export interface TokenMailSpec {
	/** i18n key block, one entry per translated data slot. */
	keys: TokenMailI18nKeys;
	/** Candidate route names of the mail link, in priority order (empty when the mail carries no link). */
	linkRoutes: string[];
	/** Data slot that receives the built link (required when `linkRoutes` is non-empty). */
	linkSlot?: string;
	/**
	 * Token TTL in hours, for flows that issue a token — the token issuance and
	 * the rendered expiry copy both derive from it. Absent on linkless flows
	 * that carry no token of their own.
	 */
	ttlHours?: number;
	/** Edge template that renders the mail body. */
	template: string;
}

/**
 * Input of the shared token mail assembly.
 */
export interface TokenMailBuildInput {
	/** Recipient address. */
	to: string;
	/** Recipient locale, resolved by the domain flow from the user's preferences. */
	locale: string;
	/** Full `selector.validator` token carried by the link (ignored when the spec has no link). */
	token?: string;
	/** Per-dispatch i18n interpolation params (e.g. the recipient addresses), merged over the spec-derived ones. */
	i18nParams?: Record<string, unknown>;
	/** Extra non-i18n data slots (e.g. the support address), stamped after the i18n slots. */
	data?: Partial<TokenMailData>;
}
