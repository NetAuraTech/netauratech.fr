import { useEffect } from 'react';
import * as THREE from 'three';
import type { RefObject } from 'react';

/**
 * Vertex deformation of every project image, in the 375 vocabulary.
 *
 * A fixed full-viewport WebGL canvas renders each `[data-project-row-media]`
 * placeholder as a textured plane, deformed by a vertex shader driven by the
 * list's scroll velocity: a vertical bend *against* the scrolling direction
 * peaking at the horizontal center, a subtle twist, a Z wave, a vertical
 * stretch and an oscillatory damp as the scroll eases. The velocity is read
 * every animation frame (matching the reference implementation) — so while you
 * are scrolling the images deform, and the moment you stop the velocity
 * decays to zero and every image returns to rest. The seamless seams of the
 * infinite loop are excluded from the velocity reading.
 *
 * The DOM `<img>` is kept as the SSR / reduced-motion / no-WebGL fallback and
 * is simply faded out while the canvas plays. Reduced-motion or a missing
 * renderer leaves the fallbacks untouched.
 */
export function useProjectDistortion(
	hostRef: RefObject<HTMLElement | null>,
	listRef: RefObject<HTMLElement | null>,
	isDesktop: boolean,
	filterKey: string,
) {
	useEffect(() => {
		const host = hostRef.current;
		const scroller = listRef.current;
		if (!host || !scroller || !isDesktop) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const canvas = document.createElement('canvas');
		canvas.className = 'projects__webgl';
		host.appendChild(canvas);

		let renderer: THREE.WebGLRenderer | null = null;
		try {
			renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
			renderer.setClearColor(0x000000, 0);
		} catch {
			canvas.remove();
			return;
		}

		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
		camera.position.z = 5;

		const resize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;
			renderer!.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer!.setSize(width, height);
			camera.left = width / -2;
			camera.right = width / 2;
			camera.top = height / 2;
			camera.bottom = height / -2;
			camera.updateProjectionMatrix();
		};
		resize();
		window.addEventListener('resize', resize);

		const placeholders = scroller.querySelectorAll<HTMLElement>('[data-project-row-media]');
		const planes: Array<{
			mesh: THREE.Mesh;
			placeholder: HTMLElement;
			image: HTMLImageElement | null;
		}> = [];
		const overlays = scroller.querySelectorAll<HTMLElement>('[data-project-row-overlay]');
		const loader = new THREE.TextureLoader();
		loader.setCrossOrigin('anonymous');

		placeholders.forEach((placeholder) => {
			const image = placeholder.querySelector<HTMLImageElement>('img');
			const src = image?.src;
			if (!src) return;

			let texture = textureCache.get(src);
			if (!texture) {
				texture = loader.load(src);
				textureCache.set(src, texture);
			}
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;

			const geometry = new THREE.PlaneGeometry(1, 1, 128, 64);
			const material = new THREE.ShaderMaterial({
				vertexShader: VERTEX_SHADER,
				fragmentShader: FRAGMENT_SHADER,
				uniforms: {
					uVelocity: { value: 0 },
					uTime: { value: 0 },
					uTexture: { value: texture },
				},
				transparent: true,
				side: THREE.DoubleSide,
			});

			const mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);
			planes.push({ mesh, placeholder, image });
			if (image) image.style.opacity = '0';
		});

		// The readability gradient now lives inside the shader so it deforms with
		// the image; the DOM copy is only the fallback, faded while the canvas plays.
		overlays.forEach((overlay) => {
			overlay.style.opacity = '0';
		});

		let last = scroller.scrollTop;
		let velocity = 0;
		let raf = 0;

		const clock = new THREE.Clock();
		let disposed = false;

		const updatePlanes = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			planes.forEach((plane) => {
				const rect = plane.placeholder.getBoundingClientRect();
				const isVisible = rect.top < height && rect.bottom > 0;
				plane.mesh.visible = isVisible;
				if (!isVisible) return;

				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;
				plane.mesh.position.set(centerX - width / 2, -(centerY - height / 2), 0);
				plane.mesh.scale.set(rect.width, rect.height, 1);
			});
		};

		const tick = () => {
			if (disposed) return;

			// Velocity is read every frame so it always decays back to zero when
			// the user stops scrolling — the deformation only lives mid-scroll.
			const now = scroller.scrollTop;
			const raw = now - last;
			last = now;

			// Ignore the seamless seam jumps: they are not user velocity.
			if (Math.abs(raw) <= 128) {
				velocity = THREE.MathUtils.lerp(velocity, raw, 0.12);
			}

			updatePlanes();

			const time = clock.getElapsedTime();
			planes.forEach((plane) => {
				const material = plane.mesh.material as THREE.ShaderMaterial;
				material.uniforms.uVelocity.value = velocity;
				material.uniforms.uTime.value = time;
			});

			renderer!.render(scene, camera);
			raf = window.requestAnimationFrame(tick);
		};
		raf = window.requestAnimationFrame(tick);

		return () => {
			disposed = true;
			window.cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);

			planes.forEach((plane) => {
				plane.mesh.geometry.dispose();
				(plane.mesh.material as THREE.ShaderMaterial).dispose();
				if (plane.image) plane.image.style.opacity = '';
			});
			overlays.forEach((overlay) => {
				overlay.style.opacity = '';
			});

			renderer!.dispose();
			canvas.remove();
		};
	}, [hostRef, listRef, isDesktop, filterKey]);
}

/**
 * Texture cache shared across effect re-runs (filter changes), so images are
 * loaded once and never re-downloaded while the list is rebuilt.
 */
const textureCache = new Map<string, THREE.Texture>();

/**
 * Vertex deformation — vertical bend reversed against the scrolling
 * direction, peak at the horizontal center. Kept around a tenth of the
 * reference strength, so the squeeze stays a subtle whisper.
 */
const VERTEX_SHADER = `
uniform float uVelocity;
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  float xNorm = uv.x;
  float curve = sin(xNorm * 3.14159265);

  float bendY = -curve * uVelocity * 0.00125;
  pos.y += bendY;

  float twist = cos(xNorm * 3.14159265);
  float twistY = -twist * uVelocity * 0.0004;
  pos.y += twistY;

  float bendZ = curve * abs(uVelocity) * 0.0003;
  pos.z += bendZ;

  float stretch = 1.0 + abs(uVelocity) * 0.00001;
  pos.y *= stretch;

  float damp = sin(uTime * 6.0) * exp(-abs(uVelocity) * 0.08) * 0.00015;
  pos.y += damp * curve;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  vec4 tex = texture2D(uTexture, vUv);

  // Readability gradient lifted from the home plates — drawn against vUv so it
  // bends with the deformed mesh instead of staying flat.
  float fade = smoothstep(0.0, 0.45, vUv.y);
  float dark = 0.75 * (1.0 - fade);

  vec3 color = tex.rgb * (1.0 - dark);
  gl_FragColor = vec4(color, tex.a);
}
`;
