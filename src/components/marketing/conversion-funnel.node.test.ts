import assert from "node:assert/strict";
import test from "node:test";
import { conversionBridgeCopy } from "./conversion-copy";
import { publicConversionStages } from "./conversion-funnel.constants";
import { publicFunnelEvents } from "./funnel-events";

test("conversion copy covers all public locales", () => {
  assert.deepEqual(Object.keys(conversionBridgeCopy).sort(), ["en", "pl", "uk"]);
  for (const value of Object.values(conversionBridgeCopy)) assert.ok(value.question.length > 10);
});

test("conversion bridge speaks about the buyer recurring decision", () => {
  assert.match(conversionBridgeCopy.en.question.toLowerCase(), /recurring decision/);
  assert.match(conversionBridgeCopy.uk.question.toLowerCase(), /рішення/);
  assert.match(conversionBridgeCopy.pl.question.toLowerCase(), /decyzję/);
});

test("demo exploration precedes pilot conversion", () => {
  assert.ok(publicConversionStages.indexOf("explore_demo") < publicConversionStages.indexOf("pilot"));
  assert.equal(publicConversionStages.at(-1), "expand");
});

test("analytics contract contains only stable event names", () => {
  assert.deepEqual(publicFunnelEvents, {
    demoViewed: "public_demo_viewed",
    demoOpened: "public_demo_opened",
    decisionIntakeOpened: "public_decision_intake_opened",
    decisionIntakeSubmitted: "public_decision_intake_submitted",
  });
});
