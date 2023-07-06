// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const myToken = await hre.ethers.deployContract("MyToken");

  await myToken.waitForDeployment();

  console.log("MyToken deployed to:", myToken.target);

  const suzuki = await hre.ethers.deployContract("Suzuki");

  await suzuki.waitForDeployment();

  console.log("Suzuki deployed to:", suzuki.target);

  const authorizeContract = await hre.ethers.deployContract(
    "AuthorizeContract",
    [suzuki.target, myToken.target]
  );

  await authorizeContract.waitForDeployment();

  console.log("AuthorizeContract deployed to:", authorizeContract.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});