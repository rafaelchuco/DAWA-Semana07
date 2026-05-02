import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/UserRepository.js';
import roleRepository from '../repositories/RoleRepository.js';

function validatePassword(password) {
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[#\$%&*@]).{8,}$/;
    return passwordPattern.test(password);
}

class AuthService {

    async signUp({ email, password, name, lastName, phoneNumber, birthdate, url_profile = '', adress = '', roles = ['user'] }) {
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            const err = new Error('El email ya se encuentra en uso');
            err.status = 400;
            throw err;
        }

        if (!validatePassword(password)) {
            const err = new Error('La contraseña no cumple con las reglas requeridas');
            err.status = 400;
            throw err;
        }

        //lógica par encriptar el password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
        const hashed = await bcrypt.hash(password, saltRounds);

        // Asignar los role ids
        const roleDocs = [];
        for (const r of roles) {
            let roleDoc = await roleRepository.findByName(r);
            if (!roleDoc) roleDoc = await roleRepository.create({ name: r });
            roleDocs.push(roleDoc._id);
        }

        const user = await userRepository.create({ email, password: hashed, name, lastName, phoneNumber, birthdate, url_profile, adress, roles: roleDocs });

        return {
                id: user._id,
                email: user.email,
            name: user.name,
            lastName: user.lastName
            };
    }

    async signIn({ email, password }) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            const err = new Error('Credenciales inválidas');
            err.status = 401;
            throw err;
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            const err = new Error('Credenciales inválidas');
            err.status = 401;
            throw err;
        }

        const token = jwt.sign({ 
            sub: user._id, 
            roles: user.roles.map(r => r.name) }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || '1h' 
            }
        );
        // console.log("Verify:", jwt.verify(token, process.env.JWT_SECRET));

        return { token };
    }
}

export default new AuthService();