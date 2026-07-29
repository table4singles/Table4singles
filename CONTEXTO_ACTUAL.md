# CONTEXTO PROYECTO - Table4Singles

## QUE ES
App cenas compartidas. Singles van a restaurante, conocen gente. React+Vite+TS+Tailwind+Supabase.

## DONDE ESTA EL PROYECTO
`/Users/joseangles/Desktop/Proyectos/Table4singles`
GitHub: https://github.com/airtifexlab/Table4singles
Dominio: table4singles.online (apunta build viejo Bolt en Netlify)

## SUPABASE
URL: `https://zocrwanhcschmydczgeh.supabase.co`
Anon key: en `.env` del proyecto

## BUILD
`npm run build` → OK sin errores. Bundle en `dist/`.

## LO QUE YA ESTA HECHO ✅
- Reconstrucción completa desde 0 (original era build minificado de Bolt.new)
- Supabase schema ejecutado (`supabase/schema.sql`)
- Auth (email+password, magic link) — Google/Apple código listo pero falta config manual
- Páginas: Landing, Browse, Create, TableDetail, MyTables, Profile, PrivacyPolicy, AvisoLegal
- **RestaurantDashboardPage** (nueva, ruteada en App.tsx)
- Hooks: useTables, useInvitations, useNotifications, useReviews, useMessages
- Componentes: Navbar, AuthModal, TableCard, ShareButton, StarRating
- Componentes nuevos: InviteModal, CancelModal, LoadingSpinner, ErrorBanner
- i18n: ES / EN / DE completo
- PWA: manifest, service worker, iconos
- Ciclo de vida mesa completo: crear → unirse (RPC atómico) → invitar → cancelar → reseña (por fecha)
- Estados de error/carga/vacío en todas las páginas
- Perfil: editar, subir fotos, eliminar fotos, cambiar rol user↔restaurante
- Navbar: fondo blanco, logo degradado azul, "Explorar" visible sin login, "Entrar"/"Registro" azul
- Hero landing: gradiente azul saturado, imagen copas vino tinto (pexels 19721743)
- Notificaciones automáticas: triggers SQL en `supabase/migrations/002_lifecycle_and_notifications.sql`

## LO QUE FALTA ⚠️

### 1. EJECUTAR MIGRACIÓN SQL (usuario debe hacer esto en Supabase SQL Editor)
Archivo: `supabase/migrations/002_lifecycle_and_notifications.sql`
Añade: campo email en profiles, triggers notificaciones, RPC join_table, RPC cancel_reservation, fix RLS invitaciones.

### 2. STRIPE (código listo, falta credentials + deploy)
- Falta crear: `supabase/functions/create-checkout/index.ts`
- Falta crear: `supabase/functions/stripe-webhook/index.ts`
- Botón "Reservar con depósito" tiene badge "Próximamente" hasta que Stripe esté activo
- Necesita: cuenta Stripe, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLISHABLE_KEY

### 3. LOGIN SOCIAL (código listo, falta config externa)
Para Google: Google Cloud Console → OAuth 2.0 Client ID
  - Authorized JS origins: https://table4singles.online
  - Redirect URI: https://zocrwanhcschmydczgeh.supabase.co/auth/v1/callback
  - Luego en Supabase Dashboard → Auth → Providers → Google → pegar Client ID + Secret

Para Apple: Apple Developer → Services ID → Sign in with Apple
  - Luego en Supabase Dashboard → Auth → Providers → Apple

### 4. DESPLIEGUE PRODUCCIÓN
- Hacer commit + push de todo el código fuente (actualmente untracked en git)
- Netlify: conectar repo, publish dir = `dist`, variables de entorno:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_STRIPE_PUBLISHABLE_KEY (cuando tengas Stripe)
- Dominio table4singles.online ya apunta a Netlify, solo cambiar el deploy target

### 5. PARIDAD VISUAL PENDIENTE (pantallas sin captura de referencia)
Browse, Create, TableDetail, MyTables, Profile, AuthModal — visualmente coherentes
pero sin comparar pixel a pixel con original. El usuario debe mandar capturas para ajustar.

## ESTRUCTURA ARCHIVOS CLAVE
```
src/
  App.tsx                    ← routing principal + casos de navegación
  contexts/
    AuthContext.tsx           ← auth, profile, signIn/Up/Out/Google/Apple
    LanguageContext.tsx        ← ES/EN/DE
  hooks/
    useTables.ts             ← useTables, useTableDetail (joinTable RPC), useMyTables (cancel)
    useInvitations.ts        ← searchUsers, sendInvitation, respondInvitation (RPC)
    useMessages.ts           ← chat realtime Supabase
    useNotifications.ts      ← leer notifs, marcar leídas
    useReviews.ts            ← submitReview
  pages/
    LandingPage.tsx          ← con Navbar incluida
    BrowsePage.tsx
    CreateTablePage.tsx
    TableDetailPage.tsx      ← InviteModal, CancelModal, paymentSuccess banner
    MyTablesPage.tsx         ← cancelar mesa propia, cancelar reserva
    ProfilePage.tsx          ← editar, fotos, cambio rol
    RestaurantDashboardPage.tsx ← NUEVA
    PrivacyPolicyPage.tsx
    AvisoLegalPage.tsx
  components/
    Navbar.tsx               ← blanco, logo grad azul, Explorar siempre visible
    AuthModal.tsx
    TableCard.tsx
    InviteModal.tsx          ← NUEVO: host invita por nombre/email
    CancelModal.tsx          ← NUEVO: cancelar reserva/mesa con lógica depósito
    LoadingSpinner.tsx       ← NUEVO
    ErrorBanner.tsx          ← NUEVO
    ShareButton.tsx
    StarRating.tsx
    LanguageSwitcher.tsx
    NotificationsPanel.tsx
  i18n/ es.ts / en.ts / de.ts  ← incluye restaurantDashboard, invite, cancel, etc.
  types/database.ts          ← Profile ahora incluye email
  lib/supabase.ts / security.ts
supabase/
  schema.sql                 ← ejecutado ✅
  migrations/
    002_lifecycle_and_notifications.sql  ← PENDIENTE ejecutar en Supabase
```

## COLORES PRINCIPALES
- Azul nav: blue-600 (#2563eb)
- Coral CTA: #e94560 (primary-500 en tailwind.config)
- Teal accents: teal-600
- Gradiente hero: sky-500 → sky-400 → orange-300

## PRÓXIMO PASO INMEDIATO
1. Usuario ejecuta `002_lifecycle_and_notifications.sql` en Supabase SQL Editor
2. Crear Edge Functions Stripe
3. Commit + push + deploy Netlify
