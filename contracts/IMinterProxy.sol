// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMinterProxy {
    function isOurMinter(address minter) external view returns(bool);
}
