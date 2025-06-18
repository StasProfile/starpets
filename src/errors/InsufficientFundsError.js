const BaseError = require('./BaseError');

class InsufficientFundsError extends BaseError {
  constructor(userId, requestedAmount, availableBalance) {
    super(
      `Insufficient funds for user ${userId}. Requested: ${requestedAmount}, Available: ${availableBalance}`,
      422,
      'INSUFFICIENT_FUNDS'
    );
    this.userId = userId;
    this.requestedAmount = requestedAmount;
    this.availableBalance = availableBalance;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.userId,
      requestedAmount: this.requestedAmount,
      availableBalance: this.availableBalance
    };
  }
}

module.exports = InsufficientFundsError;