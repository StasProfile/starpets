class User {
  constructor(id, balance, createdAt = null, updatedAt = null) {
    this.id = id;
    this.balance = balance;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromDatabase(dbUser) {
    return new User(
      dbUser.id,
      dbUser.balance,
      dbUser.createdAt,
      dbUser.updatedAt
    );
  }

  canWithdraw(amount) {
    return this.balance + amount >= 0;
  }

  withdraw(amount) {
    if (!this.canWithdraw(amount)) {
      throw new Error(`Insufficient funds. Available: ${this.balance}, Requested: ${Math.abs(amount)}`);
    }
    this.balance += amount;
    return this.balance;
  }

  deposit(amount) {
    if (amount < 0) {
      throw new Error('Deposit amount must be positive');
    }
    this.balance += amount;
    return this.balance;
  }

  toJSON() {
    return {
      id: this.id,
      balance: this.balance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;