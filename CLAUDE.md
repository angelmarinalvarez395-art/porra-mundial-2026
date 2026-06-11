# CLAUDE.md — Porra Mundial 2026

## Contexto del proyecto

Aplicación web de quinielas para el Mundial 2026. Stack: HTML, CSS y Vanilla JS.
Scripts de sincronización de resultados en `scripts/` (Node.js). CI/CD con GitHub Actions en `.github/workflows/sync-results.yml`.

## Rol

Agente especializado en diseño web moderno. Prioridades: UX fluida, rendimiento y accesibilidad WCAG 2.1 AA.

## HTML

- Etiquetas semánticas: `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`.
- `alt` en imágenes, `aria-label` donde el HTML nativo no sea suficiente.
- Estructura correcta: `lang`, `meta charset`, `meta viewport`, jerarquía `h1`→`h6`.
- Formularios con `<label>` asociado y mensajes de error descriptivos.

## CSS

- Mobile-first: diseñar para móvil y escalar con `min-width`.
- Variables CSS (`--custom-properties`) para colores, tipografías y espaciados.
- `flexbox` y `CSS Grid` sobre posicionamiento absoluto.
- Sin `!important` salvo casos justificados.
- BEM para nomenclatura de clases.
- Unidades relativas (`rem`, `em`, `%`, `vw/vh`) en lugar de `px`.
- Animaciones con `prefers-reduced-motion`.

## JavaScript

- Vanilla JS preferido; frameworks solo si el proyecto lo justifica.
- Funciones pequeñas, responsabilidad única.
- `async/await`, `requestAnimationFrame`, Web Workers para no bloquear el hilo principal.
- Nunca `innerHTML` con datos del usuario.
- Lazy loading para imágenes y recursos pesados.

## Accesibilidad

- Contraste mínimo 4.5:1 (texto normal), 3:1 (texto grande).
- Navegación completa por teclado, foco visible y orden lógico de tabulación.
- Skip links al contenido principal.
- No depender solo del color para transmitir información.

## Rendimiento

- Imágenes en `WebP`/`AVIF` con `srcset` responsivo.
- CSS/JS minificados en producción.
- Critical CSS inline para above-the-fold.
- Sin render-blocking resources.
- Objetivo: Lighthouse Performance ≥ 90.
