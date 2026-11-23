import { dashboardController } from "@/controllers/dashboard.controller";

export async function GET(request: Request) {
  return dashboardController.getAggregations(request);
}
