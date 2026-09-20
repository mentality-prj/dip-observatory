export const publicFunnelEvents={
 demoViewed:"public_demo_viewed",
 demoOpened:"public_demo_opened",
 decisionIntakeOpened:"public_decision_intake_opened",
 decisionIntakeSubmitted:"public_decision_intake_submitted",
} as const;

export type PublicFunnelEvent=(typeof publicFunnelEvents)[keyof typeof publicFunnelEvents];

// Event names only. Do not attach decision descriptions, email addresses or other form content to analytics payloads.
