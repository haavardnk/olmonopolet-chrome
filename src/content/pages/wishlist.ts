import { findProductCards, appendStyleToCategory } from "../dom/product";
import { processCards } from "./shared";

const LIST_FIELDS =
  "vmp_id,style,rating,checkins,badges,value_score,label_hd_url,user_tasted";

export async function handleWishlist(signal?: AbortSignal): Promise<void> {
  await processCards(findProductCards(), {
    requireBeer: true,
    fields: LIST_FIELDS,
    signal,
    onRendered: (card, beer) => {
      if (beer.style) {
        appendStyleToCategory(card, String(beer.vmp_id), beer.style);
      }
    },
  });
}
