import { Badge } from '@foundry/design-system/badge';
import { Button } from '@foundry/design-system/button';
import { Heading } from '@foundry/design-system/heading';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Section } from '@foundry/design-system/section';
import { ReactElement } from 'react';
import { useInterval } from '~/hooks/use_interval';
import { useTranslation } from '~/hooks/use_translation';
import type { MaintenanceTranslations } from '#transport/core/helpers/i18n_payloads/maintenance_front';

interface PageProps {
	message: string;
	retryAfter: number;
	redirectPath?: string;
	translations: MaintenanceTranslations;
}

export default function MaintenancePage(props: PageProps) {
	const { message, retryAfter, redirectPath, translations } = props;
	const { t } = useTranslation(translations);

	// Use defensive fallback: if retryAfter is undefined/NaN, default to 3600s
	const secondsRemaining = useInterval(
		typeof retryAfter === 'number' && !Number.isNaN(retryAfter) ? retryAfter : 3600,
		1000,
	);

	const formatTime = (seconds: number): string => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return [
			hrs > 0 ? `${hrs.toString().padStart(2, '0')}` : '00',
			mins.toString().padStart(2, '0'),
			secs.toString().padStart(2, '0'),
		].join(':');
	};

	const handleRetry = () => {
		if (redirectPath) {
			window.location.href = redirectPath;
		} else {
			window.location.reload();
		}
	};

	return (
		<>
			<Section className="min-h-screen flex items-center justify-center px-4 py-12">
				<div className="w-full max-w-md text-center">
					<div className="text-6xl mb-6" aria-hidden="true">
						🛠️
					</div>
					<Heading level={1}>{t('title')}</Heading>
					<Paragraph variant="muted" className="mb-8">
						{message || t('default_message')}
					</Paragraph>
					<div className="flex flex-col items-center gap-4 mb-8">
						<Badge variant="warning" className="text-sm">
							{t('retry_in')} {formatTime(secondsRemaining)}
						</Badge>
						<Button onClick={handleRetry} variant="primary" fitContent>
							{t('retry_now')}
						</Button>
					</div>
				</div>
			</Section>
		</>
	);
}

/**
 * Custom layout resolver: returns the page unwrapped, bypassing <Layout>.
 * The app.tsx/ssr.tsx resolveComponent wrapper checks for this property.
 */
MaintenancePage.layout = (page: ReactElement) => page;
