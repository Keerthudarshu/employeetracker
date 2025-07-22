import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // In production/serverless, serve a simple HTML for the root route
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Employee Tracker</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .btn { display: inline-block; padding: 10px 20px; margin: 10px; background: #007cba; color: white; text-decoration: none; border-radius: 5px; }
            .btn:hover { background: #005a87; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏢 Employee Tracker System</h1>
            <p>Welcome to the Employee Daily Reporting System</p>
            <div>
              <a href="/admin-login" class="btn">👨‍💼 Admin Login</a>
              <a href="/employee-login" class="btn">👤 Employee Login</a>
            </div>
            <div style="margin-top: 30px;">
              <h3>🔑 Test Credentials:</h3>
              <p><strong>Admin:</strong> Username: admin, Password: admin123</p>
              <p><strong>Employee:</strong> ID: EMP001, Password: employee123</p>
            </div>
          </div>
        </body>
        </html>
      `);
    });
    
    // Serve other routes as API endpoints
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        res.status(404).json({ message: 'API endpoint not found' });
      } else {
        res.redirect('/');
      }
    });
  }

  // In serverless environments like Vercel, we don't need to start a server
  if (process.env.VERCEL) {
    // Just set up the routes for serverless
    return app;
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();

// Export the app for Vercel serverless functions
export default app;
