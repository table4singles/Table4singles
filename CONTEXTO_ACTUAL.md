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

## MIGRACIONES SQL
001 schema.sql, 002 lifecycle+notifs, 003 onboarding, 004 settings, 005 avatar → EJECUTADAS ✅
006 geolocation (lat/lng en profiles, para busqueda por radio km) → ⚠️ PENDIENTE DE EJECUTAR EN SUPABASE (MCP no tiene acceso al proyecto zocrwanhcschmydczgeh, hay que correrla a mano en el SQL Editor)

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
- 5+ commits pusheados a GitHub

## PENDIENTE ⚠️
1. PROBAR flujo completo en local: onboarding+foto, listado restaurantes, ficha restaurante, unirse mesa, chat, reseña
2. STRIPE: crear Edge Functions (create-checkout, stripe-webhook), conectar deposito. Falta cuenta Stripe+keys
3. LOGIN SOCIAL: solo falta config externa (Google Cloud Console + Apple Developer + pegar keys en Supabase dashboard). Código ya OK.
4. DEPLOY VERCEL: importar repo, env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), esperar cliente de dominio table4singles.online
5. Modo oscuro solo aplicado en pantalla Ajustes, resto app sin dark mode (decidir si se extiende)

## ESTRUCTURA CLAVE
```
src/App.tsx              routing principal (switch por 'page' string)
src/contexts/            AuthContext, LanguageContext, ThemeContext
src/hooks/                useTables, useMyTables, useTableDetail, useInvitations,
                          useMessages, useNotifications, useReviews, useRestaurants
src/pages/
  LandingPage, BrowsePage(mesas-solo restaurantes), RestaurantsBrowsePage(nuevo, usuarios),
  RestaurantProfilePage(nuevo, ficha), CreateTablePage, TableDetailPage, MyTablesPage,
  RestaurantDashboardPage, OnboardingPage(nuevo), SettingsPage(nuevo), ProfilePage,
  PrivacyPolicyPage, AvisoLegalPage
src/components/
  Navbar(diferenciado por rol), AuthModal, TableCard, InviteModal, CancelModal,
  LoadingSpinner, ErrorBanner, ShareButton, StarRating, LanguageSwitcher, NotificationsPanel
src/lib/geocoding.ts     geocodeQuery (Nominatim/OSM) + haversineDistanceKm + RADIUS_STEPS_KM
src/types/database.ts    tipos+Profile con todos los campos nuevos (incluye latitude/longitude)
supabase/schema.sql       schema base
supabase/migrations/      002 a 006 (ver arriba)
```

## OJO / GOTCHAS
- Tailwind config cambia (darkMode:class) requiere reiniciar Vite completo, no solo HMR
- Si Chrome/macOS en modo oscuro del sistema y no se reinicia Vite tras tocar tailwind.config, sale todo oscuro por error
- Bucket storage `restaurant-photos` se reutiliza tambien para avatares de usuario normal (path distinto: `{user_id}/avatar_*`)
- reviews: hook `useReviews(tableId)` es por mesa, `useRestaurantReviews(hostId)` es por restaurante completo

## SIGUIENTE PASO
Probar flujo completo app en local. Luego Stripe. Luego deploy Vercel.
