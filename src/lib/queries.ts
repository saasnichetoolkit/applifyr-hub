import { queryOptions } from "@tanstack/react-query";

import { listApprovedApps } from "@/lib/apps.functions";

export const approvedAppsQuery = queryOptions({
  queryKey: ["apps", "approved"],
  queryFn: () => listApprovedApps(),
  staleTime: 60_000,
});
