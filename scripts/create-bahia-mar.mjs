// Crea el restaurante Bahía Mar en 01motorklassik@gmail.com
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
const SECRET_KEY = env.SUPABASE_SECRET_KEY
const EMAIL = '01motorklassik@gmail.com'
const PASSWORD = process.env.BAHIA_MAR_PASSWORD || env.BAHIA_MAR_PASSWORD
const LOGO_PATH = new URL('../public/icons/bahia-mar-logo.png', import.meta.url)

const DESCRIPTION =
  'Hacemos una cocina honesta y procuramos hacer las cosas como mejor sabemos, para poder conseguir la complicidad de los clientes y amigos para no decepcionarlos en los momentos importantes de sus vidas, momentos de ocio y llenos de alegria.'

async function findUserByEmail(admin, email) {
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 200) return null
    page += 1
  }
}

async function main() {
  if (!SUPABASE_URL || !SECRET_KEY) throw new Error('Faltan credenciales en .env')
  if (!PASSWORD) throw new Error('Define BAHIA_MAR_PASSWORD en el entorno o en .env')

  const admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const existing = await findUserByEmail(admin, EMAIL)
  if (existing) {
    console.log('Eliminando cuenta previa:', existing.id, existing.email)
    const { error } = await admin.auth.admin.deleteUser(existing.id)
    if (error) throw error
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: 'restaurant',
      display_name: 'BAHÍA MAR',
    },
  })
  if (createErr) throw createErr
  const userId = created.user.id
  console.log('Usuario creado:', userId)

  const logoBytes = readFileSync(LOGO_PATH)
  const logoPath = `${userId}/avatar_${Date.now()}.png`
  let avatarUrl = null
  const { error: upErr } = await admin.storage
    .from('restaurant-photos')
    .upload(logoPath, logoBytes, { contentType: 'image/png', upsert: true })
  if (upErr) {
    console.warn('Aviso upload logo:', upErr.message)
  } else {
    avatarUrl = admin.storage.from('restaurant-photos').getPublicUrl(logoPath).data.publicUrl
  }

  const { data: profile, error: getErr } = await admin.from('profiles').select('*').eq('id', userId).single()
  if (getErr) throw getErr
  console.log('Rol inicial:', profile.role)

  const updates = {
    display_name: 'BAHÍA MAR',
    restaurant_name: 'BAHÍA MAR',
    restaurant_cuisine: 'Mediterránea',
    restaurant_description: DESCRIPTION,
    restaurant_hours: '9:00 - 23:00',
    restaurant_price_range: '50€-100€',
    country: 'España',
    onboarding_completed: true,
    avatar_url: avatarUrl,
  }

  const { error: updErr } = await admin.from('profiles').update(updates).eq('id', userId)
  if (updErr) throw updErr

  console.log('\nOK Bahía Mar creado')
  console.log('Email:', EMAIL)
  console.log('Avatar:', avatarUrl)
  console.log('User ID:', userId)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
