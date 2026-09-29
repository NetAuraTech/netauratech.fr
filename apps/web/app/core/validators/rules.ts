import vine from '@vinejs/vine';

/**
 * Shared validation rule factory functions.
 * Centralized so that business constraints (password length, email format, etc.)
 * are defined in a single source of truth and inherited by all validators.
 */

export const email = () => vine.string().trim().toLowerCase().email().maxLength(254);

export const password = () => vine.string().minLength(8).maxLength(32);
