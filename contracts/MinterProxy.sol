// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface RobotCollection {
    function mintFor(address to, uint256 quantity) external;
}

contract MinterProxy is Ownable {
    using SafeMath for uint256;

    uint256 public totalSupply;

    uint256 MAX_SUPPLY = 999;
    uint256 public REMAINING_WHITELIST_SALES = 100;

    uint256 public immutable COST_PRICE;
    uint256 public immutable WHITELIST_PRICE;

    event NewMinterDetected(address indexed minter, uint256 quantity, uint256[] mintPassIds);

    uint16[] robots;

    uint16 nonce = 333;

    bytes32 whitelistRoot;

    uint256 public saleStat = 0;

    RobotCollection robotCollection;

    constructor(
        RobotCollection _robotCollection,
        uint256 _costPrice,
        uint256 _whitelistPrice
    ) {
        robotCollection = _robotCollection;
        COST_PRICE = _costPrice;
        WHITELIST_PRICE = _whitelistPrice;
    }

    function addSeeds( uint16[] memory _robotSeeds  ) external onlyOwner {
        robots = _robotSeeds;
    }

    function setSaleStat(uint256 _stat) external onlyOwner {
        saleStat = _stat;
    }

    //should

    function getRandomNum(uint256 upper) internal view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.coinbase, block.difficulty, msg.sender, upper, nonce)));
        return random % upper;
    }

    function _prepareMint(uint256 numTokens, address to) internal {

        totalSupply = totalSupply.add(numTokens);

        uint256 robotCounts = 0;

        uint256[] memory mintPassIds = new uint256[](numTokens);

        for(uint256 i = 0; i< numTokens; i++ ) {

            uint256 num = getRandomNum(robots.length);
            uint256 _robotId = uint256(robots[num]);

            if(_robotId > 0 && _robotId <= 333) {
                nonce = uint16(_robotId);
                robotCounts = robotCounts.add(1);
            }

            robots[num] = robots[robots.length - 1];
            robots.pop();

            mintPassIds[i] = _robotId;
        }

        if( robotCounts > 0) {
            robotCollection.mintFor(to, robotCounts);
        }

        emit NewMinterDetected(to, numTokens, mintPassIds);
    }

    function mintYourBot(uint256 numTokens) external payable {
        require(saleStat == 2, "PUBLIC_SALE_NOT_STARTED");

        require(totalSupply.add(numTokens) <= MAX_SUPPLY, "EXCEEDS_MAX_SUPPLY");

        require(msg.value >= COST_PRICE * numTokens, "MINT_FAILED");

        _prepareMint(numTokens, msg.sender);
    }

    function mintForWhitelist(uint256 numTokens, bytes32[] calldata proofs) external payable {
        require(saleStat == 1, "WHITELIST_NOT_STARTED");

        require(verifyIfWhiteListed(msg.sender, proofs), "PRROF_INVALID");

        require(msg.value >= WHITELIST_PRICE * numTokens, "MINT_FAILED");

        require(numTokens <= REMAINING_WHITELIST_SALES, "EXCEEDS_SUPPLY");

        REMAINING_WHITELIST_SALES = REMAINING_WHITELIST_SALES.sub(1);

        _prepareMint(numTokens, msg.sender);
    }

    //check if the user is in whitelist
    //user will pass the proofs which is returned from the api

    function verifyIfWhiteListed(address user, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(user));

        return MerkleProof.verify(merkleProof, whitelistRoot, node);
    }

    function setWhitelistRoot(bytes32 _whiteListRoot) external onlyOwner {
        whitelistRoot = _whiteListRoot;
    }

    function withdrawEth(address _treasury) public onlyOwner {
        (bool os, ) = payable(_treasury).call{value: address(this).balance}("");
        require(os);
    }
}
