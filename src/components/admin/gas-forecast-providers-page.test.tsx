import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
  FlowPointCombobox,
  GasForecastProvidersPage,
  WeatherRegionsCombobox,
} from "@/components/admin/gas-forecast-providers-page";
import { ENTSOG_POINT_PRESETS } from "@/lib/entsog-point-directory";
import { WEATHER_REGION_PRESETS } from "@/lib/weather-region-presets";

test("renders ENTSOG date pickers with local-today max constraints", () => {
  const html = renderToStaticMarkup(<GasForecastProvidersPage />);
  const fromMaxMatch = html.match(/id="entsog-from"[^>]*max="([^"]+)"/);
  const toMaxMatch = html.match(/id="entsog-to"[^>]*max="([^"]+)"/);

  assert.equal(html.includes(`id="entsog-from"`), true);
  assert.equal(html.includes(`id="entsog-to"`), true);
  assert.ok(fromMaxMatch);
  assert.ok(toMaxMatch);
  const fromMax = fromMaxMatch[1];
  const toMax = toMaxMatch[1];
  assert.equal(fromMax, toMax);
  assert.match(fromMax, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(html.includes(`min=""`), false);
  assert.equal(html.includes("Loading ENTSOG flow points"), false);
});

test("renders static ENTSOG presets into the combobox selection flow", () => {
  const selectedValue = "al-tso-0001itp-00274entry";
  const html = renderToStaticMarkup(
    <FlowPointCombobox
      presets={ENTSOG_POINT_PRESETS}
      selectedValue={selectedValue}
      onSelect={() => {}}
      initialOpen
    />,
  );

  assert.equal(html.includes('id="entsog-point-direction-options"'), true);
  assert.equal(html.includes(`id="entsog-point-direction-option-${selectedValue}"`), true);
  assert.equal(html.includes("Kipoi (GR) · TAP · Entry"), true);
});

test("renders Weather date pickers with local-today max constraints and fixed metric", () => {
  const html = renderToStaticMarkup(<GasForecastProvidersPage />);
  const fromMaxMatch = html.match(/id="weather-from"[^>]*max="([^"]+)"/);
  const toMaxMatch = html.match(/id="weather-to"[^>]*max="([^"]+)"/);

  assert.equal(html.includes('id="weather-from"'), true);
  assert.equal(html.includes('id="weather-to"'), true);
  assert.equal(html.includes('id="weather-metric"'), true);
  assert.equal(html.includes('value="Temperature (°C)"'), true);
  assert.ok(fromMaxMatch);
  assert.ok(toMaxMatch);
  assert.equal(fromMaxMatch[1], toMaxMatch[1]);
  assert.match(fromMaxMatch[1], /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(html.includes("Search/select regions..."), true);
});

test("renders static Weather presets into the multi-select combobox selection flow", () => {
  const html = renderToStaticMarkup(
    <WeatherRegionsCombobox
      presets={WEATHER_REGION_PRESETS}
      selectedValues={["Germany", "Italy"]}
      onChange={() => {}}
      initialOpen
    />,
  );

  assert.equal(html.includes('id="weather-regions-options"'), true);
  assert.equal(html.includes("Germany"), true);
  assert.equal(html.includes("Italy"), true);
  assert.equal(html.includes("United Kingdom"), true);
  assert.equal(html.includes("Search more regions..."), true);
});
