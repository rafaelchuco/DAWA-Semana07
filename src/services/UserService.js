import userRepository from '../repositories/UserRepository.js';
import bcrypt from 'bcrypt';

function calculateAge(birthdate) {
    const birth = new Date(birthdate);
    const diff = Date.now() - birth.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function mapUser(user) {
    return {
        id: user._id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        birthdate: user.birthdate,
        age: calculateAge(user.birthdate),
        url_profile: user.url_profile,
        adress: user.adress,
        roles: user.roles.map(r => r.name),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

class UserService {

    async getAll() {
        const users = await userRepository.getAll();
        return users.map(mapUser);
    }

    async getById(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return mapUser(user);
    }

    async updateMe(id, payload) {
        const updates = { ...payload };

        if (updates.email) {
            const currentUser = await userRepository.findById(id);
            const emailInUse = await userRepository.findByEmail(updates.email);
            if (emailInUse && String(emailInUse._id) !== String(currentUser?._id)) {
                const err = new Error('El email ya se encuentra en uso');
                err.status = 400;
                throw err;
            }
        }

        if (updates.password) {
            const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[#\$%&*@]).{8,}$/;
            if (!passwordPattern.test(updates.password)) {
                const err = new Error('La contraseña no cumple con las reglas requeridas');
                err.status = 400;
                throw err;
            }

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
            updates.password = await bcrypt.hash(updates.password, saltRounds);
        }

        delete updates.roles;

        const user = await userRepository.updateById(id, updates);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }

        return mapUser(user);
    }

    async getAdminById(id) {
        const user = await userRepository.findByIdRaw(id);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return mapUser(user);
    }
}

export default new UserService();