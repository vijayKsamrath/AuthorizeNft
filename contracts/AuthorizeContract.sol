// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Suzuki.sol";
import "./MyToken.sol";

contract AuthorizeContract is Ownable, ERC721Holder {
    using SafeERC20 for IERC20;

    Suzuki public suzuki;
    MyToken public myTokens;
    uint256 public startBlock;
    uint256 public constant BLOCKS_PER_DAY = 5760;

    constructor(address _suzuki, address _myToken) {
        suzuki = Suzuki(_suzuki);
        myTokens = MyToken(_myToken);
        startBlock = block.number;
    }

    function balanceOf(address _address) external view returns (uint256) {
        return myTokens.balanceOf(_address);
    }

    function buyNft(IERC20 _token) external {
        uint256 tokenAmount = calculateTokenAmount();
        require(
            _token.balanceOf(msg.sender) >= tokenAmount,
            "Not enough tokens in your wallet"
        );
        require(
            suzuki.getAuthorizedUserStatus(msg.sender) == true,"Not authorized user"
        );

        _token.safeTransferFrom(msg.sender, address(this), tokenAmount);
        suzuki.safeMint(msg.sender);
    }

    function calculateTokenAmount() public view returns (uint256) {
        uint256 mintBlockNumber = suzuki.getBlockNumber();
        uint256 currentBlockNumber = block.number;

        uint256 interval = (currentBlockNumber - mintBlockNumber) / (BLOCKS_PER_DAY * 2 days);
        uint256 intervalAmount = (interval * 50) + 100;
        return intervalAmount;
    }
}
