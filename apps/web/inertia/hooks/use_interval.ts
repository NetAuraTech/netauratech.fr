import { useEffect, useState } from 'react';

/**
 * Countdown interval hook.
 * Decrements a counter every `intervalMs` until it reaches 0.
 *
 * @param initialSeconds - Starting value in seconds
 * @param intervalMs - Interval in milliseconds (default: 1000)
 * @returns Current seconds remaining
 *
 * @example
 * const seconds = useInterval(300, 1000) // 5 minute countdown
 */
export function useInterval(initialSeconds: number, intervalMs: number = 1000): number {
	const [seconds, setSeconds] = useState(initialSeconds);

	useEffect(() => {
		if (seconds <= 0) return;

		const timer = setInterval(() => {
			setSeconds((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, intervalMs);

		return () => clearInterval(timer);
	}, [intervalMs]);

	return seconds;
}
