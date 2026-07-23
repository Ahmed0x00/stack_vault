/**
 * Tiered pricing calculation for StackVault.
 * Ensures consistent profit margins across cost tiers.
 */

function getSellPriceCents(costCents) {
  const cost = parseInt(costCents, 10);
  if (isNaN(cost)) return 99;

  return cost;
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
