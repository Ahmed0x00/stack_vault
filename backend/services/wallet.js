const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Deterministic EVM/BSC wallet derivation matching StackVault Bot.
 */
function getDepositAddress(identifier, masterSecret) {
  if (!masterSecret) {
    throw new Error('DEPOSIT_MASTER_SECRET is not defined in environment');
  }
  const hmac = crypto.createHmac('sha256', masterSecret);
  hmac.update(`stackvault-deposit-${identifier}`);
  const privateKeyHex = '0x' + hmac.digest('hex');
  const wallet = new ethers.Wallet(privateKeyHex);
  return wallet.address;
}

function getDepositPrivateKey(identifier, masterSecret) {
  if (!masterSecret) {
    throw new Error('DEPOSIT_MASTER_SECRET is not defined in environment');
  }
  const hmac = crypto.createHmac('sha256', masterSecret);
  hmac.update(`stackvault-deposit-${identifier}`);
  return '0x' + hmac.digest('hex');
}

module.exports = {
  getDepositAddress,
  getDepositPrivateKey,
};
