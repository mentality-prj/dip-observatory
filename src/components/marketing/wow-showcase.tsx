import type { MarketingLocale } from "./qdip-copy";
import { DecisionSpace } from "./decision-space";
import { DecisionSpaceStory } from "./decision-space-story";

export function WowShowcase({locale}:{locale:MarketingLocale}){
 return <><DecisionSpace locale={locale}/><DecisionSpaceStory locale={locale}/></>;
}
