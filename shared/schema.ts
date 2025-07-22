import { pgTable, text, serial, integer, date, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: varchar("employee_id").notNull().unique(),
  employeeName: varchar("employee_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyReports = pgTable("daily_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: varchar("employee_id").notNull(),
  employeeName: varchar("employee_name").notNull(),
  numberOfDials: integer("number_of_dials").notNull(),
  connectedCalls: integer("connected_calls").notNull(),
  positiveProspect: integer("positive_prospect").notNull(),
  deadCalls: integer("dead_calls").notNull(),
  demos: integer("demos").notNull(),
  admission: integer("admission").notNull(),
  clientVisit: integer("client_visit").notNull(),
  clientClosing: integer("client_closing").notNull(),
  backdoorCalls: integer("backdoor_calls").notNull(),
  postersDone: integer("posters_done").default(0),
  submissionDate: date("submission_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  userType: varchar("user_type").notNull(), // 'employee' or 'admin'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({
  id: true,
  createdAt: true,
}).extend({
  numberOfDials: z.number().min(0),
  connectedCalls: z.number().min(0),
  positiveProspect: z.number().min(0),
  deadCalls: z.number().min(0),
  demos: z.number().min(0),
  admission: z.number().min(0),
  clientVisit: z.number().min(0),
  clientClosing: z.number().min(0),
  backdoorCalls: z.number().min(0),
  postersDone: z.number().min(0).optional(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const employeeLoginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Session = typeof sessions.$inferSelect;
export type EmployeeLogin = z.infer<typeof employeeLoginSchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
