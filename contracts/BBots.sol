// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Bytes.sol";
import "hardhat/console.sol";

contract BBots is ERC721Enumerable, AccessControl, Ownable {
    uint256 public constant MAX_SUPPLY = 333;
    string public tokenBaseURI;
    address imx;

    bytes32 constant ROLE_MINTER = keccak256("MINTER");

    mapping(uint256 => string) tokenBluePrints;

    event AssetMinted(address indexed to, uint256 indexed tokenId, bytes blueprint);

    constructor(address _imx) ERC721("BubbleBots", "BBOTS") {
        imx = _imx;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ROLE_MINTER, msg.sender);
        _setupRole(ROLE_MINTER, _imx);
    }

    //will be called by imx
    function mintFor(
        address to,
        uint256 quantity,
        bytes calldata mintingBlob
    ) external onlyRole(ROLE_MINTER) {
        require(quantity == 1, "Mintable: invalid quantity");

        (uint256 tokenId, string memory ipfsHash,) = parseBlob(mintingBlob);

        tokenDetails[tokenId] = _bot;

        super._safeMint(to, tokenId);

        tokenBluePrints[tokenId] = ipfsHash;

        emit AssetMinted(to, tokenId, mintingBlob);
    }

    function updateBaseUri(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenBaseURI = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return tokenBaseURI;
    }

    function tokensOfOwner(address _owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);
        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokensId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory ipfsHash = tokenBluePrints[tokenId];
        return string(abi.encodePacked(_baseURI(), ipfsHash));
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Enumerable, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function parseBlob(bytes calldata blob)
    public
    view
    returns (
        uint256,
        string memory
    )
    {
        int256 colonIndex = Bytes.indexOf(blob, ":", 0);
        require(colonIndex >= 0, "Separator must exist");

        uint256 tokenID = Bytes.toUint(blob[1:uint256(colonIndex) - 1]);
        bytes calldata blueprint = blob[uint256(colonIndex) + 2:blob.length - 1];

        return (tokenID, string(ipfsHash));
    }
}
