const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Kred contracts with account:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");

  // 1. Deploy MockUSDT (test stablecoin)
  console.log("\n--- Deploying MockUSDT ---");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddr = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddr);

  // 2. Deploy CredScore
  console.log("\n--- Deploying CredScore ---");
  const CredScore = await hre.ethers.getContractFactory("CredScore");
  const credScore = await CredScore.deploy();
  await credScore.waitForDeployment();
  const credScoreAddr = await credScore.getAddress();
  console.log("CredScore deployed to:", credScoreAddr);

  // 3. Deploy LendingPool
  console.log("\n--- Deploying LendingPool ---");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(usdtAddr);
  await lendingPool.waitForDeployment();
  const lendingPoolAddr = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", lendingPoolAddr);

  // 4. Deploy SmartCollateral
  console.log("\n--- Deploying SmartCollateral ---");
  const SmartCollateral = await hre.ethers.getContractFactory("SmartCollateral");
  const smartCollateral = await SmartCollateral.deploy(usdtAddr);
  await smartCollateral.waitForDeployment();
  const smartCollateralAddr = await smartCollateral.getAddress();
  console.log("SmartCollateral deployed to:", smartCollateralAddr);

  // 5. Deploy CreditSBT
  console.log("\n--- Deploying CreditSBT ---");
  const CreditSBT = await hre.ethers.getContractFactory("CreditSBT");
  const creditSBT = await CreditSBT.deploy();
  await creditSBT.waitForDeployment();
  const creditSBTAddr = await creditSBT.getAddress();
  console.log("CreditSBT deployed to:", creditSBTAddr);

  // 6. Deploy BNPLCheckout
  console.log("\n--- Deploying BNPLCheckout ---");
  const BNPLCheckout = await hre.ethers.getContractFactory("BNPLCheckout");
  const bnplCheckout = await BNPLCheckout.deploy(usdtAddr);
  await bnplCheckout.waitForDeployment();
  const bnplCheckoutAddr = await bnplCheckout.getAddress();
  console.log("BNPLCheckout deployed to:", bnplCheckoutAddr);

  // 7. Wire contracts together
  console.log("\n--- Wiring contracts ---");
  let tx;

  tx = await lendingPool.setContracts(credScoreAddr, smartCollateralAddr);
  await tx.wait();
  console.log("LendingPool.setContracts done");

  tx = await smartCollateral.setLendingPool(lendingPoolAddr);
  await tx.wait();
  console.log("SmartCollateral.setLendingPool done");

  tx = await bnplCheckout.setLendingPool(lendingPoolAddr);
  await tx.wait();
  console.log("BNPLCheckout.setLendingPool done");

  tx = await credScore.setAuthorized(lendingPoolAddr, true);
  await tx.wait();
  console.log("CredScore.setAuthorized(LendingPool) done");

  // 8. Demo transactions: set a credit score + mint SBT
  console.log("\n--- Demo transactions ---");

  tx = await credScore.setScore(deployer.address, 750, hre.ethers.id("ai-credit-report-demo"));
  await tx.wait();
  console.log("TX 1: Set credit score 750 (Gold tier) for deployer");

  tx = await creditSBT.mint(deployer.address, 750);
  await tx.wait();
  console.log("TX 2: Minted Soulbound Credit Token for deployer");

  // Summary
  console.log("\n========================================");
  console.log("  Kred Deployment Summary");
  console.log("========================================");
  console.log("Network:          BSC Testnet");
  console.log("Deployer:        ", deployer.address);
  console.log("MockUSDT:        ", usdtAddr);
  console.log("CredScore:       ", credScoreAddr);
  console.log("LendingPool:     ", lendingPoolAddr);
  console.log("SmartCollateral: ", smartCollateralAddr);
  console.log("CreditSBT:      ", creditSBTAddr);
  console.log("BNPLCheckout:    ", bnplCheckoutAddr);
  console.log("========================================");
  console.log("Demo transactions: 2 successful (setScore + mintSBT)");
  console.log("========================================");

  // Write deployment addresses to file
  const fs = require("fs");
  const addresses = {
    network: "bscTestnet",
    deployer: deployer.address,
    contracts: {
      MockUSDT: usdtAddr,
      CredScore: credScoreAddr,
      LendingPool: lendingPoolAddr,
      SmartCollateral: smartCollateralAddr,
      CreditSBT: creditSBTAddr,
      BNPLCheckout: bnplCheckoutAddr,
    },
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("deployment.json", JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
