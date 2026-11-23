/**
 * Offline verification for monthly/yearly spend + due-date helpers.
 * Run: node scripts/verify-stats.mjs
 */
import assert from "node:assert/strict";

function monthlyEquivalent(amount, cycle) {
  if (cycle === "yearly") return Math.round(amount / 12);
  if (cycle === "weekly") return Math.round((amount * 52) / 12);
  return amount;
}

function yearlyEquivalent(amount, cycle) {
  return monthlyEquivalent(amount, cycle) * 12;
}

function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const today = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  );
  return Math.round((target - today) / 86_400_000);
}

function isDueSoon(item, now = new Date()) {
  if (!item.is_active || !item.next_billing_on) return false;
  const days = daysUntil(item.next_billing_on, now);
  if (days === null) return false;
  return days >= 0 && days <= (item.reminder_days ?? 3);
}

// --- monthly / yearly ---
assert.equal(monthlyEquivalent(390, "monthly"), 390);
assert.equal(yearlyEquivalent(390, "monthly"), 4680);

assert.equal(monthlyEquivalent(1200, "yearly"), 100);
assert.equal(yearlyEquivalent(1200, "yearly"), 1200);

assert.equal(monthlyEquivalent(100, "weekly"), Math.round((100 * 52) / 12));
assert.equal(
  yearlyEquivalent(100, "weekly"),
  Math.round((100 * 52) / 12) * 12,
);

assert.equal(monthlyEquivalent(50, "custom"), 50);
assert.equal(yearlyEquivalent(50, "custom"), 600);

const active = [
  { amount_twd: 390, billing_cycle: "monthly", is_active: true },
  { amount_twd: 1200, billing_cycle: "yearly", is_active: true },
  { amount_twd: 99, billing_cycle: "monthly", is_active: false },
];
const monthlyTotal = active
  .filter((i) => i.is_active)
  .reduce(
    (s, i) => s + monthlyEquivalent(i.amount_twd, i.billing_cycle),
    0,
  );
const yearlyTotal = active
  .filter((i) => i.is_active)
  .reduce(
    (s, i) => s + yearlyEquivalent(i.amount_twd, i.billing_cycle),
    0,
  );
assert.equal(monthlyTotal, 490);
assert.equal(yearlyTotal, 5880);
assert.equal(yearlyTotal, monthlyTotal * 12);

// --- due dates (fixed Taipei calendar day) ---
const now = new Date("2026-11-23T12:00:00+08:00");
assert.equal(daysUntil("2026-11-23", now), 0);
assert.equal(daysUntil("2026-11-25", now), 2);
assert.equal(daysUntil("2026-11-20", now), -3);
assert.equal(daysUntil(null, now), null);
assert.equal(daysUntil("bad", now), null);

assert.equal(
  isDueSoon(
    {
      is_active: true,
      next_billing_on: "2026-11-25",
      reminder_days: 3,
    },
    now,
  ),
  true,
);
assert.equal(
  isDueSoon(
    {
      is_active: true,
      next_billing_on: "2026-11-30",
      reminder_days: 3,
    },
    now,
  ),
  false,
);
assert.equal(
  isDueSoon(
    {
      is_active: false,
      next_billing_on: "2026-11-25",
      reminder_days: 3,
    },
    now,
  ),
  false,
);

console.log("verify-stats: all assertions passed");
