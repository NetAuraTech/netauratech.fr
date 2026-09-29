import { Form } from '@adonisjs/inertia/react';
import { Banner } from '@foundry/design-system/banner';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Data } from '@generated/data';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { actionFor, urlFor } from '~/client';
import { SettingsLayout } from '~/components/organisms/settings_layout';
import { getIcon } from '~/helpers/oauth';
import { sanitizeEmail } from '~/helpers/sanitization';
import { presets } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import { capitalize } from '~/lib/string';
import type { OAuthProvider } from '#auth/types/auth';
import type { SettingsAccountTranslations } from '#transport/account/helpers/i18n_payloads/account';

interface PageProps {
	user: Data.Identity.User;
	providers: OAuthProvider[];
	twoFactorEnabled: boolean;
	twoFactorRecoveryCodes: string[];
	twoFactorPending: { secret: string; otpauthUri: string } | null;
	translations: SettingsAccountTranslations;
}

export default function AccountPage(props: PageProps) {
	const { user, providers, twoFactorEnabled, twoFactorRecoveryCodes, twoFactorPending, translations } = props;

	const { t } = useTranslation(translations);

	const validationEmailForm = useFormValidation({
		email: presets.email(t('email.value')),
	});

	const validationTwoFactorForm = useFormValidation({
		code: presets.requiredString(t('two_factor.code.value')),
	});

	const validationDisableForm = useFormValidation({
		current_password: presets.password(t('two_factor.disable.password')),
		code: presets.requiredString(t('two_factor.disable.code')),
	});

	const copyRecoveryCodes = () => {
		void navigator.clipboard.writeText(twoFactorRecoveryCodes.join('\n'));
	};

	const downloadRecoveryCodes = () => {
		const blob = new Blob([twoFactorRecoveryCodes.join('\n')], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'recovery-codes.txt';
		link.click();
		URL.revokeObjectURL(url);
	};

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const validationPasswordForm = useFormValidation({
		current_password: presets.password(t('password.current.value')),
		password: presets.password(t('password.new.value')),
		password_confirmation: presets.passwordConfirmation(password, t('password.confirm.value')),
	});

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const validationDeleteForm = useFormValidation({
		password: presets.password(t('delete.password')),
	});

	return (
		<main>
			<SettingsLayout tab="account" translations={translations}>
				<Card title={t('email.title')} subtitle={t('email.sub_title')}>
					<Form
						action={actionFor('account.account.execute')}
						className="grid gap-6"
						onBefore={(visit) => {
							const isValid = validationEmailForm.validateAll(visit.data as Record<string, any>);
							if (!isValid) return false;
						}}
					>
						{({ errors, processing }) => (
							<>
								<input type="hidden" name="_action" value="update_email" />
								<Field
									label={t('email.value')}
									name="email"
									type="email"
									defaultValue={user.email || ''}
									placeholder={t('email.placeholder')}
									validation={validationEmailForm}
									errors={errors}
									required
									sanitizeValue={sanitizeEmail}
								/>
								<Button loading={processing} type={'submit'} fitContent name="update_email_submit">
									{t('email.submit')}
								</Button>
							</>
						)}
					</Form>
				</Card>
				<Card title={t('oauth.title')} subtitle={t('oauth.sub_title')}>
					<div className="divide-y divide-edge">
						{providers.map((provider) => {
							const isConnected = user.connectedProviders[provider];

							return (
								<div key={provider} className="flex items-center justify-between py-3">
									<div className="flex items-center gap-3">
										{getIcon(provider)}
										<div>
											<p className="text-sm font-medium text-ink">{capitalize(provider)}</p>
											<p className={`text-xs ${isConnected ? 'text-success' : 'text-ink-muted'}`}>
												{isConnected ? t('oauth.connected') : t('oauth.not_connected')}
											</p>
										</div>
									</div>

									{isConnected ? (
										<Form
											action={actionFor('auth.social.unlink', { provider: provider })}
											onBefore={() => confirm(t('oauth.unlink.confirm', { provider: capitalize(provider) }))}
										>
											<button
												type="submit"
												className="cursor-pointer text-sm px-3 py-1.5 border border-danger text-danger rounded-lg hover:bg-danger-soft transition"
												title={t('oauth.unlink')}
											>
												{t('oauth.unlink.value')}
											</button>
										</Form>
									) : (
										<a
											href={urlFor('auth.social.redirect', { provider: provider })}
											className="text-sm px-3 py-1.5 border text-ink-muted border-edge rounded-lg hover:bg-sunken transition"
											title={t('oauth.link')}
										>
											{t('oauth.link')}
										</a>
									)}
								</div>
							);
						})}
					</div>
				</Card>
				<Card title={t('password.title')} subtitle={t('password.sub_title')}>
					<Form
						action={actionFor('account.account.execute')}
						className="grid gap-6"
						onBefore={(visit) => {
							const isValid = validationPasswordForm.validateAll(visit.data as Record<string, any>);
							if (!isValid) return false;
						}}
					>
						{({ errors, processing }) => (
							<>
								<input type="hidden" name="_action" value="update_password" />
								<Field
									label={t('password.current.value')}
									name="current_password"
									type="password"
									validation={validationPasswordForm}
									errors={errors}
									required
								/>
								<Field
									label={t('password.new.value')}
									name="password"
									type="password"
									validation={validationPasswordForm}
									errors={errors}
									onChange={(event) => {
										setPassword(event.target.value);
										validationPasswordForm.handleChange('password', event.target.value);
										validationPasswordForm.handleChange('password_confirmation', confirmPassword);
									}}
									onBlur={(event) => {
										setPassword(event!.target.value);
										validationPasswordForm.handleBlur('password', event!.target.value);
										validationPasswordForm.handleBlur('password_confirmation', confirmPassword);
									}}
									required
									helpText={t('password.new.help')}
								/>
								<Field
									label={t('password.confirm.value')}
									name="password_confirmation"
									type="password"
									validation={validationPasswordForm}
									errors={errors}
									onChange={(event) => {
										setConfirmPassword(event.target.value);
										validationPasswordForm.handleChange('password_confirmation', event.target.value);
									}}
									onBlur={(event) => {
										setConfirmPassword(event!.target.value);
										validationPasswordForm.handleBlur('password_confirmation', event!.target.value);
									}}
									required
									helpText={t('password.confirm.help')}
								/>
								<Button loading={processing} type={'submit'} fitContent name="update_password_submit">
									{t('password.submit')}
								</Button>
							</>
						)}
					</Form>
				</Card>
				<Card title={t('two_factor.title')} subtitle={t('two_factor.sub_title')}>
					{twoFactorPending ? (
						<div className="grid gap-6">
							<div className="flex flex-col items-start gap-4 md:flex-row">
								<div className="rounded-lg border border-edge bg-white p-3">
									<QRCode value={twoFactorPending.otpauthUri} size={176} />
								</div>
								<div className="grid gap-2">
									<p className="text-sm text-ink-muted">{t('two_factor.scan')}</p>
									<p className="text-xs text-ink-muted">{t('two_factor.apps')}</p>
									<p className="text-xs text-ink-muted">{t('two_factor.manual')}</p>
									<code className="break-all rounded bg-sunken px-2 py-1 text-xs text-ink">
										{twoFactorPending.secret}
									</code>
								</div>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<Form
									action={actionFor('account.account.execute')}
									className="grid gap-6"
									onBefore={(visit) => {
										const isValid = validationTwoFactorForm.validateAll(visit.data as Record<string, any>);
										if (!isValid) return false;
									}}
								>
									{({ errors, processing }) => (
										<>
											<input type="hidden" name="_action" value="confirm_2fa" />
											<Field
												label={t('two_factor.code.value')}
												name="code"
												type="text"
												placeholder={t('two_factor.code.placeholder')}
												validation={validationTwoFactorForm}
												errors={errors}
												required
											/>
											<Button loading={processing} type={'submit'} fitContent name="confirm_2fa_submit">
												{t('two_factor.confirm')}
											</Button>
										</>
									)}
								</Form>
								<Form action={actionFor('account.account.execute')}>
									<input type="hidden" name="_action" value="cancel_2fa" />
									<Button type={'submit'} fitContent variant="outline" name="cancel_2fa">
										{t('two_factor.cancel')}
									</Button>
								</Form>
							</div>
						</div>
					) : twoFactorEnabled ? (
						<div className="grid gap-8">
							<div className="flex flex-wrap items-center gap-3">
								<span className="rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
									{t('two_factor.enabled')}
								</span>
								<p className="text-sm text-ink-muted">{t('two_factor.enabled_sub')}</p>
							</div>

							{twoFactorRecoveryCodes.length > 0 && (
								<div className="grid gap-3">
									<div className="grid gap-1">
										<p className="text-sm font-medium text-ink">{t('two_factor.recovery.title')}</p>
										<p className="text-sm text-ink-muted">{t('two_factor.recovery.sub_title')}</p>
										<p className="text-xs text-ink-muted">{t('two_factor.recovery.info')}</p>
									</div>
									<ul className="grid gap-1 rounded-lg border border-edge bg-sunken p-3 font-mono text-sm text-ink">
										{twoFactorRecoveryCodes.map((code) => (
											<li key={code}>{code}</li>
										))}
									</ul>
									<div className="flex flex-wrap gap-3">
										<Button
											type="button"
											fitContent
											variant="outline"
											onClick={copyRecoveryCodes}
											name="copy_recovery_codes"
										>
											{t('two_factor.recovery.copy')}
										</Button>
										<Button
											type="button"
											fitContent
											variant="outline"
											onClick={downloadRecoveryCodes}
											name="download_recovery_codes"
										>
											{t('two_factor.recovery.download')}
										</Button>
									</div>
								</div>
							)}

							<div className="grid gap-4">
								<div className="grid gap-1">
									<p className="text-sm font-medium text-ink">{t('two_factor.disable.sub_title')}</p>
									<p className="text-xs text-ink-muted">{t('two_factor.disable.warning')}</p>
								</div>
								<Form
									action={actionFor('account.account.execute')}
									className="grid gap-6"
									onBefore={(visit) => {
										const isValid = validationDisableForm.validateAll(visit.data as Record<string, any>);
										if (!isValid) return false;
									}}
								>
									{({ errors, processing }) => (
										<>
											<input type="hidden" name="_action" value="disable_2fa" />
											<Field
												label={t('two_factor.disable.password')}
												name="current_password"
												type="password"
												validation={validationDisableForm}
												errors={errors}
												required
											/>
											<Field
												label={t('two_factor.disable.code')}
												name="code"
												type="text"
												placeholder={t('two_factor.code.placeholder')}
												validation={validationDisableForm}
												errors={errors}
												required
											/>
											<Button
												loading={processing}
												type={'submit'}
												fitContent
												variant="danger"
												name="disable_2fa_submit"
											>
												{t('two_factor.disable.confirm')}
											</Button>
										</>
									)}
								</Form>
							</div>
						</div>
					) : (
						<Form action={actionFor('account.account.execute')}>
							<input type="hidden" name="_action" value="begin_2fa" />
							<Button type={'submit'} fitContent name="begin_2fa">
								{t('two_factor.enable')}
							</Button>
						</Form>
					)}
				</Card>
				<Card title={t('delete.title')} subtitle={t('delete.sub_title')} border="danger">
					{!showDeleteConfirm ? (
						<Button variant="danger" fitContent onClick={() => setShowDeleteConfirm(true)} name="delete_account_show">
							{t('delete.submit')}
						</Button>
					) : (
						<div className="grid gap-4">
							<Banner title={t('delete.confirm.title')} message={t('delete.confirm.sub_title')} type="danger" />
							<Form
								action={actionFor('account.account.destroy')}
								className="grid gap-6"
								onBefore={(visit) => {
									const isValid = validationDeleteForm.validateAll(visit.data as Record<string, any>);
									if (!isValid) return false;
								}}
							>
								{({ errors, processing, reset }) => (
									<>
										<Field
											label={t('delete.password')}
											name="password"
											type="password"
											validation={validationDeleteForm}
											errors={errors}
											required
										/>
										<div className="flex gap-3">
											<Button
												type="button"
												variant="outline"
												fitContent
												onClick={() => {
													setShowDeleteConfirm(false);
													reset('password');
													validationDeleteForm.reset();
												}}
												name="delete_account_cancel"
											>
												{t('delete.cancel')}
											</Button>
											<Button
												loading={processing}
												type={'submit'}
												fitContent
												variant="danger"
												name="delete_account_submit"
											>
												{t('delete.submit')}
											</Button>
										</div>
									</>
								)}
							</Form>
						</div>
					)}
				</Card>
			</SettingsLayout>
		</main>
	);
}
