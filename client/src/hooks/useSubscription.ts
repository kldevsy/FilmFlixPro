import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { UserSubscription, SubscriptionPlan } from "@shared/schema";

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();

  // Get user's active subscription
  const { 
    data: subscription, 
    isLoading: isLoadingSubscription, 
    error: subscriptionError 
  } = useQuery<UserSubscription | null>({
    queryKey: ['/api/user/subscription'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Get available subscription plans
  const { 
    data: plans = [], 
    isLoading: isLoadingPlans 
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  // Determine subscription status
  const hasActiveSubscription = subscription !== null && subscription !== undefined;
  const subscriptionExpired = subscription && new Date(subscription.endDate) <= new Date();
  const subscriptionExpiringSoon = subscription && 
    new Date(subscription.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    subscription,
    plans,
    hasActiveSubscription,
    subscriptionExpired,
    subscriptionExpiringSoon,
    isLoadingSubscription,
    isLoadingPlans,
    subscriptionError,
    isAuthenticated,
    user,
  };
}