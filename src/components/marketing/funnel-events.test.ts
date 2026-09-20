import { publicFunnelEvents } from "./funnel-events";

describe("publicFunnelEvents",()=>{it("uses stable privacy-safe event names",()=>{expect(publicFunnelEvents).toEqual({demoViewed:"public_demo_viewed",demoOpened:"public_demo_opened",decisionIntakeOpened:"public_decision_intake_opened",decisionIntakeSubmitted:"public_decision_intake_submitted"})})});
