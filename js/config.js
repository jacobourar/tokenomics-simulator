/**
 * Configuration constants for WOO Tokenomics Simulation
 */

// Simulation constants
const CONFIG = {
    SIMULATION_SPEED_MS: 75,
    
    // Initial state values (from Python script)
    INITIAL_STATE: {
        woo_price: 0.065,
        max_supply: 3_000_000_000, // Max supply: 3B WOO tokens (from WOO whitepaper)
        total_supply: 2_209_243_570, // Current total supply (decreases with burns)
        circulating_supply: 1_909_243_570, // Current circulating supply (from CoinGecko)
        total_staked_woo: 629_528_114,
        woofi_treasury_balance: 41_766_263, // Updated to match radCAD
        woox_treasury_balance: 32_529_236, // Updated to match radCAD
        cumulative_tokens_burned: 0,
        temporary_price_impact: 0.0,
        
        // Enhanced tracking variables (matching radCAD)
        total_gross_woofi_fees: 0.0,
        gross_woofi_swap_fees: 0.0,
        gross_woofi_perp_fees: 0.0, // Added separate perp fee tracking
        woox_staker_rewards: 0.0,
        total_woox_fees: 0.0, // Added total WOO X fees tracking
        woox_treasury_inflow: 0.0, // Added WOO X treasury inflow tracking
        total_staker_rewards_usd: 0.0,
        woofi_treasury_inflow: 0.0,
        total_affiliate_cut: 0.0, // Added for transparency
        tokens_to_burn: 0.0,
        // Model-specific variables (populated based on active model)
        buyback_usd: 0.0, // V2: Protocol buyback amount
        auto_compound_usd: 0.0, // V1: Auto-compound amount
        market_purchase_tokens: 0.0, // Both: Market purchases (different purposes)
        usdc_to_stakers: 0.0, // V2: All staker rewards in USDC
        usdc_distribution: 0.0, // V1: USDC portion of staker rewards
        permanent_impact: 0.0,
        total_temporary_impact: 0.0
    },
    
    // Fixed parameters (from Python script)
    FIXED_PARAMS: {
        woox_total_fee_rate: 0.0001, // Total WOO X fee rate (1 bps)
        // V1 specific parameters
        woofi_staker_share: 0.8, // V1: Fixed 80% to stakers
        woox_staker_bps_reward: 0.00001 // V1: Fixed 0.1 bps to stakers
    },
    
    // Chart colors - Corporate palette
    CHART_COLORS: {
        woofi_treasury: '#1e40af',
        woox_treasury: '#0ea5e9',
        circulating: '#0d9488',
        staked: '#059669',
        price: '#8b5cf6',
        burned: '#dc2626',
        purchases: '#3b82f6',
        permanent: '#f59e0b',
        temporary: '#06b6d4'
    }
};

// Default control values
const DEFAULT_VALUES = {
    // Common parameters
    woofiSwapVolume: 49.4,
    woofiPerpVolume: 11.3,
    wooxVolume: 365.9,
    affiliateCut: 60, // Still applies to perp fees only
    woofiTradingFeeRate: 0.08, // Trading fee rate as percentage (0.08% = 0.08)
    supplyElasticity: 10.0,
    buyingPressureElasticity: 1.5,
    buyingPressureDecay: 15,
    circulatingSupply: 1909.2,
    simulationDuration: 36,
    // Initial state configurations (from data sources)
    initialStaked: 629.5,           // From Dune WOO Staking Dashboard
    initialWoofiTreasury: 41.8,     // From woo.org/token
    initialWooxTreasury: 32.5,      // From woo.org/token
    
    // V1 specific parameters
    autoCompoundRate: 70,           // V1: Staker auto-compound adoption rate
    woofiStakerShare: 80,           // V1: Fixed 80% (display only, actual value from FIXED_PARAMS)
    
    // V2 specific parameters  
    buybackBurnShare: 50,           // V2: 50% to buyback & burn
    stakerShare: 30,                // V2: 30% to stakers (USDC only)
    treasuryShare: 20,              // V2: 20% to treasury
    wooxStakerBps: 0.1              // V2: 0.1 bps to stakers (0.001%)
};

// Simulation duration options
const DURATION_OPTIONS = [
    { value: 12, label: '12 Months' },
    { value: 24, label: '24 Months' },
    { value: 36, label: '36 Months' },
    { value: 48, label: '48 Months' },
    { value: 60, label: '60 Months' }
];