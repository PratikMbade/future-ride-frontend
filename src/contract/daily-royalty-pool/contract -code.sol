// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract OwnableUpgradeable {
    /// @custom:storage-location erc7201:openzeppelin.storage.Ownable
    struct OwnableStorage {
        address _owner;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.Ownable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant OwnableStorageLocation =
        0x9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c199300;

    function _getOwnableStorage() private pure returns (OwnableStorage storage $) {
        assembly {
            $.slot := OwnableStorageLocation
        }
    }

    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event renouncedOwnership(address indexed previousOwner, address indexed newOwner);

    function __Ownable_init(address initialOwner) internal {
        __Ownable_init_unchained(initialOwner);
    }

    function __Ownable_init_unchained(address initialOwner) internal {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        OwnableStorage storage $ = _getOwnableStorage();
        return $._owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != msg.sender) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
    }

    function _transferOwnership(address newOwner) internal virtual {
        OwnableStorage storage $ = _getOwnableStorage();
        address oldOwner = $._owner;
        $._owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function renounceOwnership() public onlyOwner {
        _transferOwnership(address(0));
        emit renouncedOwnership(msg.sender, address(this));
    }
}

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract DailyRoyalty is OwnableUpgradeable {

    struct users {
        uint256 addedTime;
        uint256 claimedTime;
        uint256 directCount;
        uint256 UserClaimedAmt;
        bool inPool;
        bool one;
        bool two;
        bool three;
        address upline;
        bool counted; // FIX: this downline has already been counted toward its upline in this pool
    }

    mapping(uint256 => mapping(address => users)) public userInfo;

    struct _globalUser {
        uint256 totalClaimed;
        uint256 totalPoolClaimed;
        uint256 totalQualified;
    }

    mapping(address => _globalUser) public GlobalUserDetails;

    struct poolDetail {
        uint256 poolLockedAmount;
        uint256 perUserDistribution;
        uint256 totalPoolDistribution;
        uint256 qualifiedUsers;
        address[] eligibleUsers;
    }

    mapping(uint256 => poolDetail) public poolDetails;

    struct _globalPool {
        uint256 totalSupplyAmount;
        uint256 totalDistributionAmount;
    }

    mapping(address => _globalPool) public GlobalPoolDetails;

    uint256 public poolStartTime;
    uint256 public poolIntervalTime;
    address public tokenAddress;

    address public matrixContract;
    uint256 public poolCount;        // pool currently collecting qualified users

    address public initialAddress;

    uint256 public lastClosedPool;   // FIX: the only pool that can be claimed right now (0 = none yet)

    event PoolClaim(address indexed user, uint256 indexed amount, uint256 indexed time, uint256 poolNumber);

    constructor() {
        __Ownable_init(msg.sender);
    }

    // FIX: the original modifier had no require, so it allowed every caller
    modifier onlyMatrix() {
        require(msg.sender == matrixContract, "Only matrix");
        _;
    }

    function setInitialAddress(address _add) public onlyOwner {
        initialAddress = _add;
    }

    function setTokenAddress(address _token) public onlyOwner {
        tokenAddress = _token;
    }

    function setPoolTime(uint256 _time) public onlyOwner {
        poolStartTime = _time;
        if (poolCount == 0) {
            poolCount = 1;
            setUsers(initialAddress);
        }
    }

    function setPoolIntervalTime(uint256 _time) public onlyOwner {
        poolIntervalTime = _time;
    }

    function setMatrix(address _matrix) public onlyOwner {
        matrixContract = _matrix;
    }

    function directCheck(address user, address _downline, uint256 package) public onlyMatrix {
        if (poolCount > 0 && poolStartTime < block.timestamp) {
            sessionEnd();
            require(user != address(0), "Invalid Address");

            users storage d = userInfo[poolCount][_downline];
            d.upline = user;

            if (package == 1) {
                d.one = true;
            } else if (package == 2) {
                d.two = true;
            } else if (package == 3) {
                d.three = true;
            }

            // FIX: count each downline only once per pool
            if (d.one && d.two && d.three && !d.counted) {
                d.counted = true;
                userInfo[poolCount][user].directCount++;
            }

            if (userInfo[poolCount][user].addedTime == 0 && userInfo[poolCount][user].directCount >= 2) {
                setUsers(user);
            }
        }
    }

    function setUsers(address _user) internal {
        // FIX: never add the same user to a pool twice
        if (userInfo[poolCount][_user].inPool) return;

        userInfo[poolCount][_user].addedTime = block.timestamp;
        poolDetails[poolCount].qualifiedUsers++;
        poolDetails[poolCount].eligibleUsers.push(_user);
        userInfo[poolCount][_user].inPool = true;
        GlobalUserDetails[_user].totalQualified++;
    }

    function claim(address user) public {
        require(poolCount > 0 && poolStartTime < block.timestamp, "Pool not started");
        sessionEnd();

        require(user == msg.sender || msg.sender == initialAddress, "Invalid User");
        require(lastClosedPool > 0, "No pool to claim yet");

        uint256 p = lastClosedPool;
        users storage u = userInfo[p][user];

        // FIX: was `inPool=true` (assignment), which always passed
        require(u.inPool, "Not qualified for this pool");
        require(u.claimedTime == 0, "Already Claimed");

        uint256 supplied = poolDetails[p].perUserDistribution;
        require(supplied > 0, "No Supply Available");

        // state changes before the external call
        u.claimedTime = block.timestamp;
        u.UserClaimedAmt += supplied;
        GlobalUserDetails[user].totalClaimed += supplied;
        GlobalUserDetails[user].totalPoolClaimed++;
        GlobalPoolDetails[address(this)].totalDistributionAmount += supplied;
        poolDetails[p].totalPoolDistribution += supplied;

        require(IERC20(tokenAddress).transfer(user, supplied), "Transfer failed");
        emit PoolClaim(user, supplied, block.timestamp, p);
    }

    function sessionEnd() internal {
        uint256 currentInterval = (block.timestamp - poolStartTime) / poolIntervalTime;

        if (currentInterval >= poolCount) {
            // FIX: always close the pool that was actually collecting users,
            // even if one or more intervals passed with no transactions
            uint256 closing = poolCount;
            uint256 bal = IERC20(tokenAddress).balanceOf(address(this));

            poolDetails[closing].poolLockedAmount = bal;
            if (poolDetails[closing].qualifiedUsers > 0) {
                poolDetails[closing].perUserDistribution = bal / poolDetails[closing].qualifiedUsers;
            }
            GlobalPoolDetails[address(this)].totalSupplyAmount +=
                poolDetails[closing].qualifiedUsers * poolDetails[closing].perUserDistribution;

            lastClosedPool = closing;          // only this pool is claimable until the next close
            poolCount = currentInterval + 1;   // new pool for the current interval
            setUsers(initialAddress);
        }
    }

    // Anyone (or a keeper bot) can close a finished pool; no owner claim needed
    function syncPools() external {
        require(poolCount > 0 && poolStartTime < block.timestamp, "Pool not started");
        sessionEnd();
    }

    // Read Section (time-based: correct even if nobody has sent a tx since the interval ended)

    function _started() internal view returns (bool) {
        return poolCount > 0 && poolIntervalTime > 0 && block.timestamp > poolStartTime;
    }

    // true when an interval has ended but sessionEnd() hasn't run on-chain yet
    function _pendingClose() internal view returns (bool) {
        if (!_started()) return false;
        return (block.timestamp - poolStartTime) / poolIntervalTime >= poolCount;
    }

    // Pool that is collecting qualified users right now
    function currentPool() public view returns (uint256) {
        if (!_started()) return poolCount;
        return (block.timestamp - poolStartTime) / poolIntervalTime + 1;
    }

    // Pool users can claim right now
    function claimablePool() public view returns (uint256) {
        return _pendingClose() ? poolCount : lastClosedPool;
    }

    function getPoolInfo(uint256 _pool)
        public
        view
        returns (
            uint256 lockedAmount,
            uint256 perUserDistribution,
            uint256 totalDistributed,
            uint256 qualifiedUsers,
            bool closed
        )
    {
        poolDetail storage pd = poolDetails[_pool];
        qualifiedUsers = pd.qualifiedUsers;
        totalDistributed = pd.totalPoolDistribution;
        lockedAmount = pd.poolLockedAmount;
        perUserDistribution = pd.perUserDistribution;
        closed = _pool < currentPool();

        bool pending = _pendingClose();

        // Ended but not yet closed on-chain: preview what sessionEnd() will set
        if (pending && _pool == poolCount) {
            uint256 bal = IERC20(tokenAddress).balanceOf(address(this));
            lockedAmount = bal;
            perUserDistribution = qualifiedUsers > 0 ? bal / qualifiedUsers : 0;
        }

        // New pool not yet opened on-chain: initialAddress will be added on sync
        if (pending && _pool == currentPool() && !userInfo[_pool][initialAddress].inPool) {
            qualifiedUsers += 1;
        }
    }

    function getUserClaimStatus(address user)
        public
        view
        returns (uint256 pool, bool qualified, bool claimed, uint256 claimableAmount)
    {
        pool = claimablePool();
        if (pool == 0) return (0, false, false, 0);

        users storage u = userInfo[pool][user];
        qualified = u.inPool;
        claimed = u.claimedTime != 0;

        if (qualified && !claimed) {
            (, claimableAmount, , , ) = getPoolInfo(pool);
        }
    }

    function getTimeLeft()
        public
        view
        returns (uint256 interval, uint256 startTime, uint256 endtime, uint256 timeLeftToClaim, uint256 poolNum)
    {
        uint256 quocent = ((block.timestamp - poolStartTime) / poolIntervalTime);
        return (
            poolIntervalTime,
            poolStartTime + (poolIntervalTime * quocent),
            (poolStartTime + (poolIntervalTime * quocent)) + poolIntervalTime,
            poolStartTime + (poolIntervalTime * (quocent + 1)) - block.timestamp,
            quocent + 1
        );
    }

    function eligibleUsers(uint256 _pool) public view returns (address[] memory) {
        return poolDetails[_pool].eligibleUsers;
    }
}