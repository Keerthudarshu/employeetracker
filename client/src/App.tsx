import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { authManager } from "@/lib/auth";

// Pages
import EmployeeLogin from "@/pages/employee-login";
import DailyReportForm from "@/pages/daily-report-form";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Employee routes */}
      <Route path="/" component={EmployeeLogin} />
      <Route path="/daily-report">
        {isAuthenticated && authManager.isEmployee() ? (
          <DailyReportForm />
        ) : (
          <EmployeeLogin />
        )}
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard">
        {isAuthenticated && authManager.isAdmin() ? (
          <AdminDashboard />
        ) : (
          <AdminLogin />
        )}
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
