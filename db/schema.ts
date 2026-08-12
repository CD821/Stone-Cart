import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const installers = pgTable("installers", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  color: varchar("color", { length: 32 }),
  role: varchar("role", { length: 80 }).notNull().default("Countertop Installer"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const carts = pgTable("carts", {
  id: varchar("id", { length: 24 }).primaryKey(),
  serial: varchar("serial", { length: 80 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("AVAILABLE"),
  type: varchar("type", { length: 80 }).notNull().default("A-frame"),
  condition: varchar("condition", { length: 80 }).notNull().default("Good"),
  location: text("location").notNull().default("Shop bay 2"),
  installerId: integer("installer_id").references(() => installers.id),
  checkoutDate: timestamp("checkout_date", { withTimezone: true }),
  daysOut: integer("days_out"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartHistory = pgTable("cart_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cartId: varchar("cart_id", { length: 24 }).notNull().references(() => carts.id),
  event: text("event").notNull(),
  actor: varchar("actor", { length: 160 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
