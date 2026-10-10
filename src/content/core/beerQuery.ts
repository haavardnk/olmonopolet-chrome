const BEER_MAIN_CATEGORIES = ["øl", "sider", "mjød"];
const BEER_SUB_CATEGORIES = [
  "alkoholfritt_alkoholfritt_øl",
  "alkoholfritt_alkoholfri_ingefærøl",
  "alkoholfritt_alkoholfri_sider",
];

function facetValues(query: string, facet: string): string[] {
  const pairs = query.split(":").slice(2);
  const values: string[] = [];
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    if (pairs[i] === facet) values.push(pairs[i + 1].trim().toLowerCase());
  }
  return values;
}

export function isBeerCategory(code: string): boolean {
  return BEER_MAIN_CATEGORIES.includes(code.toLowerCase());
}

export function vmpSort(query: string): string {
  return query.split(":")[1] || "relevance";
}

export function isBeerSearch(query: string, hasBeer: boolean): boolean {
  const main = facetValues(query, "mainCategory");
  if (main.length === 0) {
    return query.split(":")[0].trim() !== "" && hasBeer;
  }
  const subs = facetValues(query, "mainSubCategory");
  const beerSubs =
    subs.length > 0 && subs.every((sub) => BEER_SUB_CATEGORIES.includes(sub));
  return main.every(
    (cat) => isBeerCategory(cat) || (cat === "alkoholfritt" && beerSubs),
  );
}
