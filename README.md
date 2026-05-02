# DAWA Semana 07

Aplicación web full-stack con autenticación JWT, control de acceso por roles (`user`, `admin`) y gestión de perfil.

Incluye:

- API REST con Express + MongoDB (Mongoose)
- Capa de servicios/repositorios y middlewares de seguridad
- Frontend SSR con EJS + Materialize
- Flujo completo de registro, login, dashboard por rol y edición de perfil

## Tabla de contenido

1. [Stack y funcionalidades](#stack-y-funcionalidades)
2. [Arquitectura general (mapa)](#arquitectura-general-mapa)
3. [Secuencias de negocio](#secuencias-de-negocio)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Requisitos](#requisitos)
6. [Instalación y ejecución](#instalación-y-ejecución)
7. [Variables de entorno](#variables-de-entorno)
8. [Semillas iniciales (roles y admin)](#semillas-iniciales-roles-y-admin)
9. [Modelo de datos](#modelo-de-datos)
10. [API REST](#api-rest)
11. [Vistas web y rutas](#vistas-web-y-rutas)
12. [Manejo de autenticación en frontend](#manejo-de-autenticación-en-frontend)
13. [Guía de pruebas rápidas](#guía-de-pruebas-rápidas)
14. [Evidencias y capturas de pantalla](#evidencias-y-capturas-de-pantalla)
15. [Mejoras sugeridas](#mejoras-sugeridas)

## Stack y funcionalidades

### Backend

- Node.js + Express 4
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Hash de contraseñas con `bcrypt`
- Variables de entorno con `dotenv`

### Frontend

- EJS (render del lado servidor)
- Materialize CSS
- JavaScript vanilla para consumir API

### Funcionalidades principales

- Registro de usuario (`signUp`) con validación de contraseña robusta
- Inicio de sesión (`signIn`) y emisión de JWT
- Autorización por roles (`admin` / `user`)
- Dashboard de usuario y dashboard administrativo
- Consulta y actualización del perfil autenticado
- Seed automático de roles y usuario administrador

## Arquitectura general (mapa)

```mermaid
flowchart LR
    A[Browser EJS + app.js] -->|HTTP| B[Express Server]
    B --> C[Auth Routes]
    B --> D[Users Routes]
    C --> E[Auth Controller]
    D --> F[User Controller]
    E --> G[Auth Service]
    F --> H[User Service]
    G --> I[User Repository]
    G --> J[Role Repository]
    H --> I
    I --> K[(MongoDB Users)]
    J --> L[(MongoDB Roles)]
    B --> M[Seed Roles/Users]
    M --> L
    M --> K
```

## Secuencias de negocio

### 1) Registro de usuario (`POST /api/auth/signUp`)

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant FE as Frontend (signUp)
    participant API as Express API
    participant AS as AuthService
    participant UR as UserRepository
    participant RR as RoleRepository
    participant DB as MongoDB

    U->>FE: Completa formulario
    FE->>API: POST /api/auth/signUp
    API->>AS: signUp(payload)
    AS->>UR: findByEmail(email)
    UR->>DB: Query user por email
    DB-->>UR: Resultado
    UR-->>AS: existing/null
    AS->>AS: Validar password + hash bcrypt
    AS->>RR: findByName('user')
    RR->>DB: Query role
    DB-->>RR: Role
    AS->>UR: create(user)
    UR->>DB: Insert user
    DB-->>UR: User creado
    UR-->>AS: User creado
    AS-->>API: DTO usuario
    API-->>FE: 201 Created
    FE-->>U: Redirige a /signIn
```

### 2) Inicio de sesión (`POST /api/auth/signIn`)

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant FE as Frontend (signIn)
    participant API as Express API
    participant AS as AuthService
    participant UR as UserRepository
    participant DB as MongoDB

    U->>FE: Ingresa email/password
    FE->>API: POST /api/auth/signIn
    API->>AS: signIn(credentials)
    AS->>UR: findByEmail(email)
    UR->>DB: Query + populate roles
    DB-->>UR: User + roles
    UR-->>AS: user
    AS->>AS: bcrypt.compare + jwt.sign
    AS-->>API: { token }
    API-->>FE: 200 OK + token
    FE->>FE: Guarda token en sessionStorage
    FE->>FE: Decodifica roles
    FE-->>U: Redirección a dashboard por rol
```

### 3) Acceso a ruta protegida (`GET /api/users`)

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant API as Route /api/users
    participant Auth as authenticate
    participant Role as authorize(['admin'])
    participant UC as UserController
    participant US as UserService
    participant UR as UserRepository
    participant DB as MongoDB

    FE->>API: GET /api/users + Bearer token
    API->>Auth: Verificar JWT
    Auth-->>API: req.userId, req.userRoles
    API->>Role: Validar rol admin
    alt Rol válido
        Role-->>API: next()
        API->>UC: getAll()
        UC->>US: getAll()
        US->>UR: getAll()
        UR->>DB: Query users + populate roles
        DB-->>UR: Lista users
        UR-->>US: users
        US-->>UC: users mapeados
        UC-->>FE: 200 OK
    else Rol inválido
        Role-->>FE: 403 Prohibido
    end
```

## Estructura del proyecto

```text
.
├── public/
│   ├── css/
│   └── js/
├── src/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── views/
│   └── server.js
├── package.json
└── README.md
```

## Requisitos

- Node.js 18+
- MongoDB local en ejecución

## Instalación y ejecución

```bash
npm install
```

```bash
npm run dev
```

Scripts disponibles:

- `npm run dev`: inicia con `nodemon`
- `npm start`: inicia en modo normal con `node`

Servidor por defecto:

- `http://localhost:3000`

## Variables de entorno

Crea un archivo `.env` en la raíz:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auth_db
JWT_SECRET=f14e6a1c9843c52190c07232dfb9c0e467d5a910
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=10
```

## Semillas iniciales (roles y admin)

Al iniciar el servidor:

- Si no hay roles, se crean `user` y `admin`.
- Si no existe el admin, se crea:
  - Email: `admin@example.com`
  - Password: `Admin#1234`
  - Roles: `user`, `admin`

## Modelo de datos

### Colección `roles`

Campos:

- `name`: `user | admin`

### Colección `users`

Campos:

- `email` (único, requerido)
- `name` (requerido)
- `lastName` (requerido)
- `phoneNumber` (requerido)
- `birthdate` (requerido)
- `url_profile` (opcional)
- `adress` (opcional)
- `password` (requerido, validado y hasheado)
- `roles` (array de ObjectId referenciando `roles`)

Regla de contraseña:

- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 dígito
- Al menos 1 carácter especial entre `# $ % & * @`

## API REST

Base URL local:

- `http://localhost:3000`

### Health check

#### `GET /health`

Respuesta:

```json
{
  "ok": true
}
```

### Autenticación

#### `POST /api/auth/signUp`

Body de ejemplo:

```json
{
  "name": "Rafael",
  "lastName": "Lopez",
  "phoneNumber": "999888777",
  "birthdate": "1998-10-21",
  "email": "rafael@example.com",
  "password": "Rafael#123",
  "url_profile": "https://example.com/me.png",
  "adress": "Lima",
  "roles": ["user"]
}
```

Respuesta exitosa (`201`):

```json
{
  "id": "...",
  "email": "rafael@example.com",
  "name": "Rafael",
  "lastName": "Lopez"
}
```

#### `POST /api/auth/signIn`

Body de ejemplo:

```json
{
  "email": "rafael@example.com",
  "password": "Rafael#123"
}
```

Respuesta exitosa (`200`):

```json
{
  "token": "<jwt>"
}
```

### Usuarios (protegido)

Header requerido:

```http
Authorization: Bearer <token>
```

#### `GET /api/users`

- Acceso: solo `admin`
- Devuelve lista de usuarios mapeados

#### `GET /api/users/me`

- Acceso: cualquier usuario autenticado
- Devuelve perfil del token actual

#### `PUT /api/users/me`

- Acceso: cualquier usuario autenticado
- Actualiza perfil (no permite cambiar roles)

Body de ejemplo:

```json
{
  "name": "Rafael",
  "lastName": "Lopez",
  "phoneNumber": "999888777",
  "birthdate": "1998-10-21",
  "email": "rafael.updated@example.com",
  "url_profile": "https://example.com/new.png",
  "adress": "Arequipa",
  "password": "Nuevo#1234"
}
```

#### `GET /api/users/:id`

- Acceso: solo `admin`
- Devuelve detalle de un usuario por id

### Errores comunes

- `400`: validaciones o email repetido
- `401`: token ausente/inválido o credenciales incorrectas
- `403`: rol insuficiente
- `404`: usuario no encontrado o ruta inexistente

## Vistas web y rutas

Rutas SSR disponibles:

- `/` redirige a `/signIn`
- `/signIn` inicio de sesión
- `/signUp` registro
- `/dashboard/user` dashboard de usuario (`user,admin`)
- `/dashboard/admin` dashboard de administración (`admin`)
- `/profile` perfil editable (`user,admin`)
- `/403` acceso denegado
- `/404` no encontrada

## Manejo de autenticación en frontend

La app web guarda JWT en `sessionStorage` y:

- Decodifica payload para extraer roles
- Redirige automáticamente tras login según rol
- Adjunta `Authorization: Bearer <token>` en cada fetch protegido
- Si recibe `401`, limpia sesión y vuelve a `/signIn`
- Si recibe `403`, redirige a `/403`

## Guía de pruebas rápidas

1. Inicia MongoDB local.
2. Ejecuta `npm install`.
3. Configura `.env`.
4. Ejecuta `npm run dev`.
5. Abre `http://localhost:3000/signIn`.
6. Prueba con admin semilla: `admin@example.com` / `Admin#1234`.
7. Verifica dashboard admin, perfil y listado de usuarios.

## Evidencias y capturas de pantalla

Se recomienda guardar las capturas en:

- `docs/screenshots/`

Checklist sugerido de evidencias para informe/demo:

1. Pantalla de login (`/signIn`)
2. Pantalla de registro (`/signUp`)
3. Login exitoso (redirección por rol)
4. Dashboard usuario (`/dashboard/user`)
5. Dashboard admin (`/dashboard/admin`)
6. Modal de detalle de usuario (admin)
7. Perfil editable (`/profile`)
8. Error 403
9. Error 404
10. Respuesta API en Postman/Insomnia (`signIn` con token)

Nombres sugeridos:

- `01-signin.png`
- `02-signup.png`
- `03-login-ok.png`
- `04-dashboard-user.png`
- `05-dashboard-admin.png`
- `06-admin-modal-user.png`
- `07-profile.png`
- `08-error-403.png`
- `09-error-404.png`
- `10-api-signin-token.png`

## Mejoras sugeridas

- Agregar refresh token y estrategia de revocación
- Implementar validación de input con esquema centralizado (Joi/Zod)
- Añadir pruebas unitarias/integración (Jest + Supertest)
- Añadir rate limit y headers de seguridad (Helmet)
- Migrar `sessionStorage` a cookies `httpOnly` si se requiere mayor hardening

---

Proyecto académico para practicar arquitectura por capas, autenticación JWT y autorización RBAC con Express + MongoDB.