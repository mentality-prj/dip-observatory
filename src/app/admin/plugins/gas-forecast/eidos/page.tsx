import { connection } from "next/server";

import { GasForecastEidosPage } from "@/components/admin/gas-forecast-eidos-page";

export const metadata = {
  title: "Gas Forecast EIDOS Experiment | DIP Observatory",
};

export default async function GasForecastEidosRoute() {
  await connection();

  return <GasForecastEidosPage />;
}
