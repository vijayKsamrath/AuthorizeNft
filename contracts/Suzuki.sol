// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Suzuki is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    uint256 private immutable _mintBlockNumber;

    mapping(address => bool) private _authorizedAddresses;
    mapping(uint256 => bool) private _mintedTokens;
    uint256[] private _availableTokens;


    constructor() ERC721("Suzuki", "SZK") {
        _mintBlockNumber = block.number;
    }

    function safeMint(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(_tokenIdCounter.current() + amount <= 100, "Exceeded maximum token supply");

        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _mintedTokens[tokenId] = true;
            _safeMint(msg.sender, tokenId);
        }
    }

    function isTokenMinted(uint256 tokenId) public view returns (bool) {
        return _mintedTokens[tokenId];
    }

    function getAvailableTokensForSale() external view returns (uint256[] memory) {
        return _availableTokens;
    }

    function authorizeUser(address addressToBeAuthorized) public onlyOwner {
        require(!_authorizedAddresses[addressToBeAuthorized], "Address already authorized");
        _authorizedAddresses[addressToBeAuthorized] = true;
    }

    function getAuthorizedUserStatus(address userAddress) public view returns (bool) {
        return _authorizedAddresses[userAddress];
    }

    function getBlockNumber() public view returns (uint256) {
        return _mintBlockNumber;
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
