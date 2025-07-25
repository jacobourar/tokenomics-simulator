/**
 * Core simulation logic for WOO tokenomics
 */

class WOOSimulation {
    constructor() {
        this.simState = {};
        this.simParams = {};
        this.simInterval = null;
    }

    /**
     * Initialize simulation with parameters and initial state
     */
    initialize(controls, modelVersion = 'v2') {
        if (this.simInterval) clearInterval(this.simInterval);
        
        // Store model version
        this.modelVersion = modelVersion;
        
        // Extract parameters from controls
        this.simParams = {
            monthly_woofi_swap_volume: parseFloat(controls.woofiSwapVolume.value) * 1_000_000 * 30,
            monthly_woofi_perp_volume: parseFloat(controls.woofiPerpVolume.value) * 1_000_000 * 30,
            monthly_woox_volume: parseFloat(controls.wooxVolume.value) * 1_000_000 * 30,
            
            // Model-specific parameters
            ...(modelVersion === 'v1' ? {
                // V1: Fixed parameters from CONFIG
                woofi_staker_share: CONFIG.FIXED_PARAMS.woofi_staker_share,
                auto_compound_adoption_rate: parseFloat(controls.autoCompoundRate.value) / 100,
                woox_staker_bps: CONFIG.FIXED_PARAMS.woox_staker_bps_reward
            } : {
                // V2: Configurable fee splits
                buyback_burn_share: parseFloat(controls.buybackBurnShare.value) / 100,
                staker_share: parseFloat(controls.stakerShare.value) / 100,
                treasury_share: parseFloat(controls.treasuryShare.value) / 100,
                woox_staker_bps: parseFloat(controls.wooxStakerBps.value) / 10000 // Convert bps to decimal
            }),
            
            affiliate_share: parseFloat(controls.affiliateCut.value) / 100,
            woofi_fee_rate: parseFloat(controls.woofiTradingFeeRate.value) / 100 / 100, // Convert from percentage (0.08%) to decimal (0.0008)
            supply_elasticity: parseFloat(controls.supplyElasticity.value),
            buying_pressure_elasticity: parseFloat(controls.buyingPressureElasticity.value),
            buying_pressure_decay: parseFloat(controls.buyingPressureDecay.value) / 100,
            simulation_months: parseInt(controls.simulationDuration.value),
            initial_circulating_supply: parseFloat(controls.circulatingSupply.value) * 1_000_000,
            // Fixed parameters
            ...CONFIG.FIXED_PARAMS
        };
        
        // Initialize state with dynamic initial values
        this.simState = {
            month: 0,
            ...CONFIG.INITIAL_STATE,
            circulating_supply: this.simParams.initial_circulating_supply,
            total_staked_woo: parseFloat(controls.initialStaked.value) * 1_000_000,
            woofi_treasury_balance: parseFloat(controls.initialWoofiTreasury.value) * 1_000_000,
            woox_treasury_balance: parseFloat(controls.initialWooxTreasury.value) * 1_000_000,
            history: {
                months: [], 
                woofi_treasury: [], 
                woox_treasury: [],
                circulating: [], 
                staked: [], 
                price: [],
                monthlyBurned: [], 
                marketPurchases: [], 
                permImpact: [], 
                tempImpact: [],
                usdc_distributed: [],
                // Model-specific tracking arrays
                buyback_amounts: [], // V2: Track buyback spending
                auto_compound_amounts: [], // V1: Track auto-compound amounts
                treasury_inflows: [],
                woofi_fees_generated: [],
                woox_fees_generated: [],
                woox_treasury_inflows: [], // Track WOO X treasury inflows
                // Fee recipient breakdown
                staker_fees_received: [],
                treasury_fees_received: [],
                orderly_fees_received: [],
                // Fee recipient breakdown
                staker_fees_received: [],
                treasury_fees_received: [],
                orderly_fees_received: [],
                // Health & Sustainability Analytics
                treasury_runway_months: [],
                price_change_pct: [],
                supply_reduction_pct: [],
                cumulative_burned: [],
                // Performance Indicators
                staking_ratio: [],
                treasury_runway: []
            },
            // Store initial values for comparison
            initial_values: {
                price: 0,
                circulating_supply: 0,
                total_treasury: 0,
                total_staked: 0
            },
            // Store annual P/V ratios (dual calculation)
            annual_pv_ratios_usd: [],
            annual_pv_ratios_market: []
         };
         
         // Store initial values for analytics comparisons
         this.simState.initial_values = {
             price: this.simState.woo_price,
             circulating_supply: this.simState.circulating_supply,
             total_treasury: this.simState.woofi_treasury_balance + this.simState.woox_treasury_balance,
             total_staked: this.simState.total_staked_woo
         };
     }

    /**
     * Execute one simulation step (one month)
     */
    simulationStep() {
        const currentMonth = this.simState.month;
        
        // Check simulation end conditions based on model
        if (currentMonth >= this.simParams.simulation_months) {
            console.log(`Simulation ended normally at month ${currentMonth}`);
            return false; // Simulation ended
        }
        
        // V1: Also check for treasury depletion
        if (this.modelVersion === 'v1' && this.simState.woofi_treasury_balance <= 0) {
            console.log(`V1 Simulation ended due to treasury depletion at month ${currentMonth}`);
            return false; // Simulation ended
        }
        
        // Enhanced debugging for month 8-12
        if (currentMonth >= 8 && currentMonth <= 12) {
            console.log(`=== MONTH ${currentMonth} START ===`, {
                month: currentMonth,
                price: this.simState.woo_price,
                circulating: this.simState.circulating_supply,
                woofi_treasury: this.simState.woofi_treasury_balance,
                woox_treasury: this.simState.woox_treasury_balance
            });
        }
        
        try {
        
            // --- BLOCK 1: FEE GENERATION & DISTRIBUTION ---
            const feeData = this.calculateFees();
            if (currentMonth >= 8 && currentMonth <= 12) {
                console.log('BLOCK 1 - Fee Data:', feeData);
            }
            
            const distributionData = this.distributeFees(feeData);
            if (currentMonth >= 8 && currentMonth <= 12) {
                console.log('BLOCK 1 - Distribution Data:', distributionData);
            }
            
            // --- BLOCK 2: BUYBACK, BURN, AND PRICE IMPACT CALCULATION ---
            const burnData = this.calculateBuybackAndBurn(distributionData);
            if (currentMonth >= 8 && currentMonth <= 12) {
                console.log('BLOCK 2 - Burn Data:', burnData);
            }
            
            const priceImpactData = this.calculatePriceImpact(burnData);
            if (currentMonth >= 8 && currentMonth <= 12) {
                console.log('BLOCK 2 - Price Impact Data:', priceImpactData);
            }
            
            // --- UPDATE INTERMEDIATE STATE VARIABLES ---
            this.updateIntermediateVariables(feeData, distributionData, burnData, priceImpactData);
            
            // --- BLOCK 3: STATE UPDATES (MECHANISMS) ---
            this.updateTreasury(distributionData, burnData);
            this.updateStakerPositions(burnData);
            this.updateSupply(burnData);
            this.updatePrice(priceImpactData);
            
            if (currentMonth >= 8 && currentMonth <= 12) {
                console.log('BLOCK 3 - After Updates:', {
                    price: this.simState.woo_price,
                    circulating: this.simState.circulating_supply,
                    total_supply: this.simState.total_supply,
                    woofi_treasury: this.simState.woofi_treasury_balance,
                    woox_treasury: this.simState.woox_treasury_balance
                });
            }
            
            // --- RECORD HISTORY ---
            this.recordHistory(burnData, distributionData, feeData);
            
            this.simState.month++;
            
            if (currentMonth >= 8 && currentMonth <= 12) {
                console.log(`=== MONTH ${currentMonth} COMPLETED ===`);
            }
            
            return true; // Continue simulation
            
        } catch (error) {
            console.error(`Error in simulation step at month ${currentMonth}:`, error);
            console.error('Current state:', this.simState);
            return false; // Stop simulation on error
        }
    }

    /**
     * Calculate fees from different sources
     */
    calculateFees() {
        const gross_woofi_swap_fees = this.simParams.monthly_woofi_swap_volume * this.simParams.woofi_fee_rate;
        const gross_woofi_perp_fees = this.simParams.monthly_woofi_perp_volume * this.simParams.woofi_fee_rate;
        const total_gross_woofi_fees = gross_woofi_swap_fees + gross_woofi_perp_fees;
        
        // WOO X fees (model-specific bps)
        const total_woox_fees = this.simParams.monthly_woox_volume * this.simParams.woox_total_fee_rate;
        const woox_staker_rewards = this.simParams.monthly_woox_volume * this.simParams.woox_staker_bps;
        const woox_treasury_inflow = total_woox_fees - woox_staker_rewards; // Remainder to treasury
        
        return {
            gross_woofi_swap_fees,
            gross_woofi_perp_fees,
            total_gross_woofi_fees,
            woox_staker_rewards,
            total_woox_fees,
            woox_treasury_inflow
        };
    }

    /**
     * Distribute fees based on model version
     */
    distributeFees(feeData) {
        if (this.modelVersion === 'v1') {
            return this.distributeFeesV1(feeData);
        } else {
            return this.distributeFeesV2(feeData);
        }
    }

    /**
     * V1: Distribute fees with fixed 80/20 split - stakers/treasury 
     */
    distributeFeesV1(feeData) {
        const gross_swap_fees = feeData.gross_woofi_swap_fees;
        const gross_perp_fees = feeData.gross_woofi_perp_fees;
        
        // 1. SWAP FEES: Fixed 80/20 split
        const net_swap_fees = gross_swap_fees; // 100% goes to net (no affiliate cut)
        const swap_staker_rewards = net_swap_fees * this.simParams.woofi_staker_share; // 80%
        const swap_treasury_inflow = net_swap_fees * (1 - this.simParams.woofi_staker_share); // 20%
        
        // 2. PERP FEES: Affiliate cut first, then 80/20 split
        const perp_affiliate_cut = gross_perp_fees * this.simParams.affiliate_share; // 60% to Orderly/Affiliates
        const net_perp_fees = gross_perp_fees - perp_affiliate_cut; // 40% remaining
        const perp_staker_rewards = net_perp_fees * this.simParams.woofi_staker_share; // 80% of remaining
        const perp_treasury_inflow = net_perp_fees * (1 - this.simParams.woofi_staker_share); // 20% of remaining
        
        // 3. COMBINE TOTALS
        const total_woofi_staker_rewards = swap_staker_rewards + perp_staker_rewards;
        const total_woofi_treasury_inflow = swap_treasury_inflow + perp_treasury_inflow;
        const total_affiliate_cut = perp_affiliate_cut; // Only from perps
        
        // Total staker rewards (WOOFi + WOO X)
        const total_staker_rewards_usd = total_woofi_staker_rewards + feeData.woox_staker_rewards;

        return {
            // V1: No buyback allocation
            buyback_burn_amount: 0,
            
            // Updated distributions
            affiliate_cut: total_affiliate_cut,
            woofi_staker_rewards: total_woofi_staker_rewards,
            woofi_treasury_inflow_usd: total_woofi_treasury_inflow,
            woox_treasury_inflow_usd: feeData.woox_treasury_inflow,
            total_staker_rewards_usd,
            total_affiliate_cut,
            
            // Fee recipient breakdown for tracking
            staker_fees_total: total_woofi_staker_rewards + feeData.woox_staker_rewards,
            treasury_fees_total: total_woofi_treasury_inflow + feeData.woox_treasury_inflow,
            orderly_fees_total: total_affiliate_cut,
            buyback_fees_total: 0 // V1: No buyback
        };
    }

    /**
     * V2: Distribute fees with configurable splits - buyback/stakers/treasury
     */
    distributeFeesV2(feeData) {
        const gross_swap_fees = feeData.gross_woofi_swap_fees;
        const gross_perp_fees = feeData.gross_woofi_perp_fees;
        
        // 1. SWAP FEES: Apply configurable split directly
        const net_swap_fees = gross_swap_fees; // 100% goes to net (no affiliate cut)
        const swap_buyback_amount = net_swap_fees * this.simParams.buyback_burn_share;
        const swap_staker_rewards = net_swap_fees * this.simParams.staker_share;
        const swap_treasury_inflow = net_swap_fees * this.simParams.treasury_share;
        
        // 2. PERP FEES: Affiliate cut first, then configurable split
        const perp_affiliate_cut = gross_perp_fees * this.simParams.affiliate_share; // 60% to Orderly/Affiliates
        const net_perp_fees = gross_perp_fees - perp_affiliate_cut; // 40% remaining
        const perp_buyback_amount = net_perp_fees * this.simParams.buyback_burn_share;
        const perp_staker_rewards = net_perp_fees * this.simParams.staker_share;
        const perp_treasury_inflow = net_perp_fees * this.simParams.treasury_share;
        
        // 3. COMBINE TOTALS
        const total_buyback_burn_amount = swap_buyback_amount + perp_buyback_amount;
        const total_woofi_staker_rewards = swap_staker_rewards + perp_staker_rewards;
        const total_woofi_treasury_inflow = swap_treasury_inflow + perp_treasury_inflow;
        const total_affiliate_cut = perp_affiliate_cut; // Only from perps
        
        // Total staker rewards (WOOFi + WOO X)
        const total_staker_rewards_usd = total_woofi_staker_rewards + feeData.woox_staker_rewards;

        return {
            // V2: New buyback & burn allocation
            buyback_burn_amount: total_buyback_burn_amount,
            
            // Updated distributions
            affiliate_cut: total_affiliate_cut,
            woofi_staker_rewards: total_woofi_staker_rewards,
            woofi_treasury_inflow_usd: total_woofi_treasury_inflow,
            woox_treasury_inflow_usd: feeData.woox_treasury_inflow,
            total_staker_rewards_usd,
            total_affiliate_cut,
            
            // Fee recipient breakdown for tracking
            staker_fees_total: total_woofi_staker_rewards + feeData.woox_staker_rewards,
            treasury_fees_total: total_woofi_treasury_inflow + feeData.woox_treasury_inflow,
            orderly_fees_total: total_affiliate_cut,
            buyback_fees_total: total_buyback_burn_amount
        };
    }

    /**
     * Calculate burn mechanism based on model version
     */
    calculateBuybackAndBurn(distributionData) {
        if (this.modelVersion === 'v1') {
            return this.calculateAutoCompoundAndBurn(distributionData);
        } else {
            return this.calculateBuybackAndBurnV2(distributionData);
        }
    }

    /**
     * V1: Calculate auto-compound purchases and treasury burn matching
     */
    calculateAutoCompoundAndBurn(distributionData) {
        const total_staker_rewards = distributionData.total_staker_rewards_usd;
        
        // Debug: Check for invalid values
        if (total_staker_rewards < 0 || !isFinite(total_staker_rewards)) {
            console.error('Invalid staker rewards:', total_staker_rewards);
            return { buyback_usd: 0, auto_compound_usd: 0, usdc_distribution: 0, market_purchase_tokens: 0, tokens_burned: 0, usdc_to_stakers: 0, woofi_tokens_burned: 0, woox_tokens_burned: 0 };
        }
        
        if (this.simState.woo_price <= 0 || !isFinite(this.simState.woo_price)) {
            console.error('Invalid WOO price:', this.simState.woo_price);
            return { buyback_usd: 0, auto_compound_usd: 0, usdc_distribution: 0, market_purchase_tokens: 0, tokens_burned: 0, usdc_to_stakers: 0, woofi_tokens_burned: 0, woox_tokens_burned: 0 };
        }
        
        // 1. Split staker rewards based on auto-compound adoption
        const auto_compound_usd = total_staker_rewards * this.simParams.auto_compound_adoption_rate;
        const usdc_distribution = total_staker_rewards - auto_compound_usd;
        
        // 2. Auto-compound: Market purchase for stakers
        const market_purchase_tokens = auto_compound_usd > 0 ? auto_compound_usd / this.simState.woo_price : 0;
        
        // 3. Treasury burn matching: Treasury burns tokens to match market purchases
        const woofi_tokens_burned = Math.min(market_purchase_tokens, this.simState.woofi_treasury_balance);
        const woox_tokens_burned = 0; // V1: Only WOOFi treasury burns
        const tokens_burned = woofi_tokens_burned + woox_tokens_burned;
        
        return {
            buyback_usd: 0, // V1: No protocol buyback
            auto_compound_usd,
            usdc_distribution,
            market_purchase_tokens,
            tokens_burned,
            usdc_to_stakers: usdc_distribution, // V1: Partial USDC to stakers
            woofi_tokens_burned,
            woox_tokens_burned
        };
    }

    /**
     * V2: Calculate protocol buyback and direct burn
     */
    calculateBuybackAndBurnV2(distributionData) {
        const buyback_usd = distributionData.buyback_burn_amount;
        const usdc_to_stakers = distributionData.total_staker_rewards_usd;
        
        // Debug: Check for invalid values
        if (buyback_usd < 0 || !isFinite(buyback_usd)) {
            console.error('Invalid buyback_usd:', buyback_usd);
            return { buyback_usd: 0, market_purchase_tokens: 0, tokens_burned: 0, usdc_to_stakers: 0, woofi_tokens_burned: 0, woox_tokens_burned: 0 };
        }
        
        if (this.simState.woo_price <= 0 || !isFinite(this.simState.woo_price)) {
            console.error('Invalid WOO price:', this.simState.woo_price);
            return { buyback_usd: 0, market_purchase_tokens: 0, tokens_burned: 0, usdc_to_stakers: 0, woofi_tokens_burned: 0, woox_tokens_burned: 0 };
        }
        
        // 1. Protocol market purchase with buyback funds
        const market_purchase_tokens = buyback_usd / this.simState.woo_price;
        
        // 2. All purchased tokens are immediately burned (no treasury matching)
        const tokens_burned = market_purchase_tokens;
        
        return {
            buyback_usd,
            market_purchase_tokens,
            tokens_burned,
            usdc_to_stakers, // All staker rewards in USDC
            woofi_tokens_burned: 0, // V2: No treasury burns
            woox_tokens_burned: 0
        };
    }

    /**
     * Calculate price impact from burns and buying pressure
     */
    calculatePriceImpact(burnData) {
        // Permanent impact from supply reduction
        const supply_reduction_pct = this.simState.circulating_supply > 0 ? 
            burnData.tokens_burned / this.simState.circulating_supply : 0;
        const permanent_impact = supply_reduction_pct * this.simParams.supply_elasticity;
        
        // Temporary impact from buying pressure
        const market_depth_proxy = (this.simParams.monthly_woofi_swap_volume + this.simParams.monthly_woox_volume) / 30;
        const buying_pressure_usd = this.modelVersion === 'v1' ? burnData.auto_compound_usd : burnData.buyback_usd;
        const buy_pressure_ratio = market_depth_proxy > 0 ? buying_pressure_usd / market_depth_proxy : 0;
        const new_temporary_impact = buy_pressure_ratio * this.simParams.buying_pressure_elasticity;
        const decayed_impact = this.simState.temporary_price_impact * (1 - this.simParams.buying_pressure_decay);
        const total_temporary_impact = decayed_impact + new_temporary_impact;

        return {
            permanent_impact,
            new_temporary_impact,
            total_temporary_impact
        };
    }

    /**
     * Update treasury balances based on model version
     */
    updateTreasury(distributionData, burnData) {
        if (this.modelVersion === 'v1') {
            return this.updateTreasuryV1(distributionData, burnData);
        } else {
            return this.updateTreasuryV2(distributionData, burnData);
        }
    }

    /**
     * V1: Update treasury balances (inflow and burn depletion)
     */
    updateTreasuryV1(distributionData, burnData) {
        const woofi_inflow_tokens = this.simState.woo_price > 0 ? 
            distributionData.woofi_treasury_inflow_usd / this.simState.woo_price : 0;
        
        const woox_inflow_tokens = this.simState.woo_price > 0 ?
            distributionData.woox_treasury_inflow_usd / this.simState.woo_price : 0;
        
        // V1: Treasury burns tokens to match auto-compound purchases (depletion risk)
        this.simState.woofi_treasury_balance += woofi_inflow_tokens - burnData.woofi_tokens_burned;
        this.simState.woox_treasury_balance += woox_inflow_tokens - burnData.woox_tokens_burned;
        
        // Prevent negative treasury balances
        this.simState.woofi_treasury_balance = Math.max(0, this.simState.woofi_treasury_balance);
        this.simState.woox_treasury_balance = Math.max(0, this.simState.woox_treasury_balance);
    }

    /**
     * V2: Update treasury balances (accumulation only, no burns)
     */
    updateTreasuryV2(distributionData, burnData) {
        const woofi_inflow_tokens = this.simState.woo_price > 0 ? 
            distributionData.woofi_treasury_inflow_usd / this.simState.woo_price : 0;
        
        const woox_inflow_tokens = this.simState.woo_price > 0 ?
            distributionData.woox_treasury_inflow_usd / this.simState.woo_price : 0;
        
        // V2: Both treasuries only accumulate (no burns)
        this.simState.woofi_treasury_balance += woofi_inflow_tokens; // No subtraction
        this.simState.woox_treasury_balance += woox_inflow_tokens;
    }

    /**
     * Update staker positions based on model version
     */
    updateStakerPositions(burnData) {
        if (this.modelVersion === 'v1') {
            return this.updateStakerPositionsV1(burnData);
        } else {
            return this.updateStakerPositionsV2(burnData);
        }
    }

    /**
     * V1: Update staker positions (auto-compound increases staked balance)
     */
    updateStakerPositionsV1(burnData) {
        // V1: Auto-compound purchases increase staked token balance
        if (burnData.market_purchase_tokens > 0) {
            this.simState.total_staked_woo += burnData.market_purchase_tokens;
        }
    }

    /**
     * V2: Update staker positions (no changes - stakers get USDC only)
     */
    updateStakerPositionsV2(burnData) {
        // V2: No staked token increases - all rewards in USDC
        // this.simState.total_staked_woo remains unchanged
    }

    /**
     * Update token supply
     */
    updateSupply(burnData) {
        // Debug: Check for invalid values
        if (burnData.tokens_burned < 0 || !isFinite(burnData.tokens_burned) ||
            burnData.market_purchase_tokens < 0 || !isFinite(burnData.market_purchase_tokens)) {
            console.error('Invalid burn data:', burnData);
            return;
        }
        
        // V2: Protocol buys from circulating and burns immediately
        this.simState.total_supply -= burnData.tokens_burned;
        this.simState.circulating_supply -= burnData.market_purchase_tokens; // Only market purchases
        this.simState.cumulative_tokens_burned += burnData.tokens_burned;
        
        // Debug: Check for negative supplies
        if (this.simState.total_supply < 0 || this.simState.circulating_supply < 0) {
            console.error('Negative supply detected at month', this.simState.month, {
                total_supply: this.simState.total_supply,
                circulating_supply: this.simState.circulating_supply,
                tokens_burned: burnData.tokens_burned,
                market_purchases: burnData.market_purchase_tokens
            });
        }
    }

    /**
     * Update price based on impacts
     */
    updatePrice(priceImpactData) {
        const price_change_multiplier = 1 + priceImpactData.permanent_impact + priceImpactData.total_temporary_impact;
        
        // V2: Add safeguards for price calculations
        if (isNaN(price_change_multiplier) || !isFinite(price_change_multiplier) || price_change_multiplier <= 0) {
            console.error('Invalid price multiplier at month', this.simState.month, {
                multiplier: price_change_multiplier,
                permanent: priceImpactData.permanent_impact,
                temporary: priceImpactData.total_temporary_impact,
                current_price: this.simState.woo_price
            });
            return; // Skip price update if invalid
        }
        
        const old_price = this.simState.woo_price;
        this.simState.woo_price *= price_change_multiplier;
        this.simState.woo_price = Math.max(0.0001, Math.min(1000, this.simState.woo_price)); // Cap at $1000
        this.simState.temporary_price_impact = priceImpactData.total_temporary_impact;
        
        // Debug extreme price changes
        if (this.simState.month >= 8 && Math.abs(this.simState.woo_price - old_price) / old_price > 0.1) {
            console.warn('Large price change at month', this.simState.month, {
                old_price,
                new_price: this.simState.woo_price,
                multiplier: price_change_multiplier
            });
        }
    }

    /**
     * Update intermediate state variables (matching radCAD structure)
     */
    updateIntermediateVariables(feeData, distributionData, burnData, priceImpactData) {
        this.simState.total_gross_woofi_fees = feeData.total_gross_woofi_fees;
        this.simState.gross_woofi_swap_fees = feeData.gross_woofi_swap_fees;
        this.simState.gross_woofi_perp_fees = feeData.gross_woofi_perp_fees;
        this.simState.woox_staker_rewards = feeData.woox_staker_rewards;
        this.simState.total_woox_fees = feeData.total_woox_fees;
        this.simState.woox_treasury_inflow = feeData.woox_treasury_inflow;
        this.simState.total_staker_rewards_usd = distributionData.total_staker_rewards_usd;
        this.simState.woofi_treasury_inflow = distributionData.woofi_treasury_inflow_usd;
        this.simState.total_affiliate_cut = distributionData.total_affiliate_cut;
        // Model-specific tracking variables
        this.simState.tokens_to_burn = burnData.tokens_burned;
        this.simState.market_purchase_tokens = burnData.market_purchase_tokens;
        this.simState.usdc_to_stakers = burnData.usdc_to_stakers;
        
        if (this.modelVersion === 'v1') {
            // V1: Auto-compound tracking
            this.simState.auto_compound_usd = burnData.auto_compound_usd;
            this.simState.usdc_distribution = burnData.usdc_distribution;
            this.simState.buyback_usd = 0; // V1: No buyback
            this.simState.buyback_burn_amount = 0;
        } else {
            // V2: Buyback tracking
            this.simState.buyback_usd = burnData.buyback_usd;
            this.simState.buyback_burn_amount = distributionData.buyback_burn_amount;
            this.simState.auto_compound_usd = 0; // V2: No auto-compound
            this.simState.usdc_distribution = 0;
        }
        this.simState.permanent_impact = priceImpactData.permanent_impact;
        this.simState.total_temporary_impact = priceImpactData.total_temporary_impact;
    }

    /**
     * Record historical data
     */
    recordHistory(burnData, distributionData, feeData) {
        try {
            this.simState.history.months.push(this.simState.month + 1);
            this.simState.history.woofi_treasury.push(this.simState.woofi_treasury_balance / 1e6);
            this.simState.history.woox_treasury.push(this.simState.woox_treasury_balance / 1e6);
            this.simState.history.circulating.push(this.simState.circulating_supply / 1e6);
            this.simState.history.staked.push(this.simState.total_staked_woo / 1e6);
            this.simState.history.price.push(this.simState.woo_price);
            this.simState.history.monthlyBurned.push(burnData.tokens_burned / 1e6); // V2: Direct burns
            this.simState.history.marketPurchases.push(burnData.market_purchase_tokens / 1e6);
            this.simState.history.permImpact.push(this.simState.permanent_impact * 100);
            this.simState.history.tempImpact.push(this.simState.temporary_price_impact * 100);
        
        // Enhanced tracking (matching radCAD)
        this.simState.history.usdc_distributed.push(burnData.usdc_to_stakers / 1e6); // All USDC to stakers
        
        // Model-specific tracking
        if (this.modelVersion === 'v1') {
            this.simState.history.auto_compound_amounts.push(burnData.auto_compound_usd / 1e6); // V1: Track auto-compound
            this.simState.history.buyback_amounts.push(0); // V1: No buyback
        } else {
            this.simState.history.buyback_amounts.push(burnData.buyback_usd / 1e6); // V2: Track buybacks
            this.simState.history.auto_compound_amounts.push(0); // V2: No auto-compound
        }
        this.simState.history.treasury_inflows.push(distributionData.woofi_treasury_inflow_usd / 1e6);
        
        // Separate fee tracking for WOOFi and WOO X
        this.simState.history.woofi_fees_generated.push(feeData.total_gross_woofi_fees / 1e6);
        this.simState.history.woox_fees_generated.push(feeData.total_woox_fees / 1e6); // Track total WOO X fees, not just staker portion
        this.simState.history.woox_treasury_inflows.push(feeData.woox_treasury_inflow / 1e6);
        
        // Fee recipient breakdown tracking
        this.simState.history.staker_fees_received.push(distributionData.staker_fees_total / 1e6);
        this.simState.history.treasury_fees_received.push(distributionData.treasury_fees_total / 1e6);
        this.simState.history.orderly_fees_received.push(distributionData.orderly_fees_total / 1e6);
        // V2: Add buyback tracking
        if (!this.simState.history.buyback_fees_received) this.simState.history.buyback_fees_received = [];
        this.simState.history.buyback_fees_received.push(distributionData.buyback_fees_total / 1e6);
        
        // Health & Sustainability Analytics
        const currentBurnRate = burnData.tokens_to_burn / 1e6; // Monthly burn rate
        const totalTreasury = (this.simState.woofi_treasury_balance + this.simState.woox_treasury_balance) / 1e6;
        const treasuryRunway = currentBurnRate > 0 ? totalTreasury / currentBurnRate : Infinity;
        
        this.simState.history.treasury_runway_months.push(treasuryRunway);
        this.simState.history.price_change_pct.push(
            ((this.simState.woo_price - this.simState.initial_values.price) / this.simState.initial_values.price) * 100
        );
        this.simState.history.supply_reduction_pct.push(
            (this.simState.cumulative_tokens_burned / this.simState.initial_values.circulating_supply) * 100
        );
        this.simState.history.cumulative_burned.push(this.simState.cumulative_tokens_burned / 1e6);
        
        // Performance Indicators
        this.simState.history.staking_ratio.push(
            (this.simState.total_staked_woo / this.simState.total_supply) * 100
        );
        this.simState.history.treasury_runway.push(treasuryRunway);
        
        // Calculate annual P/V ratios at 12-month intervals (dual calculation)
        if ((this.simState.month + 1) % 12 === 0) {
            const yearNumber = Math.floor((this.simState.month + 1) / 12);
            const marketCap = this.simState.circulating_supply * this.simState.woo_price;
            
            // Calculate actual 12-month value distribution for this year
            const startIndex = Math.max(0, this.simState.history.months.length - 12);
            const endIndex = this.simState.history.months.length;
            
            let annualUSDC = 0;
            let annualBuybackUSD = 0; // V2: USD spent on buyback program
            let annualAutoCompoundUSD = 0; // V1: USD spent on auto-compound
            let annualTokensBurned = 0; // Tokens burned through treasury matching or buyback
            
            for (let i = startIndex; i < endIndex; i++) {
                annualUSDC += (this.simState.history.usdc_distributed[i] || 0) * 1e6;
                annualBuybackUSD += (this.simState.history.buyback_amounts[i] || 0) * 1e6;
                annualAutoCompoundUSD += (this.simState.history.auto_compound_amounts[i] || 0) * 1e6;
                annualTokensBurned += (this.simState.history.monthlyBurned[i] || 0) * 1e6;
            }
            
            if (this.modelVersion === 'v1') {
                // V1: Single P/R ratio calculation (matching original V1 logic)
                const annualBurnValue = annualTokensBurned * this.simState.woo_price;
                const totalAnnualValue = annualUSDC + annualBurnValue + annualAutoCompoundUSD;
                const prRatio = totalAnnualValue > 0 ? marketCap / totalAnnualValue : Infinity;
                
                // Store in legacy format for V1
                if (!this.simState.annual_pr_ratios) this.simState.annual_pr_ratios = [];
                this.simState.annual_pr_ratios[yearNumber - 1] = isFinite(prRatio) ? prRatio : null;
            } else {
                // V2: Dual P/V ratio calculation
                const totalAnnualValueUSD = annualUSDC + annualBuybackUSD;
                const pvRatioUSD = totalAnnualValueUSD > 0 ? marketCap / totalAnnualValueUSD : Infinity;
                
                const annualBurnValue = annualTokensBurned * this.simState.woo_price;
                const totalAnnualValueMarket = annualUSDC + annualBurnValue;
                const pvRatioMarket = totalAnnualValueMarket > 0 ? marketCap / totalAnnualValueMarket : Infinity;
                
                // Initialize arrays if they don't exist
                if (!this.simState.annual_pv_ratios_usd) this.simState.annual_pv_ratios_usd = [];
                if (!this.simState.annual_pv_ratios_market) this.simState.annual_pv_ratios_market = [];
                
                this.simState.annual_pv_ratios_usd[yearNumber - 1] = isFinite(pvRatioUSD) ? pvRatioUSD : null;
                this.simState.annual_pv_ratios_market[yearNumber - 1] = isFinite(pvRatioMarket) ? pvRatioMarket : null;
            }
        }
        
        } catch (error) {
            console.error('Error in recordHistory at month', this.simState.month, error);
            throw error; // Re-throw to stop simulation
        }
    }

    /**
     * Get current simulation state
     */
    getState() {
        return this.simState;
    }

    /**
     * Stop simulation
     */
    stop() {
        if (this.simInterval) {
            clearInterval(this.simInterval);
            this.simInterval = null;
        }
    }
} 