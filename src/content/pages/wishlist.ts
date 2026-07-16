import { findProductCards, appendStyleToCategory } from "../dom/product";
import { processCards } from "./shared";

const LIST_FIELDS =
  "vmp_id,style,rating,untpd_url,badges,value_score,label_hd_url";

export async function handleWishlist(): Promise<void> {
  await processCards(findProductCards(), {
    requireBeer: true,
    fields: LIST_FIELDS,
    onRendered: (card, beer) => {
      if (beer.style) appendStyleToCategory(card, beer.style);
    },
  });
}
