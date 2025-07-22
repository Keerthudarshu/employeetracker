import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authManager } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Users, Plus, Edit, Trash2, LogOut, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().min(1, "Employee name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updateEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().min(1, "Employee name is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type CreateEmployeeForm = z.infer<typeof createEmployeeSchema>;
type UpdateEmployeeForm = z.infer<typeof updateEmployeeSchema>;

interface Employee {
  id: string;
  employeeId: string;
  employeeName: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeManagement() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const createForm = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      employeeId: "",
      employeeName: "",
      password: "",
    },
  });

  const editForm = useForm<UpdateEmployeeForm>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      employeeId: "",
      employeeName: "",
      password: "",
    },
  });

  // Fetch employees
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['/api/admin/employees'],
    queryFn: async () => {
      const response = await fetch('/api/admin/employees', {
        headers: authManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateEmployeeForm) => {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateEmployeeForm) => {
      const response = await fetch(`/api/admin/employees/${selectedEmployee?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
        headers: authManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: CreateEmployeeForm) => {
    createMutation.mutate(data);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    editForm.reset({
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      password: "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = (data: UpdateEmployeeForm) => {
    if (!data.password) {
      const { password, ...updateData } = data;
      updateMutation.mutate(updateData);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteMutation.mutate(selectedEmployee.id);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold text-gray-900">Employee Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Employees</CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Employee</DialogTitle>
                    <DialogDescription>
                      Add a new employee to the system with login credentials.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="EMP001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="employeeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John Doe" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Enter password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                          {createMutation.isPending ? "Creating..." : "Create Employee"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesData?.employees?.map((employee: Employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono">{employee.employeeId}</TableCell>
                      <TableCell>{employee.employeeName}</TableCell>
                      <TableCell>
                        {new Date(employee.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(employee.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(employee)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!employeesData?.employees || employeesData.employees.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No employees found. Create the first employee to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information. Leave password empty to keep current password.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EMP001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Leave empty to keep current" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Employee"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete employee "{selectedEmployee?.employeeName}" 
              ({selectedEmployee?.employeeId})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}