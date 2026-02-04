const state = { processing: 0 };

function findByClassPrefix(parent, prefix) {
  return parent.querySelector(`[class*="${prefix}"]`);
}

function getCartProducts() {
  return Array.from(document.querySelectorAll('li[id^="cartEntryCode"]'));
}

function createRatings(products, beer_info) {
  products.forEach((product) => {
    const id = product.id.split("cartEntryCode")[1];
    if (!beer_info[id]) return;

    const elements = createBaseElements();
    const infoContainer = findByClassPrefix(product, "info-container");
    if (!infoContainer) return;

    if (infoContainer.getElementsByClassName("untappd").length > 0) return;

    infoContainer.appendChild(elements.container);

    const beerInfo = beer_info[id];
    setRatingInfo(elements, beerInfo);

    if (beerInfo) {
      addBadges(infoContainer, beerInfo.badges);
    }
  });

  state.processing = 0;
}

async function processCart() {
  const products = getCartProducts();
  const ids = products.map((product) => product.id.split("cartEntryCode")[1]);

  if (ids.length === 0) {
    state.processing = 0;
    return;
  }

  try {
    const data = await getBeerInfo(ids);
    const beer_info = {};

    data.results?.forEach((beer) => {
      beer_info[beer.vmp_id] = beer;
    });

    createRatings(products, beer_info);
  } catch (error) {
    console.error("Failed to fetch beer info:", error);
    state.processing = 0;
  }
}

document.arrive('[class*="product-item__image"]', () => {
  const untappd = document.getElementsByClassName("untappd");
  if (untappd.length === 0 && state.processing === 0) {
    state.processing = 1;
    processCart();
  }
});
