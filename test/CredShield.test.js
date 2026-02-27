const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Kred Protocol", function () {
  async function deployFixture() {
    const [owner, user1, user2, merchant, lender] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();

    // Deploy CredScore
    const CredScore = await ethers.getContractFactory("CredScore");
    const credScore = await CredScore.deploy();

    // Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(await usdt.getAddress());

    // Deploy SmartCollateral
    const SmartCollateral = await ethers.getContractFactory("SmartCollateral");
    const smartCollateral = await SmartCollateral.deploy(await usdt.getAddress());

    // Deploy CreditSBT
    const CreditSBT = await ethers.getContractFactory("CreditSBT");
    const creditSBT = await CreditSBT.deploy();

    // Deploy BNPLCheckout
    const BNPLCheckout = await ethers.getContractFactory("BNPLCheckout");
    const bnplCheckout = await BNPLCheckout.deploy(await usdt.getAddress());

    // Wire contracts together
    await lendingPool.setContracts(await credScore.getAddress(), await smartCollateral.getAddress());
    await smartCollateral.setLendingPool(await lendingPool.getAddress());
    await bnplCheckout.setLendingPool(await lendingPool.getAddress());
    await credScore.setAuthorized(await lendingPool.getAddress(), true);

    // Distribute USDT for testing
    const amount = ethers.parseEther("10000");
    await usdt.mint(user1.address, amount);
    await usdt.mint(user2.address, amount);
    await usdt.mint(lender.address, amount);
    await usdt.mint(merchant.address, amount);

    return { owner, user1, user2, merchant, lender, usdt, credScore, lendingPool, smartCollateral, creditSBT, bnplCheckout };
  }

  // ========== CredScore Tests ==========
  describe("CredScore", function () {
    it("Should set credit score for a user", async function () {
      const { credScore, user1, owner } = await loadFixture(deployFixture);
      const reportHash = ethers.id("test-report");

      await credScore.setScore(user1.address, 750, reportHash);
      const profile = await credScore.getProfile(user1.address);

      expect(profile.score).to.equal(750);
      expect(profile.tier).to.equal(2); // Gold
      expect(profile.collateralRatio).to.equal(7500); // 75%
      expect(profile.creditLimit).to.equal(ethers.parseEther("2000"));
      expect(await credScore.hasProfile(user1.address)).to.be.true;
    });

    it("Should reject scores outside 300-900 range", async function () {
      const { credScore, user1 } = await loadFixture(deployFixture);
      const reportHash = ethers.id("test");

      await expect(credScore.setScore(user1.address, 200, reportHash)).to.be.revertedWith("Score must be 300-900");
      await expect(credScore.setScore(user1.address, 950, reportHash)).to.be.revertedWith("Score must be 300-900");
    });

    it("Should assign correct tiers", async function () {
      const { credScore, user1, user2 } = await loadFixture(deployFixture);
      const hash = ethers.id("report");

      // Bronze (300-549)
      await credScore.setScore(user1.address, 400, hash);
      expect((await credScore.getProfile(user1.address)).tier).to.equal(0);

      // Platinum (800-900)
      await credScore.setScore(user2.address, 850, hash);
      expect((await credScore.getProfile(user2.address)).tier).to.equal(3);
      expect((await credScore.getProfile(user2.address)).collateralRatio).to.equal(5000); // 50%
    });

    it("Should record successful loan outcome and boost score", async function () {
      const { credScore, user1 } = await loadFixture(deployFixture);
      await credScore.setScore(user1.address, 700, ethers.id("r"));

      await credScore.recordLoanOutcome(user1.address, true, ethers.parseEther("100"));
      const profile = await credScore.getProfile(user1.address);

      expect(profile.score).to.equal(715); // +15 boost
      expect(profile.loansCompleted).to.equal(1);
    });

    it("Should penalize score on loan failure", async function () {
      const { credScore, user1 } = await loadFixture(deployFixture);
      await credScore.setScore(user1.address, 700, ethers.id("r"));

      await credScore.recordLoanOutcome(user1.address, false, ethers.parseEther("100"));
      const profile = await credScore.getProfile(user1.address);

      expect(profile.score).to.equal(600); // -100 penalty
      expect(profile.loansFailed).to.equal(1);
    });

    it("Should cap score at 900 on success and floor at 300 on failure", async function () {
      const { credScore, user1, user2 } = await loadFixture(deployFixture);

      // Test cap at 900
      await credScore.setScore(user1.address, 895, ethers.id("r"));
      await credScore.recordLoanOutcome(user1.address, true, ethers.parseEther("100"));
      expect((await credScore.getProfile(user1.address)).score).to.equal(900);

      // Test floor at 300
      await credScore.setScore(user2.address, 350, ethers.id("r"));
      await credScore.recordLoanOutcome(user2.address, false, ethers.parseEther("100"));
      expect((await credScore.getProfile(user2.address)).score).to.equal(300);
    });

    it("Should only allow owner to set scores", async function () {
      const { credScore, user1 } = await loadFixture(deployFixture);
      await expect(
        credScore.connect(user1).setScore(user1.address, 700, ethers.id("r"))
      ).to.be.revertedWithCustomError(credScore, "OwnableUnauthorizedAccount");
    });

    it("Should emit events correctly", async function () {
      const { credScore, user1 } = await loadFixture(deployFixture);
      const hash = ethers.id("report");

      await expect(credScore.setScore(user1.address, 700, hash))
        .to.emit(credScore, "CreditScoreSet")
        .withArgs(user1.address, 700, 2, ethers.parseEther("2000"));

      // Update existing profile
      await expect(credScore.setScore(user1.address, 800, hash))
        .to.emit(credScore, "CreditScoreUpdated")
        .withArgs(user1.address, 700, 800);
    });

    it("Should return correct interest rates", async function () {
      const { credScore, user1, user2 } = await loadFixture(deployFixture);

      // No profile = default Bronze rate
      expect(await credScore.getInterestRate(user1.address)).to.equal(800);

      // Platinum
      await credScore.setScore(user1.address, 850, ethers.id("r"));
      expect(await credScore.getInterestRate(user1.address)).to.equal(200); // 2%

      // Gold
      await credScore.setScore(user2.address, 750, ethers.id("r"));
      expect(await credScore.getInterestRate(user2.address)).to.equal(400); // 4%
    });
  });

  // ========== LendingPool Tests ==========
  describe("LendingPool", function () {
    it("Should allow lender deposits", async function () {
      const { lendingPool, usdt, lender } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      await usdt.connect(lender).approve(await lendingPool.getAddress(), amount);
      await expect(lendingPool.connect(lender).deposit(amount))
        .to.emit(lendingPool, "Deposited")
        .withArgs(lender.address, amount);

      expect(await lendingPool.lenderDeposits(lender.address)).to.equal(amount);
      expect(await lendingPool.totalDeposits()).to.equal(amount);
    });

    it("Should allow lender withdrawals", async function () {
      const { lendingPool, usdt, lender } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      await usdt.connect(lender).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(lender).deposit(amount);

      await expect(lendingPool.connect(lender).withdraw(ethers.parseEther("500")))
        .to.emit(lendingPool, "Withdrawn");

      expect(await lendingPool.lenderDeposits(lender.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should create a loan and disburse funds", async function () {
      const { lendingPool, usdt, lender, user1, owner } = await loadFixture(deployFixture);
      const depositAmount = ethers.parseEther("5000");
      const loanAmount = ethers.parseEther("1000");

      // Lender deposits
      await usdt.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender).deposit(depositAmount);

      // Create loan
      const balBefore = await usdt.balanceOf(user1.address);
      await expect(lendingPool.createLoan(user1.address, loanAmount, 3, 400, ethers.parseEther("750")))
        .to.emit(lendingPool, "LoanCreated");

      const balAfter = await usdt.balanceOf(user1.address);
      expect(balAfter - balBefore).to.equal(loanAmount);

      const loan = await lendingPool.getLoan(0);
      expect(loan.borrower).to.equal(user1.address);
      expect(loan.active).to.be.true;
      expect(loan.totalInstallments).to.equal(3);
    });

    it("Should not allow loan if insufficient liquidity", async function () {
      const { lendingPool, user1 } = await loadFixture(deployFixture);
      await expect(
        lendingPool.createLoan(user1.address, ethers.parseEther("1000"), 3, 400, ethers.parseEther("750"))
      ).to.be.revertedWith("Insufficient pool liquidity");
    });

    it("Should not allow multiple active loans", async function () {
      const { lendingPool, usdt, lender, user1 } = await loadFixture(deployFixture);
      const deposit = ethers.parseEther("5000");

      await usdt.connect(lender).approve(await lendingPool.getAddress(), deposit);
      await lendingPool.connect(lender).deposit(deposit);
      await lendingPool.createLoan(user1.address, ethers.parseEther("500"), 3, 400, ethers.parseEther("375"));

      await expect(
        lendingPool.createLoan(user1.address, ethers.parseEther("500"), 3, 400, ethers.parseEther("375"))
      ).to.be.revertedWith("Has active loan");
    });

    it("Should process installment repayments", async function () {
      const { lendingPool, usdt, lender, user1 } = await loadFixture(deployFixture);

      // Setup: lender deposits, create loan
      await usdt.connect(lender).approve(await lendingPool.getAddress(), ethers.parseEther("5000"));
      await lendingPool.connect(lender).deposit(ethers.parseEther("5000"));
      await lendingPool.createLoan(user1.address, ethers.parseEther("1000"), 3, 400, ethers.parseEther("750"));

      const loan = await lendingPool.getLoan(0);
      const installment = loan.installmentAmount;

      // Approve and repay first installment
      await usdt.connect(user1).approve(await lendingPool.getAddress(), installment);
      await expect(lendingPool.connect(user1).repayInstallment(0))
        .to.emit(lendingPool, "InstallmentPaid");

      const updatedLoan = await lendingPool.getLoan(0);
      expect(updatedLoan.installmentsPaid).to.equal(1);
      expect(updatedLoan.active).to.be.true;
    });

    it("Should complete loan after all installments", async function () {
      const { lendingPool, usdt, lender, user1 } = await loadFixture(deployFixture);

      // Use amount divisible evenly: 900 + 4% = 936, 936/3 = 312 exact
      await usdt.connect(lender).approve(await lendingPool.getAddress(), ethers.parseEther("5000"));
      await lendingPool.connect(lender).deposit(ethers.parseEther("5000"));
      await lendingPool.createLoan(user1.address, ethers.parseEther("900"), 3, 400, ethers.parseEther("675"));

      const loan = await lendingPool.getLoan(0);
      const totalOwed = loan.totalAmount;

      // Approve full amount for all installments
      await usdt.connect(user1).approve(await lendingPool.getAddress(), totalOwed);

      // Pay all 3 installments
      for (let i = 0; i < 3; i++) {
        await lendingPool.connect(user1).repayInstallment(0);
      }

      const finalLoan = await lendingPool.getLoan(0);
      expect(finalLoan.active).to.be.false;
      expect(finalLoan.remainingAmount).to.equal(0);
      expect(await lendingPool.totalLoansRepaid()).to.equal(1);
    });

    it("Should return correct pool stats", async function () {
      const { lendingPool, usdt, lender } = await loadFixture(deployFixture);

      await usdt.connect(lender).approve(await lendingPool.getAddress(), ethers.parseEther("5000"));
      await lendingPool.connect(lender).deposit(ethers.parseEther("5000"));

      const stats = await lendingPool.getPoolStats();
      expect(stats._totalDeposits).to.equal(ethers.parseEther("5000"));
      expect(stats._available).to.equal(ethers.parseEther("5000"));
    });

    it("Should mark loan as defaulted", async function () {
      const { lendingPool, usdt, lender, user1 } = await loadFixture(deployFixture);

      await usdt.connect(lender).approve(await lendingPool.getAddress(), ethers.parseEther("5000"));
      await lendingPool.connect(lender).deposit(ethers.parseEther("5000"));
      await lendingPool.createLoan(user1.address, ethers.parseEther("500"), 3, 400, ethers.parseEther("375"));

      await expect(lendingPool.markDefault(0))
        .to.emit(lendingPool, "LoanDefaulted");

      const loan = await lendingPool.getLoan(0);
      expect(loan.active).to.be.false;
      expect(loan.defaulted).to.be.true;
    });
  });

  // ========== SmartCollateral Tests ==========
  describe("SmartCollateral", function () {
    it("Should accept collateral deposits", async function () {
      const { smartCollateral, usdt, user1, owner } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("500");

      await usdt.connect(user1).approve(await smartCollateral.getAddress(), amount);
      await expect(smartCollateral.depositCollateral(user1.address, amount, 0))
        .to.emit(smartCollateral, "CollateralDeposited")
        .withArgs(user1.address, amount, 0);

      const pos = await smartCollateral.getPosition(user1.address);
      expect(pos.amount).to.equal(amount);
      expect(pos.active).to.be.true;
      expect(await smartCollateral.totalCollateral()).to.equal(amount);
    });

    it("Should not allow double deposit", async function () {
      const { smartCollateral, usdt, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("500");

      await usdt.connect(user1).approve(await smartCollateral.getAddress(), amount);
      await smartCollateral.depositCollateral(user1.address, amount, 0);

      await expect(smartCollateral.depositCollateral(user1.address, amount, 1))
        .to.be.revertedWith("Already has collateral");
    });

    it("Should calculate yield correctly", async function () {
      const { smartCollateral, usdt, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      await usdt.connect(user1).approve(await smartCollateral.getAddress(), amount);
      await smartCollateral.depositCollateral(user1.address, amount, 0);

      // Fast forward 10 days
      await ethers.provider.send("evm_increaseTime", [10 * 86400]);
      await ethers.provider.send("evm_mine");

      const yield_ = await smartCollateral.calculateYield(user1.address);
      // 1000 * 14 * 10 / 10000 = 14 USDT
      expect(yield_).to.equal(ethers.parseEther("14"));
    });

    it("Should withdraw collateral + yield", async function () {
      const { smartCollateral, usdt, user1, owner } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      // Fund the contract with extra for yield
      await usdt.mint(await smartCollateral.getAddress(), ethers.parseEther("100"));

      await usdt.connect(user1).approve(await smartCollateral.getAddress(), amount);
      await smartCollateral.depositCollateral(user1.address, amount, 0);

      // Fast forward 5 days
      await ethers.provider.send("evm_increaseTime", [5 * 86400]);
      await ethers.provider.send("evm_mine");

      const balBefore = await usdt.balanceOf(user1.address);
      await smartCollateral.withdrawCollateral(user1.address);
      const balAfter = await usdt.balanceOf(user1.address);

      // Should get back principal + yield
      expect(balAfter).to.be.gt(balBefore);
      const pos = await smartCollateral.getPosition(user1.address);
      expect(pos.active).to.be.false;
    });

    it("Should seize collateral on default", async function () {
      const { smartCollateral, usdt, user1, lendingPool } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("500");

      await usdt.connect(user1).approve(await smartCollateral.getAddress(), amount);
      await smartCollateral.depositCollateral(user1.address, amount, 0);

      const poolBalBefore = await usdt.balanceOf(await lendingPool.getAddress());
      await expect(smartCollateral.seizeCollateral(user1.address))
        .to.emit(smartCollateral, "CollateralSeized");

      const poolBalAfter = await usdt.balanceOf(await lendingPool.getAddress());
      expect(poolBalAfter - poolBalBefore).to.equal(amount);
    });
  });

  // ========== CreditSBT Tests ==========
  describe("CreditSBT", function () {
    it("Should mint soulbound token", async function () {
      const { creditSBT, user1 } = await loadFixture(deployFixture);

      await expect(creditSBT.mint(user1.address, 700))
        .to.emit(creditSBT, "CreditSBTMinted");

      expect(await creditSBT.hasSBT(user1.address)).to.be.true;
      expect(await creditSBT.balanceOf(user1.address)).to.equal(1);
      expect(await creditSBT.totalMinted()).to.equal(1);
    });

    it("Should not allow duplicate SBTs", async function () {
      const { creditSBT, user1 } = await loadFixture(deployFixture);

      await creditSBT.mint(user1.address, 700);
      await expect(creditSBT.mint(user1.address, 750))
        .to.be.revertedWith("Already has SBT");
    });

    it("Should block transfers (soulbound)", async function () {
      const { creditSBT, user1, user2 } = await loadFixture(deployFixture);

      await creditSBT.mint(user1.address, 700);
      const tokenId = await creditSBT.userToken(user1.address);

      await expect(
        creditSBT.connect(user1).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWith("Soulbound: non-transferable");
    });

    it("Should update credit history", async function () {
      const { creditSBT, user1 } = await loadFixture(deployFixture);

      await creditSBT.mint(user1.address, 700);
      await creditSBT.updateHistory(user1.address, 715, true, ethers.parseEther("100"));

      const history = await creditSBT.getHistory(user1.address);
      expect(history.score).to.equal(715);
      expect(history.loansCompleted).to.equal(1);
      expect(history.currentStreak).to.equal(1);
      expect(history.totalRepaid).to.equal(ethers.parseEther("100"));
    });

    it("Should track streaks correctly", async function () {
      const { creditSBT, user1 } = await loadFixture(deployFixture);

      await creditSBT.mint(user1.address, 700);

      // 3 successful loans
      await creditSBT.updateHistory(user1.address, 715, true, ethers.parseEther("100"));
      await creditSBT.updateHistory(user1.address, 730, true, ethers.parseEther("200"));
      await creditSBT.updateHistory(user1.address, 745, true, ethers.parseEther("150"));

      let history = await creditSBT.getHistory(user1.address);
      expect(history.currentStreak).to.equal(3);
      expect(history.longestStreak).to.equal(3);

      // One failure resets current streak
      await creditSBT.updateHistory(user1.address, 645, false, ethers.parseEther("100"));
      history = await creditSBT.getHistory(user1.address);
      expect(history.currentStreak).to.equal(0);
      expect(history.longestStreak).to.equal(3); // preserved
    });

    it("Should reject invalid initial scores", async function () {
      const { creditSBT, user1 } = await loadFixture(deployFixture);

      await expect(creditSBT.mint(user1.address, 200)).to.be.revertedWith("Invalid score");
      await expect(creditSBT.mint(user1.address, 950)).to.be.revertedWith("Invalid score");
    });
  });

  // ========== BNPLCheckout Tests ==========
  describe("BNPLCheckout", function () {
    it("Should create a purchase", async function () {
      const { bnplCheckout, user1, merchant } = await loadFixture(deployFixture);

      await expect(bnplCheckout.createPurchase(
        user1.address,
        merchant.address,
        "MacBook Pro",
        ethers.parseEther("3000"),
        3,
        0
      )).to.emit(bnplCheckout, "PurchaseCreated");

      const purchase = await bnplCheckout.getPurchase(0);
      expect(purchase.buyer).to.equal(user1.address);
      expect(purchase.merchant).to.equal(merchant.address);
      expect(purchase.itemName).to.equal("MacBook Pro");
      expect(purchase.totalPrice).to.equal(ethers.parseEther("3000"));
      expect(purchase.totalInstallments).to.equal(3);
      expect(purchase.completed).to.be.false;
    });

    it("Should track installment payments", async function () {
      const { bnplCheckout, user1, merchant } = await loadFixture(deployFixture);

      await bnplCheckout.createPurchase(user1.address, merchant.address, "Item", ethers.parseEther("900"), 3, 0);

      await bnplCheckout.recordInstallmentPaid(0);
      let purchase = await bnplCheckout.getPurchase(0);
      expect(purchase.installmentsPaid).to.equal(1);
      expect(purchase.paidAmount).to.equal(ethers.parseEther("300"));

      await bnplCheckout.recordInstallmentPaid(0);
      await bnplCheckout.recordInstallmentPaid(0);

      purchase = await bnplCheckout.getPurchase(0);
      expect(purchase.completed).to.be.true;
      expect(purchase.installmentsPaid).to.equal(3);
    });

    it("Should not allow payment on completed purchase", async function () {
      const { bnplCheckout, user1, merchant } = await loadFixture(deployFixture);

      await bnplCheckout.createPurchase(user1.address, merchant.address, "Item", ethers.parseEther("600"), 2, 0);
      await bnplCheckout.recordInstallmentPaid(0);
      await bnplCheckout.recordInstallmentPaid(0);

      await expect(bnplCheckout.recordInstallmentPaid(0))
        .to.be.revertedWith("Already completed");
    });

    it("Should track buyer and merchant purchases", async function () {
      const { bnplCheckout, user1, user2, merchant } = await loadFixture(deployFixture);

      await bnplCheckout.createPurchase(user1.address, merchant.address, "Item1", ethers.parseEther("100"), 2, 0);
      await bnplCheckout.createPurchase(user2.address, merchant.address, "Item2", ethers.parseEther("200"), 3, 1);

      const buyer1Purchases = await bnplCheckout.getBuyerPurchases(user1.address);
      expect(buyer1Purchases.length).to.equal(1);

      const merchantPurchases = await bnplCheckout.getMerchantPurchases(merchant.address);
      expect(merchantPurchases.length).to.equal(2);
    });

    it("Should track stats correctly", async function () {
      const { bnplCheckout, user1, merchant } = await loadFixture(deployFixture);

      await bnplCheckout.createPurchase(user1.address, merchant.address, "A", ethers.parseEther("100"), 2, 0);
      await bnplCheckout.createPurchase(user1.address, merchant.address, "B", ethers.parseEther("200"), 3, 1);

      const [volume, count] = await bnplCheckout.getStats();
      expect(volume).to.equal(ethers.parseEther("300"));
      expect(count).to.equal(2);
    });
  });

  // ========== Integration Test ==========
  describe("Full Protocol Integration", function () {
    it("Should complete full BNPL flow: score → loan → collateral → repay → SBT update", async function () {
      const { credScore, lendingPool, smartCollateral, creditSBT, bnplCheckout, usdt, user1, merchant, lender } = await loadFixture(deployFixture);

      // 1. Set credit score
      await credScore.setScore(user1.address, 750, ethers.id("ai-credit-report"));
      const profile = await credScore.getProfile(user1.address);
      expect(profile.tier).to.equal(2); // Gold

      // 2. Mint SBT
      await creditSBT.mint(user1.address, 750);

      // 3. Lender deposits liquidity
      await usdt.connect(lender).approve(await lendingPool.getAddress(), ethers.parseEther("5000"));
      await lendingPool.connect(lender).deposit(ethers.parseEther("5000"));

      // 4. Deposit collateral (75% of 900 = 675)
      const loanAmount = ethers.parseEther("900");
      const collateralAmount = ethers.parseEther("675");
      await usdt.connect(user1).approve(await smartCollateral.getAddress(), collateralAmount);
      await smartCollateral.depositCollateral(user1.address, collateralAmount, 0);

      // 5. Create loan (900 + 4% = 936, divisible by 3)
      await lendingPool.createLoan(user1.address, loanAmount, 3, 400, collateralAmount);

      // 6. Create BNPL purchase
      await bnplCheckout.createPurchase(user1.address, merchant.address, "Premium API Credits", loanAmount, 3, 0);

      // 7. Repay all installments
      const loan = await lendingPool.getLoan(0);
      await usdt.connect(user1).approve(await lendingPool.getAddress(), loan.totalAmount);

      for (let i = 0; i < 3; i++) {
        await lendingPool.connect(user1).repayInstallment(0);
        await bnplCheckout.recordInstallmentPaid(0);
      }

      // 8. Verify loan completed
      const finalLoan = await lendingPool.getLoan(0);
      expect(finalLoan.active).to.be.false;
      expect(finalLoan.remainingAmount).to.equal(0);

      // 9. Fund contract for yield, then withdraw collateral with yield
      await usdt.mint(await smartCollateral.getAddress(), ethers.parseEther("100"));
      await smartCollateral.withdrawCollateral(user1.address);

      // 10. Update credit score and SBT
      await credScore.recordLoanOutcome(user1.address, true, loanAmount);
      await creditSBT.updateHistory(user1.address, 765, true, loanAmount);

      // Verify final state
      const finalProfile = await credScore.getProfile(user1.address);
      expect(finalProfile.score).to.equal(765); // boosted
      expect(finalProfile.loansCompleted).to.equal(1);

      const sbtHistory = await creditSBT.getHistory(user1.address);
      expect(sbtHistory.loansCompleted).to.equal(1);
      expect(sbtHistory.currentStreak).to.equal(1);

      const purchase = await bnplCheckout.getPurchase(0);
      expect(purchase.completed).to.be.true;
    });
  });
});
