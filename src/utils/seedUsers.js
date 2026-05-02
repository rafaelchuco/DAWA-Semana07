import bcrypt from 'bcrypt';
import userRepository from '../repositories/UserRepository.js';
import roleRepository from '../repositories/RoleRepository.js';

export default async function seedUsers() {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await userRepository.findByEmail(adminEmail);

    if (existingAdmin) {
        return;
    }

    const adminRole = await roleRepository.findByName('admin');
    const userRole = await roleRepository.findByName('user');
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
    const password = await bcrypt.hash('Admin#1234', saltRounds);

    await userRepository.create({
        email: adminEmail,
        password,
        name: 'Admin',
        lastName: 'Sistema',
        phoneNumber: '3000000000',
        birthdate: new Date('1990-01-01'),
        url_profile: '',
        adress: 'N/A',
        roles: [userRole?._id, adminRole?._id].filter(Boolean)
    });

    console.log('Seeded admin user: admin@example.com / Admin#1234');
}