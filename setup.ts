import 'dotenv/config';
import { storage } from './server/storage.js';

async function setupInitialData() {
  try {
    console.log('Setting up initial data...');
    
    // Create default admin
    const adminData = {
      username: 'admin',
      passwordHash: 'admin123' // This will be hashed by the storage.createAdmin method
    };
    
    try {
      const admin = await storage.createAdmin(adminData);
      console.log('✅ Admin created:', admin.username);
    } catch (error) {
      console.log('ℹ️ Admin might already exist');
    }
    
    // Create test employee
    const employeeData = {
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      passwordHash: 'employee123' // This will be hashed by the storage.createEmployee method
    };
    
    try {
      const employee = await storage.createEmployee(employeeData);
      console.log('✅ Employee created:', employee.employeeName, '(ID:', employee.employeeId + ')');
    } catch (error) {
      console.log('ℹ️ Employee might already exist');
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('\n📋 CREDENTIALS:');
    console.log('=================');
    console.log('🔐 Admin Login:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 Employee Login:');
    console.log('   Employee ID: EMP001');
    console.log('   Password: employee123');
    console.log('   Name: John Doe');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupInitialData().then(() => process.exit(0)).catch(console.error);
