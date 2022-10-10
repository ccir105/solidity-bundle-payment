// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "erc721a/contracts/extensions/IERC721AQueryable.sol";
import "./Bytes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface Collection {
    function mintFor(address _to, uint256 quantity, bytes memory mintingBlob) external;
    function totalSupply() public view returns(uint256);
}

contract BattlePass is ERC721, Ownable {
    uint256 constant MAX_SUPPLY = 999;
    uint256 TOTAL_WHITELIST = 100;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("BATTLE PASS", "BTL-PASS"){}

    mapping(address => bool) public whiteListUsers;
    event AssetMinted(address indexed to, uint256 indexed tokenId, bytes blueprint);

    Collection nftCollection;

    uint8 public saleStat = 0;
    uint256 totalSupply = 0;

    function updateCollection(Collection _collection) external onlyOwner  {
        nftCollection = _collection;
    }

    function updateSaleStat(uint8 _saleStat) external onlyOwner {
        saleStat = _saleStat;
    }

    function addToWhitelist(address[] calldata _users) external onlyOwner {
       for(uint256 i = 0; i<_users.length;i++) {
           if(address(0) != _users[i]) {
               whiteListUsers[_users[i]] = true;
           }
       }
    }

    function mintFor( address to, uint256 quantity, bytes memory mintingBlob  ) external {

        require( totalSupply <= MAX_SUPPLY, "SUPPLY_EXCEEDS" );

        //whitelist check
        if( saleStat == 1 ) {
            require(whiteListUsers[msg.sender], "NOT_WHITELISTED");
            require( TOTAL_WHITELIST > 0 , "EXCEEDS_SUPPLY");
            TOTAL_WHITELIST = TOTAL_WHITELIST - 1;
        }

        //minting battle pass to user
        uint256 _tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        totalSupply += 1;

        _safeMint(to, _tokenId);

        emit AssetMinted(to, _tokenId, mintingBlob);

        (uint256 tokenId, string memory ipfsHash, bytes memory tokenSeed ) = parseBlob(mintingBlob);

        if( checkIfUserHasChance(tokenSeed) == true && nftCollection.totalSupply() < 333) {

            nftCollection.mintBBots(tokenId, msg.sender, ipfsHash);
        }
    }

    function parseBlob(bytes calldata blob) internal returns(uint256, string memory, string memory)
    {
        int256 colonIndex = Bytes.indexOf(blob, ":", 0);

        require(colonIndex >= 0, "Separator must exist");

        uint256 tokenID = Bytes.toUint(blob[1:uint256(colonIndex) - 1]);

        bytes calldata blueprint = blob[uint256(colonIndex) + 2:blob.length - 1];

        int256 commaIndex = Bytes.indexOf(blueprint, ",", 0);

        require(commaIndex >= 0, "Separator must exist");

        bytes memory ipfsHash = blueprint[0:uint256(commaIndex)];

        //random number generated from javascript
        bytes memory tokenSeed = blueprint[uint256(commaIndex) + 1:blueprint.length];

        return (tokenID, string(ipfsHash), tokenSeed);
    }

    function checkIfUserHasChance(bytes memory seed) public view returns(bool)
    {
        uint256 randomNumber = uint256(keccak256(abi.encode("BBOTS_NFT", seed, block.timestamp))) % 1500;

        if (randomNumber % 3 == 0)
        {
            return true;
        }

        return false;
    }
}
