import type { MetadataRoute } from "next";

export default function manifest():MetadataRoute.Manifest{
 return {name:"QDIP — Decision Engine",short_name:"QDIP",description:"Decision Engine for consistent, explainable decisions",start_url:"/en",display:"standalone",background_color:"#fcf8f9",theme_color:"#8e2949"};
}
