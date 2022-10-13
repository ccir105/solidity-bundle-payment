// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

contract OtherWay is Ownable {
    using SafeMath for uint256;

    uint256 public totalSupply;

    uint256 constant MAX_SUPPLY = 999;
    uint256 REMAINING_WHITELIST_SALES = 100;

    uint256 public constant COST_PRICE = 0.2 ether;
    uint256 public constant WHITELIST_PRICE = 0.1 ether;

    event NewMinterDetected(address minter, uint256 nftIds);

    bytes32 communityWLRoot;

    IERC721 ForTheBuilders;

    address signer;

    mapping(address => uint256) mintParticipator;

    uint256 saleStat = 0;

    constructor(IERC721 _forTheBuilders, address _signer) {
        ForTheBuilders = _forTheBuilders;
        signer = _signer;
    }

    function isOurMinter(address _user) public view returns (bool) {
        return mintParticipator[_user] != 0;
    }

    function _prepareMint(uint256 numTokens) internal {
        totalSupply = totalSupply.add(numTokens);
        mintParticipator[msg.sender] = mintParticipator[msg.sender].add(numTokens);
        emit NewMinterDetected(msg.sender, numTokens);
    }

    function mintYourBot(uint256 numTokens) external payable {
        require(totalSupply.add(numTokens) < MAX_SUPPLY, "EXCEEDS_MAX_SUPPLY");

        require(msg.value >= COST_PRICE * numTokens, "MINT_FAILED");

        _prepareMint(numTokens);
    }

    /**
        Max allowded for the mint not implemented
     */
    function mintForWhitelist(uint256 numTokens, bytes32[] calldata proofs) external payable {
        require(saleStat == 1, "WHITELIST_NOT_STARTED");

        uint256 balanceOnFTHNft = ForTheBuilders.balanceOf(msg.sender);

        //for the builders already whitelisted
        if (balanceOnFTHNft > 0) {
            numTokens = balanceOnFTHNft;
        } else {
            //for the others verify merkle proof
            require(verifyCommunityWL(msg.sender, proofs), "PRROF_INVALID");
        }

        require(msg.value >= WHITELIST_PRICE * numTokens, "MINT_FAILED");

        require(numTokens <= REMAINING_WHITELIST_SALES, "EXCEEDS_SUPPLY");

        REMAINING_WHITELIST_SALES = REMAINING_WHITELIST_SALES.sub(1);

        _prepareMint(numTokens);
    }

    function verifyCommunityWL(address user, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(user));

        return MerkleProof.verify(merkleProof, communityWLRoot, node);
    }

    function setCommunityWLRoot(bytes32 _communityWLRoot) external onlyOwner {
        communityWLRoot = _communityWLRoot;
    }

    function withdrawEth(address _treasury) public onlyOwner {
        (bool os, ) = payable(_treasury).call{value: address(this).balance}("");
        require(os);
    }
}
