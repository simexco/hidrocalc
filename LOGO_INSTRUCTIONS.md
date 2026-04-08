# Cómo actualizar el logo de SIMEX

1. Coloca el archivo en /public/simex-logo.svg (SVG preferido)
   o /public/simex-logo.png (PNG con fondo transparente)

2. En /src/components/layout/BrandLogo.tsx, cambia:
   const LOGO_EXISTS = false  →  const LOGO_EXISTS = true

3. El logo aparecerá automáticamente en:
   - Header de la aplicación
   - Sidebar superior
   - Pantalla de inicio
   - Todos los PDFs exportados

No se requiere ningún otro cambio en el código.
