import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, LogOut, Send } from "lucide-react";

import { dailyReportFormSchema, type DailyReportForm } from "@shared/schema";

type ReportForm = DailyReportForm;

export default function DailyReportForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, logout, isAuthenticated } = useAuth();

  const form = useForm<ReportForm>({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues: {
      numberOfDials: 0,
      connectedCalls: 0,
      positiveProspect: 0,
      deadCalls: 0,
      demos: 0,
      admission: 0,
      clientVisit: 0,
      clientClosing: 0,
      backdoorCalls: 0,
      postersDone: 0,
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !authManager.isEmployee()) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const submitMutation = useMutation({
    mutationFn: async (data: ReportForm) => {
      const headers = authManager.getAuthHeaders();
      const response = await apiRequest('POST', '/api/reports/submit', data, headers);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted Successfully!",
        description: "Thank you, have a nice day!",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportForm) => {
    submitMutation.mutate(data);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (!user) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-500"></div>
      
      <div className="relative z-10">
        {/* Enhanced Header */}
        <div className="card-gradient shadow-xl border-0 mb-6">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-14 w-14 gradient-bg rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Building className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">EduPrajna</h1>
                  <p className="text-sm text-muted-foreground font-medium">Employee Reporting Portal</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{user.employeeName}</p>
                  <p className="text-xs text-muted-foreground font-medium">{user.employeeId}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center border-2 hover:bg-destructive hover:text-white transition-all duration-200 transform hover:scale-105"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Card className="card-gradient shadow-xl border-0">
            <CardHeader className="border-b border-border/20 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Daily Report Submission
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">{today}</p>
            </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Employee Info (Auto-filled) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">Employee Name</Label>
                  <Input
                    value={user.employeeName}
                    readOnly
                    className="bg-white border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1">Employee ID</Label>
                  <Input
                    value={user.employeeId}
                    readOnly
                    className="bg-white border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Report Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="numberOfDials" className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Dials <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="numberOfDials"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("numberOfDials", { valueAsNumber: true })}
                  />
                  {form.formState.errors.numberOfDials && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.numberOfDials.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="connectedCalls" className="block text-sm font-medium text-slate-700 mb-2">
                    Connected Calls <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="connectedCalls"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("connectedCalls", { valueAsNumber: true })}
                  />
                  {form.formState.errors.connectedCalls && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.connectedCalls.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="positiveProspect" className="block text-sm font-medium text-slate-700 mb-2">
                    Positive Prospect <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="positiveProspect"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("positiveProspect", { valueAsNumber: true })}
                  />
                  {form.formState.errors.positiveProspect && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.positiveProspect.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="deadCalls" className="block text-sm font-medium text-slate-700 mb-2">
                    Dead Calls <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="deadCalls"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("deadCalls", { valueAsNumber: true })}
                  />
                  {form.formState.errors.deadCalls && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.deadCalls.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="demos" className="block text-sm font-medium text-slate-700 mb-2">
                    Demos <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="demos"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("demos", { valueAsNumber: true })}
                  />
                  {form.formState.errors.demos && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.demos.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="admission" className="block text-sm font-medium text-slate-700 mb-2">
                    Admission <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="admission"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("admission", { valueAsNumber: true })}
                  />
                  {form.formState.errors.admission && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.admission.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientVisit" className="block text-sm font-medium text-slate-700 mb-2">
                    Client Visit <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="clientVisit"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("clientVisit", { valueAsNumber: true })}
                  />
                  {form.formState.errors.clientVisit && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.clientVisit.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientClosing" className="block text-sm font-medium text-slate-700 mb-2">
                    Client Closing <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="clientClosing"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("clientClosing", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-slate-500 mt-1">Software/Digital Marketing</p>
                  {form.formState.errors.clientClosing && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.clientClosing.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="backdoorCalls" className="block text-sm font-medium text-slate-700 mb-2">
                    Backdoor Calls <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="backdoorCalls"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("backdoorCalls", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-slate-500 mt-1">Numbers & textbook follow-ups</p>
                  {form.formState.errors.backdoorCalls && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.backdoorCalls.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postersDone" className="block text-sm font-medium text-slate-700 mb-2">
                    Posters Done <span className="text-slate-400">(Optional)</span>
                  </Label>
                  <Input
                    id="postersDone"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register("postersDone", { valueAsNumber: true })}
                  />
                  {form.formState.errors.postersDone && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.postersDone.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-200">
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-blue-700 text-white font-medium"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Daily Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
