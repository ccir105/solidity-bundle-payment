// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <=0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Bubbles is Pausable, Ownable {

    address multiSigWallet;

    using SafeMath for uint256;

    struct Bundle {
        uint256 price;
        uint256 gems;
        bool isActive;
        string name;
        string description;
    }

    mapping(uint256 => Bundle) bundles;

    IERC20 assetAddress;

    mapping(address => uint256[]) purchaseHistory;
    address[] buyers;

    event GemsPurchased(address buyer, uint256 bundleId);

    constructor(address _multiSigWallet, address _assetAddress) {
        assetAddress = IERC20(_assetAddress);
        multiSigWallet = _multiSigWallet;
    }

    function saveBundle(
        uint256 id,
        uint256 price,
        uint256 gems,
        bool isActive,
        string memory name,
        string memory description
    ) external onlyOwner {

        Bundle storage _bundle = bundles[id];

        _bundle.price = price;
        _bundle.gems = gems;
        _bundle.isActive = isActive;
        _bundle.name = name;
        _bundle.description = description;
    }

    function changeAssetAddress( address _assetAddress) external onlyOwner {
        require(_assetAddress != address(0));
        assetAddress = IERC20(_assetAddress);
    }

    function _purchase(address _buyer, uint256 _bundleId) internal {

        purchaseHistory[_buyer].push(_bundleId);
        buyers.push(_buyer);
        emit GemsPurchased(_buyer, _bundleId);
    }

    function purchaseGems( uint256 bundleId ) external whenNotPaused {

        Bundle memory _bundle = bundles[bundleId];
        require(_bundle.isActive == true , "Not Active");

        uint256 totalApproved = assetAddress.allowance(msg.sender, address(this));
        require(totalApproved >= _bundle.price);

        assetAddress.transferFrom(msg.sender, multiSigWallet, _bundle.price);
        _purchase(msg.sender, bundleId);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function getAllBuyers() public view returns(address[] memory) {
        return buyers;
    }

    function getBuyerHistory(address _buyer) public view returns(uint256[] memory) {
        return purchaseHistory[_buyer];
    }

    function getBundles(uint256 bundleId) public view returns(uint256, uint256, bool, string memory, string memory) {
        Bundle memory _bundle = bundles[bundleId];
        return (
        _bundle.price,
        _bundle.gems,
        _bundle.isActive,
        _bundle.name,
        _bundle.description
        );
    }
}
