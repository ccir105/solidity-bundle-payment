// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Bytes.sol";

contract BBots is ERC721Royalty, Ownable {

    uint256 immutable MAX_SUPPLY;

    string public tokenBaseURI;

    address imx;

    uint256 public totalSupply = 0;

    event AssetMinted(address indexed to, uint256 indexed tokenId, bytes blueprint);

    modifier imxOrAdmin() {
        require(msg.sender == imx, "NOT AUTHORIZED");
        _;
    }

    constructor(uint256 _maxSupply, address _imx, address _royaltyReceiver) ERC721("BubbleBots", "BBOTS") {
        imx = _imx;
        MAX_SUPPLY=_maxSupply;
        _setDefaultRoyalty(_royaltyReceiver, 200);
    }

    function mintFor(
        address to,
        uint256 quantity,
        bytes calldata mintingBlob
    ) external imxOrAdmin {

        require(quantity == 1 && totalSupply < MAX_SUPPLY, "INVALID MINT");

        uint256 tokenId = getTokenId(mintingBlob);

        totalSupply += 1;

        super._safeMint(to, tokenId);

        emit AssetMinted(to, tokenId, mintingBlob);
    }

    function updateBaseUri(string memory baseURI) external onlyOwner {
        tokenBaseURI = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return tokenBaseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return string(abi.encodePacked(_baseURI(), Strings.toString(tokenId)));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getTokenId(bytes calldata blob) internal pure returns(uint256)
    {
        int256 colonIndex = Bytes.indexOf(blob, ":", 0);

        require(colonIndex >= 0, "Separator must exist");

        return Bytes.toUint(blob[1:uint256(colonIndex) - 1]);
    }
}
