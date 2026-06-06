import Decimal from "decimal.js";

Decimal.set({ precision: 1000, rounding: 4 });

export type AssetCategory =
  | "EARTH_MINERALS"
  | "EARTH_ENERGY"
  | "ARTIFACTS"
  | "SPACE_METALS"
  | "GEMSTONES";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  quantity: Decimal;
  unit: string;
  valuationPerUnit: Decimal;
  totalValue: Decimal;
  growthRate: Decimal;
}

export const generateMockAssets = (): Asset[] => [
  {
    id: "gold-1",
    name: "Global Gold Reserves",
    category: "EARTH_MINERALS",
    quantity: new Decimal("208874"),
    unit: "Tonnes",
    valuationPerUnit: new Decimal("64300000"),
    totalValue: new Decimal("208874").mul("64300000"),
    growthRate: new Decimal("1.000000015"),
  },
  {
    id: "silver-1",
    name: "Global Silver Reserves",
    category: "EARTH_MINERALS",
    quantity: new Decimal("1740000"),
    unit: "Tonnes",
    valuationPerUnit: new Decimal("980000"),
    totalValue: new Decimal("1740000").mul("980000"),
    growthRate: new Decimal("1.0000001"),
  },
  {
    id: "oil-1",
    name: "Crude Oil Reserves",
    category: "EARTH_ENERGY",
    quantity: new Decimal("1700000000000"),
    unit: "Barrels",
    valuationPerUnit: new Decimal("75"),
    totalValue: new Decimal("1700000000000").mul("75"),
    growthRate: new Decimal("0.999998"),
  },
  {
    id: "diamond-1",
    name: "Global Diamond Reserves",
    category: "GEMSTONES",
    quantity: new Decimal("1900000000"),
    unit: "Carats",
    valuationPerUnit: new Decimal("4500"),
    totalValue: new Decimal("1900000000").mul("4500"),
    growthRate: new Decimal("1.0000002"),
  },
  {
    id: "space-psyche",
    name: "Asteroid 16 Psyche",
    category: "SPACE_METALS",
    quantity: new Decimal("10000000000000000000"),
    unit: "kg",
    valuationPerUnit: new Decimal("1000"),
    totalValue: new Decimal("10000000000000000000").mul("1000"),
    growthRate: new Decimal("1.00000000005"),
  },
  {
    id: "artifacts-pharaohs",
    name: "Pharaonic Antiquities",
    category: "ARTIFACTS",
    quantity: new Decimal("500000"),
    unit: "Pieces",
    valuationPerUnit: new Decimal("25000000"),
    totalValue: new Decimal("500000").mul("25000000"),
    growthRate: new Decimal("1.00002"),
  },
];

export const formatHugeNumber = (num: Decimal): string => {
  const abs = num.abs();
  if (abs.gte("1e21")) return num.div("1e21").toDP(4) + " Sextillion";
  if (abs.gte("1e18")) return num.div("1e18").toDP(4) + " Quintillion";
  if (abs.gte("1e15")) return num.div("1e15").toDP(4) + " Quadrillion";
  if (abs.gte("1e12")) return num.div("1e12").toDP(4) + " Trillion";
  if (abs.gte("1e9")) return num.div("1e9").toDP(4) + " Billion";
  if (abs.gte("1e6")) return num.div("1e6").toDP(4) + " Million";
  return num.toDP(4).toString();
};
