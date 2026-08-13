# CONTEXTO Table4Singles (modo caveman, ahorro tokens)
Actualizado 2026-08-13. Completado ~98%. Fuente larga: `.cursor/rules/proyecto-contexto.mdc`. Responde siempre en español.

## QUE ES
App cenas compartidas singles. React+Vite+TS+Tailwind+Supabase (Edge Functions, RLS, Realtime, pg_cron). PWA instalable.

## RUTAS
Proyecto: `/Users/joseangles/Desktop/Proyectos/Table4singles`
GitHub: `table4singles/Table4singles` rama `main` (deploy auto desde `main`)
Supabase: `jcuonaxmworztegolvyf` (recreado 2026-08-07; el viejo `zocrwanhcschmydczgeh` desapareció)
MCP Supabase: autenticado, ve este proyecto.
Dominio: `https://table4singles.online` (producción)
Vercel: proyecto `table4singles` team `jai-a359`. También `https://table4singles.vercel.app`. Env `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` en Production+Preview.
Dev local: `npm run dev` → localhost:5173. Si HMR sirve código viejo: `lsof -i :5173` + `kill -9 <pid>` y arrancar limpio.

## MIGRACIONES SQL — TODAS APLICADAS EN REMOTO ✅
Local (`supabase/migrations/`): 002–025.
Remoto extra (MCP, SIN archivo local): 026 `referral_program`, 027 `fix_referred_by_trigger`, 028 `fix_ambassador_rpc_and_referral_lookup`.
| # | Nombre | Qué hace |
|---|-----|-----|
| 002–017 | lifecycle, onboarding, geo, role lock, referrals UUID, favorites, diner_reviews, reminders, invites, push, extra fields, restaurant_reviews, notify left/reply | base app |
| 018 | realtime_notifications | tabla notifications + Realtime |
| 019 | ambassadors | sistema embajadores |
| 020 | table_availability | disponibilidad mesas |
| 021 | stripe_payments | pagos + subscription_status |
| 022 | admin_ambassador_policies | RLS admin/embajador + RPC stats |
| 023 | email_reminders_cron | pg_cron 18:00 UTC + Resend |
| 024 | price_ranges_and_review_replies | rangos precio + `review_replies` |
| 025 | fix_admin_rls_recursion | `public.is_admin()` SECURITY DEFINER |
| 026 | referral_program | `ambassadors.referral_code` + `profiles.referred_by` texto |
| 027 | fix_referred_by_trigger | `handle_new_user` acepta texto (no UUID) |
| 028 | fix_ambassador_rpc | `get_ambassador_restaurants` busca por `referral_code` |

## EDGE FUNCTIONS (desplegadas ACTIVE)
- `create-subscription-checkout` — Stripe 10€/mes. Cupón `PROMO_LAUNCH_3M` = 100% dto 2 meses (primer pago 10€ cubre 3 meses)
- `create-reservation-checkout` — depósito 2€ (sin "bajo palabra")
- `stripe-webhook` — sync BD + notif in-app al restaurante
- `create-billing-portal` — portal Stripe (`SubscriptionPage`)
- `send-reservation-reminders` — email HTML via Resend (`verify_jwt: false`)
Secrets: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
Local extra no listada en remoto: `send-push-notification`

## HECHO ✅

### Auth / perfiles / roles
- Email + Google + Apple. Recuperar password + toggle visibilidad + fortaleza (min 8, mayúscula o número)
- Roles: `user`, `restaurant`, `ambassador`. Rol inmutable post-signup (trigger 007)
- Admins: `manelmercadal@me.com`, `joseanglesai@gmail.com` (`is_admin=true`)
- Toggle admin usuario↔restaurante sin logout: `ViewModeContext` + localStorage `t4s_admin_view`
- Onboarding obligatorio: nombre, foto (excepto admin), dirección, nacimiento, bio, teléfono, instagram opcional. Restaurante: wizard 4 pasos (identidad → ubicación → contacto → confirmar)

### Stripe LIVE — activo
Suscripción restaurantes + depósito reserva 2€ + webhook + portal billing. Ver Edge Functions.

### Buscador restaurantes (`RestaurantsBrowsePage`)
Filtro nombre/ciudad, cocina multi, precio (`0-50`/`50-100`/`100-200`/`+200`), fecha, tramo (mediodía/noche), radio km (Nominatim+Haversine, cache lat/lng en profiles), solo favoritos. Lista/mapa Leaflet. Contador filtros. Fecha+hora siempre visibles.

### Flujo reserva
- Perfil restaurante: carrusel fotos, selector fecha+tramo OBLIGATORIO antes de mesas
- `TableCard` compacta sin imagen; avatares → `CommensalModal`
- `TableDetailPage`: solo depósito 2€; ocupados/total; chat solo si hay reserva
- `MyTablesPage`: clic reserva → `restaurant-profile` (no table-detail)

### Valoraciones
- `PostDinnerReviewModal`: 1 botón → paso1 restaurante (estrellas+comentario público) → paso2 comensales (rating anónimo). Si ya valoró local → salta a 2. Host → solo 2
- `review_replies`: restaurante escribe, todos leen. UI en `RestaurantReviewsPage` (tabs local + cenas) y público en `TableDetailPage`
- Aparte: `diner_reviews` (confianza, agregado via `get_diner_trust_score`)

### Notifs / recordatorios / PWA
- Campana navbar + badge. Realtime postgres_changes
- Reserva → notif in-app al restaurante (webhook Stripe)
- Email recordatorio diario 18:00 UTC (pg_cron + Resend)
- PWA: `manifest.json` + SW. `InstallPrompt` a los 30s (Android instalar / iOS instrucciones)
- Dark mode 100% (`darkMode: class`)

### Paneles
- Admin: usuarios (incluye admins), restaurantes, embajadores, movimientos
- Embajador: restaurantes captados, reservas, comisión 5%. Compartir WhatsApp/Email/Web Share con `referral_code` tipo `AMBX3F7K`
- Analytics restaurante: KPIs mesas/reservas/ocupación/rating + BarChart/PieChart, filtro 7d/30d/90d. Solo `effectiveRole==='restaurant'`
- Agenda restaurante: `RestaurantAgendaPage`

### Referidos
`?ref=` → localStorage → `AuthModal` pre-rellena código. `referred_by` es TEXTO (código), no UUID. RPC embajador busca por `referral_code`.

### i18n — 13 idiomas
ES EN DE FR IT RU PT UK RO AR(RTL) SV ZH JA. Selector grid en Ajustes + botón compacto en AuthModal. Maestro: `src/i18n/es.ts`. RTL: `document.documentElement.dir`.
Traducido 100%: Navbar, Settings, AuthModal, Analytics, Ambassador, Dashboard, Subscription, TableDetail, CancelModal, CommensalModal, RestaurantProfile.

### Features lado usuario (siguen vivas)
Mini-perfiles, idiomas/intereses, mapa, favoritos, Comensales+invitar (`CompanionsPage`, `PendingInviteContext`), stats perfil, modo oscuro.

## CUENTAS DE PRUEBA
Password todas: `Test1234!` (script `scripts/seed-test-accounts.mjs`, requiere `SUPABASE_SECRET_KEY`)
- `t4s.test.elena.martin@gmail.com` — Elena Martín, user, Madrid
- `t4s.test.marc.soler@gmail.com` — Marc Soler, user, Barcelona
- `t4s.test.tabernasur@gmail.com` — La Taberna del Sur, restaurant, Madrid
- `t4s.test.sakurasushi@gmail.com` — Sakura Sushi Bar, restaurant, Barcelona

## PENDIENTE ⚠️ (baja prioridad)
- Strings hardcodeados: OnboardingPage (cocinas/wizard), AdminPage, RestaurantAgendaPage, PostDinnerReviewModal, MyTablesPage (estados)
- Reactivar validación email al registrarse (off para pruebas)
- Test E2E: restaurante crea mesa → usuario reserva → agenda → notif
- Búsqueda directa de mesas (ahora se buscan restaurantes)
- Perfil público comensal más completo
- Subir a git archivos SQL de 026–028 (existen solo en remoto)

## ESTRUCTURA CLAVE
```
src/App.tsx                 routing + ?ref= + redirects pago Stripe + PendingInviteProvider
src/contexts/               Auth, Language(RTL), Theme, ViewMode(admin toggle), PendingInvite
src/i18n/                   es.ts maestro + 12 langs + index (languageOptions, RTL_LANGS)
src/pages/
  Landing, Browse(mesas-solo restaurant), RestaurantsBrowse(user+mapa+filtros),
  RestaurantProfile(fecha/hora+mesas), CreateTable, TableDetail(deposito 2€),
  MyTables, RestaurantDashboard, RestaurantAgenda, Analytics, RestaurantReviews,
  Onboarding(wizard 4), Settings(13 langs), Profile, Subscription(Stripe portal),
  Ambassador, Admin, Companions, Privacy, AvisoLegal
src/components/
  Navbar(+toggle admin), AuthModal(+lang), TableCard, CommensalModal,
  PostDinnerReviewModal, CancelModal, InviteModal, InviteToTableModal,
  CompanionCard/Modal, PendingInviteBanner, RestaurantsMap, InstallPrompt,
  NotificationsPanel, ParticipantCard, DinerReviewModal, Agenda*
src/hooks/                  useTables, useRestaurants, useReviews(+replies), useFavorites,
                            useDinerReviews, useCompanions, useInvitableTables,
                            useAmbassadorStats, useAdminData, useRestaurantAgenda,
                            useNotifications, usePushSubscription, useMessages, useInvitations
src/lib/geocoding.ts        Nominatim + Haversine + RADIUS_STEPS_KM
src/lib/options.ts          LANGUAGE_OPTIONS + INTEREST_OPTIONS
supabase/functions/         5 desplegadas (ver arriba) + send-push-notification local
supabase/migrations/        002–025 en git; 026–028 solo remoto
```

## TABLAS PUBLIC (RLS on)
profiles, cities, dining_tables, table_participants, invitations, reviews, messages, notifications, refund_claims, payments, vip_cards, referrals, restaurant_terms_acceptance, favorites, diner_reviews, push_subscriptions, restaurant_reviews, restaurant_review_replies, ambassadors, reservation_payments, review_replies

## OJO / GOTCHAS
- Tailwind `darkMode:class` → reiniciar Vite, no solo HMR. Si macOS dark y Vite no reiniciado, sale todo oscuro
- Vite zombie en :5173 sirve código viejo → matar y `npm run dev` limpio
- Bucket `restaurant-photos` también avatares user (`{user_id}/avatar_*`)
- `useReviews(tableId)` = por mesa; reviews de local = `restaurant_reviews`
- `referred_by` es CÓDIGO TEXTO no UUID (026–027). No romper el trigger
- Keys Supabase: publishable (=anon JWT) + secret `sb_secret_...` (`SUPABASE_SECRET_KEY`, no git)
- 026–028 aplicadas por MCP: si recreas el proyecto, hay que reaplicarlas; no están en `supabase/migrations/`
- Landing footer "Política de Privacidad" navega a ruta `politica-privacidad` (no `privacy`)

## SIGUIENTE PASO
Deuda i18n residual (Onboarding/Admin/Agenda/PostDinner/MyTables). Luego E2E con cuentas de prueba. Opcional: volcar 026–028 a archivos SQL locales.
