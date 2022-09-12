// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "erc721a/contracts/extensions/IERC721AQueryable.sol";

interface Collection is IERC721AQueryable {
    function mintBBots(uint256 _amt, address _to) external;
}

contract GachaPack is Ownable {
    uint256 constant MAX_SUPPLY = 3000;

    uint256 remainingWLSales = 500;

    uint256 constant PER_PACK = 5;

    struct MintLog {
        uint256[] nfts;
        bool isNormalSaleOpened;
        bool isWhiteListOpened;
        uint256 mintedDate;
    }

    mapping( address => MintLog ) gachaMints;
    bytes32 whitelistRoot;
    mapping(address => bool) public whiteListUsers;


    Collection nftCollection;

    uint256 public totalSupply = 0;

    uint8 public saleStat = 0;

    event MintGacha(address minter, uint256[] nftIds);

    function updateCollection(Collection _collection) external onlyOwner  {
        nftCollection = _collection;
    }

    function updateWhitelistRoot(bytes32 _merkleRoot) external onlyOwner {
        whitelistRoot = _merkleRoot;
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

    function openPackForWl( bytes32[] calldata wlProofs ) external {
        require(saleStat == 1, "Not Opened");
        require( PER_PACK <= remainingWLSales , "EXCEEDS_SUPPLY");
        if( wlProofs.length == 0) {
            require(whiteListUsers[msg.sender], "NOT_WHITELISTED");
        }
        else{
            require(verifyWhitelist(msg.sender, wlProofs), "NOT_WHITELISTED");
        }
        MintLog storage mintLog = gachaMints[msg.sender];
        require(!mintLog.isWhiteListOpened, "Already Opened");

        mintLog.isWhiteListOpened = true;
        mintLog.mintedDate = block.timestamp;
        totalSupply += PER_PACK;

        nftCollection.mintBBots( PER_PACK, msg.sender );
        mintLog.nfts = nftCollection.tokensOfOwner(msg.sender);

        emit MintGacha( msg.sender, mintLog.nfts );
    }

    function openPack(  ) external {
        require(saleStat == 2, "Not Opened");
        require(totalSupply + PER_PACK <= MAX_SUPPLY - remainingWLSales, "EXCEEDS_SUPPLY");

        MintLog storage mintLog = gachaMints[msg.sender];
        require(!mintLog.isNormalSaleOpened, "Already Opened");

        mintLog.isNormalSaleOpened = true;
        mintLog.mintedDate = block.timestamp;
        totalSupply += PER_PACK;

        nftCollection.mintBBots( PER_PACK, msg.sender );
        mintLog.nfts = nftCollection.tokensOfOwner(msg.sender);

        emit MintGacha( msg.sender, mintLog.nfts );
    }

    function getMintedNft(address _minter) public view returns(uint256[] memory){
        return gachaMints[_minter].nfts;
    }

    function verifyWhitelist(address user, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(user));

        return MerkleProof.verify(merkleProof, whitelistRoot, node);
    }
}
