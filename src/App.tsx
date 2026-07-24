import { useEffect } from "react";
import { Routes, Route, NavLink, Link } from "react-router-dom";
import { Activity, Layers, Radio, Cpu, Search, ArrowDownUp, FlaskConical, ShieldCheck, Lock } from "lucide-react";
import { initPi } from "@/lib/piSdk";
import PiConnectButton from "@/components/PiConnectButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n";
import Explorer from "./pages/Explorer";
import Layers7 from "./pages/Layers7";
import MicroDevice from "./pages/MicroDevice";
import Network from "./pages/Network";
import PiDEX from "./pages/PiDEX";
import Testnet from "./pages/Testnet";
import Standards from "./pages/Standards";
import Bn254 from "./pages/Bn254";

export default function App() {
  useEffect(() => {
    initPi().catch((e) => console.warn("Pi SDK init:", e?.message ?? e));
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Explorer />} />
          <Route path="/layers" element={<Layers7 />} />
          <Route path="/micro-device" element={<MicroDevice />} />
          <Route path="/network" element={<Network />} />
          <Route path="/pidex" element={<PiDEX />} />
          <Route path="/testnet" element={<Testnet />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/bn254" element={<Bn254 />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  const nav = [
    { to: "/", key: "nav.explorer", icon: Activity },
    { to: "/layers", key: "nav.layers", icon: Layers },
    { to: "/micro-device", key: "nav.micro", icon: Cpu },
    { to: "/network", key: "nav.network", icon: Radio },
    { to: "/pidex", key: "nav.pidex", icon: ArrowDownUp },
    { to: "/standards", key: "nav.standards", icon: ShieldCheck },
    { to: "/bn254", key: "nav.bn254", icon: Lock },
    { to: "/testnet", key: "nav.testnet", icon: FlaskConical },
  ];
  return (
    <header className="border-b border-border bg-panel/60 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="w-7 h-7 rounded-md bg-gradient-to-br from-gold to-orange flex items-center justify-center text-black">π</span>
          <span>PiScan</span>
          <span className="text-xs text-muted mono">/ PiRC v3</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  isActive ? "bg-panel2 text-text" : "text-muted hover:text-text hover:bg-panel2/50"
                }`
              }
            >
              <n.icon size={14} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-muted">
          <span className="pulse-dot" />
          <span className="mono">MAINNET · api.mainnet.minepi.com</span>
        </div>
        <PiConnectButton />
        <button className="p-2 rounded-md border border-border hover:bg-panel2">
          <Search size={16} />
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted">
      PiScan · PiRC Sovereign Network Ecosystem · Data streaming live from Pi Network Horizon
    </footer>
  );
}
