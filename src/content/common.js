const API_BASE_URL = "https://api.olmonopolet.app";
const BEER_CATEGORIES = ["ØL", "SIDER", "MJØD"];

async function getBeerInfo(
  beer_ids,
  fields = "vmp_id,rating,untpd_url,badges"
) {
  const url = `${API_BASE_URL}/beers/?beers=${beer_ids.join()}&fields=${fields}`;
  const response = await fetch(url);
  return await response.json();
}

async function getBeerById(
  beer_id,
  fields = "vmp_id,ibu,style,rating,checkins,untpd_url,untpd_updated,badges"
) {
  const response = await fetch(
    `${API_BASE_URL}/beers/${beer_id}/?fields=${fields}`
  );
  return await response.json();
}

function getProductId(product) {
  const link =
    product.querySelector(".product__name") ||
    product.querySelector("a[aria-label]") ||
    product.querySelector('a[href*="/p/"]');
  if (!link) return null;
  const match = link.href?.match(/\/p\/(\d+)/);
  return match ? match[1] : null;
}

function getBeerIds(products) {
  return products.map(getProductId).filter((id) => id);
}

function addBadges(container, badges) {
  if (!badges?.length) return;

  badges.forEach((badge) => {
    const badgeDiv = document.createElement("div");
    const badgeSpan = document.createElement("span");
    badgeDiv.classList.add("badges");
    badgeSpan.innerText = badge.text;
    badgeDiv.appendChild(badgeSpan);
    container.appendChild(badgeDiv);
  });
}

function createBaseElements() {
  const elements = {};

  elements.container = document.createElement("div");
  elements.rating = document.createElement("div");
  elements.link = document.createElement("a");

  elements.container.classList.add("untappd");

  elements.link.target = "_blank";
  elements.link.rel = "noopener noreferrer";

  elements.container.appendChild(elements.rating);
  elements.rating.appendChild(elements.link);

  return elements;
}

function isProductSupported(product) {
  const productLink = product.querySelector("a[aria-label]");
  if (productLink) {
    const label = (productLink.getAttribute("aria-label") || "").toUpperCase();
    if (BEER_CATEGORIES.some((cat) => label.includes(cat))) return true;
  }
  const categoryElement = product.querySelector(".product__category-name");
  if (categoryElement) {
    return BEER_CATEGORIES.some((cat) =>
      categoryElement.textContent.toUpperCase().includes(cat)
    );
  }
  return false;
}

function getProductInfoContainer(product) {
  const nameEl = product.querySelector(".product__name");
  return nameEl?.parentElement;
}

function productUrl(vmpId) {
  return `https://olmonopolet.app/products/${vmpId}`;
}

function hasExistingUntappd(product) {
  return product.getElementsByClassName("untappd").length > 0;
}

function setRatingInfo(elements, beerInfo) {
  if (beerInfo && beerInfo.rating !== null) {
    elements.link.innerText = beerInfo.rating.toPrecision(3);
    elements.link.href = productUrl(beerInfo.vmp_id);
    return true;
  } else {
    elements.link.innerText = "Ingen match";
    return false;
  }
}
