import { render, screen } from "@testing-library/react";
import { PilotPath } from "./pilot-path";
import { UseCaseConversionNote } from "./use-case-conversion-note";

describe("marketing conversion funnel",()=>{
 it("presents a low-friction English pilot path",()=>{render(<PilotPath locale="en" decisionHref="/en/decision"/>);expect(screen.getByText("Test QDIP on one decision before committing to more.")).toBeInTheDocument();expect(screen.getByRole("link",{name:/Describe your decision/i})).toHaveAttribute("href","/en/decision")});
 it("keeps the pilot proposition localized",()=>{render(<PilotPath locale="uk" decisionHref="/uk/decision"/>);expect(screen.getByText("Перевірте QDIP на одному рішенні, перш ніж рухатися далі.")).toBeInTheDocument()});
 it("connects demos to a user's own recurring decision",()=>{render(<UseCaseConversionNote locale="pl" href="/pl/decision"/>);expect(screen.getByRole("link",{name:/Sprawdź, czy Twoja decyzja pasuje/i})).toHaveAttribute("href","/pl/decision")});
});
