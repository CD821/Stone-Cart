"use client";

import { useMemo, useState } from "react";

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

const carts: Cart[] = [
  {
    id: "CART-006",
    serial: "SN-22-1048",
    status: "AVAILABLE",
    type: "A-frame",
    condition: "Older frame, serviceable",
    location: "Shop bay 2",
    notes: "Ready for reassignment",
  },
  {
    id: "CART-018",
    serial: "SN-24-1882",
    status: "OVERDUE",
    type: "Slab dolly",
    condition: "Good",
    location: "With installer",
    installer: "John Smith",
    checkoutDate: "Aug 8, 2026",
    daysOut: 3,
    notes: "Manager notification sent",
  },
  {
    id: "CART-021",
    serial: "SN-25-2190",
    status: "CHECKED OUT",
    type: "A-frame",
    condition: "Excellent",
    location: "Lakeside condos jobsite",
    installer: "Mike Lopez",
    checkoutDate: "Aug 10, 2026",
    daysOut: 1,
    notes: "Expected back today",
  },
  {
    id: "CART-027",
    serial: "SN-25-2307",
    status: "CHECKED OUT",
    type: "A-frame",
    condition: "Excellent",
    location: "With installer",
    installer: "John Smith",
    checkoutDate: "Aug 11, 2026",
    daysOut: 0,
    notes: "QR label verified at checkout",
  },
  {
    id: "CART-042",
    serial: "SN-23-1620",
    status: "MISSING",
    type: "Heavy duty",
    condition: "Unknown",
    location: "Unconfirmed",
    installer: "Rafael Pena",
    checkoutDate: "Aug 5, 2026",
    daysOut: 6,
    notes: "Manager override required",
  },
  {
    id: "CART-055",
    serial: "SN-26-0114",
    status: "MAINTENANCE",
    type: "A-frame",
    condition: "Needs wheel repair",
    location: "Repair rack",
    notes: "Do not issue",
  },
];

const history = [
  ["Aug 11, 8:32 AM", "CART-027 checked out to John Smith", "Issued by Carlos"],
  ["Aug 10, 3:41 PM", "CART-021 checked out to Mike Lopez", "Issued by Maria"],
  ["Aug 9, 4:17 PM", "CART-027 returned by John Smith", "Received by Maria"],
  ["Aug 8, 7:16 AM", "CART-018 checked out to John Smith", "Issued by Carlos"],
];

const navItems = [
  "Dashboard",
  "Carts",
  "Check Out",
  "Returns",
  "Installers",
  "History",
  "Notifications",
  "Admin",
];

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

export default function Home() {
  const [search, setSearch] = useState("027");
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [expectedCart, setExpectedCart] = useState("CART-021");
  const [returnedCart, setReturnedCart] = useState("CART-006");
  const [checkoutInstaller, setCheckoutInstaller] = useState("Mike Lopez");

  const filteredCarts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return carts.filter((cart) => {
      const matchesFilter = filter === "ALL" || cart.status === filter;
      const matchesQuery =
        !query ||
        [cart.id, cart.serial, cart.status, cart.installer ?? "", cart.location]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [filter, search]);

  const totals = useMemo(() => {
    return carts.reduce(
      (acc, cart) => {
        acc.total += 1;
        acc[cart.status] += 1;
        return acc;
      },
      {
        total: 0,
        AVAILABLE: 0,
        "CHECKED OUT": 0,
        OVERDUE: 0,
        MISSING: 0,
        MAINTENANCE: 0,
        RETIRED: 0,
      } as Record<Status | "total", number>,
    );
  }, []);

  const incorrectReturn = expectedCart !== returnedCart;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">SC</div>
          <div>
            <p>StoneCart</p>
            <span>Fabrication control</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <a className={item === "Dashboard" ? "active" : ""} href={`#${item.toLowerCase().replace(" ", "-")}`} key={item}>
              <span aria-hidden="true">{item.slice(0, 1)}</span>
              {item}
            </a>
          ))}
        </nav>
        <div className="profile-chip">
          <strong>Carlos</strong>
          <span>Manager access</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Countertop fabrication cart accountability</p>
            <h1>Know exactly which cart is out, who has it, and what must come back.</h1>
          </div>
          <div className="quick-actions" aria-label="Mobile quick actions">
            <button>Scan Cart</button>
            <button>Check Out</button>
            <button>Return</button>
            <button>My Carts</button>
          </div>
        </header>

        <section className="search-panel" id="dashboard">
          <label htmlFor="global-search">Global search</label>
          <input
            id="global-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Cart ID, installer, serial number, or status"
          />
          <div className="scope-pills" aria-label="Cart filters">
            {["ALL", "AVAILABLE", "CHECKED OUT", "OVERDUE", "MISSING", "MAINTENANCE", "RETIRED"].map((status) => (
              <button
                className={filter === status ? "selected" : ""}
                key={status}
                onClick={() => setFilter(status as Status | "ALL")}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        <section className="metrics-grid" aria-label="Cart status totals">
          {[
            ["Total carts", totals.total],
            ["Available", totals.AVAILABLE],
            ["Checked out", totals["CHECKED OUT"]],
            ["Overdue", totals.OVERDUE],
            ["Missing", totals.MISSING],
            ["Maintenance", totals.MAINTENANCE],
          ].map(([label, value]) => (
            <article className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="split-layout">
          <article className="panel" id="returns">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Return verification</p>
                <h2>Exact cart match required</h2>
              </div>
              <span className={incorrectReturn ? "alert-dot" : "ok-dot"} />
            </div>
            <div className="verify-grid">
              <label>
                Expected cart
                <select value={expectedCart} onChange={(event) => setExpectedCart(event.target.value)}>
                  <option>CART-021</option>
                  <option>CART-027</option>
                  <option>CART-018</option>
                </select>
              </label>
              <label>
                Returned cart
                <select value={returnedCart} onChange={(event) => setReturnedCart(event.target.value)}>
                  <option>CART-006</option>
                  <option>CART-021</option>
                  <option>CART-027</option>
                  <option>CART-018</option>
                </select>
              </label>
            </div>
            <div className={incorrectReturn ? "return-warning" : "return-ok"} role="status">
              <strong>{incorrectReturn ? "Incorrect Cart Returned" : "Return verified"}</strong>
              <span>Expected: {expectedCart}</span>
              <span>Returned: {returnedCart}</span>
              <p>
                {incorrectReturn
                  ? `${expectedCart} remains assigned until the exact cart is returned or a manager override is approved.`
                  : "The original checkout can be closed and the cart can return to AVAILABLE."}
              </p>
            </div>
            <div className="action-row">
              <button className="primary-action" disabled={incorrectReturn}>
                Complete Return
              </button>
              <button className="secondary-action">Manager Override</button>
            </div>
          </article>

          <article className="panel" id="check-out">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Checkout workflow</p>
                <h2>Issue CART-006</h2>
              </div>
              <span className="status-badge available">Available</span>
            </div>
            <label>
              Installer receiving cart
              <select value={checkoutInstaller} onChange={(event) => setCheckoutInstaller(event.target.value)}>
                <option>Mike Lopez</option>
                <option>John Smith</option>
                <option>Rafael Pena</option>
              </select>
            </label>
            <div className="receipt">
              <span>Cart ID</span>
              <strong>CART-006</strong>
              <span>Issued by</span>
              <strong>Carlos</strong>
              <span>Checkout time</span>
              <strong>Aug 11, 2026, 1:30 PM</strong>
              <span>Installer</span>
              <strong>{checkoutInstaller}</strong>
            </div>
            <button className="primary-action full">Check Out Cart</button>
          </article>
        </section>

        <section className="panel table-panel" id="carts">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Carts currently out</h2>
            </div>
            <button className="secondary-action">Add Cart</button>
          </div>
          <div className="cart-table" role="table" aria-label="Cart inventory">
            <div className="table-row table-head" role="row">
              <span>Cart ID</span>
              <span>Status</span>
              <span>Installer</span>
              <span>Checkout</span>
              <span>Days</span>
              <span>Location</span>
            </div>
            {filteredCarts.map((cart) => (
              <div className="table-row" role="row" key={cart.id}>
                <strong>{cart.id}</strong>
                <span className={`status-badge ${cart.status.toLowerCase().replace(" ", "-")}`}>{cart.status}</span>
                <span>{cart.installer ?? "Unassigned"}</span>
                <span>{cart.checkoutDate ?? "Not out"}</span>
                <span>{cart.daysOut ?? "-"}</span>
                <span>{cart.location}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="tri-layout">
          <article className="panel" id="installers">
            <p className="eyebrow">Installer profile</p>
            <h2>John Smith</h2>
            <div className="installer-score">
              <strong>2</strong>
              <span>Current carts outstanding</span>
            </div>
            <ul className="compact-list">
              <li><span>CART-027</span><strong>0 days</strong></li>
              <li><span>CART-018</span><strong className="danger-text">3 days overdue</strong></li>
              <li><span>Previous carts</span><strong>14</strong></li>
            </ul>
          </article>

          <article className="panel" id="notifications">
            <p className="eyebrow">Notification center</p>
            <h2>Manager alerts</h2>
            <ul className="notification-list">
              <li>CART-018 has been checked out to John Smith for 3 days.</li>
              <li>CART-042 is now considered MISSING.</li>
              <li>Mike Lopez currently has 1 outstanding cart.</li>
            </ul>
          </article>

          <article className="panel" id="admin">
            <p className="eyebrow">Admin controls</p>
            <h2>Policy settings</h2>
            <div className="setting-row"><span>Overdue after</span><strong>2 days</strong></div>
            <div className="setting-row"><span>Missing after</span><strong>5 days</strong></div>
            <div className="setting-row"><span>Roles</span><strong>Admin, Manager, Employee, Installer</strong></div>
          </article>
        </section>

        <section className="split-layout">
          <article className="panel" id="history">
            <p className="eyebrow">Permanent cart history</p>
            <h2>CART-027 timeline</h2>
            <ol className="timeline">
              {history.map(([time, event, actor]) => (
                <li key={`${time}-${event}`}>
                  <span>{time}</span>
                  <strong>{event}</strong>
                  <p>{actor}</p>
                </li>
              ))}
            </ol>
          </article>

          <article className="panel schema-panel">
            <p className="eyebrow">Database structure</p>
            <h2>PostgreSQL relational model</h2>
            <p>
              The cart record stores permanent physical identity. Checkout, return, status, notification,
              and audit tables preserve history through foreign keys instead of overwriting past activity.
            </p>
            <div className="schema-list">
              {schema.map(([table, purpose]) => (
                <div key={table}>
                  <code>{table}</code>
                  <span>{purpose}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
