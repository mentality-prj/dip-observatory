import { render, screen } from "@testing-library/react";
import { PilotPath } from "./pilot-path";

describe("PilotPath",()=>{it("links a scoped pilot to the decision intake",()=>{render(<PilotPath locale="en" decisionHref="/en/decision"/>);expect(screen.getByText(/No platform-wide rollout/i)).toBeInTheDocument();expect(screen.getByRole("link",{name:/Describe your decision/i})).toHaveAttribute("href","/en/decision")})});
