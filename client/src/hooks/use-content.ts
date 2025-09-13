import { useQuery } from "@tanstack/react-query";
import type { Content } from "@shared/schema";

export function useContent() {
  return useQuery<Content[]>({
    queryKey: ["/api/content"],
  });
}

export function useContentByType(type: string) {
  return useQuery<Content[]>({
    queryKey: ["/api/content/type", type],
    enabled: type !== "all",
  });
}

export function useTrendingContent() {
  return useQuery<Content[]>({
    queryKey: ["/api/content/trending"],
  });
}

export function useNewReleases() {
  return useQuery<Content[]>({
    queryKey: ["/api/content/new-releases"],
  });
}

export function usePopularContent() {
  return useQuery<Content[]>({
    queryKey: ["/api/content/popular"],
  });
}

export function useSearchContent(query: string) {
  return useQuery<Content[]>({
    queryKey: ["/api/content/search", { q: query }],
    enabled: query.length > 0,
  });
}
