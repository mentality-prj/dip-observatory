import { render } from "@testing-library/react";
import { PilotPath } from "./pilot-path";

describe("buyer-first conversion language",()=>{it("avoids enterprise rollout pressure",()=>{const {container}=render(<PilotPath locale="en" decisionHref="/en/decision"/>);const text=container.textContent??"";expect(text).toContain("Start small");expect(text).toContain("Expand only if");expect(text).not.toContain("Contact sales")})});
