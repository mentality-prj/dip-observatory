import { render, screen } from "@testing-library/react";
import { PilotPath } from "./pilot-path";

describe("PilotPath accessibility",()=>{it("exposes a semantic conversion link",()=>{render(<PilotPath locale="pl" decisionHref="/pl/decision"/>);expect(screen.getByRole("link",{name:/Opisz swoją decyzję/i})).toBeVisible()})});
