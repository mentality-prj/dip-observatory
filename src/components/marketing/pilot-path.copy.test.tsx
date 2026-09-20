import { render, screen } from "@testing-library/react";
import { PilotPath } from "./pilot-path";

describe("pilot positioning",()=>{it("does not position QDIP as automation or AI",()=>{const {container}=render(<PilotPath locale="en" decisionHref="/en/decision"/>);const text=container.textContent?.toLowerCase()??"";expect(text).not.toContain("automation");expect(text).not.toContain("artificial intelligence");expect(screen.getByText(/one decision/i)).toBeInTheDocument()})});
