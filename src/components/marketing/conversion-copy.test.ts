import { conversionBridgeCopy } from "./conversion-copy";

describe("conversionBridgeCopy",()=>{it("covers every public locale",()=>{expect(Object.keys(conversionBridgeCopy).sort()).toEqual(["en","pl","uk"]);for(const value of Object.values(conversionBridgeCopy))expect(value.question.length).toBeGreaterThan(10)})});
