# CONTEXTO Table4Singles (modo caveman, ahorro tokens)

## QUE ES
App cenas compartidas singles. React+Vite+TS+Tailwind+Supabase.

## RUTAS
Proyecto: `/Users/joseangles/Desktop/Proyectos/Table4singles`
GitHub: airtifexlab/Table4singles
Supabase: zocrwanhcschmydczgeh.supabase.co
Dominio: table4singles.online (aun apunta build vieja, deploy pendiente)
Deploy futuro: VERCEL (no Netlify)
Dev local: `npm run dev` → localhost:5173 (si puerto ocupado, matar procesos viejos: `lsof -i :5173`, `kill -9 <pid>`)

## MIGRACIONES SQL — TODAS EJECUTADAS ✅
001 schema.sql, 002 lifecycle+notifs, 003 onboarding, 004 settings, 005 avatar, 006 geolocation, 007 lock_role, 008 referrals, 009 favorites, 010 diner_reviews, 011 reminders (pg_cron habilitado, job `send_dinner_reminders_hourly` programado con id 1, `0 * * * *`).
Todas en `supabase/migrations/`. Ninguna pendiente ahora mismo.

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
8. **Modo oscuro completo (lado usuario)**: variantes `dark:` anadidas a Navbar, LandingPage, RestaurantsBrowsePage, RestaurantProfilePage, TableDetailPage, MyTablesPage, ProfilePage, OnboardingPage, AuthModal, NotificationsPanel, TableCard, ShareButton, InviteModal, CancelModal, StarRating, RestaurantsMap + componentes nuevos. Fuera de alcance a proposito: CreateTablePage, RestaurantDashboardPage, BrowsePage (lado restaurante)
9. **Estadisticas de perfil**: seccion "Mi actividad" en ProfilePage (cenas asistidas, confianza, miembro desde)
10. **Referidos**: enlace `?ref={user_id}` compartible desde ProfilePage (ShareButton), capturado en `App.tsx` (localStorage) y aplicado en `AuthContext.signUp` -> `profiles.referred_by` (migracion 008, via `handle_new_user()` actualizado). Contador de invitados en ProfilePage

## PENDIENTE ⚠️
1. PROBAR flujo completo en local: onboarding+foto, listado restaurantes, ficha restaurante, unirse mesa, chat, reseña, favoritos, mapa, resenas entre comensales, referidos
2. STRIPE: crear Edge Functions (create-checkout, stripe-webhook), conectar deposito. Falta cuenta Stripe+keys
3. LOGIN SOCIAL: solo falta config externa (Google Cloud Console + Apple Developer + pegar keys en Supabase dashboard). Código ya OK.
4. DEPLOY VERCEL: importar repo, env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), esperar cliente de dominio table4singles.online
5. Modo oscuro: completo en todo el lado usuario. Lado restaurante (CreateTablePage, RestaurantDashboardPage, BrowsePage) sigue sin dark mode, fuera de alcance de este plan

## ESTRUCTURA CLAVE
```
src/App.tsx              routing principal (switch por 'page' string) + captura ?ref= para referidos
src/contexts/            AuthContext(signUp con referred_by), LanguageContext, ThemeContext
src/hooks/                useTables, useMyTables, useTableDetail(+hostProfile), useInvitations,
                          useMessages, useNotifications, useReviews, useRestaurants(+ensureCoordinates),
                          useFavorites(nuevo), useDinerReviews(nuevo, trust score + envio ratings)
src/pages/
  LandingPage, BrowsePage(mesas-solo restaurantes), RestaurantsBrowsePage(usuarios, +mapa+favoritos),
  RestaurantProfilePage(ficha, +favorito+filtros mesas), CreateTablePage, TableDetailPage(+mini-perfiles+resenas comensales),
  RestaurantDashboardPage, OnboardingPage(+idiomas/intereses), SettingsPage, ProfilePage(+stats+referidos+idiomas/intereses),
  PrivacyPolicyPage, AvisoLegalPage
src/components/
  Navbar(diferenciado por rol), AuthModal, TableCard, InviteModal, CancelModal,
  LoadingSpinner, ErrorBanner, ShareButton, StarRating, LanguageSwitcher, NotificationsPanel,
  ParticipantCard(nuevo), DinerReviewModal(nuevo), RestaurantsMap(nuevo, Leaflet)
src/lib/geocoding.ts     geocodeQuery (Nominatim/OSM) + haversineDistanceKm + RADIUS_STEPS_KM
src/lib/options.ts       LANGUAGE_OPTIONS + INTEREST_OPTIONS (chips)
src/types/database.ts    tipos+Profile con todos los campos nuevos (incluye referred_by, created_at)
supabase/schema.sql       schema base
supabase/migrations/      002 a 011, todas ejecutadas (ver arriba)
```

## OJO / GOTCHAS
- Tailwind config cambia (darkMode:class) requiere reiniciar Vite completo, no solo HMR
- Si Chrome/macOS en modo oscuro del sistema y no se reinicia Vite tras tocar tailwind.config, sale todo oscuro por error
- Bucket storage `restaurant-photos` se reutiliza tambien para avatares de usuario normal (path distinto: `{user_id}/avatar_*`)
- reviews: hook `useReviews(tableId)` es por mesa, `useRestaurantReviews(hostId)` es por restaurante completo

## SIGUIENTE PASO
Probar flujo completo app en local. Luego Stripe. Luego deploy Vercel.
