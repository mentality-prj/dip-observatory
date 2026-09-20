import { render } from "@testing-library/react";
import { PilotPath } from "./pilot-path";
describe("PilotPath structure",()=>{it("keeps a single intro and four ordered stages",()=>{const {container}=render(<PilotPath locale="uk" decisionHref="/uk/decision"/>);expect(container.querySelectorAll("section")).toHaveLength(1);expect([...container.querySelectorAll("article b")].map(node=>node.textContent)).toEqual(["01","02","03","04"])})});
