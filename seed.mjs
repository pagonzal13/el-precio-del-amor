// seed.mjs - Importa el historial usando fetch directo contra PostgREST
// Uso: node seed.mjs

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

try { const { config } = await import('dotenv'); config() } catch {}

const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000'
const apiKey  = process.env.VITE_API_KEY  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24ifQ.IIu6Hgh990TJGBVMWsuMk70dBKxJBlqdO3pQCl4PXms'

console.log('🔌 Conectando a:', apiUrl)

// Verificar conexión primero
const check = await fetch(apiUrl + '/expenses?limit=1', {
  headers: { 'Authorization': 'Bearer ' + apiKey, 'Accept': 'application/json' }
})
if (!check.ok) {
  const txt = await check.text()
  console.error('❌ No se puede conectar a PostgREST:', check.status, txt)
  process.exit(1)
}
console.log('✅ Conexión OK')

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, 'seed_data.json'), 'utf-8'))

console.log('📦 Importando', data.length, 'gastos...')

const BATCH = 50
let imported = 0

for (let i = 0; i < data.length; i += BATCH) {
  const batch = data.slice(i, i + BATCH)
  const res = await fetch(apiUrl + '/expenses', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(batch)
  })

  if (!res.ok) {
    const txt = await res.text()
    console.error('\n❌ Error en lote', Math.floor(i/BATCH)+1, '— HTTP', res.status)
    console.error('Respuesta:', txt)
    process.exit(1)
  }

  imported += batch.length
  process.stdout.write('\r✅ ' + imported + '/' + data.length + ' gastos importados')
}

console.log('\n🎉 ¡Datos históricos importados con éxito!')
