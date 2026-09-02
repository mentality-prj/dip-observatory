import { connection } from "next/server";

import { GasForecastProvidersPage } from "@/components/admin/gas-forecast-providers-page";

export const metadata = {
  title: "Gas Forecast Providers | DIP Observatory",
};

export default async function GasForecastProvidersRoute() {
  await connection();

  return <GasForecastProvidersPage />;
}
