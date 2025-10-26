// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMyOFT {
    struct SendParam {
        uint32 dstEid;
        bytes32 to;
        uint256 amountLD;
        uint256 minAmountLD;
        bytes extraOptions;
        bytes composeMsg;
        bytes oftCmd;
    }
    
    struct MessagingFee {
        uint256 nativeFee;
        uint256 lzTokenFee;
    }
    
    struct MessagingReceipt {
        bytes32 guid;
        uint64 nonce;
        MessagingFee fee;
    }
    
    struct OFTReceipt {
        uint256 amountSentLD;
        uint256 amountReceivedLD;
    }
    
    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt);
    
    function quoteSend(
        SendParam calldata _sendParam,
        bool _payInLzToken
    ) external view returns (MessagingFee memory msgFee);
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

/**
 * @title ConditionalBridge
 * @notice Enables automated token bridging when price conditions are met
 * @dev Integrates Pyth Network price feeds with LayerZero OFT bridging
 */
contract ConditionalBridge is Ownable, ReentrancyGuard {
    IPyth public immutable pyth;
    IMyOFT public immutable oftToken;
    
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant BTC_USD_PRICE_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    
    enum ConditionType {
        PRICE_ABOVE,    // Execute when price >= target
        PRICE_BELOW     // Execute when price <= target
    }
    
    enum OrderStatus {
        PENDING,
        EXECUTED,
        CANCELLED,
        EXPIRED
    }
    
    struct BridgeOrder {
        uint256 orderId;
        address user;
        uint256 amount;
        uint32 dstEid;              // Destination chain endpoint ID
        bytes32 priceFeedId;        // Pyth price feed ID
        int64 targetPrice;          // Target price (with Pyth's 8 decimals)
        ConditionType conditionType;
        OrderStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        bytes lzOptions;            // LayerZero send options
    }
    
    // Storage
    mapping(uint256 => BridgeOrder) public orders;
    uint256 public orderCount;
    uint256 public constant EXECUTOR_REWARD_BPS = 10; // Fixed 0.1% reward for executor
    
    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed user,
        uint256 amount,
        uint32 dstEid,
        bytes32 priceFeedId,
        int64 targetPrice,
        ConditionType conditionType
    );
    
    event OrderExecuted(
        uint256 indexed orderId,
        address indexed executor,
        int64 executionPrice
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed user);
    event OrderExpired(uint256 indexed orderId);
    
    constructor(
        address _pythContract,
        address _oftToken,
        address _owner
    ) Ownable(_owner) {
        require(_pythContract != address(0), "Invalid Pyth address");
        require(_oftToken != address(0), "Invalid OFT address");
        
        pyth = IPyth(_pythContract);
        oftToken = IMyOFT(_oftToken);
    }
    
    /**
     * @notice Create a conditional bridge order
     * @param amount Amount of OFT tokens to bridge
     * @param dstEid Destination chain endpoint ID (LayerZero)
     * @param priceFeedId Pyth price feed ID to monitor
     * @param targetPrice Target price (with 8 decimals, e.g., 3800e8 for $3800)
     * @param conditionType PRICE_ABOVE or PRICE_BELOW
     * @param expiryDuration How long the order is valid (in seconds, 0 for no expiry)
     * @param lzOptions LayerZero send options (gas settings, etc.)
     */
    function createOrder(
        uint256 amount,
        uint32 dstEid,
        bytes32 priceFeedId,
        int64 targetPrice,
        ConditionType conditionType,
        uint256 expiryDuration,
        bytes calldata lzOptions
    ) external nonReentrant returns (uint256 orderId) {
        require(amount > 0, "Amount must be > 0");
        require(targetPrice > 0, "Target price must be > 0");
        require(dstEid != 0, "Invalid destination EID");
        
        // Transfer tokens from user to this contract
        require(
            oftToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        orderId = orderCount++;
        uint256 expiresAt = expiryDuration > 0 ? block.timestamp + expiryDuration : 0;
        
        orders[orderId] = BridgeOrder({
            orderId: orderId,
            user: msg.sender,
            amount: amount,
            dstEid: dstEid,
            priceFeedId: priceFeedId,
            targetPrice: targetPrice,
            conditionType: conditionType,
            status: OrderStatus.PENDING,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            lzOptions: lzOptions
        });
        
        emit OrderCreated(
            orderId,
            msg.sender,
            amount,
            dstEid,
            priceFeedId,
            targetPrice,
            conditionType
        );
        
        return orderId;
    }
    
    /**
     * @notice Execute a bridge order when price condition is met
     * @dev Anyone can call this (keeper/bot), executor gets a small reward
     * @param orderId Order ID to execute
     * @param priceUpdate Pyth price update data (fetch from Hermes API)
     */
    function executeOrder(
        uint256 orderId,
        bytes[] calldata priceUpdate
    ) external payable nonReentrant {
        BridgeOrder storage order = orders[orderId];
        
        require(order.status == OrderStatus.PENDING, "Order not pending");
        require(
            order.expiresAt == 0 || block.timestamp <= order.expiresAt,
            "Order expired"
        );
        
        // Update Pyth price feed
        uint updateFee = pyth.getUpdateFee(priceUpdate);
        require(msg.value >= updateFee, "Insufficient fee for price update");
        pyth.updatePriceFeeds{value: updateFee}(priceUpdate);
        
        // Check if price condition is met
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(order.priceFeedId, 60);
        
        bool conditionMet = false;
        if (order.conditionType == ConditionType.PRICE_ABOVE) {
            conditionMet = price.price >= order.targetPrice;
        } else {
            conditionMet = price.price <= order.targetPrice;
        }
        
        require(conditionMet, "Price condition not met");
        
        // Calculate executor reward (fixed at 0.1%)
        uint256 executorReward = (order.amount * EXECUTOR_REWARD_BPS) / 10000;
        uint256 bridgeAmount = order.amount - executorReward;
        
        // Transfer reward to executor
        if (executorReward > 0) {
            require(
                oftToken.transfer(msg.sender, executorReward),
                "Reward transfer failed"
            );
        }
        
        // Execute LayerZero bridge
        bytes32 recipientBytes32 = bytes32(uint256(uint160(order.user)));
        
        IMyOFT.SendParam memory sendParam = IMyOFT.SendParam({
            dstEid: order.dstEid,
            to: recipientBytes32,
            amountLD: bridgeAmount,
            minAmountLD: bridgeAmount,
            extraOptions: order.lzOptions,
            composeMsg: "",
            oftCmd: ""
        });
        
        IMyOFT.MessagingFee memory fee = IMyOFT.MessagingFee({
            nativeFee: msg.value - updateFee,
            lzTokenFee: 0
        });
        
        oftToken.send{value: msg.value - updateFee}(
            sendParam,
            fee,
            order.user
        );
        
        order.status = OrderStatus.EXECUTED;
        
        emit OrderExecuted(orderId, msg.sender, price.price);
    }
    
    /**
     * @notice Cancel a pending order and return tokens to user
     * @param orderId Order ID to cancel
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        BridgeOrder storage order = orders[orderId];
        
        require(msg.sender == order.user, "Not order owner");
        require(order.status == OrderStatus.PENDING, "Order not pending");
        
        // Return tokens to user
        require(
            oftToken.transfer(order.user, order.amount),
            "Transfer failed"
        );
        
        order.status = OrderStatus.CANCELLED;
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @notice Mark expired orders (callable by anyone)
     * @param orderId Order ID to mark as expired
     */
    function markExpired(uint256 orderId) external {
        BridgeOrder storage order = orders[orderId];
        
        require(order.status == OrderStatus.PENDING, "Order not pending");
        require(order.expiresAt > 0, "Order has no expiry");
        require(block.timestamp > order.expiresAt, "Order not expired yet");
        
        // Return tokens to user
        require(
            oftToken.transfer(order.user, order.amount),
            "Transfer failed"
        );
        
        order.status = OrderStatus.EXPIRED;
        
        emit OrderExpired(orderId);
    }
    
    /**
     * @notice Check if order condition is currently met (view function)
     * @param orderId Order ID to check
     * @return met Whether condition is met
     * @return currentPrice Current price from Pyth
     */
    function checkOrderCondition(uint256 orderId) 
        external 
        view 
        returns (bool met, int64 currentPrice) 
    {
        BridgeOrder storage order = orders[orderId];
        
        PythStructs.Price memory price = pyth.getPriceUnsafe(order.priceFeedId);
        currentPrice = price.price;
        
        if (order.conditionType == ConditionType.PRICE_ABOVE) {
            met = currentPrice >= order.targetPrice;
        } else {
            met = currentPrice <= order.targetPrice;
        }
        
        return (met, currentPrice);
    }
    
    /**
     * @notice Get current price from Pyth feed
     * @param priceFeedId Pyth price feed ID
     * @return price Current price
     * @return expo Price exponent
     * @return timestamp Price timestamp
     */
    function getCurrentPrice(bytes32 priceFeedId) 
        external 
        view 
        returns (int64 price, int32 expo, uint timestamp) 
    {
        PythStructs.Price memory priceData = pyth.getPriceUnsafe(priceFeedId);
        return (priceData.price, priceData.expo, priceData.publishTime);
    }
    
    // Receive ETH for LayerZero fees
    receive() external payable {}
}

