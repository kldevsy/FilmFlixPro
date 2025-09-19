import { useAuth } from "@/hooks/useAuth";

export function useAdmin() {
  const { user } = useAuth();
  
  const isAdmin = (user as any)?.isAdmin ?? false;
  
  return {
    isAdmin,
    user
  };
}