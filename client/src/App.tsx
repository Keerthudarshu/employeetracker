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
  const { isAuthenticated, isEmployee, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Employee routes */}
      <Route path="/">
        {isAuthenticated && isEmployee ? <DailyReportForm /> : <EmployeeLogin />}
      </Route>
      <Route path="/daily-report">
        {isAuthenticated && isEmployee ? <DailyReportForm /> : <EmployeeLogin />}
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin">
        {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}
      </Route>
      <Route path="/admin/dashboard">
        {isAuthenticated && isAdmin ? <AdminDashboard /> : <AdminLogin />}
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
