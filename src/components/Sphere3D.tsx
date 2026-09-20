import { useEffect, useRef } from "react";
import * as THREE from "three";

/* A glass marble drawn by a custom fragment shader rather than a picture of
   one. Ported from the Overdue-EMI-assist-app prototype.

   The form is shaded off the sphere's own normal, so the highlights stay put
   while the mesh turns beneath them — only the cool wash inside drifts, and
   slowly. A tight specular hotspot, a bounce highlight low on the far side and
   a white fresnel rim do the rest.

   Deliberately cheap: no shadows, no textures, no environment map, one mesh,
   and the loop pauses when the tab is hidden. Still, each instance owns a
   WebGL context and browsers cap those at ~16 — so this is used once, for the
   hero. Small avatars keep the flat PNG, where the difference is invisible. */

const VERT = `
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    /* object-space position, so the pattern is built from a continuous field
       on the sphere instead of from UVs — UVs have a seam at the wrap, which
       is what produced the hard vertical line down the middle */
    vObj = normalize(position);
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = `
  precision highp float;
  uniform float uTime;
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vView;

  /* One soft sheet of ink, defined on the sphere itself. The height is taken
     along a tilted axis and warped by sines of the object-space position, so
     the whole field is continuous — no wrap, therefore no seam. */
  float sheet(vec3 p, float phase, float thick, float tilt, float freq) {
    float h = p.y * cos(tilt) - p.x * sin(tilt);
    float warp = 0.16 * sin(p.x * freq + p.z * freq * 0.7 + phase)
               + 0.07 * sin(p.z * freq * 1.6 - p.y * freq * 0.5 - phase * 0.8);
    return smoothstep(thick, 0.0, abs(h - warp));
  }

  void main() {
    vec3 glass  = vec3(0.965, 0.972, 0.988);
    vec3 cool   = vec3(0.886, 0.898, 0.937);
    vec3 blue   = vec3(0.290, 0.545, 0.980);
    vec3 lilac  = vec3(0.639, 0.573, 0.945);
    vec3 violet = vec3(0.478, 0.373, 0.878);
    vec3 deep   = vec3(0.286, 0.220, 0.639);

    float up = clamp(vN.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(cool, glass, smoothstep(0.10, 0.85, up));

    /* three sheets at different tilts and rates; depth only where they stack */
    float i1 = sheet(vObj, uTime * 0.28,       0.34, -0.42, 2.1) * 0.64;
    float i2 = sheet(vObj, uTime * 0.21 + 1.8, 0.26, -0.56, 2.8) * 0.52;
    float i3 = sheet(vObj, uTime * 0.34 + 3.4, 0.19, -0.28, 3.4) * 0.42;
    float ink = clamp(i1 + i2 + i3, 0.0, 1.0);

    /* fades toward the silhouette, as if seen through the curve of the glass */
    ink *= 0.38 + 0.62 * max(dot(vN, vView), 0.0);

    /* the hue sweeps blue -> lilac -> violet across the sphere and drifts, so
       both shades are always present and neither settles in one place */
    float hue = clamp(0.5 + 0.5 * sin(vObj.x * 1.5 + vObj.z * 1.1 + uTime * 0.14), 0.0, 1.0);
    vec3 tint = hue < 0.5
      ? mix(blue, lilac, hue * 2.0)
      : mix(lilac, violet, (hue - 0.5) * 2.0);

    col = mix(col, tint, ink * 0.90);
    col = mix(col, deep, pow(ink, 2.4) * 0.52);

    vec3 L = normalize(vec3(-0.40, 0.82, 0.76));
    vec3 H = normalize(L + vView);

    /* broad sheen, then the tight hotspot that sells it as glass */
    col += vec3(1.0) * pow(max(dot(vN, H), 0.0), 18.0) * 0.16;
    col += vec3(1.0) * pow(max(dot(vN, H), 0.0), 260.0) * 0.85;

    /* bounce light low on the far side */
    vec3 B = normalize(vec3(0.64, -0.62, 0.55));
    col += vec3(0.90, 0.93, 1.0) * pow(max(dot(vN, normalize(B + vView)), 0.0), 120.0) * 0.34;

    /* thin bright rim — the giveaway of a glass edge */
    float fres = pow(1.0 - max(dot(vN, vView), 0.0), 3.0);
    col = mix(col, vec3(1.0), fres * 0.70);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Sphere3D({
  size = 128,
  /** Degrees per second — frame-rate independent, so a 120Hz display doesn't
      spin it twice as fast as a 60Hz one. Kept low; the motion should be felt
      rather than watched. */
  degPerSec = 16,
  className,
}: {
  size?: number;
  degPerSec?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* preserveDrawingBuffer keeps the last frame readable, so the sphere shows
       up in canvas-based screenshots instead of coming out blank */
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(size, size, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    /* 3.38 leaves a hair of margin — nothing clips at the edges */
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 3.38;

    const geometry = new THREE.SphereGeometry(1, 96, 64);
    const uniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.z = 0.2;
    scene.add(sphere);

    let raf = 0;
    let live = true;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    /* Paused on tab visibility rather than IntersectionObserver: this screen
       arrives via a transform rather than a scroll, so IO can latch to "not
       visible" on mount and never fire again, silently freezing the sphere. */
    const awake = () => document.visibilityState === "visible";

    const rate = (degPerSec * Math.PI) / 180;
    let last = performance.now();
    const frame = (now: number) => {
      if (!live) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (awake()) {
        if (!still) {
          sphere.rotation.y += rate * dt;
          uniforms.uTime.value += dt;
        }
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [size, degPerSec]);

  return <div ref={host} className={className} style={{ width: size, height: size }} />;
}
