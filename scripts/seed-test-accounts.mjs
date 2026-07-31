// Script puntual para crear cuentas de prueba (2 usuarios + 2 restaurantes) con
// onboarding ya completado, para poder probar "Comensales" e "Invitar" sin tener
// que rellenar el onboarding a mano. Uso: node scripts/seed-test-accounts.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
const PASSWORD = 'Test1234!'

const users = [
  {
    email: 't4s.test.elena.martin@gmail.com',
    role: 'user',
    display_name: 'Elena Martín',
    full_name: 'Elena Martín',
    street_address: 'Calle Alcalá 45',
    city: 'Madrid',
    province: 'Madrid',
    country: 'España',
    date_of_birth: '1994-03-12',
    bio: 'Cuenta de prueba. Me encanta el cine y probar restaurantes nuevos.',
    phone: '+34600111222',
    languages: ['Español', 'Inglés'],
    interests: ['Cine', 'Gastronomía', 'Viajar'],
  },
  {
    email: 't4s.test.marc.soler@gmail.com',
    role: 'user',
    display_name: 'Marc Soler',
    full_name: 'Marc Soler',
    street_address: 'Carrer de Sants 12',
    city: 'Barcelona',
    province: 'Barcelona',
    country: 'España',
    date_of_birth: '1991-08-27',
    bio: 'Cuenta de prueba. Aficionado a la fotografía y al deporte.',
    phone: '+34600333444',
    languages: ['Español', 'Catalán'],
    interests: ['Fotografía', 'Deporte', 'Música'],
  },
]

const restaurants = [
  {
    email: 't4s.test.tabernasur@gmail.com',
    role: 'restaurant',
    display_name: 'La Taberna del Sur',
    restaurant_name: 'La Taberna del Sur',
    restaurant_cuisine: 'Spanish',
    restaurant_description: 'Cuenta de prueba. Cocina tradicional española en el corazón de Madrid.',
    restaurant_price_range: '€€',
    city: 'Madrid',
    province: 'Madrid',
    country: 'España',
    street_address: 'Calle Mayor 10',
    table: {
      restaurant_address: 'Calle Mayor 10',
      restaurant_city: 'Madrid',
      restaurant_country: 'España',
      cuisine_type: 'Spanish',
      max_seats: 6,
      description: 'Mesa de prueba para testing de Comensales/Invitaciones.',
    },
  },
  {
    email: 't4s.test.sakurasushi@gmail.com',
    role: 'restaurant',
    display_name: 'Sakura Sushi Bar',
    restaurant_name: 'Sakura Sushi Bar',
    restaurant_cuisine: 'Japanese',
    restaurant_description: 'Cuenta de prueba. Sushi y cocina japonesa moderna en Barcelona.',
    restaurant_price_range: '€€€',
    city: 'Barcelona',
    province: 'Barcelona',
    country: 'España',
    street_address: 'Passeig de Gràcia 88',
    table: {
      restaurant_address: 'Passeig de Gràcia 88',
      restaurant_city: 'Barcelona',
      restaurant_country: 'España',
      cuisine_type: 'Japanese',
      max_seats: 8,
      description: 'Mesa de prueba para testing de Comensales/Invitaciones.',
    },
  },
]

function futureDateTime(daysAhead) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return { date: d.toISOString().slice(0, 10), time: '21:00:00' }
}

async function ensureSession(client, email) {
  const { data: signUpData, error: signUpErr } = await client.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { role: email.includes('taberna') || email.includes('sakura') ? 'restaurant' : 'user' } },
  })

  if (signUpErr) console.log(`  signUp error para ${email}: ${signUpErr.message}`)
  if (signUpData?.user) console.log(`  signUp ok, session=${signUpData.session ? 'si' : 'no'} (confirmado=${!!signUpData.user.email_confirmed_at})`)

  if (!signUpErr && signUpData.session) return signUpData.user

  const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (signInErr) {
    throw new Error(
      `No se pudo crear ni iniciar sesión con ${email}: ${signInErr.message}. ` +
      `Probablemente el proyecto exige confirmar el email antes de poder iniciar sesión.`
    )
  }
  return signInData.user
}

async function seedUser(def) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const user = await ensureSession(client, def.email)

  const { error: updErr } = await client.from('profiles').update({
    display_name: def.display_name,
    full_name: def.full_name,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(def.display_name)}`,
    street_address: def.street_address,
    city: def.city,
    province: def.province,
    country: def.country,
    date_of_birth: def.date_of_birth,
    bio: def.bio,
    phone: def.phone,
    languages: def.languages,
    interests: def.interests,
    onboarding_completed: true,
  }).eq('id', user.id)

  if (updErr) throw new Error(`Error actualizando perfil de ${def.email}: ${updErr.message}`)
  console.log(`OK usuario: ${def.email} (${def.display_name}) id=${user.id}`)
  await client.auth.signOut()
  return user.id
}

async function seedRestaurant(def, dayOffset) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const user = await ensureSession(client, def.email)

  const { error: updErr } = await client.from('profiles').update({
    display_name: def.display_name,
    restaurant_name: def.restaurant_name,
    restaurant_cuisine: def.restaurant_cuisine,
    restaurant_description: def.restaurant_description,
    restaurant_price_range: def.restaurant_price_range,
    restaurant_photos: [`https://picsum.photos/seed/${encodeURIComponent(def.restaurant_name)}/800/600`],
    street_address: def.street_address,
    city: def.city,
    province: def.province,
    country: def.country,
    onboarding_completed: true,
  }).eq('id', user.id)

  if (updErr) throw new Error(`Error actualizando perfil de ${def.email}: ${updErr.message}`)

  const { date, time } = futureDateTime(dayOffset)
  const { error: tableErr } = await client.from('dining_tables').insert({
    host_id: user.id,
    restaurant_name: def.restaurant_name,
    restaurant_address: def.table.restaurant_address,
    restaurant_city: def.table.restaurant_city,
    restaurant_country: def.table.restaurant_country,
    restaurant_image_url: `https://picsum.photos/seed/${encodeURIComponent(def.restaurant_name)}/800/600`,
    date,
    time,
    max_seats: def.table.max_seats,
    available_seats: def.table.max_seats,
    status: 'open',
    description: def.table.description,
    cuisine_type: def.table.cuisine_type,
    languages: null,
    deposit_amount: 7,
  })

  if (tableErr) console.warn(`Aviso: no se pudo crear mesa de prueba para ${def.restaurant_name}: ${tableErr.message}`)
  else console.log(`OK restaurante: ${def.email} (${def.restaurant_name}) id=${user.id} + mesa creada (${date} ${time})`)

  await client.auth.signOut()
  return user.id
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env')
    process.exit(1)
  }

  for (const u of users) await seedUser(u)
  await seedRestaurant(restaurants[0], 3)
  await seedRestaurant(restaurants[1], 5)

  console.log('\nListo. Contraseña de todas las cuentas de prueba:', PASSWORD)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
