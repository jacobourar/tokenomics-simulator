# WOO Tokenomics V2 - Tracking Logic Documentation

## 📊 **What We're Measuring in V2**

### **🎯 Core System Flow**

```
Monthly Trading Volume 
    ↓
Fee Generation (WOOFi Swap, WOOFi Perp, WOO X)
    ↓
Fee Distribution (Configurable: Buyback/Stakers/Treasury)
    ↓
Protocol Buyback & Burn (Market Purchase → Immediate Burn)
    ↓
Price Impact (Permanent: Supply Reduction + Temporary: Buying Pressure)
    ↓
Treasury Accumulation (No Depletion Risk)
```

---

## **📈 Primary Tracking Categories**

### **1. Token Supply Dynamics**
- **`circulating_supply`**: Tradeable tokens in market
  - **Decreases by**: Protocol market purchases for buyback
  - **Formula**: `circulating -= market_purchase_tokens`
  
- **`total_supply`**: All tokens in existence
  - **Decreases by**: Direct burns from buyback program
  - **Formula**: `total_supply -= tokens_burned`
  
- **`total_staked_woo`**: Tokens locked in staking
  - **V2 Change**: No longer increases (stakers get USDC only)
  - **Remains constant** unless manual staking/unstaking

### **2. Treasury Health (V2: Accumulation Only)**
- **`woofi_treasury_balance`**: WOOFi treasury tokens
  - **Increases by**: 20% of WOOFi fees (configurable)
  - **V2 Change**: Never decreases (no burns from treasury)
  
- **`woox_treasury_balance`**: WOO X treasury tokens
  - **Increases by**: Remainder of WOO X fees after staker allocation
  - **V2 Change**: Never decreases

### **3. Fee Generation & Distribution**
- **`total_gross_woofi_fees`**: All WOOFi trading fees before splits
- **`gross_woofi_swap_fees`**: Swap trading fees (no affiliate cut)
- **`gross_woofi_perp_fees`**: Perpetual trading fees (60% to affiliates first)
- **`woox_staker_rewards`**: Configurable bps to WOO X stakers
- **`woox_treasury_inflow`**: Remainder to WOO X treasury

### **4. V2 Buyback & Burn Program**
- **`buyback_usd`**: USD allocated to buyback program (50% default)
- **`market_purchase_tokens`**: WOO tokens bought from market
- **`tokens_burned`**: Tokens immediately burned (same as purchased)
- **`usdc_to_stakers`**: All staker rewards (30% + WOO X %)

---

## **🧮 Key Calculations Per Month**

### **Step 1: Fee Calculation**
```javascript
// WOOFi Fees
gross_swap_fees = swap_volume × 0.08%
gross_perp_fees = perp_volume × 0.08%

// WOO X Fees  
woox_staker_rewards = woox_volume × configurable_bps
woox_treasury_inflow = total_woox_fees - woox_staker_rewards
```

### **Step 2: Fee Distribution (Configurable)**
```javascript
// After affiliate cut on perps (60% default)
net_fees = swap_fees + (perp_fees × 0.4)

// Configurable split (default 50/30/20)
buyback_amount = net_fees × buyback_share%
staker_rewards = net_fees × staker_share%  
treasury_inflow = net_fees × treasury_share%
```

### **Step 3: Buyback & Burn Execution**
```javascript
// Protocol market purchase
market_purchase_tokens = buyback_amount ÷ current_price

// Immediate burn (no treasury matching)
tokens_burned = market_purchase_tokens

// Supply updates
circulating_supply -= market_purchase_tokens
total_supply -= tokens_burned
```

### **Step 4: Price Impact**
```javascript
// Permanent impact (supply reduction)
permanent_impact = (tokens_burned ÷ circulating_supply) × supply_elasticity

// Temporary impact (buying pressure)
buy_pressure = buyback_amount ÷ daily_market_depth
new_temp_impact = buy_pressure × buying_pressure_elasticity
total_temp_impact = decayed_previous + new_temp_impact

// Price update
new_price = current_price × (1 + permanent + temporary)
```

---

## **📊 Historical Tracking Arrays**

### **Core Metrics (Monthly)**
- **`months[]`**: Month numbers (1, 2, 3...)
- **`price[]`**: WOO token price evolution
- **`circulating[]`**: Circulating supply changes
- **`staked[]`**: Total staked tokens (V2: mostly constant)
- **`woofi_treasury[]`**: WOOFi treasury accumulation
- **`woox_treasury[]`**: WOO X treasury accumulation

### **V2 Buyback Program**
- **`monthlyBurned[]`**: Tokens burned each month via buyback
- **`marketPurchases[]`**: Tokens purchased from market
- **`buyback_amounts[]`**: USD spent on buyback program
- **`usdc_distributed[]`**: USDC paid to stakers

### **Fee Tracking**
- **`staker_fees_received[]`**: Total USD to stakers (WOOFi + WOO X)
- **`treasury_fees_received[]`**: Total USD to treasuries
- **`orderly_fees_received[]`**: USD to Orderly/affiliates
- **`buyback_fees_received[]`**: USD to buyback program

### **Price Impact Components**
- **`permImpact[]`**: Permanent price impact from burns
- **`tempImpact[]`**: Temporary price impact from buying pressure

---

## **🎯 Key Performance Indicators**

### **1. Sustainability Metrics**
- **Treasury Runway**: `∞` (treasuries only accumulate in V2)
- **Supply Reduction**: `cumulative_burned ÷ initial_supply × 100%`
- **Price Change**: `(current_price - initial_price) ÷ initial_price × 100%`

### **2. Program Effectiveness**
- **Burn Rate Consistency**: Fixed % vs variable auto-compound adoption
- **Treasury Growth**: Continuous accumulation vs depletion risk
- **Staker Simplicity**: Pure USDC vs auto-compound complexity

### **3. Annual P/R Ratios** (Every 12 months)
```javascript
// Market cap vs value distribution
market_cap = circulating_supply × current_price
annual_value = annual_USDC + annual_burn_value + annual_buyback
p_r_ratio = market_cap ÷ annual_value
```

---

## **🔄 V1 vs V2 Tracking Differences**

| **Metric** | **V1 Tracking** | **V2 Tracking** | **Key Change** |
|------------|-----------------|-----------------|----------------|
| **Burn Source** | Treasury match & burn | Direct market buyback | Consistency vs variability |
| **Treasury** | Depletes over time | Accumulates continuously | Sustainability risk eliminated |
| **Staker Rewards** | USDC + auto-compound | USDC only | Simplified tracking |
| **Market Purchases** | Staker-driven | Protocol-driven | Predictable vs adoption-dependent |
| **Fee Splits** | Fixed 80/20 | Configurable sliders | Research flexibility |

---

## **💡 What This Tells Us**

### **V2 Advantages**
1. **Predictable Burns**: Fixed 50% allocation vs variable adoption rates
2. **Treasury Safety**: No depletion risk, continuous accumulation
3. **Research Flexibility**: Configurable splits for scenario testing
4. **Simplified Staking**: Pure USDC rewards, no complex choices

### **Key Insights from Data**
- **Price Impact**: More consistent vs V1's variable patterns
- **Treasury Health**: Always improving vs potential runway issues
- **Token Supply**: Steady reduction vs adoption-dependent burns
- **Fee Distribution**: Transparent allocation vs complex auto-compound flows

The V2 tracking system provides cleaner, more predictable metrics while maintaining the economic benefits of the original tokenomics design.