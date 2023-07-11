const { expect } = require("chai");
const { ethers } = require("hardhat");

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

    // Deploy a different ERC20 token contract
    anotherToken = await hre.ethers.deployContract("AnotherToken");

    await anotherToken.waitForDeployment();

    // Deploy the AuthorizeContract
    authorizeContract = await hre.ethers.deployContract(
      "AuthorizeContract",
      [suzuki.target, myToken.target]
    );

    await authorizeContract.waitForDeployment();
    console.log("AuthorizeContract deployed to:", authorizeContract.target);

    [owner, user, accounts] = await ethers.getSigners();

  });


  it("should create and buy an NFT successfully", async () => {

    // Mint tokens for the user
    await myToken.mint(user.address, 500);

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Approve the AuthorizeContract to spend user's tokens
    await myToken.connect(user).approve(authorizeContract, 500);

    // Mint an NFT for sale
    await suzuki.connect(owner).safeMint(100);
    console.log("Nft balance of owner", await suzuki.balanceOf(owner));

    // Approve the AuthorizeContract to spend suzuki Nfts
    await suzuki.connect(owner).setApprovalForAll(authorizeContract, true);

    // Create an NFT for sale
    await authorizeContract.connect(owner).createNftsforSale(suzuki, 1);

    // Get the user's token balance before the purchase
    const initialBalance = await myToken.balanceOf(user.address);
    console.log("user token balance before buying Nft", initialBalance);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // Make the purchase
    await authorizeContract.connect(user).buyNft(myToken, 1);

    // Get the user's Nft balance after the purchase
    console.log("Nft balance of user", await suzuki.balanceOf(user));

    // Get the user's token balance after the purchase
    const finalBalance = await myToken.balanceOf(user.address);
    console.log("user token balance after buying nft", finalBalance);

  });

  it("should revert when buying an NFT with an invalid token", async () => {

    // Mint tokens for the user
    await anotherToken.mint(user.address, 200);

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Approve the AuthorizeContract to spend user's tokens
    await anotherToken.connect(user).approve(authorizeContract, 200);

    // Mint an NFT for sale
    await suzuki.connect(owner).safeMint(100);

    // Approve the AuthorizeContract to spend suzuki Nfts
    await suzuki.connect(owner).approve(authorizeContract, 1);

    // Create an NFT for sale
    await authorizeContract.connect(owner).createNftsforSale(suzuki, 1);

    // Attempt to buy the NFT with a different token
    await expect(
      authorizeContract.connect(user).buyNft(anotherToken, 1)
    ).to.be.revertedWith("Invalid Token");

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

    // Approve the AuthorizeContract to spend user's tokens
    await myToken.connect(user).approve(authorizeContract, 50);

    // Mint an NFT for sale
    await suzuki.connect(owner).safeMint(100);
    console.log("Nft balance of owner", await suzuki.balanceOf(owner));

    // Approve the AuthorizeContract to spend suzuki Nfts
    await suzuki.connect(owner).approve(authorizeContract, 1);

    // Create an NFT for sale
    await authorizeContract.connect(owner).createNftsforSale(suzuki, 1);

    // Attempt to make the purchase
    await expect(authorizeContract.connect(user).buyNft(myToken, 1)).to.be.revertedWith("Not enough Token in your wallet");

  });

  it("should revert when buying an NFT without authorization", async function () {

    // Mint tokens for the user
    await myToken.mint(user.address, 200);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // Approve the AuthorizeContract to spend user's tokens
    await myToken.connect(user).approve(authorizeContract, 50);

    // Mint an NFT for sale
    await suzuki.connect(owner).safeMint(100);

    // Approve the AuthorizeContract to spend suzuki Nfts
    await suzuki.connect(owner).approve(authorizeContract, 1);

    // Create an NFT for sale
    await authorizeContract.connect(owner).createNftsforSale(suzuki, 1);

    // Attempt to make the purchase
    await expect(authorizeContract.connect(user).buyNft(myToken, 1)).to.be.revertedWith("Not Authorized User");

  });

  it("should revert when buying a non-existent NFT", async () => {

    // Mint tokens for the user
    await myToken.mint(user.address, 200);

    // Approve the AuthorizeContract to spend user's tokens
    await myToken.connect(user).approve(authorizeContract, 100);

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Attempt to buy a non-existent NFT
    await expect(
      authorizeContract.connect(user).buyNft(myToken, 1)
    ).to.be.revertedWith("NFT not found");

  });

  it("should revert when buying an already sold NFT", async () => {

    // Mint tokens for the user
    await myToken.mint(user.address, 200);

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Approve the AuthorizeContract to spend user's tokens
    await myToken.connect(user).approve(authorizeContract, 200);

    // Mint an NFT for sale
    await suzuki.connect(owner).safeMint(100);

    // Approve the AuthorizeContract to spend suzuki Nfts
    await suzuki.connect(owner).approve(authorizeContract, 1);

    // Create an NFT for sale
    await authorizeContract.connect(owner).createNftsforSale(suzuki, 1);

    // Get the user's token balance before the purchase
    const initialBalance = await myToken.balanceOf(user.address);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // Make the purchase
    await authorizeContract.connect(user).buyNft(myToken, 1);

    // Attempt to buy the same NFT again
    await expect(
      authorizeContract.connect(user).buyNft(myToken, 1)
    ).to.be.revertedWith("NFT already sold");

  });

  it("should buy an NFT after 2 days with the required token amount", async () => {

    // Mint tokens for the user
    await myToken.mint(user.address, 200);

    // Authorize the user
    await suzuki.authorizeUser(user.address);

    // Approve the AuthorizeContract to spend user's tokens
    await myToken.connect(user).approve(authorizeContract, 200);

    // Mint an NFT for sale
    await suzuki.connect(owner).safeMint(100);
    console.log("Nft balance of owner", await suzuki.balanceOf(owner));

    // Approve the AuthorizeContract to spend suzuki Nfts
    await suzuki.connect(owner).approve(authorizeContract, 1);

    // Create an NFT for sale
    await authorizeContract.connect(owner).createNftsforSale(suzuki, 1);

    // Get the user's token balance before the purchase
    const initialBalance = await myToken.balanceOf(user.address);
    console.log("user token balance before buying Nft", initialBalance);

    // Calculate the required token amount for the purchase
    await authorizeContract.calculateTokenAmount();

    // Fast-forward time by 2 days (172800 seconds)
    await network.provider.send("evm_increaseTime", [172800]);
    await network.provider.send("evm_mine");

    // Make the purchase
    await authorizeContract.connect(user).buyNft(myToken, 1);

    // Get the user's Nft balance after the purchase
    console.log("Nft balance of user", await suzuki.balanceOf(user));

    // Get the user's token balance after the purchase
    const finalBalance = await myToken.balanceOf(user.address);
    console.log("user token balance after buying nft", finalBalance);

  });

});
