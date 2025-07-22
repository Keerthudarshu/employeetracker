import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";

export function useAuth() {
  const session = authManager.getSession();
  
  const { data: employeeUser, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['/api/employee/me'],
    enabled: session?.userType === 'employee',
    retry: false,
  });

  const { data: adminUser, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['/api/admin/me'],
    enabled: session?.userType === 'admin',
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const endpoint = session?.userType === 'admin' ? '/api/admin/logout' : '/api/employee/logout';
      const headers = authManager.getAuthHeaders();
      
      await apiRequest('POST', endpoint, undefined, headers);
    },
    onSuccess: () => {
      authManager.clearSession();
      queryClient.clear();
      window.location.href = '/';
    },
  });

  const currentUser = session?.userType === 'employee' ? employeeUser : adminUser;
  const isLoading = session?.userType === 'employee' ? isLoadingEmployee : isLoadingAdmin;

  return {
    isAuthenticated: authManager.isAuthenticated(),
    isEmployee: authManager.isEmployee(),
    isAdmin: authManager.isAdmin(),
    user: currentUser || session?.user,
    isLoading,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
