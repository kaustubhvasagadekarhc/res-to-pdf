import prisma from '../src/config/database';

async function main() {
    const roles = ['user', 'admin'];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role },
            update: {},
            create: { name: role },
        });
    }

    console.log('Seeding completed: Roles created/verified.');

    // Create Default Admin
    const bcrypt = require('bcrypt'); // Use require for seed script usually, or import if ts-node handles it. 
    // Since this is TS, we can use import potentially or just assume bcrypt is available. 
    // But better to use conditional check or just create user.

    // Note: In typical seed file we might need to be careful with imports.
    // Let's use simple logic.

    const adminEmail = 'admin@resumebuilder.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('123456789', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'System Admin',
                userType: 'ADMIN',
                isVerified: true
            }
        });
        console.log('Default Admin user created: admin@resumebuilder.com / 123456789');
    } else {
        console.log('Admin user already exists.');
    }
}

main()
    .catch((e) => {
        console.error('Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

