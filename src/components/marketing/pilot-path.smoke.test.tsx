import { render } from "@testing-library/react";
import { PilotPath } from "./pilot-path";

describe("PilotPath locales",()=>{for(const locale of ["en","uk","pl"] as const)it(`renders ${locale}`,()=>{const {container}=render(<PilotPath locale={locale} decisionHref={`/${locale}/decision`}/>);expect(container.querySelectorAll("article")).toHaveLength(4)})});
