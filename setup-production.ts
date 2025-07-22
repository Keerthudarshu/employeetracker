import { storage } from './server/storage.js';

async function setupProductionData() {
  try {
    console.log('🚀 Setting up production data...');
    
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
    
    console.log('🎉 Production setup complete!');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProductionData().then(() => process.exit(0)).catch(console.error);
}

export { setupProductionData };
