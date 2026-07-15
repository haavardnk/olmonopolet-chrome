const state = { processing: 0 };

function addStyleToCategory(product, style) {
  const categoryElement = product.querySelector(".product__category-name");
  if (!categoryElement || categoryElement.textContent.includes(" - ")) return;
  categoryElement.textContent += ` - ${style}`;
}

function createRatings(products, beer_info) {
  products.forEach((product) => {
    if (!isProductSupported(product)) return;
    if (hasExistingUntappd(product)) return;

    const id = getProductId(product);
    if (!id) return;

    const elements = createBaseElements();
    const infoContainer = getProductInfoContainer(product);
    if (!infoContainer) return;

    infoContainer.appendChild(elements.container);

    const beerInfo = beer_info[id];

    if (setRatingInfo(elements, beerInfo)) {
      elements.rating.insertBefore(
        ratingToStars(beerInfo.rating.toPrecision(3)),
        elements.link
      );
      if (beerInfo.style) {
        addStyleToCategory(product, beerInfo.style);
      }
    }

    if (beerInfo) {
      addBadges(infoContainer, beerInfo.badges);
    }
  });

  state.processing = 0;
}

async function initializeWishlistPage() {
  const products = Array.from(
    document.querySelectorAll("ul.product-list > li")
  );
  const supportedProducts = products.filter(isProductSupported);
  const ids = getBeerIds(supportedProducts);

  if (ids.length === 0) {
    state.processing = 0;
    return;
  }

  try {
    const data = await getBeerInfo(ids, "vmp_id,style,rating,untpd_url,badges");
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

document.arrive(".product__name", () => {
  if (state.processing === 0) {
    state.processing = 1;
    setTimeout(initializeWishlistPage, 200);
  }
});
