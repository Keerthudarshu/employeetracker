import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authManager } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportToCSV } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, LogOut, Filter, Download, FileSpreadsheet, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface ReportFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  page: number;
  limit: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ReportFilters>({
    page: 1,
    limit: 25,
  });

  useEffect(() => {
    if (!isAuthenticated || !authManager.isAdmin()) {
      setLocation("/admin");
    }
  }, [isAuthenticated, setLocation]);

  const { data: reportsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/reports', filters],
    queryFn: async () => {
      const headers = authManager.getAuthHeaders();
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      return response.json();
    },
    enabled: isAuthenticated && authManager.isAdmin(),
  });

  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'excel') => {
      const headers = authManager.getAuthHeaders();
      const params = new URLSearchParams();
      
      // Add current filters to export
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('format', format);

      const response = await fetch(`/api/admin/reports/export?${params}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `daily-reports-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        exportToCSV(data.reports, `daily-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Report has been downloaded",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDateRangeChange = (value: string) => {
    const today = new Date();
    let startDate = '';
    let endDate = '';

    switch (value) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
    }

    setFilters(prev => ({ ...prev, dateRange: value, startDate, endDate, page: 1 }));
  };

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Admin Dashboard</h1>
                <p className="text-sm text-slate-600">EduPrajna Reporting System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">Administrator</p>
                <p className="text-xs text-slate-500">{user.username}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-slate-600 hover:text-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <Card className="shadow-sm mb-6">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Report Filters & Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="date-range" className="block text-sm font-medium text-slate-700 mb-2">
                  Date Range
                </Label>
                <Select onValueChange={handleDateRangeChange} value={filters.dateRange || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee-filter" className="block text-sm font-medium text-slate-700 mb-2">
                  Employee ID
                </Label>
                <Input
                  id="employee-filter"
                  placeholder="Filter by Employee ID"
                  value={filters.employeeId || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, employeeId: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={applyFilters} className="bg-primary hover:bg-blue-700">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button
                onClick={() => exportMutation.mutate('csv')}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => exportMutation.mutate('excel')}
                variant="outline"
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                disabled={exportMutation.isPending}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Daily Reports
              </CardTitle>
              <span className="text-sm text-slate-600">
                Showing {reportsData?.reports?.length || 0} reports
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-slate-600">Loading reports...</p>
              </div>
            ) : !reportsData?.reports?.length ? (
              <div className="p-8 text-center">
                <p className="text-slate-600">No reports found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Employee</TableHead>
                      <TableHead className="font-medium">Dials</TableHead>
                      <TableHead className="font-medium">Connected</TableHead>
                      <TableHead className="font-medium">Prospects</TableHead>
                      <TableHead className="font-medium">Demos</TableHead>
                      <TableHead className="font-medium">Admissions</TableHead>
                      <TableHead className="font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportsData.reports.map((report: any) => (
                      <TableRow key={report.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{report.submissionDate}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">{report.employeeName}</div>
                            <div className="text-sm text-slate-500">{report.employeeId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{report.numberOfDials}</TableCell>
                        <TableCell>{report.connectedCalls}</TableCell>
                        <TableCell>{report.positiveProspect}</TableCell>
                        <TableCell>{report.demos}</TableCell>
                        <TableCell>{report.admission}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary hover:text-blue-700"
                            onClick={() => {
                              toast({
                                title: "Report Details",
                                description: `Viewing detailed report for ${report.employeeName}`,
                              });
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {reportsData?.reports?.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-700">
                  Showing page {filters.page} of results
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={filters.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!reportsData?.reports?.length || reportsData.reports.length < filters.limit}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
