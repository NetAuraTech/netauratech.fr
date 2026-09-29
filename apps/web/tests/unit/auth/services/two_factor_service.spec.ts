import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { Totp } from '#auth/domain/totp';
import InvalidCurrentPasswordException from '#auth/exceptions/invalid_current_password_exception';
import InvalidTwoFactorCodeException from '#auth/exceptions/invalid_two_factor_code_exception';
import { TwoFactorService } from '#auth/services/two_factor_service';
import User from '#identity/models/user';

/**
 * Unit seam for the 2FA business service, exercised against the real container
 * and test database. The critical guarantees: the TOTP secret and the
 * recovery codes are stored *encrypted* — plaintext never reaches the
 * database — recovery codes are one-time, and disabling 2FA requires both the
 * current password and a valid second factor.
 */
test.group('TwoFactorService', () => {
	const PASSWORD = 'TestPassword123!';

	async function makeService(): Promise<TwoFactorService> {
		return app.container.make(TwoFactorService);
	}

	async function makeUser(email: string): Promise<User> {
		return User.create({
			email,
			username: email.split('@')[0],
			password: PASSWORD,
			emailVerifiedAt: DateTime.now(),
		});
	}

	/** Enrolls a user for 2FA and returns the enrolled user plus its secret. */
	async function enroll(service: TwoFactorService, user: User): Promise<{ user: User; secret: string }> {
		const { secret } = service.beginEnrollment(user);
		const { user: enrolled } = await service.confirmEnrollment(user, Totp.code(secret), secret);
		return { user: enrolled, secret };
	}

	test('beginEnrollment: returns a secret and URI without persisting anything', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('begin@test.com');

		const { secret, otpauthUri } = service.beginEnrollment(user);

		assert.isString(secret);
		assert.match(secret, /^[A-Z2-7]+$/);
		assert.isTrue(otpauthUri.startsWith('otpauth://totp/'));
		assert.isTrue(otpauthUri.includes('secret=' + encodeURIComponent(secret)));

		// Nothing persisted yet: the user is unchanged.
		const fresh = await User.find(user.id);
		assert.isFalse(!!fresh?.twoFactorEnabled);
		assert.isNull(fresh?.twoFactorSecret);
	});

	test('confirmEnrollment: a valid code enables 2FA, stores an encrypted secret, and issues recovery codes', async ({
		assert,
	}) => {
		const service = await makeService();
		const user = await makeUser('confirm@test.com');

		const { secret } = service.beginEnrollment(user);
		const { user: updated, recoveryCodes } = await service.confirmEnrollment(user, Totp.code(secret), secret);

		assert.isTrue(!!updated.twoFactorEnabled);
		assert.isString(updated.twoFactorSecret!);
		// The plaintext secret must not be stored in plain text.
		assert.isFalse(updated.twoFactorSecret!.includes(secret));
		// A fresh set of recovery codes is issued...
		assert.lengthOf(recoveryCodes, TwoFactorService.RECOVERY_CODE_COUNT);
		// ...and stored encrypted (the plaintext codes must not be persisted).
		assert.isString(updated.twoFactorRecoveryCodes!);
		for (const code of recoveryCodes) {
			assert.isFalse(updated.twoFactorRecoveryCodes!.includes(code));
		}
		// getRecoveryCodes round-trips the stored set.
		assert.sameMembers(service.getRecoveryCodes(updated), recoveryCodes);
	});

	test('confirmEnrollment: a wrong code is rejected and 2FA stays disabled', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('wrong@test.com');

		const { secret } = service.beginEnrollment(user);
		const wrongCode = String((Number(Totp.code(secret)) + 1) % 1_000_000).padStart(6, '0');

		await assert.rejects(async () => {
			await service.confirmEnrollment(user, wrongCode, secret);
		}, InvalidTwoFactorCodeException);

		const fresh = await User.find(user.id);
		assert.isFalse(!!fresh?.twoFactorEnabled);
		assert.isNull(fresh?.twoFactorSecret);
	});

	test('verifyLoginCode: accepts a valid TOTP code for an enrolled user', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('login@test.com');
		const { user: enrolled, secret } = await enroll(service, user);

		const verified = await service.verifyLoginCode(enrolled, Totp.code(secret));
		assert.equal(verified.id, user.id);
	});

	test('verifyLoginCode: rejects a wrong code', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('badcode@test.com');
		const { user: enrolled, secret } = await enroll(service, user);

		const wrong = String((Number(Totp.code(secret)) + 1) % 1_000_000).padStart(6, '0');
		await assert.rejects(async () => {
			await service.verifyLoginCode(enrolled, wrong);
		}, InvalidTwoFactorCodeException);
	});

	test('verifyLoginCode: accepts a recovery code when the TOTP device is unavailable', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('recovery@test.com');
		const { user: enrolled } = await enroll(service, user);

		const code = service.getRecoveryCodes(enrolled)[0];
		const verified = await service.verifyLoginCode(enrolled, code);
		assert.equal(verified.id, user.id);
	});

	test('verifyLoginCode: a recovery code is single-use and rejected on replay', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('replay@test.com');
		const { user: enrolled } = await enroll(service, user);

		const code = service.getRecoveryCodes(enrolled)[0];

		// First use succeeds.
		await service.verifyLoginCode(enrolled, code);

		// The code is gone from the stored set...
		const fresh = await User.find(user.id);
		assert.isFalse(service.getRecoveryCodes(fresh!).includes(code));

		// ...so replaying it is rejected.
		await assert.rejects(async () => {
			await service.verifyLoginCode(fresh!, code);
		}, InvalidTwoFactorCodeException);
	});

	test('verifyLoginCode: accepts a recovery code typed with lowercase letters and no separator', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('normalise@test.com');
		const { user: enrolled } = await enroll(service, user);

		const code = service.getRecoveryCodes(enrolled)[0];
		const typed = code.replace('-', '').toLowerCase();

		const verified = await service.verifyLoginCode(enrolled, typed);
		assert.equal(verified.id, user.id);
	});

	test('disableTwoFactor: a valid password and TOTP code disable 2FA and clear the secret and codes', async ({
		assert,
	}) => {
		const service = await makeService();
		const user = await makeUser('disable-totp@test.com');
		const { user: enrolled, secret } = await enroll(service, user);

		const disabled = await service.disableTwoFactor(enrolled, PASSWORD, Totp.code(secret));

		assert.isFalse(!!disabled.twoFactorEnabled);
		assert.isNull(disabled.twoFactorSecret);
		assert.isNull(disabled.twoFactorRecoveryCodes);

		const fresh = await User.find(user.id);
		assert.isFalse(!!fresh?.twoFactorEnabled);
		assert.isNull(fresh?.twoFactorSecret);
		assert.isNull(fresh?.twoFactorRecoveryCodes);
	});

	test('disableTwoFactor: a valid password and an unused recovery code disable 2FA', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('disable-recovery@test.com');
		const { user: enrolled } = await enroll(service, user);

		const code = service.getRecoveryCodes(enrolled)[0];
		const disabled = await service.disableTwoFactor(enrolled, PASSWORD, code);

		assert.isFalse(!!disabled.twoFactorEnabled);
		assert.isNull(disabled.twoFactorSecret);
		assert.isNull(disabled.twoFactorRecoveryCodes);
	});

	test('disableTwoFactor: a wrong password is rejected and 2FA stays enabled', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('disable-badpass@test.com');
		const { user: enrolled, secret } = await enroll(service, user);

		await assert.rejects(async () => {
			await service.disableTwoFactor(enrolled, 'WrongPassword123!', Totp.code(secret));
		}, InvalidCurrentPasswordException);

		const fresh = await User.find(user.id);
		assert.isTrue(!!fresh?.twoFactorEnabled);
	});

	test('disableTwoFactor: a wrong second factor is rejected and 2FA stays enabled', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('disable-badcode@test.com');
		const { user: enrolled, secret } = await enroll(service, user);

		const wrongTotp = String((Number(Totp.code(secret)) + 1) % 1_000_000).padStart(6, '0');
		await assert.rejects(async () => {
			await service.disableTwoFactor(enrolled, PASSWORD, wrongTotp);
		}, InvalidTwoFactorCodeException);

		const fresh = await User.find(user.id);
		assert.isTrue(!!fresh?.twoFactorEnabled);
	});

	test('re-enrolling after a disable issues a fresh secret', async ({ assert }) => {
		const service = await makeService();
		const user = await makeUser('reenroll@test.com');
		const { user: enrolled, secret: firstSecret } = await enroll(service, user);

		await service.disableTwoFactor(enrolled, PASSWORD, Totp.code(firstSecret));

		// Begin a fresh enrollment from the (disabled) user.
		const disabled = (await User.find(user.id))!;
		const { secret: secondSecret } = service.beginEnrollment(disabled);
		assert.notEqual(secondSecret, firstSecret);

		const { user: reenrolled } = await service.confirmEnrollment(disabled, Totp.code(secondSecret), secondSecret);

		assert.isTrue(!!reenrolled.twoFactorEnabled);
		assert.isString(reenrolled.twoFactorSecret!);
		// A fresh set of recovery codes is issued too.
		assert.lengthOf(service.getRecoveryCodes(reenrolled), TwoFactorService.RECOVERY_CODE_COUNT);
	});
});
