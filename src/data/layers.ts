// PiRC-207 7-Layer Token System (mainnet-ready registry addresses).
// Sourced from schemas/pirc207_layers.json in the PiRC monorepo.
export const ISSUER = "GA3ECRFJ6S05BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6";
export const MASTER_REGISTRY = "CAEUNHEUXACISTVHICFNISFRTRVSK5IALA3H5MUT7P4JKU5L3IPSKG4B";

export type Layer = {
  id: string;
  name: string;
  role: string;
  address: string;
  color: string; // tailwind color class
  hex: string;
};

export const LAYERS: Layer[] = [
  { id: "L0", name: "Purple", role: "Root Registry", address: "CCGEMIEAZFJSBTRL5VGJJAUGPJI3B7UQ3BTAB2OQGW73JMWLS57YVVA4", color: "bg-purple",  hex: "#a970ff" },
  { id: "L1", name: "Gold",   role: "Reserve Asset", address: "CD3UAUN4FU3VHPMLOZWFQWJ2UBUUBBD37SZ7WBEGJQACJ7YF6QVE2SYG", color: "bg-gold",    hex: "#ffb020" },
  { id: "L2", name: "Yellow", role: "Utility Tier",  address: "CANLSQUPUZYKE3S2HAIGXAHMOQWE4FVX5DS7GTL42BVKSNHLFVMQSDFF", color: "bg-yellow",  hex: "#f0d95b" },
  { id: "L3", name: "Orange", role: "Settlement",    address: "CB7T6TDSZ5B2MQI7NI4EG6ZASYPRMJ3XVUWS6BON4Z64OBMUJ4ZD6GKF", color: "bg-orange",  hex: "#ff8c42" },
  { id: "L4", name: "Blue",   role: "Liquidity",     address: "CAMSQZTSCTF3MG4UEIAWKRZNSX7LLKGKXMVBEQO2ETVPGS3CINM7JBQD", color: "bg-blue",    hex: "#58a6ff" },
  { id: "L5", name: "Green",  role: "PiCash",        address: "CBPG33E7RUX6MGU65IMM4HXCAGLA4OZRBOUWKQSBTIZWE2RD52VGWDT4", color: "bg-green",   hex: "#3fb950" },
  { id: "L6", name: "Red",    role: "Governance",    address: "CC6WMAHKOPWY6HW46VNKTAV4DZZLRTTNMYLDEKCAICQGMCWV5PZYNTBO", color: "bg-red",     hex: "#f85149" },
];
