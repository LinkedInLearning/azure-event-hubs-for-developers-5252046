"use client";

import { useQuery } from "@tanstack/react-query";
import { SensorDevice } from "@/services/types";

export function useSensors() {
  return useQuery<SensorDevice[], Error>({
    queryKey: ["sensors"],
    queryFn: async () => {
      const res = await fetch(`/api/sensors`);
      if (!res.ok) {
        throw new Error("Failed to fetch sensors");
      }
      return res.json() as Promise<SensorDevice[]>;
    },
  });
}