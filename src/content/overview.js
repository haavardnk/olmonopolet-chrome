const state = { processing: 0 };

function createProductElements() {
  const elements = createBaseElements();

  elements.userRating = document.createElement("span");
  elements.logoUser = document.createElement("img");
  elements.linkCheckin = document.createElement("a");
  elements.triangle = document.createElement("div");
  elements.checkmark = document.createElement("img");
  elements.star2 = document.createElement("img");

  elements.triangle.classList.add("triangle-overview");
  elements.logoUser.classList.add("logo-overview");
  elements.star2.classList.add("star-overview");

  elements.logoUser.src = chrome.runtime.getURL("assets/img/user.svg");
  elements.checkmark.src = chrome.runtime.getURL("assets/img/check-solid.svg");
  elements.star2.src = chrome.runtime.getURL("assets/img/star-solid.svg");

  elements.linkCheckin.target = "_blank";
  elements.linkCheckin.rel = "noopener noreferrer";

  return elements;
}

function updateCategoryStyle(product, beerInfo) {
  const categoryElement = product.querySelector(".product__category-name");
  if (!categoryElement || !beerInfo.style) return;
  if (categoryElement.textContent.includes(" - ")) return;
  categoryElement.textContent += " - " + beerInfo.style;
}

function addUserRating(elements, product, beerInfo) {
  if (
    !beerInfo.hasOwnProperty("user_checked_in") ||
    !beerInfo.user_checked_in.length
  )
    return;

  elements.rating.appendChild(elements.userRating);
  elements.userRating.appendChild(elements.logoUser);
  elements.userRating.appendChild(elements.linkCheckin);
  elements.userRating.appendChild(elements.star2);

  elements.linkCheckin.href = productUrl(beerInfo.vmp_id);
  elements.linkCheckin.innerText =
    beerInfo.user_checked_in[0].rating.toPrecision(3);

  elements.triangle.appendChild(elements.checkmark);
  const imgLink = product.querySelector("a[aria-label]");
  if (imgLink) {
    imgLink.style.position = "relative";
    imgLink.insertBefore(elements.triangle, imgLink.firstChild);
  }
}

function createRatings(products, beer_info) {
  products.forEach((product) => {
    if (!isProductSupported(product)) return;
    if (hasExistingUntappd(product)) return;

    const id = getProductId(product);
    if (!id || !beer_info[id]) return;

    const elements = createProductElements();
    const infoContainer = getProductInfoContainer(product);
    if (!infoContainer) return;

    infoContainer.appendChild(elements.container);

    const beerInfo = beer_info[id];

    if (setRatingInfo(elements, beerInfo)) {
      elements.rating.insertBefore(
        ratingToStars(beerInfo.rating.toPrecision(3)),
        elements.link
      );
      updateCategoryStyle(product, beerInfo);
      addUserRating(elements, product, beerInfo);
    }

    if (beerInfo?.badges?.length > 0) {
      const badgeContainer = document.createElement("div");
      badgeContainer.classList.add("badges");

      beerInfo.badges.forEach((badge) => {
        const badgeSpan = document.createElement("span");
        badgeSpan.innerText = badge.text;
        badgeContainer.appendChild(badgeSpan);
      });

      elements.container.appendChild(badgeContainer);
    }
  });

  state.processing = 0;
}

async function processProductOverview() {
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

function resultsChanged() {
  if (state.processing === 0) {
    state.processing = 1;
    setTimeout(processProductOverview, 200);
  }
}

document.arrive(".product__name", resultsChanged);
