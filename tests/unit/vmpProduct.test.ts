import { describe, it, expect } from "vitest";
import { toVmpProduct } from "../../src/content/main/vmpProduct";
import type { Beer } from "../../src/shared/types";

const base: Beer = {
  vmp_id: 20400602,
  vmp_name: "Mini Choc Eggs",
  vmp_url: "https://www.vinmonopolet.no/Land/Skottland/Mini/p/20400602",
  main_category: "Øl",
  sub_category: "Porter & stout",
  country: "Skottland",
  price: 109.9,
  volume: 0.44,
  vmp_abv: 6,
  product_selection: "Bestillingsutvalget",
  post_delivery: true,
  store_delivery: false,
  rating: 3.9,
};

describe("toVmpProduct", () => {
  it("builds a vinmonopolet search product", () => {
    expect(toVmpProduct(base)).toMatchObject({
      code: "20400602",
      name: "Mini Choc Eggs",
      url: "/Land/Skottland/Mini/p/20400602",
      main_category: { code: "øl", name: "Øl" },
      main_sub_category: { code: "øl_porter___stout", name: "Porter & stout" },
      main_country: { code: "skottland", name: "Skottland" },
      price: {
        formattedValue: "Kr\u00a0109,90",
        readableValue: "109 kroner og 90 øre",
        value: 109.9,
      },
      volume: {
        formattedValue: "44 cl",
        readableValue: "44 centiliter",
        value: 44,
      },
      alcohol: {
        formattedValue: "6%",
        readableValue: "6 prosent",
        value: 6,
      },
      buyable: true,
    });
  });

  it.each([
    [true, true, "Kan bestilles", "Kan bestilles til alle butikker"],
    [
      false,
      false,
      "Kan ikke bestilles",
      "Kan kjøpes i butikk med varen på lager",
    ],
  ])(
    "maps post %s and store %s to vinmonopolet availability",
    (post, store, delivery, stores) => {
      const product = toVmpProduct({
        ...base,
        post_delivery: post,
        store_delivery: store,
      });
      expect(product?.productAvailability).toMatchObject({
        deliveryAvailability: {
          availableForPurchase: post,
          infos: [
            {
              availability: delivery,
              readableValue: `Post/Levering: ${delivery}`,
            },
          ],
        },
        storesAvailability: {
          availableForPurchase: true,
          infos: [{ availability: stores, readableValue: stores }],
        },
      });
    },
  );

  it.each([
    [
      { price: 515, volume: 0.375, vmp_abv: 10.7 },
      "515 kroner",
      "37,5 cl",
      "10,7%",
    ],
    [
      { price: 1299.5, volume: 5, vmp_abv: 4.75 },
      "1299 kroner og 50 øre",
      "500 cl",
      "4,8%",
    ],
  ])("formats %j", (fields, readablePrice, volume, alcohol) => {
    const product = toVmpProduct({ ...base, ...fields });
    expect(product?.price).toMatchObject({ readableValue: readablePrice });
    expect(product?.volume).toMatchObject({ formattedValue: volume });
    expect(product?.alcohol).toMatchObject({ formattedValue: alcohol });
  });

  it.each([
    [{ vmp_url: null }, "/p/20400602"],
    [{ vmp_url: "https://example.com/p/20400602" }, "/p/20400602"],
  ])("falls back to the product id path for %j", (fields, url) => {
    expect(toVmpProduct({ ...base, ...fields })?.url).toBe(url);
  });

  it.each(["price", "volume", "vmp_abv"] as const)(
    "skips beers without %s",
    (field) => {
      expect(toVmpProduct({ ...base, [field]: null })).toBeNull();
    },
  );
});
