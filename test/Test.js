const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;

describe("AuthorizeContract", function () {
  let authorizeContract;
  let myToken;
  let suzuki;
  let owner;
  let user;

  beforeEach(async function () {
    // Deploy the SuzukiNFT contract
    suzuki = await hre.ethers.deployContract("Suzuki");

    await suzuki.waitForDeployment();

    // Deploy the MyToken contract
    myToken = await hre.ethers.deployContract("MyToken");

    await myToken.waitForDeployment();
    // Deploy the AuthorizeContract
    authorizeContract = await hre.ethers.deployContract(
      "AuthorizeContract",
      [suzuki.target, myToken.target]
    );

    await authorizeContract.waitForDeployment();

    console.log("AuthorizeContract deployed to:", authorizeContract.target);


    [owner, user, accounts] = await ethers.getSigners();
  });

  it("should return Name and symbol", async () => {
    // erc20 token name
    console.log("Erc20 token Name", await myToken.name())

    // Nft name 
    console.log("NFT Name", await suzuki.name())
  });

  it("should buy an NFT with the required token amount", async () => {
    // Mint tokens for the user
    await myToken.mint(user.address, 200);

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Get the user's token balance before the purchase
    const initialBalance = await myToken.balanceOf(user.address);
    console.log("user balance", initialBalance);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // Approve the ERC20 To spend on behalf of user
    await myToken.connect(user).approve(authorizeContract, 200);

    // Make the purchase
    await authorizeContract.connect(user).buyNft(myToken);

    // Get the user's token balance after the purchase
    const finalBalance = await myToken.balanceOf(user.address);
    console.log("user balance after buying nft", finalBalance);

  });

  it("should revert when buying an NFT with insufficient token balance", async function () {
    // Mint tokens for the user
    await myToken.mint(user.address, 50);

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // Approve the ERC20 To spend on behalf of user
    await myToken.connect(user).approve(authorizeContract, 50);

    // Attempt to make the purchase
    await expect(authorizeContract.connect(user).buyNft(myToken)).to.be.revertedWith("Not enough tokens in your wallet");
  });

  it("should revert when buying an NFT without authorization", async function () {
    // Mint tokens for the user
    await myToken.mint(user.address, 200);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // Attempt to make the purchase
    await expect(authorizeContract.connect(user).buyNft(myToken)).to.be.revertedWith("Not authorized user");
  });

  it("should buy an NFT after 2 days with the required token amount", async function () {
    // Mint tokens for the user
    await myToken.mint(user.address, "200");

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Fast-forward time by 2 days 
    await network.provider.send("evm_increaseTime", [172800]);
    await network.provider.send("evm_mine");

    // Get the user's token balance before the purchase
    await myToken.balanceOf(user.address);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // approve erc20 token before buying nft 
    await myToken.connect(user).approve(authorizeContract, 200);

    // Make the purchase
    await authorizeContract.connect(user).buyNft(myToken);

    // Get the user's token balance after the purchase
    const finalBalance = await myToken.balanceOf(user.address);
    console.log("user balance after buying nft", finalBalance);

  });

});
