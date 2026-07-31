# CONTEXTO Table4Singles (modo caveman, ahorro tokens)

## QUE ES
App cenas compartidas singles. React+Vite+TS+Tailwind+Supabase.

## RUTAS
Proyecto: `/Users/joseangles/Desktop/Proyectos/Table4singles`
GitHub: airtifexlab/Table4singles
Supabase: zocrwanhcschmydczgeh.supabase.co
Dominio: table4singles.online (aun apunta build vieja, dominio personalizado en Vercel pendiente de conectar)
DEPLOY: hecho en VERCEL (no Netlify). Proyecto `table4singles` en team `jai-a359`. URL producción: https://table4singles.vercel.app (verificado OK: carga, estilos Tailwind, sin errores consola/red/Supabase). Env vars `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` configuradas en Production+Preview. Cada push a `main` dispara redeploy automático (Git integration).
Dev local: `npm run dev` → localhost:5173 (si puerto ocupado, matar procesos viejos: `lsof -i :5173`, `kill -9 <pid>`). OJO: si tras HMR algo raro persiste (ej. cambios que no aparecen), puede haber un proceso vite zombie en el puerto sirviendo codigo viejo desde una sesion anterior — matar y arrancar limpio.

## MIGRACIONES SQL — TODAS EJECUTADAS ✅
001 schema.sql, 002 lifecycle+notifs, 003 onboarding, 004 settings, 005 avatar, 006 geolocation, 007 lock_role, 008 referrals, 009 favorites, 010 diner_reviews, 011 reminders (pg_cron habilitado, job `send_dinner_reminders_hourly` programado con id 1, `0 * * * *`), 012 participant_invites (participantes con reserva aprobada tambien pueden crear invitaciones, no solo el host).
Todas en `supabase/migrations/`. Ninguna pendiente ahora mismo.
OJO: MCP de Supabase conectado en este entorno NO es el proyecto Table4singles (ve otros proyectos: ComandIAvoz, QuieroBailar). Migraciones se ejecutan a mano en SQL Editor del dashboard real (zocrwanhcschmydczgeh).

## HECHO ✅
- Reconstrucción código fuente completo desde build Bolt vieja
- Auth email+password+magic link. Google/Apple: código listo, falta config externa (OAuth apps + Supabase dashboard)
- Ciclo mesa completo: crear, unir (RPC), invitar, cancelar (RPC), reseña, notifs automáticas (triggers SQL)
- RLS en todo, 0 errores seguridad Supabase
- Logo oficial (gradiente azul→naranja) en Navbar+footer
- ONBOARDING obligatorio tras signup: nombre completo, foto perfil (obligatoria excepto joseviangles@gmail.com=admin), dirección completa (calle/ciudad/provincia/país), fecha nacimiento, bio, telefono (selector pais+bandera), instagram opcional. Bloquea navegación hasta completar.
- AJUSTES (pagina nueva): suscripcion(placeholder), notif email/push, modo oscuro(parcial-solo Ajustes), idioma, privacidad/legal, ayuda soporte, cerrar sesion
- MODELO DIFERENCIADO POR ROL:
  - Usuario normal: ve "Restaurantes" (listado con foto/nombre/direccion/cocina, filtro ciudad+cocina) en vez de mesas planas. Click→ficha restaurante (foto grande+datos+sus mesas disponibles). Ya NO ve "Crear mesa". "Mis mesas"→"Mis reservas" (solo reservas+invitaciones)
  - Restaurante: igual que antes - Explorar(mesas), Crear mesa, Mis Mesas, Dashboard
- Archivos nuevos clave: OnboardingPage.tsx, SettingsPage.tsx, RestaurantsBrowsePage.tsx, RestaurantProfilePage.tsx, ThemeContext.tsx, hooks/useRestaurants.ts
- Avatar visible en Navbar (icono usuario)
- BUSQUEDA POR RADIO KM en RestaurantsBrowsePage: al escribir ciudad en el buscador, dentro de "Filtros" aparece un slider con pasos fijos (5/10/25/50/100/200/500 km). Al mover el slider se geocodifica el texto escrito (Nominatim/OSM, sin API key, `src/lib/geocoding.ts`) y se calcula distancia Haversine contra cada restaurante (se geocodifica su city/province/country y se cachea lat/lng en `profiles` para no repetir). Sin radio seleccionado, se mantiene el comportamiento anterior (texto ilike). Requiere migracion 006 (ver arriba)
- Pestaña "Invitaciones" en barra inferior movil (junto a Reservas), abre directamente esa sub-pestaña en MyTablesPage
- Filtros de tipo de cocina (Restaurantes y Mesas) ahora son multiseleccion (antes solo 1)
- ROL INMUTABLE: usuario y restaurante son cuentas distintas, el rol se elige solo al registrarse (AuthModal) y ya NO se puede cambiar despues. Se quito el boton "Cambiar a cuenta de restaurante/personal" de ProfilePage. Ademas bloqueado a nivel BD con trigger (migracion 007, ver arriba) para que ni siquiera se pueda cambiar manipulando la API directamente
- 5+ commits pusheados a GitHub

### MEJORAS LADO USUARIO (10 features, plan "Mejoras lado usuario") — codigo + migraciones 008-011 completos y ejecutados
1. **Mini-perfiles de comensales**: `components/ParticipantCard.tsx` (avatar, edad, bio, idiomas/intereses, badge de confianza), usado en TableDetailPage para el anfitrion + participantes
2. **Idiomas e intereses**: chips multiseleccion nuevos (`lib/options.ts`) en OnboardingPage (opcional) y ProfilePage (editable), guardan en `profiles.languages`/`interests`
3. **Mapa de restaurantes**: dependencias `leaflet`+`react-leaflet@4`(compatibles con React 18)+`@types/leaflet`. `components/RestaurantsMap.tsx` (tiles OSM gratis), toggle Lista/Mapa en RestaurantsBrowsePage. `useRestaurants` acepta `ensureCoordinates` para geocodificar bajo demanda al activar el mapa
4. **Favoritos**: `hooks/useFavorites.ts` + tabla `favorites` (migracion 009). Corazon en tarjeta de RestaurantsBrowsePage y en cabecera de RestaurantProfilePage. Filtro "Solo favoritos"
5. **Filtros de mesas**: en RestaurantProfilePage, filtro client-side por fecha desde/idioma/plazas libres minimas sobre las mesas ya cargadas
6. **Resenas entre comensales**: `hooks/useDinerReviews.ts` + tabla `diner_reviews` (migracion 010, solo rating 1-5 sin comentario, filas privadas). Agregado publico solo via funcion SQL `get_diner_trust_score` (security definer). Modal `components/DinerReviewModal.tsx` en TableDetailPage cuando la mesa ya paso
7. **Recordatorios in-app**: migracion 011, funcion `send_dinner_reminders()` + `cron.schedule` cada hora (pg_cron), inserta en `notifications` 24h antes. Sin cambios de frontend (NotificationsPanel ya es generico)
8. **Modo oscuro completo (TODA la app, lado usuario Y restaurante)**: variantes `dark:` anadidas a Navbar, LandingPage, RestaurantsBrowsePage, RestaurantProfilePage, TableDetailPage, MyTablesPage, ProfilePage, OnboardingPage, AuthModal, NotificationsPanel, TableCard, ShareButton, InviteModal, CancelModal, StarRating, RestaurantsMap + componentes nuevos. Ampliado despues (ver mas abajo) a CreateTablePage, RestaurantDashboardPage, BrowsePage (lado restaurante), PrivacyPolicyPage, AvisoLegalPage, ErrorBanner, LanguageSwitcher — ya no queda ninguna pagina sin dark mode
9. **Estadisticas de perfil**: seccion "Mi actividad" en ProfilePage (cenas asistidas, confianza, miembro desde)
10. **Referidos**: enlace `?ref={user_id}` compartible desde ProfilePage (ShareButton), capturado en `App.tsx` (localStorage) y aplicado en `AuthContext.signUp` -> `profiles.referred_by` (migracion 008, via `handle_new_user()` actualizado). Contador de invitados en ProfilePage

### PESTAÑA COMENSALES + INVITAR DESDE COMENSALES (feature nueva, codigo completo, migracion 012 ejecutada)
- **Comensales** (`pages/CompanionsPage.tsx`, ruta `'companions'`): directorio de usuarios rol=user (solo lectura de perfiles). Hook `hooks/useCompanions.ts` (columnas publicas explicitas, nunca email/phone/street_address/lat/lng; filtro nombre+ciudad+idiomas+intereses; paginacion `.range()` + "cargar mas"). Tarjeta `components/CompanionCard.tsx`. Click abre `components/CompanionProfileModal.tsx` (ficha completa: bio, idiomas, intereses, confianza via `useDinerTrustScore`, miembro desde). Pestaña en Navbar (desktop+movil) solo visible role=user, entre Restaurantes y Mis reservas.
- **Invitar desde Comensales**: hallazgo clave -> las mesas SIEMPRE las crea un restaurante (`host_id` nunca es usuario normal), asi que se abrio la politica RLS de `invitations` (migracion 012) para permitir tambien a participantes con `status='approved'`, no solo al host.
  - `hooks/useInvitableTables.ts`: mesas desde las que el usuario puede invitar ya mismo (host o participante aprobado, `status='open'`, plazas libres, fecha futura)
  - `components/InviteToTableModal.tsx`: boton "Invitar a una cena" en `CompanionProfileModal`. Si 1 mesa invitable -> elegir tipo ("Yo invito"/"Cada uno paga") y enviar. Si varias -> elegir mesa primero. Si 0 -> boton "Buscar restaurante para invitar"
  - Fase 2 (invitar sin tener mesa aun): `contexts/PendingInviteContext.tsx` (persiste intencion `{inviteeId,inviteeName}` en localStorage `t4s_pending_invite`, provider montado en `App.tsx`), `components/PendingInviteBanner.tsx` (banner fijo global "Buscando mesa para invitar a X"). En `TableDetailPage`, tras unirse ("doy mi palabra" o volviendo de pago con deposito exitoso), si hay invitacion pendiente se ofrece enviarla al instante y se limpia el estado
  - No se toca `InviteModal.tsx` (flujo host clasico) ni reglas de `diner_reviews`

### CUENTAS DE PRUEBA — creadas ✅
`scripts/seed-test-accounts.mjs` reescrito para usar la Secret Key de Supabase (API admin: `auth.admin.createUser`/`updateUserById` con `email_confirm:true`, bypassa confirmacion de email y RLS). Re-ejecutable sin duplicar (busca por email, actualiza si ya existe). Requiere `SUPABASE_SECRET_KEY` en `.env` (clave secreta del nuevo sistema de API keys de Supabase, formato `sb_secret_...`, NO subida a git). Cuentas creadas, confirmadas y con onboarding completo, password para todas: `Test1234!`:
- `t4s.test.elena.martin@gmail.com` — Elena Martín, user, Madrid, idiomas Español/Inglés, intereses Cine/Gastronomía/Viajar
- `t4s.test.marc.soler@gmail.com` — Marc Soler, user, Barcelona, idiomas Español/Catalán, intereses Fotografía/Deporte/Música
- `t4s.test.tabernasur@gmail.com` — La Taberna del Sur, restaurant, Madrid, española €€, mesa abierta con 6 plazas
- `t4s.test.sakurasushi@gmail.com` — Sakura Sushi Bar, restaurant, Barcelona, japonesa €€€, mesa abierta con 8 plazas

### MODO OSCURO — ampliado a toda la app ✅
Ya cubre el 100% de paginas y componentes (antes faltaba el lado restaurante y las legales):
- `CreateTablePage.tsx`, `RestaurantDashboardPage.tsx`, `BrowsePage.tsx` (lado restaurante)
- `PrivacyPolicyPage.tsx`, `AvisoLegalPage.tsx` (legales)
- `ErrorBanner.tsx`, `LanguageSwitcher.tsx` (componentes que faltaban)
- Verificado visualmente con capturas en local (Crear mesa, Dashboard, Politica de Privacidad, Aviso Legal) via CDP (`document.documentElement.classList.add('dark')`), sin bloques blancos ni texto ilegible
- BONUS fix: el boton "Politica de Privacidad" del footer de LandingPage llamaba a `onNavigate('privacy')` pero la ruta real en App.tsx es `'politica-privacidad'` -> nunca navegaba. Corregido (bug pre-existente, no relacionado con dark mode)

## PENDIENTE ⚠️
1. PROBAR flujo completo (local o en Vercel) con las cuentas de prueba de arriba: unirse a mesa, chat, reseña, favoritos, mapa, resenas entre comensales, referidos, Comensales+Invitar
2. STRIPE: crear Edge Functions (create-checkout, stripe-webhook), conectar deposito. Falta cuenta Stripe+keys
3. LOGIN SOCIAL: solo falta config externa (Google Cloud Console + Apple Developer + pegar keys en Supabase dashboard). Código ya OK.
4. DOMINIO: conectar table4singles.online al proyecto de Vercel (cambiar DNS/nameservers)

## ESTRUCTURA CLAVE
```
src/App.tsx              routing principal (switch por 'page' string) + captura ?ref= + PendingInviteProvider+Banner global
src/contexts/            AuthContext(signUp con referred_by), LanguageContext, ThemeContext, PendingInviteContext(nuevo)
src/hooks/                useTables, useMyTables, useTableDetail(+hostProfile), useInvitations,
                          useMessages, useNotifications, useReviews, useRestaurants(+ensureCoordinates),
                          useFavorites, useDinerReviews(trust score + envio ratings),
                          useCompanions(nuevo, directorio), useInvitableTables(nuevo, mesas desde las que invitar)
src/pages/
  LandingPage, BrowsePage(mesas-solo restaurantes), RestaurantsBrowsePage(usuarios, +mapa+favoritos),
  RestaurantProfilePage(ficha, +favorito+filtros mesas), CreateTablePage, TableDetailPage(+mini-perfiles+resenas comensales+auto-invitar tras reservar),
  RestaurantDashboardPage, OnboardingPage(+idiomas/intereses), SettingsPage, ProfilePage(+stats+referidos+idiomas/intereses),
  CompanionsPage(nuevo, pestaña Comensales), PrivacyPolicyPage, AvisoLegalPage
src/components/
  Navbar(diferenciado por rol, +tab Comensales), AuthModal, TableCard, InviteModal, CancelModal,
  LoadingSpinner, ErrorBanner, ShareButton, StarRating, LanguageSwitcher, NotificationsPanel,
  ParticipantCard, DinerReviewModal, RestaurantsMap(Leaflet),
  CompanionCard(nuevo), CompanionProfileModal(nuevo, +boton Invitar), InviteToTableModal(nuevo), PendingInviteBanner(nuevo)
src/lib/geocoding.ts     geocodeQuery (Nominatim/OSM) + haversineDistanceKm + RADIUS_STEPS_KM
src/lib/options.ts       LANGUAGE_OPTIONS + INTEREST_OPTIONS (chips)
src/types/database.ts    tipos+Profile con todos los campos nuevos (incluye referred_by, created_at)
supabase/schema.sql       schema base
supabase/migrations/      002 a 012, todas ejecutadas (ver arriba)
scripts/seed-test-accounts.mjs  crea/actualiza 2 users+2 restaurantes+mesa de prueba via API admin (SUPABASE_SECRET_KEY). Ya ejecutado, ver cuentas arriba
```

## OJO / GOTCHAS
- Tailwind config cambia (darkMode:class) requiere reiniciar Vite completo, no solo HMR
- Si Chrome/macOS en modo oscuro del sistema y no se reinicia Vite tras tocar tailwind.config, sale todo oscuro por error
- Bucket storage `restaurant-photos` se reutiliza tambien para avatares de usuario normal (path distinto: `{user_id}/avatar_*`)
- reviews: hook `useReviews(tableId)` es por mesa, `useRestaurantReviews(hostId)` es por restaurante completo
- Supabase migró a nuevo sistema de API keys: `publishable key` (=antiguo anon, sigue siendo JWT en este proyecto, funciona igual) y `secret key` (=antiguo service_role, formato `sb_secret_...`, usada en `SUPABASE_SECRET_KEY`)
- Recurrente: si tras editar archivos el navegador sigue mostrando codigo viejo (HMR no lo recoge), el fix es matar el proceso vite del puerto 5173 y arrancar `npm run dev` de cero — verificar con `curl http://localhost:5173/src/archivo.tsx` que el contenido servido coincide con el fuente antes de dar por buena una verificacion visual

## SIGUIENTE PASO
Probar flujo completo con las cuentas de prueba (local o en https://table4singles.vercel.app), incluyendo Comensales+Invitar entre Elena y Marc. Luego Stripe. Luego conectar dominio table4singles.online.
