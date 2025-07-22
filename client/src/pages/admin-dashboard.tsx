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
import { Shield, LogOut, Filter, Download, FileSpreadsheet, Eye, ChevronLeft, ChevronRight, Trash2, Edit3, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

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

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chartsDialogOpen, setChartsDialogOpen] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const headers = authManager.getAuthHeaders();
      await apiRequest('DELETE', `/api/admin/reports/${reportId}`, undefined, headers);
    },
    onSuccess: () => {
      toast({
        title: "Report deleted",
        description: "Report has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete report.",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string; data: any }) => {
      const headers = authManager.getAuthHeaders();
      await apiRequest('PUT', `/api/admin/reports/${reportId}`, data, headers);
    },
    onSuccess: () => {
      toast({
        title: "Report updated",
        description: "Report has been updated successfully.",
      });
      setEditDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update report.",
        variant: "destructive",
      });
    },
  });

  // Chart data preparation functions
  const generateChartData = () => {
    if (!reportsData?.reports?.length) return null;

    const reports = reportsData.reports;
    const labels = reports.map((r: any) => r.submissionDate);
    
    return {
      dailyMetrics: {
        labels,
        datasets: [
          {
            label: 'Number of Dials',
            data: reports.map((r: any) => r.numberOfDials),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
          },
          {
            label: 'Connected Calls',
            data: reports.map((r: any) => r.connectedCalls),
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
          },
          {
            label: 'Demos',
            data: reports.map((r: any) => r.demos),
            backgroundColor: 'rgba(245, 158, 11, 0.5)',
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 2,
          },
          {
            label: 'Admissions',
            data: reports.map((r: any) => r.admission),
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2,
          },
        ],
      },
      performancePie: {
        labels: ['Positive Prospects', 'Dead Calls', 'Demos', 'Admissions'],
        datasets: [
          {
            data: [
              reports.reduce((sum: number, r: any) => sum + r.positiveProspect, 0),
              reports.reduce((sum: number, r: any) => sum + r.deadCalls, 0),
              reports.reduce((sum: number, r: any) => sum + r.demos, 0),
              reports.reduce((sum: number, r: any) => sum + r.admission, 0),
            ],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(139, 92, 246, 1)',
            ],
            borderWidth: 2,
          },
        ],
      },
    };
  };

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
      
      <div className="relative z-10">
        {/* Enhanced Header */}
        <div className="bg-white/10 backdrop-blur-lg shadow-2xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-14 w-14 admin-gradient rounded-xl flex items-center justify-center mr-4 shadow-xl border border-white/20">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
                  <p className="text-sm text-white/80 font-medium">EduPrajna Reporting System</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">Administrator</p>
                  <p className="text-xs text-white/70 font-medium">{user?.username || 'Admin'}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="flex items-center border-2 border-white/20 text-white hover:bg-red-500 hover:border-red-500 transition-all duration-200 transform hover:scale-105"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <Card className="bg-white/10 backdrop-blur-lg shadow-2xl border-0 mb-6">
            <CardHeader className="border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Report Filters & Export
              </CardTitle>
            </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="date-range" className="block text-sm font-medium text-white mb-2">
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
              <Button
                onClick={() => setChartsDialogOpen(true)}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Charts
              </Button>
            </div>
          </CardContent>
        </Card>

          {/* Reports Table */}
          <Card className="bg-white/10 backdrop-blur-lg shadow-2xl border-0">
            <CardHeader className="border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Daily Reports
                </CardTitle>
                <span className="text-sm text-white/70">
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
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                setSelectedReport(report);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-yellow-600 hover:text-yellow-700"
                              onClick={() => {
                                setSelectedReport(report);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedReport(report);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* View Report Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Detailed view of daily report for {selectedReport?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <div><strong>Employee:</strong> {selectedReport.employeeName}</div>
                <div><strong>Employee ID:</strong> {selectedReport.employeeId}</div>
                <div><strong>Date:</strong> {selectedReport.submissionDate}</div>
                <div><strong>Number of Dials:</strong> {selectedReport.numberOfDials}</div>
                <div><strong>Connected Calls:</strong> {selectedReport.connectedCalls}</div>
                <div><strong>Positive Prospects:</strong> {selectedReport.positiveProspect}</div>
              </div>
              <div className="space-y-2">
                <div><strong>Dead Calls:</strong> {selectedReport.deadCalls}</div>
                <div><strong>Demos:</strong> {selectedReport.demos}</div>
                <div><strong>Admissions:</strong> {selectedReport.admission}</div>
                <div><strong>Client Visits:</strong> {selectedReport.clientVisit}</div>
                <div><strong>Client Closings:</strong> {selectedReport.clientClosing}</div>
                <div><strong>Backdoor Calls:</strong> {selectedReport.backdoorCalls}</div>
                <div><strong>Posters Done:</strong> {selectedReport.postersDone || 0}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Report Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Modify report data for {selectedReport?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label>Number of Dials</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.numberOfDials}
                    onChange={(e) => setSelectedReport({...selectedReport, numberOfDials: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Connected Calls</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.connectedCalls}
                    onChange={(e) => setSelectedReport({...selectedReport, connectedCalls: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Positive Prospects</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.positiveProspect}
                    onChange={(e) => setSelectedReport({...selectedReport, positiveProspect: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Dead Calls</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.deadCalls}
                    onChange={(e) => setSelectedReport({...selectedReport, deadCalls: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Demos</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.demos}
                    onChange={(e) => setSelectedReport({...selectedReport, demos: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Admissions</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.admission}
                    onChange={(e) => setSelectedReport({...selectedReport, admission: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Client Visits</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.clientVisit}
                    onChange={(e) => setSelectedReport({...selectedReport, clientVisit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Client Closings</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.clientClosing}
                    onChange={(e) => setSelectedReport({...selectedReport, clientClosing: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-4">
                <div>
                  <Label>Backdoor Calls</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.backdoorCalls}
                    onChange={(e) => setSelectedReport({...selectedReport, backdoorCalls: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Posters Done</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedReport.postersDone || 0}
                    onChange={(e) => setSelectedReport({...selectedReport, postersDone: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => editMutation.mutate({ reportId: selectedReport.id, data: selectedReport })}
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report for{' '}
              {selectedReport?.employeeName} on {selectedReport?.submissionDate}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReport && deleteMutation.mutate(selectedReport.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Charts Modal */}
      <Dialog open={chartsDialogOpen} onOpenChange={setChartsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Analytics & Charts
            </DialogTitle>
            <DialogDescription>
              Visual representation of employee performance data
            </DialogDescription>
          </DialogHeader>
          
          {generateChartData() && (
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Daily Metrics
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Performance Overview
                </TabsTrigger>
                <TabsTrigger value="trends" className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trends
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <Bar 
                        data={generateChartData()!.dailyMetrics}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            title: {
                              display: true,
                              text: 'Daily Performance Comparison'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Performance Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <Pie 
                        data={generateChartData()!.performancePie}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right' as const,
                            },
                            title: {
                              display: true,
                              text: 'Performance Breakdown'
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <Line 
                        data={generateChartData()!.dailyMetrics}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            title: {
                              display: true,
                              text: 'Performance Trends Over Time'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
