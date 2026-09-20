import { publicConversionStages } from "./conversion-funnel.constants";
describe("publicConversionStages",()=>{it("keeps demo exploration before pilot conversion",()=>{expect(publicConversionStages.indexOf("explore_demo")).toBeLessThan(publicConversionStages.indexOf("pilot"));expect(publicConversionStages.at(-1)).toBe("expand")})});
