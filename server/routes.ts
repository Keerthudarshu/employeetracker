import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  employeeLoginSchema, 
  adminLoginSchema, 
  insertDailyReportSchema 
} from "@shared/schema";
import { z } from "zod";

// Extend Request type to include session
interface AuthenticatedRequest extends Request {
  session?: {
    sessionId: string;
    userId: string;
    userType: 'employee' | 'admin';
  };
}

// Authentication middleware
async function authenticateEmployee(req: AuthenticatedRequest, res: Response, next: Function) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ message: "No session token provided" });
  }

  try {
    const session = await storage.getSession(sessionId);
    if (!session || session.userType !== 'employee') {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    req.session = {
      sessionId: session.id,
      userId: session.userId,
      userType: session.userType
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
}

async function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ message: "No session token provided" });
  }

  try {
    const session = await storage.getSession(sessionId);
    if (!session || session.userType !== 'admin') {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    req.session = {
      sessionId: session.id,
      userId: session.userId,
      userType: session.userType
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee authentication routes
  app.post("/api/employee/login", async (req, res) => {
    try {
      const { employeeId, password } = employeeLoginSchema.parse(req.body);
      
      const employee = await storage.validateEmployeeCredentials(employeeId, password);
      if (!employee) {
        return res.status(401).json({ message: "Invalid employee ID or password" });
      }

      const session = await storage.createSession(employee.id, 'employee');

      res.json({
        message: "Login successful",
        sessionToken: session.id,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          employeeName: employee.employeeName
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Employee login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/employee/logout", authenticateEmployee, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.session?.sessionId) {
        await storage.deleteSession(req.session.sessionId);
      }
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Employee logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current employee info
  app.get("/api/employee/me", authenticateEmployee, async (req: AuthenticatedRequest, res) => {
    try {
      const employee = await storage.getEmployee(req.session!.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({
        id: employee.id,
        employeeId: employee.employeeId,
        employeeName: employee.employeeName
      });
    } catch (error) {
      console.error("Get employee info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Daily report submission
  app.post("/api/reports/submit", authenticateEmployee, async (req: AuthenticatedRequest, res) => {
    try {
      const employee = await storage.getEmployee(req.session!.userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const reportData = insertDailyReportSchema.parse(req.body);
      const today = new Date().toISOString().split('T')[0];

      // Check if report already exists for today
      const existingReport = await storage.checkExistingReport(employee.employeeId, new Date(today));
      if (existingReport) {
        return res.status(409).json({ message: "Report for today already submitted" });
      }

      const report = await storage.createDailyReport({
        ...reportData,
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        submissionDate: today
      });

      res.json({
        message: "Report submitted successfully",
        report
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Report submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      
      const admin = await storage.validateAdminCredentials(username, password);
      if (!admin) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const session = await storage.createSession(admin.id, 'admin');

      res.json({
        message: "Login successful",
        sessionToken: session.id,
        admin: {
          id: admin.id,
          username: admin.username
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/logout", authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.session?.sessionId) {
        await storage.deleteSession(req.session.sessionId);
      }
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current admin info
  app.get("/api/admin/me", authenticateAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const admin = await storage.getAdmin(req.session!.userId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({
        id: admin.id,
        username: admin.username
      });
    } catch (error) {
      console.error("Get admin info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin dashboard - get reports with filters
  app.get("/api/admin/reports", authenticateAdmin, async (req, res) => {
    try {
      const { employeeId, startDate, endDate, page = '1', limit = '25' } = req.query;

      const filters: any = {
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string)
      };

      if (employeeId) filters.employeeId = employeeId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const reports = await storage.getDailyReports(filters);

      res.json({
        reports,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Export reports as CSV
  app.get("/api/admin/reports/export", authenticateAdmin, async (req, res) => {
    try {
      const { employeeId, startDate, endDate, format = 'csv' } = req.query;

      const filters: any = {};
      if (employeeId) filters.employeeId = employeeId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const reports = await storage.getDailyReports(filters);

      if (format === 'csv') {
        const csvHeader = 'Date,Employee ID,Employee Name,Dials,Connected Calls,Positive Prospect,Dead Calls,Demos,Admission,Client Visit,Client Closing,Backdoor Calls,Posters Done\n';
        const csvData = reports.map(report => 
          `${report.submissionDate},${report.employeeId},${report.employeeName},${report.numberOfDials},${report.connectedCalls},${report.positiveProspect},${report.deadCalls},${report.demos},${report.admission},${report.clientVisit},${report.clientClosing},${report.backdoorCalls},${report.postersDone || 0}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="daily-reports-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeader + csvData);
      } else {
        res.json({ reports });
      }
    } catch (error) {
      console.error("Export reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clean up expired sessions periodically
  setInterval(async () => {
    try {
      await storage.cleanExpiredSessions();
    } catch (error) {
      console.error("Session cleanup error:", error);
    }
  }, 60 * 60 * 1000); // Run every hour

  const httpServer = createServer(app);
  return httpServer;
}
