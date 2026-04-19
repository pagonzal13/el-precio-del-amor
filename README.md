# 💛 El Precio del Amor

Tu app personal de gastos compartidos — Capa & Pau.

---

## 🏠 Setup local con Docker (recomendado)

Todo corre en local: PostgreSQL + PostgREST + la app React.  
Un solo comando lo levanta todo. Los datos sobreviven a reinicios.

### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

### Primer arranque (una sola vez)

```bash
# 1. Entra en la carpeta del proyecto
cd el-precio-del-amor

# 2. Levanta todo (construye la app, arranca la BD y PostgREST)
docker-compose up --build

# Espera a ver este mensaje:
#   app    | ➜  Local:   http://localhost:5173/
```

La primera vez Docker descarga las imágenes (~500 MB), construye la app y crea la base de datos.  
Las siguientes veces arranca en segundos.

### Importar el historial (solo la primera vez)

Con los contenedores corriendo, abre **otra terminal** y ejecuta:

```bash
# Instala las dependencias si aún no lo has hecho
npm install
```

### Uso diario

```bash
# Arrancar
docker-compose up

# Parar
docker-compose down      # Para los contenedores (datos conservados)
```

### Acceder desde otros dispositivos del WiFi

La app escucha en `0.0.0.0:5173`, así que cualquier dispositivo en vuestra red puede entrar.

1. Averigua tu IP local:
   - **Mac**: `ipconfig getifaddr en0`
   - **Windows**: `ipconfig` → "Dirección IPv4"
2. Desde el móvil de Capa: `http://192.168.x.x:5173`

⚠️ **Un detalle importante para el WiFi**: el navegador del móvil llama a PostgREST en `localhost:3000`... pero `localhost` desde el móvil apunta al propio móvil, no a tu ordenador. Para que funcione desde otros dispositivos, edita `docker-compose.yml` y cambia:

```yaml
environment:
  VITE_API_URL: http://192.168.x.x:3000   # ← tu IP local real
```

Y luego reconstruye: `docker-compose up --build`

---

## 📦 Dónde viven los datos

Los datos de PostgreSQL están en un **volumen Docker**:

```
postgres_data (volumen gestionado por Docker)
└── /var/lib/postgresql/data   ← dentro del contenedor
```

- `docker-compose down` → los datos se conservan ✅
- `docker-compose down -v` → **borra el volumen y todos los datos** ⚠️

Para hacer una copia de seguridad manual:

```bash
docker-compose exec db pg_dump -U amor amor > backup_$(date +%Y%m%d).sql
```

Para restaurar:

```bash
cat backup_XXXXXXXX.sql | docker-compose exec -T db psql -U amor amor
```

---

## 🔧 Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver solo los logs de la base de datos
docker-compose logs -f db

# Acceder a la base de datos directamente (psql)
docker-compose exec db psql -U amor amor

# Reconstruir solo la app (si cambias código)
docker-compose up --build app
```

---

## 📁 Estructura del proyecto

```
el-precio-del-amor/
├── docker/
│   └── init.sql             # Crea la tabla y roles al primer arranque
├── src/
│   ├── components/
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── AddExpense.jsx
│   │   ├── History.jsx
│   │   └── Dashboard.jsx
│   └── lib/
│       ├── supabase.js      # Cliente API (apunta a PostgREST local)
│       └── useBalance.js    # Hook de cálculo de deuda
├── seed_data.json            # 850 gastos históricos procesados
├── seed.mjs                  # Script de importación
├── docker-compose.yml        # Orquesta DB + PostgREST + App
├── Dockerfile                # Construye la app React
└── .env.example
```

---

## 🔄 Migración desde Supabase cloud

Si ya tienes datos en Supabase y quieres traerlos al local:

```bash
# 1. Exporta desde Supabase (en su SQL Editor):
#    Table Editor → expenses → Export as CSV
#    O desde la CLI: supabase db dump

# 2. Con el docker local corriendo, importa:
cat tu_export.sql | docker-compose exec -T db psql -U amor amor
```

