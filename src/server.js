import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import seedRoles from './utils/seedRoles.js';
import seedUsers from './utils/seedUsers.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (_req, res) => res.redirect('/signIn'));

app.get('/signIn', (_req, res) => {
    res.render('auth/signIn', { title: 'Iniciar sesión' });
});

app.get('/signUp', (_req, res) => {
    res.render('auth/signUp', { title: 'Registro' });
});

app.get('/dashboard/user', (_req, res) => {
    res.render('dashboard/user', { title: 'Dashboard de usuario' });
});

app.get('/dashboard/admin', (_req, res) => {
    res.render('dashboard/admin', { title: 'Dashboard de administrador' });
});

app.get('/profile', (_req, res) => {
    res.render('profile', { title: 'Mi cuenta' });
});

app.get('/403', (_req, res) => {
    res.status(403).render('errors/403', { title: 'Acceso denegado' });
});

app.get('/health', (req, res) => res.status(200).json({ ok: true }));

app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'Ruta API no encontrada' });
});

app.use((_req, res) => {
    res.status(404).render('errors/404', { title: 'No encontrada' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
    .then(async () => {
        console.log('Mongo connected');
        await seedRoles();
        await seedUsers();
        app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
    })
    .catch(err => {
        console.error('Error al conectar con Mongo:', err);
        process.exit(1);
    });
