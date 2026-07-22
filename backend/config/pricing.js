/**
 * Tiered pricing calculation for StackVault.
 * Ensures consistent profit margins across cost tiers.
 */

function getSellPriceCents(costCents) {
  const cost = parseInt(costCents, 10);
  if (isNaN(cost)) return 99;

  // 1. Micro-cents tier (Free to $0.05) -> $0.99
  if (cost <= 5) return 99;

  // 2. $0.06 to $0.50 -> $1.99
  if (cost <= 50) return 199;

  // 3. $0.51 to $1.00 -> $2.99
  if (cost <= 100) return 299;

  // 4. $1.01 to $5.00 -> 100% markup + $1 flat
  if (cost <= 500) return Math.round(cost * 2.0) + 100;

  // 5. Over $5.00 -> 50% markup + $2 flat
  return Math.round(cost * 1.5) + 200;
}

function getProfitCents(sellCents, costCents) {
  return sellCents - costCents;
}

function centsToDollars(cents) {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(dollars) {
  return Math.round(parseFloat(dollars) * 100);
}

module.exports = {
  getSellPriceCents,
  getProfitCents,
  centsToDollars,
  dollarsToCents,
};
