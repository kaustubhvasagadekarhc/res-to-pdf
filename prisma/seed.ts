import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...\n');

    // Step 1: Create Roles
    const roles = ['user', 'admin'];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role },
            update: {},
            create: { name: role },
        });
    }

    console.log('✓ Roles created/verified.\n');

    // Step 2: Get role IDs for assignment
    const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

    // Step 3: Hash password once (all users will use "123456789")
    const defaultPassword = '123456789';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Step 4: Define default users to create
    const defaultUsers = [
        // Admin users
        {
            email: 'admin@resumebuilder.com',
            name: 'System Admin',
            password: hashedPassword,
            userType: 'ADMIN' as const,
            isVerified: true,
            jobTitle: 'System Administrator',
            roleId: adminRole?.id,
        },
        {
            email: 'admin2@resumebuilder.com',
            name: 'Secondary Admin',
            password: hashedPassword,
            userType: 'ADMIN' as const,
            isVerified: true,
            jobTitle: 'Administrator',
            roleId: adminRole?.id,
        },
        // Regular users
        {
            email: 'user1@example.com',
            name: 'John Doe',
            password: hashedPassword,
            userType: 'USER' as const,
            isVerified: true,
            jobTitle: 'Software Engineer',
            roleId: userRole?.id,
        },
        {
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword,
            userType: 'USER' as const,
            isVerified: true,
            jobTitle: 'QA Tester',
            roleId: userRole?.id,
        },
    ];

    // Step 5: Create users (skip if already exists)
    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of defaultUsers) {
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (!existingUser) {
            await prisma.user.create({
                data: userData,
            });
            console.log(`✓ Created user: ${userData.email} (${userData.userType})`);
            createdCount++;
        } else {
            console.log(`⊘ Skipped user: ${userData.email} (already exists)`);
            skippedCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Seeding Summary:');
    console.log(`  Roles: ${roles.length} created/verified`);
    console.log(`  Users created: ${createdCount}`);
    console.log(`  Users skipped: ${skippedCount}`);
    console.log(`  Total users: ${defaultUsers.length}`);
    console.log(`\n  Default password for all users: ${defaultPassword}`);
    console.log('='.repeat(50));
    console.log('\n✓ Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('\n✗ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });