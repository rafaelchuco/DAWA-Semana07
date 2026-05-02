# DAWA-Semana07

API REST con Express, MongoDB, JWT y bcrypt para autenticación y control de usuarios por roles.

Además incluye una interfaz web con EJS y Materialize para iniciar sesión, registrarse, ver el perfil y navegar por dashboards por rol.

## Requisitos

- Node.js 18 o superior
- MongoDB local en ejecución

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con este contenido:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auth_db
JWT_SECRET=f14e6a1c9843c52190c07232dfb9c0e467d5a910
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=10
```

También puedes usar `.env.example` como referencia.

## Modelo de usuario

El modelo `User` incluye estos campos:

- `name`
- `lastName`
- `phoneNumber`
- `birthdate`
- `email`
- `password`
- `url_profile`
- `adress`
- `roles`

La contraseña debe tener al menos 8 caracteres, una mayúscula, un dígito y un carácter especial entre `# $ % & * @`.

## Scripts

```bash
npm run dev
npm start
```

- `npm run dev`: arranca con nodemon
- `npm start`: arranca en modo producción con Node

## Estructura del proyecto

```text
src/
├── controllers/
├── middlewares/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
└── server.js
```

## Roles iniciales

Al iniciar el servidor, se ejecuta un seed automático que crea estos roles si no existen:

- `user`
- `admin`

También se crea un usuario administrador inicial:

- Email: `admin@example.com`
- Password: `Admin#1234`

## Endpoints

### Health check

- `GET /health`

### Autenticación

- `POST /api/auth/signUp`
- `POST /api/auth/signIn`

#### POST /api/auth/signUp

Body JSON:

```json
{
  "email": "user@example.com",
  "password": "123456",
  "name": "Usuario Demo",
  "roles": ["user"]
}
```

#### POST /api/auth/signIn

Body JSON:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Respuesta esperada:

```json
{
  "token": "..."
}
```

### Usuarios

- `GET /api/users` -> requiere rol `admin`
- `GET /api/users/me` -> requiere autenticación
- `PUT /api/users/me` -> actualiza el perfil autenticado
- `GET /api/users/:id` -> detalle de usuario para administradores

#### Headers para rutas protegidas

```http
Authorization: Bearer <token>
```

## Notas

- La base de datos usada por defecto es `auth_db`.
- Los tokens JWT expiran según `JWT_EXPIRES_IN`.
- La contraseña se hashea con bcrypt antes de guardarse.

## Vistas web

- `/signIn`: formulario de acceso
- `/signUp`: formulario de registro
- `/dashboard/user`: panel del usuario
- `/dashboard/admin`: panel de administración
- `/profile`: perfil editable
- `/403`: acceso denegado
- `/404`: página no encontrada

La navegación usa `sessionStorage` para guardar el JWT y redirigir según el rol del usuario.

## Agente personalizado

El workspace incluye un agente especializado en seguridad backend en [.github/agents/backend-security-architect.agent.md](.github/agents/backend-security-architect.agent.md). Úsalo para tareas de diseño, implementación y revisión de APIs seguras con Express, MongoDB, JWT, bcrypt y control de acceso por roles.

## Flujo recomendado

1. Inicia MongoDB local.
2. Ejecuta `npm install`.
3. Crea o ajusta el archivo `.env`.
4. Levanta la app con `npm run dev`.
5. Accede a `/signIn` y usa el usuario semilla `admin@example.com` con contraseña `Admin#1234` para probar el dashboard de administrador.