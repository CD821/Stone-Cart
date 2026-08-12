"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthRole } from "./AuthRoleContext";
import ClerkUserControl from "./ClerkUserControl";

type Status =
  | "AVAILABLE"
  | "CHECKED OUT"
  | "OVERDUE"
  | "MISSING"
  | "MAINTENANCE"
  | "RETIRED";

type Cart = {
  id: string;
  serial: string;
  status: Status;
  type: string;
  condition: string;
  location: string;
  installer?: string;
  checkoutDate?: string;
  daysOut?: number;
  notes: string;
};

type Installer = {
  id: number;
  name: string;
  color?: string;
  role: string;
  active: boolean;
};

const specialCarts: Record<string, Partial<Cart>> = {
  "CART-018": { status: "OVERDUE", type: "Slab dolly", condition: "Good", location: "With installer", installer: "Jorge Bocanegra", checkoutDate: "Aug 8, 2026", daysOut: 3, notes: "Manager notification sent" },
  "CART-021": { status: "CHECKED OUT", condition: "Excellent", location: "Lakeside condos jobsite", installer: "Dixon Lopez", checkoutDate: "Aug 10, 2026", daysOut: 1, notes: "Expected back today" },
  "CART-027": { status: "CHECKED OUT", condition: "Excellent", location: "With installer", installer: "Erick Huerta", checkoutDate: "Aug 11, 2026", daysOut: 0, notes: "QR label verified at checkout" },
  "CART-042": { status: "MISSING", type: "Heavy duty", condition: "Unknown", location: "Unconfirmed", installer: "Ruben Bocanegra", checkoutDate: "Aug 5, 2026", daysOut: 6, notes: "Manager override required" },
};

const initialCarts: Cart[] = Array.from({ length: 50 }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  const id = `CART-${number}`;
  return {
    id,
    serial: `SN-26-${number}`,
    status: "AVAILABLE",
    type: index % 5 === 0 ? "Slab dolly" : index % 7 === 0 ? "Heavy duty" : "A-frame",
    condition: index % 6 === 0 ? "Serviceable" : "Good",
    location: "Shop bay 2",
    notes: "Ready for reassignment",
    ...specialCarts[id],
  };
});

const initialHistory = [
  ["Aug 11, 8:32 AM", "CART-027 checked out to Erick Huerta", "Issued by Carlos"],
  ["Aug 10, 3:41 PM", "CART-021 checked out to Dixon Lopez", "Issued by Maria"],
  ["Aug 9, 4:17 PM", "CART-027 returned by Erick Huerta", "Received by Maria"],
  ["Aug 8, 7:16 AM", "CART-018 checked out to Jorge Bocanegra", "Issued by Carlos"],
];

const navItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Carts", icon: "carts" },
  { label: "Installers", icon: "installers" },
  { label: "History", icon: "history" },
  { label: "Admin", icon: "admin" },
];
const routes: Record<string, string> = {
  Dashboard: "/",
  Carts: "/carts",
  Installers: "/installers",
  History: "/history",
  Admin: "/admin",
};
const initialInstallers: Installer[] = [
  { id: 10, name: "Jorge Bocanegra", color: "#0000ee", role: "Countertop Installer", active: true },
  { id: 11, name: "Jairo", role: "Countertop Installer", active: false },
  { id: 12, name: "Leoncio Castanon", color: "#00eeee", role: "Countertop Installer", active: true },
  { id: 13, name: "Jose Saldana", color: "#ffff44", role: "Countertop Installer", active: true },
  { id: 14, name: "Agustin Narvaez Sr.", color: "#550000", role: "Countertop Installer", active: true },
  { id: 15, name: "Victor Velazquez", color: "#ffcccc", role: "Countertop Installer", active: true },
  { id: 16, name: "Javier Bocanegra", color: "#88ffff", role: "Countertop Installer", active: true },
  { id: 17, name: "Antonio Duarte", role: "Countertop Installer", active: false },
  { id: 75, name: "Agustin Narvaez Jr.", color: "#8f008f", role: "Countertop Installer", active: true },
  { id: 76, name: "Jorge Espinoza", role: "Countertop Installer", active: false },
  { id: 77, name: "Ruben Bocanegra", color: "navy", role: "Countertop Installer", active: true },
  { id: 120, name: "Asael Guevara", role: "Countertop Installer", active: false },
  { id: 131, name: "Luis Hernandez", role: "Countertop Installer", active: false },
  { id: 198, name: "Dixon Lopez", color: "green", role: "Countertop Installer", active: true },
  { id: 141, name: "Josuel Elizalde", role: "Countertop Installer", active: false },
  { id: 142, name: "Erick Huerta", color: "fuchsia", role: "Countertop Installer", active: true },
];
const nowLabel = "Aug 11, 2026, 1:30 PM";

const schema = [
  ["users", "Login identity, role, active flag, employee or installer link"],
  ["installers", "Installer profile, contact details, active status, risk totals"],
  ["carts", "Permanent Cart ID, serial, type, condition, QR payload, lifecycle status"],
  ["cart_checkouts", "Open and closed checkout records with issued-by user"],
  ["cart_returns", "Verified return events tied to the original checkout"],
  ["cart_status_history", "Every status change with actor, reason, and timestamp"],
  ["notifications", "Overdue, missing, and outstanding-cart alerts"],
  ["audit_logs", "Immutable record of edits, overrides, checkouts, and returns"],
];

function normalizeCartId(value: string) {
  const trimmed = value.trim().toUpperCase();
  const digits = trimmed.replace("CART-", "").replace(/\D/g, "");
  return digits ? `CART-${digits.padStart(3, "0")}` : trimmed;
}

function normalizeInstallers(savedInstallers?: Installer[] | string[]) {
  const deprecatedDemoNames = new Set(["Mike Lopez", "John Smith", "Rafael Pena"]);
  const merged = new Map<string, Installer>();

  initialInstallers.forEach((installer) => merged.set(installer.name.toLowerCase(), installer));

  savedInstallers?.forEach((installer, index) => {
    const profile = typeof installer === "string"
      ? { id: 900 + index, name: installer, role: "Countertop Installer", active: true }
      : installer;

    if (deprecatedDemoNames.has(profile.name)) return;

    const key = profile.name.toLowerCase();
    merged.set(key, { ...merged.get(key), ...profile });
  });

  return Array.from(merged.values()).sort((a, b) => a.id - b.id);
}

type PageKey = "dashboard" | "carts" | "installers" | "history" | "admin";
type AppRole = "Admin" | "Manager" | "Employee" | "Installer";
type SortKey = "id" | "status" | "installer" | "checkoutDate" | "daysOut" | "location";
type InstallerSortKey = "name" | "assigned" | "status";
type PolicySettings = {
  overdueDays: number;
  missingDays: number;
  roles: string;
};
const storageKey = "stonecart-state-v2";
const initialPolicySettings: PolicySettings = {
  overdueDays: 2,
  missingDays: 5,
  roles: "Admin, Manager, Employee, Installer",
};
const validRoles: AppRole[] = ["Admin", "Manager", "Employee", "Installer"];
const roleAccess: Record<AppRole, {
  summary: string;
  permissions: string[];
  checkout: boolean;
  returnCart: boolean;
  manageCarts: boolean;
  viewInstallers: boolean;
  manageInstallers: boolean;
  viewHistory: boolean;
  viewNotifications: boolean;
  viewAdmin: boolean;
}> = {
  Admin: {
    summary: "Full system access",
    permissions: ["Full access", "Edit policy", "Manage carts", "Manage installers", "View all history"],
    checkout: true,
    returnCart: true,
    manageCarts: true,
    viewInstallers: true,
    manageInstallers: true,
    viewHistory: true,
    viewNotifications: true,
    viewAdmin: true,
  },
  Manager: {
    summary: "Daily operations and exceptions",
    permissions: ["Check out carts", "Return carts", "Manage carts", "Manage installers", "View all history"],
    checkout: true,
    returnCart: true,
    manageCarts: true,
    viewInstallers: true,
    manageInstallers: true,
    viewHistory: true,
    viewNotifications: true,
    viewAdmin: false,
  },
  Employee: {
    summary: "Standard checkout desk access",
    permissions: ["Check out carts", "Return carts", "View carts", "View installers", "View history"],
    checkout: true,
    returnCart: true,
    manageCarts: false,
    viewInstallers: true,
    manageInstallers: false,
    viewHistory: true,
    viewNotifications: false,
    viewAdmin: false,
  },
  Installer: {
    summary: "Assigned cart visibility",
    permissions: ["View assigned carts", "View own cart history"],
    checkout: false,
    returnCart: false,
    manageCarts: false,
    viewInstallers: false,
    manageInstallers: false,
    viewHistory: false,
    viewNotifications: false,
    viewAdmin: false,
  },
};

function normalizeRole(value: unknown): AppRole {
  return validRoles.find((role) => role.toLowerCase() === String(value ?? "").toLowerCase()) ?? "Admin";
}

export default function StoneCartApp({ page = "dashboard" }: { page?: PageKey }) {
  const authRole = useAuthRole();
  const [carts, setCarts] = useState(initialCarts);
  const [installers, setInstallers] = useState(initialInstallers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [returnedCart, setReturnedCart] = useState("");
  const [checkoutCart, setCheckoutCart] = useState("");
  const [checkoutInstaller, setCheckoutInstaller] = useState("");
  const [checkoutLocation, setCheckoutLocation] = useState("");
  const [selectedInstaller, setSelectedInstaller] = useState("Jorge Bocanegra");
  const [history, setHistory] = useState(initialHistory);
  const [notifications, setNotifications] = useState([
    "CART-018 has been checked out to Jorge Bocanegra for 3 days.",
    "CART-042 is now considered MISSING.",
    "Dixon Lopez currently has 1 outstanding cart.",
  ]);
  const [message, setMessage] = useState("Ready.");
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [installerModalOpen, setInstallerModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [newCartId, setNewCartId] = useState("");
  const [newInstallerName, setNewInstallerName] = useState("");
  const [loadedSavedState, setLoadedSavedState] = useState(false);
  const [selectedInstallerDetail, setSelectedInstallerDetail] = useState<string | null>(null);
  const [editedInstallerName, setEditedInstallerName] = useState("");
  const [installerNameEditing, setInstallerNameEditing] = useState(false);
  const [selectedCartDetail, setSelectedCartDetail] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [installerSortKey, setInstallerSortKey] = useState<InstallerSortKey>("name");
  const [installerSortDirection, setInstallerSortDirection] = useState<"asc" | "desc">("asc");
  const [policySettings, setPolicySettings] = useState(initialPolicySettings);

  const userRole = normalizeRole(authRole.role);
  const access = roleAccess[userRole];
  const userName = authRole.name;
  const matchedInstaller = installers.find((installer) => installer.name.toLowerCase() === authRole.name.toLowerCase());
  const currentInstallerName = userRole === "Installer" ? matchedInstaller?.name : selectedInstaller;
  const allowedNavItems = navItems.filter((item) => {
    if (item.label === "Admin") return access.viewAdmin;
    if (item.label === "Installers") return access.viewInstallers;
    if (item.label === "History") return access.viewHistory;
    return true;
  });
  const pageAllowed =
    page === "dashboard" ||
    page === "carts" ||
    (page === "installers" && access.viewInstallers) ||
    (page === "history" && access.viewHistory) ||
    (page === "admin" && access.viewAdmin);
  const selectedCheckoutCart = carts.find((cart) => cart.id === checkoutCart);
  const selectedReturnedCart = carts.find((cart) => cart.id === returnedCart);
  const availableCarts = carts.filter((cart) => cart.status === "AVAILABLE");
  const returnableCarts = carts.filter((cart) => ["CHECKED OUT", "OVERDUE", "MISSING"].includes(cart.status));
  const show = (section: PageKey) => pageAllowed && (page === "dashboard" || page === section);
  const showOnly = (section: PageKey) => pageAllowed && page === section;

  const filteredCarts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const roleFilteredCarts = userRole === "Installer"
      ? carts.filter((cart) => cart.installer === currentInstallerName && cart.status !== "AVAILABLE")
      : carts;
    const filtered = roleFilteredCarts.filter((cart) => {
      const matchesFilter = filter === "ALL" || cart.status === filter;
      const matchesQuery = !query || [cart.id, cart.serial, cart.status, cart.installer ?? "", cart.location].join(" ").toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
    return filtered.toSorted((a, b) => {
      const aValue = a[sortKey] ?? "";
      const bValue = b[sortKey] ?? "";
      const result = typeof aValue === "number" || typeof bValue === "number"
        ? Number(aValue || 0) - Number(bValue || 0)
        : String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
      return sortDirection === "asc" ? result : -result;
    });
  }, [carts, currentInstallerName, filter, search, sortDirection, sortKey, userRole]);

  const visibleCarts = page === "dashboard"
    ? filteredCarts.filter((cart) => cart.installer && cart.status !== "AVAILABLE")
    : filteredCarts;

  const sortedInstallers = useMemo(() => {
    return installers.toSorted((a, b) => {
      const assignedA = carts.filter((cart) => cart.installer === a.name && cart.status !== "AVAILABLE");
      const assignedB = carts.filter((cart) => cart.installer === b.name && cart.status !== "AVAILABLE");
      const statusA = !a.active ? "inactive" : assignedA.some((cart) => cart.status === "OVERDUE" || cart.status === "MISSING") ? "needs review" : assignedA.length ? "has carts" : "clear";
      const statusB = !b.active ? "inactive" : assignedB.some((cart) => cart.status === "OVERDUE" || cart.status === "MISSING") ? "needs review" : assignedB.length ? "has carts" : "clear";
      const result = installerSortKey === "assigned"
        ? assignedA.length - assignedB.length
        : installerSortKey === "status"
          ? statusA.localeCompare(statusB)
          : a.name.localeCompare(b.name, undefined, { numeric: true });
      return installerSortDirection === "asc" ? result : -result;
    });
  }, [carts, installerSortDirection, installerSortKey, installers]);

  const totals = useMemo(() => carts.reduce(
    (acc, cart) => {
      acc.total += 1;
      acc[cart.status] += 1;
      return acc;
    },
    { total: 0, AVAILABLE: 0, "CHECKED OUT": 0, OVERDUE: 0, MISSING: 0, MAINTENANCE: 0, RETIRED: 0 } as Record<Status | "total", number>,
  ), [carts]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          carts?: Cart[];
          installers?: Installer[] | string[];
          history?: string[][];
          notifications?: string[];
          policySettings?: PolicySettings;
        };
        if (parsed.carts?.length) setCarts(parsed.carts);
        setInstallers(normalizeInstallers(parsed.installers));
        if (parsed.history?.length) setHistory(parsed.history);
        if (parsed.notifications?.length) setNotifications(parsed.notifications);
        if (parsed.policySettings) setPolicySettings({ ...initialPolicySettings, ...parsed.policySettings });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setLoadedSavedState(true);
  }, []);

  useEffect(() => {
    if (!loadedSavedState) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ carts, installers, history, notifications, policySettings }),
    );
  }, [carts, history, installers, loadedSavedState, notifications, policySettings]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const hasModal = cartModalOpen || installerModalOpen || checkoutModalOpen || returnModalOpen || notificationModalOpen || selectedInstallerDetail || selectedCartDetail;
      if (!hasModal) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeModals();
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitActiveModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function record(event: string, actor = userName) {
    setHistory((items) => [[nowLabel, event, actor], ...items]);
  }

  function closeModals() {
    setCartModalOpen(false);
    setInstallerModalOpen(false);
    setCheckoutModalOpen(false);
    setReturnModalOpen(false);
    setNotificationModalOpen(false);
    setSelectedInstallerDetail(null);
    setInstallerNameEditing(false);
    setEditedInstallerName("");
    setSelectedCartDetail(null);
  }

  function submitActiveModal() {
    if (cartModalOpen) addCart();
    else if (installerModalOpen) addInstaller();
    else if (checkoutModalOpen) checkOutCart();
    else if (returnModalOpen) completeReturn();
    else if (selectedInstallerDetail && installerNameEditing) saveInstallerName();
    else if (notificationModalOpen || selectedInstallerDetail || selectedCartDetail) closeModals();
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  function toggleInstallerSort(key: InstallerSortKey) {
    if (installerSortKey === key) {
      setInstallerSortDirection((direction) => direction === "asc" ? "desc" : "asc");
      return;
    }
    setInstallerSortKey(key);
    setInstallerSortDirection("asc");
  }

  function installerCarts(name: string) {
    return carts.filter((cart) => cart.installer === name && cart.status !== "AVAILABLE");
  }

  function openInstallerDetail(name: string) {
    setSelectedInstallerDetail(name);
    setEditedInstallerName(name);
    setInstallerNameEditing(false);
  }

  function openCartHistory(cartId: string) {
    setSelectedCartDetail(cartId);
  }

  function openCheckoutModal() {
    if (!access.checkout) {
      setMessage(`${userRole} role cannot check out carts.`);
      return;
    }
    setCheckoutCart("");
    setCheckoutInstaller("");
    setCheckoutLocation("");
    setCheckoutModalOpen(true);
  }

  function openReturnModal() {
    if (!access.returnCart) {
      setMessage(`${userRole} role cannot return carts.`);
      return;
    }
    setReturnedCart("");
    setReturnModalOpen(true);
  }

  const activeInstallers = installers.filter((installer) => installer.active);
  const installerDetails = selectedInstallerDetail
    ? installers.find((installer) => installer.name === selectedInstallerDetail)
    : undefined;
  const selectedCart = selectedCartDetail ? carts.find((cart) => cart.id === selectedCartDetail) : undefined;
  const selectedCartHistory = selectedCartDetail ? history.filter((item) => item.join(" ").includes(selectedCartDetail)) : [];
  const returnedCartHistory = returnedCart ? history.filter((item) => item.join(" ").includes(returnedCart)) : [];

  function checkOutCart() {
    if (!access.checkout) {
      setMessage(`${userRole} role cannot check out carts.`);
      return;
    }
    const cart = carts.find((item) => item.id === checkoutCart);
    if (!cart || cart.status !== "AVAILABLE") {
      setMessage(checkoutCart ? `${checkoutCart} is not available for checkout.` : "Select a cart before checking out.");
      return;
    }
    if (!checkoutInstaller) {
      setMessage("Select an installer before checking out.");
      return;
    }

    const location = checkoutLocation.trim() || "With installer";

    setCarts((items) => items.map((item) => item.id === checkoutCart
      ? { ...item, status: "CHECKED OUT", installer: checkoutInstaller, checkoutDate: "Aug 11, 2026", daysOut: 0, location, notes: "Checked out from dashboard" }
      : item));
    setSelectedInstaller(checkoutInstaller);
    setCheckoutLocation("");
    setCheckoutModalOpen(false);
    record(`${checkoutCart} checked out to ${checkoutInstaller} at ${location}`, `Issued by ${userName}`);
    setMessage(`${checkoutCart} checked out to ${checkoutInstaller}.`);
  }

  function completeReturn() {
    if (!access.returnCart) {
      setMessage(`${userRole} role cannot return carts.`);
      return;
    }
    const cart = carts.find((item) => item.id === returnedCart);
    if (!cart) {
      setMessage("Select a returned cart before completing the return.");
      return;
    }

    setCarts((items) => items.map((item) => item.id === returnedCart
      ? { ...item, status: "AVAILABLE", installer: undefined, checkoutDate: undefined, daysOut: undefined, returnDate: "Aug 11, 2026", location: "Shop bay 2", notes: "Returned and verified" } as Cart
      : item));
    setReturnModalOpen(false);
    record(`${returnedCart} returned by ${cart.installer ?? "installer"}`, `Received by ${userName}`);
    setReturnedCart("");
    setMessage(`${returnedCart} return completed and marked AVAILABLE.`);
  }

  function addCart() {
    if (!access.manageCarts) {
      setMessage(`${userRole} role cannot add carts.`);
      return;
    }
    const id = normalizeCartId(newCartId);
    if (!/^CART-\d{3,}$/.test(id)) {
      setMessage("Enter a valid Cart ID, such as CART-051.");
      return;
    }
    if (carts.some((cart) => cart.id === id)) {
      setMessage(`${id} already exists. Cart IDs cannot be reused.`);
      return;
    }

    setCarts((items) => [...items, { id, serial: `SN-26-${id.replace("CART-", "")}`, status: "AVAILABLE", type: "A-frame", condition: "New", location: "Shop intake", notes: "Added by admin" }]);
    setSearch(id);
    setFilter("ALL");
    setNewCartId("");
    setCartModalOpen(false);
    record(`${id} added to inventory`, `Added by ${userName}`);
    setMessage(`${id} added and ready for checkout.`);
  }

  function addInstaller() {
    if (!access.manageInstallers) {
      setMessage(`${userRole} role cannot add installers.`);
      return;
    }
    const name = newInstallerName.trim();
    if (!name) {
      setMessage("Enter an installer name before confirming.");
      return;
    }
    if (installers.some((installer) => installer.name.toLowerCase() === name.toLowerCase())) {
      setMessage(`${name} already exists in the installer list.`);
      return;
    }

    setInstallers((items) => [...items, { id: Math.max(0, ...items.map((installer) => installer.id)) + 1, name, role: "Countertop Installer", active: true }]);
    setSelectedInstaller(name);
    setCheckoutInstaller(name);
    setNewInstallerName("");
    setInstallerModalOpen(false);
    record(`${name} added as an installer`, `Added by ${userName}`);
    setMessage(`${name} added as an installer.`);
  }

  function showMyCarts() {
    if (userRole === "Installer" && !currentInstallerName) {
      setSearch("");
      setFilter("ALL");
      setMessage("No installer profile is linked to this signed-in account yet.");
      window.location.href = "/carts";
      return;
    }
    const installerName = currentInstallerName ?? "Jorge Bocanegra";
    setSelectedInstaller(installerName);
    setSearch(installerName);
    setFilter("ALL");
    setMessage(`Showing ${installerName}'s current carts.`);
    window.location.href = "/carts";
  }

  function toggleInstallerActive(name: string) {
    if (!access.manageInstallers) {
      setMessage(`${userRole} role cannot change installer access.`);
      return;
    }
    const installer = installers.find((item) => item.name === name);
    if (!installer) return;
    setInstallers((items) => items.map((item) => item.name === name ? { ...item, active: !item.active } : item));
    record(`${name} marked ${installer.active ? "inactive" : "active"}`, `Updated by ${userName}`);
    setMessage(`${name} is now ${installer.active ? "inactive" : "active"}.`);
  }

  function saveInstallerName() {
    if (!access.manageInstallers) {
      setMessage(`${userRole} role cannot edit installer names.`);
      return;
    }
    if (!selectedInstallerDetail) return;
    const nextName = editedInstallerName.trim();
    if (!nextName) {
      setMessage("Installer name cannot be blank.");
      return;
    }
    if (installers.some((installer) => installer.name.toLowerCase() === nextName.toLowerCase() && installer.name !== selectedInstallerDetail)) {
      setMessage(`${nextName} already exists in the installer list.`);
      return;
    }

    setInstallers((items) => items.map((installer) => installer.name === selectedInstallerDetail ? { ...installer, name: nextName } : installer));
    setCarts((items) => items.map((cart) => cart.installer === selectedInstallerDetail ? { ...cart, installer: nextName } : cart));
    setHistory((items) => items.map(([time, event, actor]) => [time, event.replaceAll(selectedInstallerDetail, nextName), actor.replaceAll(selectedInstallerDetail, nextName)]));
    if (selectedInstaller === selectedInstallerDetail) setSelectedInstaller(nextName);
    if (checkoutInstaller === selectedInstallerDetail) setCheckoutInstaller(nextName);
    record(`${selectedInstallerDetail} renamed to ${nextName}`, `Updated by ${userName}`);
    setSelectedInstallerDetail(nextName);
    setInstallerNameEditing(false);
    setMessage(`${selectedInstallerDetail} renamed to ${nextName}.`);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand"><div className="brand-mark">SC</div><div><p>StoneCart</p><span>Fabrication control</span></div></div>
        <nav>
          {allowedNavItems.map((item) => (
            <a className={(item.label === "Dashboard" && page === "dashboard") || routes[item.label] === `/${page}` ? "active" : ""} href={routes[item.label]} key={item.label}>
              <span className={`nav-icon ${item.icon}`} aria-hidden="true" />{item.label}
            </a>
          ))}
        </nav>
        <div className="profile-chip"><strong>{userName}</strong><span>{userRole} access</span></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="quick-actions" aria-label="Mobile quick actions">
            {access.checkout && <button onClick={openCheckoutModal}>Check Out</button>}
            {access.returnCart && <button onClick={openReturnModal}>Return</button>}
            <button onClick={showMyCarts}>My Carts</button>
            {access.viewNotifications && <button className="notification-button" aria-label="Notifications" onClick={() => setNotificationModalOpen(true)}>
              <span className="notification-glyph" aria-hidden="true" />
              <span className="notification-count">{notifications.length}</span>
            </button>}
            <ClerkUserControl />
          </div>
        </header>

        {!pageAllowed && (
          <section className="panel access-panel">
            <p className="eyebrow">Restricted area</p>
            <h2>{userRole} access does not include this page.</h2>
            <p>{access.summary}. Use the available navigation links for this role.</p>
          </section>
        )}

        {show("carts") && <section className="search-panel" id="dashboard">
          <label htmlFor="global-search">Global search</label>
          <input id="global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Cart ID, installer, serial number, or status" />
          <div className="scope-pills" aria-label="Cart filters">
            {["ALL", "AVAILABLE", "CHECKED OUT", "OVERDUE", "MISSING", "MAINTENANCE", "RETIRED"].map((status) => (
              <button className={filter === status ? "selected" : ""} key={status} onClick={() => setFilter(status as Status | "ALL")}>{status}</button>
            ))}
          </div>
        </section>}

        {page === "dashboard" && <section className="metrics-grid" aria-label="Cart status totals">
          {[["Total carts", totals.total], ["Available", totals.AVAILABLE], ["Checked out", totals["CHECKED OUT"]], ["Overdue", totals.OVERDUE], ["Missing", totals.MISSING], ["Maintenance", totals.MAINTENANCE]].map(([label, value]) => (
            <button className="metric" key={label} onClick={() => setFilter(label === "Total carts" ? "ALL" : String(label).toUpperCase() as Status)}>
              <span>{label}</span><strong>{value}</strong>
            </button>
          ))}
        </section>}

        {show("carts") && <section className="panel table-panel" id="carts">
          <div className="panel-heading"><div><p className="eyebrow">Inventory</p>{page === "dashboard" && <h2>Carts currently out</h2>}</div>{access.manageCarts && <button className="secondary-action" onClick={() => setCartModalOpen(true)}>Add Cart</button>}</div>
          <div className="cart-table" role="table" aria-label="Cart inventory">
            <div className="table-row table-head" role="row">
              {[
                ["Cart ID", "id"],
                ["Status", "status"],
                ["Installer", "installer"],
                ["Checkout", "checkoutDate"],
                ["Days", "daysOut"],
                ["Location", "location"],
              ].map(([label, key]) => (
                <button className="sort-button" key={key} onClick={() => toggleSort(key as SortKey)}>
                  {label}
                  {sortKey === key && <span>{sortDirection === "asc" ? "Up" : "Down"}</span>}
                </button>
              ))}
            </div>
            {visibleCarts.map((cart) => (
              <button className="table-row row-button" role="row" key={cart.id} onClick={() => openCartHistory(cart.id)}>
                <strong>{cart.id}</strong><span className={`status-badge ${cart.status.toLowerCase().replace(" ", "-")}`}>{cart.status}</span><span>{cart.installer ?? "Unassigned"}</span><span>{cart.checkoutDate ?? "Not out"}</span><span>{cart.daysOut ?? "-"}</span><span>{cart.location}</span>
              </button>
            ))}
          </div>
        </section>}

        {(showOnly("installers") || showOnly("admin")) && <section className="tri-layout">
          {showOnly("installers") && (
          <article className="panel" id="installers">
            <div className="panel-heading"><div><p className="eyebrow">Installers</p><h2>Installer possession list</h2></div>{access.manageInstallers && <button className="secondary-action" onClick={() => setInstallerModalOpen(true)}>Add Installer</button>}</div>
            <div className="installer-table">
              <div className="installer-row installer-head">
                {[
                  ["Installer", "name"],
                  ["Carts in possession", "assigned"],
                  ["Status", "status"],
                ].map(([label, key]) => (
                  <button className="sort-button" key={key} onClick={() => toggleInstallerSort(key as InstallerSortKey)}>
                    {label}
                    {installerSortKey === key && <span>{installerSortDirection === "asc" ? "Up" : "Down"}</span>}
                  </button>
                ))}
              </div>
              {sortedInstallers.map((installer) => {
                const assigned = installerCarts(installer.name);
                const hasProblem = assigned.some((cart) => cart.status === "OVERDUE" || cart.status === "MISSING");
                return (
                  <div className="installer-row installer-button" key={installer.id}>
                    <button className="installer-main-button" onClick={() => openInstallerDetail(installer.name)}>
                      <strong>{installer.name}</strong>
                      <span className="installer-meta">#{installer.id} · {installer.role}</span>
                    </button>
                    <button className="installer-main-button" onClick={() => openInstallerDetail(installer.name)}>
                      <span>{assigned.length ? assigned.map((cart) => cart.id).join(", ") : "None"}</span>
                    </button>
                    <span className={`status-badge ${hasProblem ? "missing" : assigned.length ? "checked-out" : "available"}`}>
                      {!installer.active ? "Inactive" : hasProblem ? "Needs review" : assigned.length ? "Has carts" : "Clear"}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
          )}

          {showOnly("admin") && (
          <article className="panel" id="admin">
            <p className="eyebrow">Admin controls</p><h2>Policy settings</h2>
            <div className="setting-row">
              <span>Overdue after</span>
              <label className="setting-input">
                <input type="number" min="1" value={policySettings.overdueDays} onChange={(event) => setPolicySettings((settings) => ({ ...settings, overdueDays: Number(event.target.value) || 1 }))} />
                days
              </label>
            </div>
            <div className="setting-row">
              <span>Missing after</span>
              <label className="setting-input">
                <input type="number" min="1" value={policySettings.missingDays} onChange={(event) => setPolicySettings((settings) => ({ ...settings, missingDays: Number(event.target.value) || 1 }))} />
                days
              </label>
            </div>
            <div className="setting-row">
              <span>Roles</span>
              <input className="roles-input" value={policySettings.roles} onChange={(event) => setPolicySettings((settings) => ({ ...settings, roles: event.target.value }))} />
            </div>
            <div className="permission-grid" aria-label="Role permissions">
              {validRoles.map((role) => (
                <div className="permission-card" key={role}>
                  <div>
                    <strong>{role}</strong>
                    <span>{roleAccess[role].summary}</span>
                  </div>
                  <ul>
                    {roleAccess[role].permissions.map((permission) => <li key={permission}>{permission}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </article>
          )}
        </section>}

        {(showOnly("history") || showOnly("admin")) && <section className="split-layout">
          {showOnly("history") && (
          <article className="panel" id="history">
            <p className="eyebrow">Permanent cart history</p><h2>Live transaction timeline</h2>
            <ol className="timeline">{history.map(([time, event, actor]) => <li key={`${time}-${event}-${actor}`}><span>{time}</span><strong>{event}</strong><p>{actor}</p></li>)}</ol>
          </article>
          )}

          {showOnly("admin") && (
          <article className="panel schema-panel">
            <p className="eyebrow">Database structure</p><h2>PostgreSQL relational model</h2>
            <p>The cart record stores permanent physical identity. Checkout, return, status, notification, and audit tables preserve history through foreign keys instead of overwriting past activity.</p>
            <div className="schema-list">{schema.map(([table, purpose]) => <div key={table}><code>{table}</code><span>{purpose}</span></div>)}</div>
          </article>
          )}
        </section>}
      </section>

      {cartModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-cart-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Add cart</p>
                <h2 id="add-cart-title">Create permanent Cart ID</h2>
              </div>
            </div>
            <label>
              Cart ID
              <input value={newCartId} onChange={(event) => setNewCartId(event.target.value)} placeholder="CART-051" autoFocus />
            </label>
            <p className="modal-note">Cart IDs are permanent and cannot be reused once added.</p>
            <div className="action-row modal-actions">
              <button className="secondary-action" onClick={() => setCartModalOpen(false)}>Cancel</button>
              <button className="primary-action" onClick={addCart}>Confirm Add Cart</button>
            </div>
          </section>
        </div>
      )}

      {checkoutModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <section className="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Checkout workflow</p>
                <h2 id="checkout-title">{checkoutCart ? `Issue ${checkoutCart}` : "Issue cart"}</h2>
              </div>
              {selectedCheckoutCart && <span className={`status-badge ${selectedCheckoutCart.status.toLowerCase().replace(" ", "-")}`}>{selectedCheckoutCart.status}</span>}
            </div>
            <label>Cart to issue<select value={checkoutCart} onChange={(event) => setCheckoutCart(event.target.value)}><option value="">Select cart</option>{availableCarts.map((cart) => <option key={cart.id}>{cart.id}</option>)}</select></label>
            <label>Installer receiving cart<select value={checkoutInstaller} onChange={(event) => setCheckoutInstaller(event.target.value)}><option value="">Select installer</option>{activeInstallers.map((installer) => <option key={installer.id}>{installer.name}</option>)}</select></label>
            <label>Location<input value={checkoutLocation} onChange={(event) => setCheckoutLocation(event.target.value)} placeholder="Jobsite, address, or shop area" /></label>
            <div className="receipt"><span>Cart ID</span><strong>{checkoutCart}</strong><span>Issued by</span><strong>{userName}</strong><span>Checkout time</span><strong>{nowLabel}</strong><span>Installer</span><strong>{checkoutInstaller}</strong><span>Location</span><strong>{checkoutLocation}</strong></div>
            <div className="action-row modal-actions">
              <button className="secondary-action" onClick={() => setCheckoutModalOpen(false)}>Cancel</button>
              <button className="primary-action" onClick={checkOutCart} disabled={!checkoutCart || !checkoutInstaller}>Check Out Cart</button>
            </div>
          </section>
        </div>
      )}

      {returnModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <section className="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="return-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Return workflow</p>
                <h2 id="return-title">Return cart</h2>
              </div>
              {selectedReturnedCart && <span className={`status-badge ${selectedReturnedCart.status.toLowerCase().replace(" ", "-")}`}>{selectedReturnedCart.status}</span>}
            </div>
            <label>Returned cart<select value={returnedCart} onChange={(event) => setReturnedCart(event.target.value)}><option value="">Select returned cart</option>{returnableCarts.map((cart) => <option key={cart.id}>{cart.id}</option>)}</select></label>
            <div className="return-history" role="status">
              <h3>{returnedCart ? `${returnedCart} history` : "Cart history"}</h3>
              <ol className="timeline">
                {returnedCartHistory.map(([time, event, actor]) => (
                  <li key={`${time}-${event}-${actor}`}><span>{time}</span><strong>{event}</strong><p>{actor}</p></li>
                ))}
                {returnedCart && !returnedCartHistory.length && (
                  <li><span>No history yet</span><strong>{returnedCart} has no recorded transactions</strong><p>Completing the return will create the first return event.</p></li>
                )}
                {!returnedCart && (
                  <li><span>Select a cart</span><strong>History will appear here</strong><p>Choose the cart being returned to review its activity before completing the return.</p></li>
                )}
              </ol>
            </div>
            <div className="action-row modal-actions">
              <button className="secondary-action" onClick={() => setReturnModalOpen(false)}>Cancel</button>
              <button className="primary-action" onClick={completeReturn} disabled={!returnedCart}>Complete Return</button>
            </div>
          </section>
        </div>
      )}

      {notificationModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="notifications-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Notification center</p>
                <h2 id="notifications-title">Manager alerts</h2>
              </div>
            </div>
            <ul className="notification-list modal-list">{notifications.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="action-row modal-actions">
              <button className="primary-action" onClick={() => setNotificationModalOpen(false)}>Done</button>
            </div>
          </section>
        </div>
      )}

      {selectedInstallerDetail && (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <section className="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="installer-detail-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Installer details</p>
                {installerNameEditing ? (
                  <label className="inline-edit">
                    Installer name
                    <input value={editedInstallerName} onChange={(event) => setEditedInstallerName(event.target.value)} autoFocus />
                  </label>
                ) : (
                  <h2 id="installer-detail-title">{selectedInstallerDetail}</h2>
                )}
                <span className="installer-meta">#{installerDetails?.id} · {installerDetails?.role}</span>
              </div>
              <span className={`status-badge ${installerDetails?.active ? "available" : "retired"}`}>{installerDetails?.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="installer-detail-grid">
              <div className="installer-score compact-score">
                <strong>{installerCarts(selectedInstallerDetail).length}</strong>
                <span>Current carts outstanding</span>
              </div>
              <ul className="compact-list">
                {installerCarts(selectedInstallerDetail).map((cart) => (
                  <li key={cart.id}>
                    <span>{cart.id}</span>
                    <strong className={cart.status === "OVERDUE" || cart.status === "MISSING" ? "danger-text" : ""}>{cart.status}</strong>
                  </li>
                ))}
                {!installerCarts(selectedInstallerDetail).length && <li><span>No carts currently assigned</span><strong>Clear</strong></li>}
                <li><span>Returned carts history</span><strong>{selectedInstallerDetail === "John Smith" ? 14 : 8}</strong></li>
              </ul>
            </div>
            <h2 className="modal-subhead">Cart history</h2>
            <ol className="timeline">
              {history
                .filter((item) => item.join(" ").includes(selectedInstallerDetail))
                .map(([time, event, actor]) => <li key={`${time}-${event}-${actor}`}><span>{time}</span><strong>{event}</strong><p>{actor}</p></li>)}
              {!history.some((item) => item.join(" ").includes(selectedInstallerDetail)) && <li><span>No history yet</span><strong>New installer profile</strong><p>Future checkout and return activity will appear here.</p></li>}
            </ol>
            <div className="action-row modal-actions">
              {access.manageInstallers && (installerNameEditing ? (
                <button className="secondary-action" onClick={saveInstallerName}>Save name</button>
              ) : (
                <button className="secondary-action" onClick={() => setInstallerNameEditing(true)}>Edit name</button>
              ))}
              {access.manageInstallers && <button className="secondary-action" onClick={() => toggleInstallerActive(selectedInstallerDetail)}>
                {installerDetails?.active ? "Make inactive" : "Make active"}
              </button>}
              <button className="primary-action" onClick={closeModals}>Done</button>
            </div>
          </section>
        </div>
      )}

      {selectedCartDetail && (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <section className="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="cart-history-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Cart history</p>
                <h2 id="cart-history-title">{selectedCartDetail}</h2>
                <span className="installer-meta">{selectedCart?.serial} · {selectedCart?.type}</span>
              </div>
              {selectedCart && <span className={`status-badge ${selectedCart.status.toLowerCase().replace(" ", "-")}`}>{selectedCart.status}</span>}
            </div>
            <ol className="timeline">
              {selectedCartHistory.map(([time, event, actor]) => (
                <li key={`${time}-${event}-${actor}`}><span>{time}</span><strong>{event}</strong><p>{actor}</p></li>
              ))}
              {!selectedCartHistory.length && (
                <li><span>No history yet</span><strong>{selectedCartDetail} has no recorded transactions</strong><p>Future checkout and return activity will appear here.</p></li>
              )}
            </ol>
            <div className="action-row modal-actions">
              <button className="primary-action" onClick={closeModals}>Done</button>
            </div>
          </section>
        </div>
      )}

      {installerModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-installer-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Add installer</p>
                <h2 id="add-installer-title">Create installer profile</h2>
              </div>
            </div>
            <label>
              Installer name
              <input value={newInstallerName} onChange={(event) => setNewInstallerName(event.target.value)} placeholder="Installer name" autoFocus />
            </label>
            <p className="modal-note">The installer will be available immediately in checkout and installer profile lists.</p>
            <div className="action-row modal-actions">
              <button className="secondary-action" onClick={() => setInstallerModalOpen(false)}>Cancel</button>
              <button className="primary-action" onClick={addInstaller}>Confirm Add Installer</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
