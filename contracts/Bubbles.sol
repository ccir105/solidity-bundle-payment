// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <=0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Bubbles is Pausable, Ownable {

    using ECDSA for bytes32;
    using SafeMath for uint256;

    struct Bundle {
        uint256 price;
        uint256 beforeDiscount;
        uint256 gems;
        bool isActive;
        string name;
        string description;
    }

    struct PurchaseInfo {
        address buyerAddress;
        uint256 paidAmountAsToken;
        uint256 paidAmountAsEth;
        uint256 bundleId;
    }

    mapping(uint256 => Bundle) bundles;
    uint256[] bundleIds;

    PurchaseInfo[] purchaseHistory;

    IERC20 assetAddress;
    address multiSigWallet;
    address public manager;

    event GemsPurchased(address buyer, uint256 bundleId, uint256 gems);

    constructor(address _multiSigWallet, address _assetAddress, address _manager) {
        assetAddress = IERC20(_assetAddress);
        multiSigWallet = _multiSigWallet;
        manager = _manager;
    }

    function saveBundle(
        uint256 id,
        Bundle memory _toSaveBundle
    ) external onlyOwner {

        if( bundles[id].gems == 0 ) {
            bundleIds.push(id);
        }

        bundles[id] = _toSaveBundle;
    }

    function deleteBundle(uint256 id) external onlyOwner {
        delete bundles[id];
    }

    function changeAssetAddress( address _assetAddress) external onlyOwner {
        require(_assetAddress != address(0));
        assetAddress = IERC20(_assetAddress);
    }

    function changeManager(address _newManager) external onlyOwner {
        manager = _newManager;
    }

    function purchaseGemsByToken( uint256 bundleId ) external whenNotPaused {

        Bundle memory _bundle = bundles[bundleId];
        require(_bundle.isActive == true , "Not Active");

        uint256 totalApproved = assetAddress.allowance(msg.sender, address(this));
        require(totalApproved >= _bundle.price, "Not Enough");

        assetAddress.transferFrom(msg.sender, multiSigWallet, _bundle.price);

        PurchaseInfo memory history = PurchaseInfo(msg.sender, _bundle.price, 0, bundleId);
        purchaseHistory.push(history);

        emit GemsPurchased(msg.sender, bundleId, _bundle.gems);
    }

    function purchaseGemsByEth(uint256 bundleId, uint256 amountInEth, bytes memory _signature )
    external payable whenNotPaused {

        bytes memory _message = abi.encodePacked(bundleId, amountInEth, msg.sender);
        address _recoveredAddress = keccak256(_message).toEthSignedMessageHash().recover(_signature);

        require(manager == _recoveredAddress,"Signature Not Matched");
        require(msg.value >= amountInEth, "Not Enough");

        Bundle memory _bundle = bundles[bundleId];
        require(_bundle.isActive == true , "Not Active");

        payable(multiSigWallet).transfer(address(this).balance);

        PurchaseInfo memory history = PurchaseInfo(msg.sender, 0, amountInEth, bundleId);
        purchaseHistory.push(history);

        emit GemsPurchased(msg.sender, bundleId, _bundle.gems);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function getBundle(uint256 bundleId) public view returns(Bundle memory) {
        return bundles[bundleId];
    }

    function getBundles() public view returns(uint256[] memory) {
        return bundleIds;
    }

    function getPurchaseHistory() public view returns(PurchaseInfo[] memory) {
        return purchaseHistory;
    }
}
