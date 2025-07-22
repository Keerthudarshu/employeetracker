import 'dotenv/config';
import { db } from '../server/db';
import { admins, employees } from '../shared/schema';

async function setupDatabase() {
  try {
    console.log('Setting up initial data...');

    // Create admin user (if doesn't exist)
    try {
      const [admin] = await db.insert(admins).values({
        username: 'admin',
        passwordHash: 'admin123', // In production, this should be hashed
      }).returning();
      console.log('Admin created:', admin);
    } catch (error: any) {
      if (error?.cause?.code === '23505' || error?.code === '23505') {
        console.log('Admin user already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Create sample employee (if doesn't exist)
    try {
      const [employee] = await db.insert(employees).values({
        employeeId: 'EMP001',
        employeeName: 'John Doe',
        passwordHash: 'employee123' // In production, this should be hashed
      }).returning();
      console.log('Employee created:', employee);
    } catch (error: any) {
      if (error?.cause?.code === '23505' || error?.code === '23505') {
        console.log('Employee EMP001 already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
