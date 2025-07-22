import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";

export function useAuth() {
  const session = authManager.getSession();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/employee/me'],
    enabled: session?.userType === 'employee',
    retry: false,
  });

  const { data: admin } = useQuery({
    queryKey: ['/api/admin/me'],
    enabled: session?.userType === 'admin',
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const endpoint = session?.userType === 'admin' ? '/api/admin/logout' : '/api/employee/logout';
      const headers = authManager.getAuthHeaders();
      
      await apiRequest('POST', endpoint, undefined);
    },
    onSuccess: () => {
      authManager.clearSession();
      queryClient.clear();
      window.location.href = '/';
    },
  });

  return {
    isAuthenticated: authManager.isAuthenticated(),
    isEmployee: authManager.isEmployee(),
    isAdmin: authManager.isAdmin(),
    user: session?.userType === 'employee' ? user : admin,
    isLoading,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
