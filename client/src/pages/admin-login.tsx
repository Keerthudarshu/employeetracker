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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
      
      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 bg-white/10 backdrop-blur-lg">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 admin-gradient rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/20">
              <Shield className="h-10 w-10 text-white drop-shadow-sm" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Admin Portal</h2>
            <p className="mt-2 text-sm text-white/80 font-medium">EduPrajna Reporting System</p>
            <p className="mt-4 text-xl font-semibold text-white">Secure Access</p>
            <p className="text-sm text-white/70">Administrator Dashboard Login</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-white">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter admin username"
                className="h-12 input-focus border-2 border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-blue-400 transition-all duration-200 backdrop-blur-sm"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="mt-1 text-sm text-red-400 font-medium">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  className="h-12 pr-12 input-focus border-2 border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-blue-400 transition-all duration-200 backdrop-blur-sm"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-white/10 rounded-r-lg transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-400 font-medium">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Access Admin Dashboard
                </div>
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
