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
import { Shield, Eye, EyeOff, ArrowLeft } from "lucide-react";

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: AdminLoginForm) => {
      const response = await apiRequest('POST', '/api/admin/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      authManager.setSession({
        sessionToken: data.sessionToken,
        userType: 'admin',
        user: data.admin,
      });
      toast({
        title: "Login successful",
        description: "Welcome to Admin Dashboard!",
      });
      // Force a page reload to ensure authentication state is properly updated
      window.location.href = "/admin/dashboard";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminLoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Admin Portal</h2>
            <p className="mt-2 text-sm text-slate-600">EduPrajna Reporting System</p>
            <p className="mt-4 text-lg font-semibold text-slate-700">Administrator Login</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter admin username"
                className="h-12 focus:ring-slate-800 focus:border-slate-800"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  className="h-12 pr-10 focus:ring-slate-800 focus:border-slate-800"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-medium"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Sign In
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="text-sm text-slate-600 hover:text-primary transition-colors duration-200 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Employee Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
