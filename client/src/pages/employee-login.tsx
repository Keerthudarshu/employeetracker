import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function EmployeeLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest('POST', '/api/employee/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      authManager.setSession({
        sessionToken: data.sessionToken,
        userType: 'employee',
        user: data.employee,
      });
      toast({
        title: "Login successful",
        description: "Welcome to EduPrajna reporting system!",
      });
      // Force a page reload to ensure authentication state is properly updated
      window.location.href = "/daily-report";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid employee ID or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      
      <Card className="w-full max-w-md card-gradient shadow-2xl border-0 relative z-10">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 gradient-bg rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Building className="h-10 w-10 text-white drop-shadow-sm" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">EduPrajna</h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">Employee Reporting System</p>
            <p className="mt-4 text-xl font-semibold text-foreground">Welcome Back</p>
            <p className="text-sm text-muted-foreground">Sign in to your employee account</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="employeeId" className="text-sm font-semibold text-foreground">
                Employee ID
              </Label>
              <Input
                id="employeeId"
                type="text"
                placeholder="Enter your employee ID"
                className="h-12 input-focus border-2 border-border focus:border-primary transition-all duration-200"
                {...form.register("employeeId")}
              />
              {form.formState.errors.employeeId && (
                <p className="mt-1 text-sm text-destructive font-medium">{form.formState.errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-12 pr-12 input-focus border-2 border-border focus:border-primary transition-all duration-200"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-muted rounded-r-lg transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-destructive font-medium">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 gradient-bg hover:shadow-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Sign In to Dashboard
                </div>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/admin")}
                className="text-sm text-slate-600 hover:text-primary transition-colors duration-200"
              >
                Admin Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
