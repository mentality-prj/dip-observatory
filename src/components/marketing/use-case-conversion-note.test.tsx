import { render, screen } from "@testing-library/react";
import { UseCaseConversionNote } from "./use-case-conversion-note";

describe("UseCaseConversionNote",()=>{it("explains that demos are patterns rather than product limits",()=>{render(<UseCaseConversionNote locale="en" href="/en/decision"/>);expect(screen.getByText(/does not need to look exactly like these demos/i)).toBeInTheDocument();expect(screen.getByRole("link",{name:/See if your decision fits/i})).toHaveAttribute("href","/en/decision")})});
