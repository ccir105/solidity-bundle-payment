// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";

contract BBots is ERC721AQueryable, AccessControl {
    uint256 public constant MAX_SUPPLY = 15000;
    bytes32 constant ROLE_MINTER = keccak256("MINTER");

    string public tokenBaseURI;

    constructor(address _minter) ERC721A("BubbleBots", "BBOTS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ROLE_MINTER, _minter);
    }

    function mintBBots(uint256 numTokens, address _to ) external onlyRole(ROLE_MINTER) {

        require(totalSupply() <= MAX_SUPPLY, "MINT_FAILED");

        _safeMint(_to, numTokens);

    }

    function updateBaseUri(string memory baseURI) external onlyRole('DEFAULT_ADMIN_ROLE') {
        tokenBaseURI = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return tokenBaseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return string(abi.encodePacked(_baseURI(), _toString(tokenId), ".json"));
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl, ERC721A) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
