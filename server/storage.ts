import { 
  employees, 
  dailyReports, 
  admins, 
  sessions,
  type Employee, 
  type InsertEmployee,
  type DailyReport,
  type InsertDailyReport,
  type Admin,
  type InsertAdmin,
  type Session
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  validateEmployeeCredentials(employeeId: string, password: string): Promise<Employee | null>;

  // Daily report operations
  createDailyReport(report: InsertDailyReport): Promise<DailyReport>;
  getDailyReports(filters?: {
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<DailyReport[]>;
  getDailyReportsByDateRange(startDate: Date, endDate: Date): Promise<DailyReport[]>;
  checkExistingReport(employeeId: string, date: Date): Promise<DailyReport | undefined>;
  updateDailyReport(id: string, report: Partial<InsertDailyReport>): Promise<DailyReport | undefined>;
  deleteDailyReport(id: string): Promise<boolean>;

  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  validateAdminCredentials(username: string, password: string): Promise<Admin | null>;

  // Session operations
  createSession(userId: string, userType: 'employee' | 'admin'): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return employee;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(asc(employees.employeeName));
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const passwordHash = await bcrypt.hash(insertEmployee.passwordHash, 10);
    const [employee] = await db
      .insert(employees)
      .values({ ...insertEmployee, passwordHash })
      .returning();
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const updateData: any = { ...updates };
    if (updateData.passwordHash) {
      updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 10);
    }
    updateData.updatedAt = new Date();

    const [employee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async validateEmployeeCredentials(employeeId: string, password: string): Promise<Employee | null> {
    const employee = await this.getEmployeeByEmployeeId(employeeId);
    if (!employee) return null;

    const isValid = await bcrypt.compare(password, employee.passwordHash);
    return isValid ? employee : null;
  }

  async createDailyReport(insertReport: InsertDailyReport): Promise<DailyReport> {
    const [report] = await db
      .insert(dailyReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getDailyReports(filters?: {
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<DailyReport[]> {
    const conditions = [];
    if (filters?.employeeId) {
      conditions.push(eq(dailyReports.employeeId, filters.employeeId));
    }
    if (filters?.startDate) {
      conditions.push(gte(dailyReports.submissionDate, filters.startDate.toISOString().split('T')[0]));
    }
    if (filters?.endDate) {
      conditions.push(lte(dailyReports.submissionDate, filters.endDate.toISOString().split('T')[0]));
    }

    let query = db.select().from(dailyReports);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    query = query.orderBy(desc(dailyReports.submissionDate), desc(dailyReports.createdAt)) as typeof query;

    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }

    return await query;
  }

  async getDailyReportsByDateRange(startDate: Date, endDate: Date): Promise<DailyReport[]> {
    return await db.select().from(dailyReports)
      .where(and(
        gte(dailyReports.submissionDate, startDate.toISOString().split('T')[0]),
        lte(dailyReports.submissionDate, endDate.toISOString().split('T')[0])
      ))
      .orderBy(desc(dailyReports.submissionDate));
  }

  async checkExistingReport(employeeId: string, date: Date): Promise<DailyReport | undefined> {
    const [report] = await db.select().from(dailyReports)
      .where(and(
        eq(dailyReports.employeeId, employeeId),
        eq(dailyReports.submissionDate, date.toISOString().split('T')[0])
      ));
    return report;
  }

  async updateDailyReport(id: string, report: Partial<InsertDailyReport>): Promise<DailyReport | undefined> {
    const [updatedReport] = await db
      .update(dailyReports)
      .set(report)
      .where(eq(dailyReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteDailyReport(id: string): Promise<boolean> {
    const result = await db
      .delete(dailyReports)
      .where(eq(dailyReports.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const passwordHash = await bcrypt.hash(insertAdmin.passwordHash, 10);
    const [admin] = await db
      .insert(admins)
      .values({ ...insertAdmin, passwordHash })
      .returning();
    return admin;
  }

  async validateAdminCredentials(username: string, password: string): Promise<Admin | null> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return null;

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    return isValid ? admin : null;
  }

  async createSession(userId: string, userType: 'employee' | 'admin'): Promise<Session> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [session] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId,
        userType,
        expiresAt,
      })
      .returning();
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        gte(sessions.expiresAt, new Date())
      ));
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async cleanExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lte(sessions.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
