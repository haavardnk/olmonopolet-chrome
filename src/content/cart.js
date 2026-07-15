const state = { processing: 0 };

function getCartProducts() {
  return Array.from(document.querySelectorAll("ul.product-list > li"));
}

function getCartInfoContainer(product) {
  const nameEl = product.querySelector("h3, .product__name");
  if (nameEl) {
    let el = nameEl;
    while (el.parentElement && el.parentElement !== product) el = el.parentElement;
    return el;
  }
  return product;
}

function createRatings(products, beer_info) {
  products.forEach((product) => {
    const id = getProductId(product);
    if (!id || !beer_info[id]) return;

    if (product.querySelector(".untappd")) return;

    const elements = createBaseElements();
    const infoContainer = getCartInfoContainer(product);

    infoContainer.appendChild(elements.container);

    const beerInfo = beer_info[id];

    if (setRatingInfo(elements, beerInfo)) {
      elements.rating.insertBefore(
        ratingToStars(beerInfo.rating.toPrecision(3)),
        elements.link
      );
    }

    if (beerInfo) {
      addBadges(infoContainer, beerInfo.badges);
    }
  });

  state.processing = 0;
}

async function processCart() {
  const products = getCartProducts();
  const ids = products.map(getProductId).filter(Boolean);

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

function triggerCart() {
  if (state.processing === 0) {
    state.processing = 1;
    setTimeout(processCart, 300);
  }
}

triggerCart();
document.arrive("ul.product-list", triggerCart);
