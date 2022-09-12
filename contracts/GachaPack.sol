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

    bytes32 whitelistRoot;

    uint256 constant MAX_MINT = 5;

    mapping( address => uint256[] ) gachaMints;

    Collection nftCollection;

    uint256 public totalSupply = 0;

    bool public isSaleOpen;

    event MintGacha(address minter, uint256[] nftIds);

    function updateCollection(Collection _collection) external onlyOwner  {
        nftCollection = _collection;
    }

    function updateWhitelistRoot(bytes32 _merkleRoot) external onlyOwner {
        whitelistRoot = _merkleRoot;
    }

    function startSale() external onlyOwner {
        isSaleOpen = true;
    }

    function stopSale() external onlyOwner {
        isSaleOpen = false;
    }


    function openPack( ) external {
        require(isSaleOpen, "error");
        require( totalSupply <= MAX_SUPPLY , "error");
        require(gachaMints[msg.sender].length == 0, "Already Minted");
        totalSupply += 5;

        nftCollection.mintBBots( MAX_MINT, msg.sender );
        gachaMints[msg.sender] = nftCollection.tokensOfOwner(msg.sender);

        emit MintGacha( msg.sender, gachaMints[msg.sender] );
    }

    function getMintedNft(address _minter) public view returns(uint256[] memory){
        return gachaMints[_minter];
    }

    function verifyWhitelist(address user, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(user));

        return MerkleProof.verify(merkleProof, whitelistRoot, node);
    }
}
