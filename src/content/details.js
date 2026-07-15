function getElement(className, index = 0) {
  return document.getElementsByClassName(className)[index] || null;
}

function isProductSupported() {
  const category = getElement("product__category-name");
  return (
    category &&
    BEER_CATEGORIES.some((cat) =>
      category.textContent.toUpperCase().includes(cat)
    )
  );
}

function createUntappdElements() {
  const elements = {};

  elements.container = document.createElement("div");
  elements.rating = document.createElement("div");
  elements.link = document.createElement("a");
  elements.updated = document.createElement("p");
  elements.wrong = document.createElement("a");

  elements.container.classList.add("untappd");
  elements.wrong.classList.add("suggest");

  elements.link.target = "_blank";
  elements.link.rel = "noopener noreferrer";

  elements.rating.appendChild(elements.link);
  elements.container.appendChild(elements.rating);
  elements.container.appendChild(elements.updated);
  elements.container.appendChild(elements.wrong);

  return elements;
}

function findDetailsList() {
  const allLis = document.querySelectorAll("main li");
  for (const li of allLis) {
    const spans = li.querySelectorAll(":scope > span");
    if (spans.length >= 2 && spans[0].textContent.trim() === "Varenummer") {
      return li.parentElement;
    }
  }
  return null;
}

function injectIBU(data) {
  if (!data.ibu) return true;

  const category = getElement("product__category-name");
  if (!category?.textContent.toUpperCase().includes("ØL")) return true;

  const detailsList = findDetailsList();
  if (!detailsList) return false;

  const hasIBU = Array.from(detailsList.querySelectorAll("li")).some((item) => {
    const s = item.querySelectorAll(":scope > span");
    return s.length >= 1 && s[0].textContent.trim() === "Ibu";
  });

  if (hasIBU) return true;

  const templateLi = detailsList.querySelector("li");
  if (!templateLi) return false;

  const ibuItem = templateLi.cloneNode(true);
  const spans = ibuItem.querySelectorAll("span");
  if (spans.length >= 2) {
    spans[0].textContent = "Ibu";
    spans[1].textContent = data.ibu;
    spans[1].removeAttribute("aria-label");
    const innerLink = spans[1].querySelector("a");
    if (innerLink) spans[1].innerHTML = data.ibu;
  }
  detailsList.appendChild(ibuItem);
  return true;
}

function injectExtraInfo(data, attempt = 0) {
  updateStyleInfo(data);
  if (!injectIBU(data) && attempt < 20) {
    setTimeout(() => injectExtraInfo(data, attempt + 1), 300);
  }
}

function updateStyleInfo(data) {
  const category = getElement("product__category-name");
  if (!category || !data.style) return;
  if (category.textContent.includes("(")) return;

  if (category.textContent.toUpperCase().includes("ØL")) {
    const styleSpan = document.createElement("span");
    styleSpan.textContent = " (" + data.style + ")";
    category.appendChild(styleSpan);
  }
}

function addBadges(data) {
  if (!data?.badges?.length) return;

  const layoutWrapper = getElement("product__layout-wrapper");
  const existingBadges = layoutWrapper?.getElementsByClassName("badges");

  if (!layoutWrapper || existingBadges?.length > 0) return;

  data.badges.forEach((badge) => {
    const badgeDiv = document.createElement("div");
    const badgeSpan = document.createElement("span");
    badgeDiv.classList.add("badges");
    badgeSpan.innerText = badge.text;
    badgeDiv.appendChild(badgeSpan);
    layoutWrapper.appendChild(badgeDiv);
  });
}

function setupWrongMatchHandler(wrongElement, beerId) {
  wrongElement.addEventListener("click", (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Rapporter feil Untappd match",
      text: "Legg inn riktig Untappd link. Eksempel: https://untappd.com/b/nogne-o-porter/27638",
      input: "text",
      inputAttributes: { autocapitalize: "off" },
      showCancelButton: false,
      confirmButtonText: "Send",
      confirmButtonColor: "#002025",
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        fetch("https://api.olmonopolet.app/wrongmatch/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beer: beerId, suggested_url: result.value }),
        }).then((response) => {
          const success = response.status === 201;
          Swal.fire({
            title: success
              ? "Feil registrert!"
              : "Det oppsto en feil ved sending av forslaget...",
            text: success
              ? "Ditt endringsforslag vil bli evaluert. Takk for hjelpen!"
              : "Sjekk at du har tastet inn en gyldig URL!",
            icon: success ? "success" : "error",
            confirmButtonColor: "#002025",
          });
        });
      } else if (result.isConfirmed && !result.value) {
        Swal.fire({
          title: "Du må oppgi en gyldig Untappd link!",
          text: "Eksempel: https://untappd.com/b/nogne-o-porter/27638",
          icon: "error",
          confirmButtonColor: "#002025",
        });
      }
    });
  });
}

let observersInitialized = false;

function getBeerId() {
  const match = window.location.pathname.match(/\/p\/(\d+)/);
  if (match) return match[1];

  const allLis = document.querySelectorAll("main li");
  for (const li of allLis) {
    const spans = li.querySelectorAll(":scope > span");
    if (spans.length >= 2 && spans[0].textContent.trim() === "Varenummer") {
      return spans[1].textContent.trim();
    }
  }
  return null;
}

function injectBeerInfo() {
  if (
    getElement("untappd") ||
    !getElement("product__layout-wrapper") ||
    !isProductSupported()
  ) {
    return;
  }

  const beerId = getBeerId();

  if (!beerId) return;

  const elements = createUntappdElements();
  getElement("product-details-main").appendChild(elements.container);

  getBeerById(beerId)
    .then((data) => {
      if (data?.rating !== undefined && data.rating !== null) {
        elements.rating.insertBefore(
          ratingToStars(data.rating.toPrecision(3)),
          elements.link
        );
        elements.link.href = productUrl(beerId);
        elements.link.innerText = `${data.rating.toPrecision(3)} (${kFormatter(
          data.checkins
        )})`;

        const date = new Date(data.untpd_updated);
        elements.updated.innerText = `Oppdatert: ${date.toLocaleDateString(
          "en-GB"
        )} ${date.toLocaleTimeString("en-GB")}`;
        elements.wrong.innerText = "Feil øl?";

        injectExtraInfo(data);
      } else if (data?.detail === "Not found.") {
        elements.link.innerText = "Ny, oppdateres ved neste kjøring";
      } else {
        elements.link.innerText = "Ingen match";
        elements.wrong.innerText = "Foreslå Untappd match";
      }

      addBadges(data);
      setupWrongMatchHandler(elements.wrong, beerId);
    })
    .catch((error) => {
      console.error("Failed to fetch beer data:", error);
      elements.link.innerText = "Feil ved lasting";
    });
}

function initializeProductDetails() {
  injectBeerInfo();

  if (!observersInitialized) {
    observersInitialized = true;
    document.arrive(".product__layout-wrapper", () =>
      setTimeout(injectBeerInfo, 100)
    );
    document.arrive(".product__category-name", () =>
      setTimeout(injectBeerInfo, 100)
    );
    document.arrive(".product-details-main", () =>
      setTimeout(injectBeerInfo, 100)
    );
  }
}

initializeProductDetails();
