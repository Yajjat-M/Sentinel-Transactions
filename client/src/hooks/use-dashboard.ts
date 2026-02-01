import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// --- Transactions ---

export function useTransactions(filters?: { status?: string; minRisk?: number; limit?: number }) {
  const queryKey = [api.transactions.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.minRisk !== undefined) params.minRisk = filters.minRisk.toString();
      if (filters?.limit !== undefined) params.limit = filters.limit.toString();
      
      const url = filters ? `${api.transactions.list.path}?${new URLSearchParams(params)}` : api.transactions.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json();
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: [api.transactions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.transactions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch transaction");
      return await res.json();
    },
  });
}

// --- Stats ---

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s for dashboard
  });
}

// --- Alerts ---

export function useAlerts() {
  return useQuery({
    queryKey: [api.alerts.list.path],
    queryFn: async () => {
      const res = await fetch(api.alerts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return await res.json();
    },
  });
}

// --- Investigations ---

export function useInvestigations() {
  return useQuery({
    queryKey: [api.investigations.list.path],
    queryFn: async () => {
      const res = await fetch(api.investigations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch investigations");
      return await res.json();
    },
  });
}

export function useCreateInvestigation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { transactionId: string; reason: string }) => {
      const res = await fetch(api.investigations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create investigation");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investigations.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useUpdateInvestigation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, outcome }: { id: number; status: 'RESOLVED' | 'BLOCKED'; outcome?: string }) => {
      const url = buildUrl(api.investigations.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, outcome }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update investigation");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investigations.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.blocked.list.path] });
    },
  });
}

// --- Blocked ---

export function useBlockedTransactions() {
  return useQuery({
    queryKey: [api.blocked.list.path],
    queryFn: async () => {
      const res = await fetch(api.blocked.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch blocked transactions");
      return await res.json();
    },
  });
}

// --- Agent Status ---

export function useAgentStatus() {
  return useQuery({
    queryKey: [api.agent.status.path],
    queryFn: async () => {
      const res = await fetch(api.agent.status.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch agent status");
      return api.agent.status.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Poll every 2s for live terminal
  });
}
