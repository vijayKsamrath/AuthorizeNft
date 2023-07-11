// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Suzuki.sol";
import "./MyToken.sol";

contract AuthorizeContract is Ownable, ERC721Holder, ReentrancyGuard {
    
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    Counters.Counter private _nftIds;
    Counters.Counter private _nftSold;

    MyToken public myTokens;
    Suzuki public suzuki;
    uint256 public startBlock;
    uint256 public constant BLOCKS_PER_DAY = 5760;

    struct Nfts
    {
        uint256 nftIds;
        address nftContract;
        uint256 tokenId;
        bool sold;
    }

    mapping (uint256 => Nfts) private trackNfts;

    constructor( address _suzuki, address _myToken){
        suzuki   = Suzuki(_suzuki);
        myTokens = MyToken(_myToken);
        startBlock = block.number;
    }

    function createNftsforSale(address nftContract, uint256 tokenId) public nonReentrant {
        _nftIds.increment();
        uint256 nftIds = _nftIds.current();
        trackNfts[nftIds] = Nfts(nftIds, nftContract, tokenId, false);
        suzuki.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function _balanceOfToken( address _address) external view returns(uint){
        uint balance = myTokens.balanceOf(_address);
        return balance;
    }

    function buyNft(IERC20 _Token, uint nftIds) public nonReentrant  {
        uint256 tokenAmount = calculateTokenAmount();
        uint256 tokenId = trackNfts[nftIds].tokenId;
        Nfts storage nft = trackNfts[nftIds];

        require(!nft.sold, "NFT already sold");
        require(address(_Token) == address(myTokens), "Invalid Token");
        require(_Token.balanceOf(msg.sender) > tokenAmount, "Not enough Token in your wallet");
        require(suzuki.getAuthorizedUserStatus(msg.sender) ==  true, "Not Authorized User");
        require(suzuki.isTokenMinted(tokenId) == true, "NFT not found");

        _Token.safeTransferFrom(msg.sender, address(this), tokenAmount);
        _nftSold.increment;
        trackNfts[nftIds].sold=true;
        suzuki.safeTransferFrom(address(this),msg.sender, tokenId);

    }
    
    function calculateTokenAmount() public view returns(uint) {
        uint256 mintBlockNumber = suzuki.getBlockNumber();
        uint256 currentBlockNumber = block.number;

        uint256 interval = (currentBlockNumber - mintBlockNumber) / (BLOCKS_PER_DAY * 2 );
        uint256 intervalAmount = (interval * 50) + 100;
        return intervalAmount;
    }
    
}