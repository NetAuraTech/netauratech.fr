/**
 * Extracts the Inertia page object from the server-rendered HTML. In Inertia
 * v5 the initial page payload is emitted as a JSON `<script>` element whose
 * `data-page` attribute holds the mount element id and whose body is the page
 * JSON (with `/` escaped as `\/`, a form `JSON.parse` accepts directly).
 */
export function parseInertiaPage(html: string) {
	const match = html.match(/<script data-page="[^"]*" type="application\/json">([\s\S]*?)<\/script>/);
	if (!match) throw new Error('No Inertia data-page script in response');
	return JSON.parse(match[1]);
}
