"use client";

import { useState, useEffect, useCallback } from "react";
import { getVenusData, VenusMarketData } from "@/lib/venus";

export function useVenus(autoRefresh = true) {
  const [data, setData] = useState<VenusMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getVenusData();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch Venus data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 60_000); // refresh every 60s
      return () => clearInterval(interval);
    }
  }, [refresh, autoRefresh]);

  return { data, loading, error, refresh };
}
