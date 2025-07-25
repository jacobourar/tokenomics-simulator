# WOO Tokenomics Research Platform

A comprehensive multi-model research platform for WOO token economics, featuring system dynamics and agent-based modeling approaches with an extensible architecture for iterative economic research.

## 🚀 Platform Overview

A research-grade platform designed for iterative tokenomics modeling with multiple model versions and approaches:

### 🏗️ **Multi-Model Architecture**
- **Version 0**: Current WOO system with Match & Burn mechanism ✅
- **Version 1**: Enhanced tokenomics with new mechanisms 🔄 *Coming Soon*
- **Version 1.2**: Optimized parameters and refined mechanisms 🔄 *Coming Soon*

### 🔬 **Dual Modeling Approaches**
- **System Dynamics**: Stock & flow continuous modeling ✅ *Active*
- **Agent-Based Model**: Individual agent behaviors and interactions 🔄 *Coming Soon*

### 📊 **Current Model Features (V0)**
- **WOOFi** (swap and perpetuals trading)
- **WOO X** (centralized exchange) 
- **Dual Treasury System** (separate WOOFi and WOO X treasuries)
- **Dynamic Parameter Control** (circulating supply, duration, elasticity)
- **Advanced Analytics** (flow diagrams, multi-chart dashboard)
- **Configuration Management** (save/load parameters, export results)

## 📊 Key Features

### Economic Modeling
- **Fee Generation**: Models trading fees from WOOFi swap, WOOFi perpetuals, and WOO X
- **Fee Distribution**: Simulates revenue sharing between affiliates, stakers, and treasury
- **Auto-Compound Mechanism**: Models stakers who automatically reinvest rewards
- **Match & Burn**: Treasury burns tokens to match auto-compound purchases
- **Price Impact**: Dual impact model with permanent (supply) and temporary (buying pressure) effects

### Visualization
- **Treasury & Supply Dynamics**: Track both WOOFi and WOO X treasury balances, circulating supply, and staked tokens
- **Price Evolution**: Monitor WOO token price changes over time with professional styling
- **Token Flows**: Visualize monthly burns and market purchases
- **Impact Components**: Separate permanent and temporary price impacts
- **Corporate Dashboard**: Clean, minimalist interface with professional color scheme

### Interactive Controls
- **Simulation Configuration**: Choose duration (12-60 months) and set circulating supply
- **Trading Volumes**: Adjust WOOFi swap, WOOFi perp, and WOO X daily volumes
- **Staking Parameters**: Configure auto-compound adoption rates and affiliate cuts
- **Price Impact Model**: Tune supply elasticity, buying pressure sensitivity, and decay rates

## 🏗️ Architecture

The project follows a modular architecture with clear separation of concerns:

```
├── index.html              # Main HTML structure
├── css/
│   └── styles.css          # Custom styling
├── js/
│   ├── config.js           # Configuration constants
│   ├── simulation.js       # Core simulation logic
│   ├── charts.js           # Chart management
│   ├── ui.js              # UI interactions
│   └── main.js            # Application coordinator
└── README.md              # This documentation
```

### Module Responsibilities

- **`config.js`**: Constants, default values, and configuration
- **`simulation.js`**: Core tokenomics calculations and state management
- **`charts.js`**: Chart creation and updates using Chart.js
- **`ui.js`**: DOM manipulation and user interface management
- **`main.js`**: Application lifecycle and module coordination

## 🔬 Simulation Logic

### 1. Fee Generation & Distribution
```javascript
// Calculate fees from different sources
gross_woofi_fees = (swap_volume + perp_volume) * fee_rate
woox_rewards = woox_volume * staker_bps_reward

// Distribute fees
affiliate_cut = gross_woofi_fees * affiliate_share
net_fees = gross_woofi_fees - affiliate_cut
staker_rewards = net_fees * staker_share
treasury_inflow = net_fees * (1 - staker_share)
```

### 2. Auto-Compound & Burn Mechanism
```javascript
// Auto-compound calculation
auto_compound_usd = total_staker_rewards * auto_compound_rate
market_purchase_tokens = auto_compound_usd / woo_price
tokens_to_burn = min(market_purchase_tokens, treasury_balance)
```

### 3. Price Impact Model
```javascript
// Permanent impact from supply reduction
supply_reduction_pct = tokens_burned / circulating_supply
permanent_impact = supply_reduction_pct * supply_elasticity

// Temporary impact from buying pressure
buy_pressure_ratio = auto_compound_usd / daily_market_depth
new_temp_impact = buy_pressure_ratio * buying_pressure_elasticity
total_temp_impact = decayed_previous_impact + new_temp_impact
```

### 4. State Updates
- **Treasury**: `balance += inflow_tokens - burned_tokens`
- **Supply**: `circulating -= (purchased + burned)`
- **Price**: `price *= (1 + permanent_impact + temp_impact)`
- **Staking**: `total_staked += purchased_tokens`

## 📈 Default Parameters

### Simulation Configuration
- **Duration**: 36 months (configurable: 12-60 months)
- **Circulating Supply**: 1,909.2M tokens (configurable: 1,000-2,000M)

### Economic Activity (Daily)
- **WOOFi Swap Volume**: 49.4M USD
- **WOOFi Perp Volume**: 11.3M USD  
- **WOO X Volume**: 365.9M USD

### Fee Structure
- **WOOFi Fee Rate**: 0.08%
- **WOO X Staker Reward**: 0.001%
- **Staker Share**: 80%
- **Affiliate Cut**: 60%

### Initial State
- **WOO Price**: $0.065
- **Total Supply**: 2.209B tokens
- **Circulating Supply**: 1.909B tokens (user configurable)
- **Staked Tokens**: 629.5M tokens
- **WOOFi Treasury**: 25.0M tokens
- **WOO X Treasury**: 16.8M tokens

### Price Impact Model
- **Supply Elasticity**: 10.0
- **Buying Pressure Elasticity**: 1.5
- **Buying Pressure Decay**: 15% per month
- **Auto-Compound Rate**: 40%

## 🚀 Getting Started

### Quick Start
1. **Clone or download** the repository
2. **Open** `index.html` in a modern web browser
3. **Select model version** (currently V0 available)
4. **Choose modeling approach** (currently System Dynamics available)
5. **Configure parameters** using the research controls
6. **Run simulation** and analyze results

### Research Workflow
1. **Configure Model**: Select version and approach
2. **Set Parameters**: Adjust economic variables and simulation settings
3. **Run Analysis**: Execute simulation with real-time progress tracking
4. **Review Results**: Analyze charts, tables, and system flow diagrams
5. **Export Data**: Save parameters and results for further analysis
6. **Iterate**: Load configurations and compare different scenarios

### Browser Requirements
- Modern browser with ES6 support
- JavaScript enabled
- Internet connection for CDN dependencies (Tailwind CSS, Chart.js)

## 🔧 Customization

### Adding New Parameters
1. Add the parameter to `DEFAULT_VALUES` in `config.js`
2. Add HTML control in `index.html`
3. Reference in `UIManager.initializeElements()`
4. Use in `WOOSimulation.initialize()`

### Extending Visualizations
1. Add new chart configuration in `ChartManager`
2. Create corresponding HTML canvas element
3. Update `updateCharts()` method with new data

### Modifying Economic Logic
Edit the calculation methods in `WOOSimulation`:
- `calculateFees()`
- `distributeFees()`
- `calculateAutoCompoundAndBurn()`
- `calculatePriceImpact()`

## 📊 Interpreting Results

### Key Metrics
- **WOO Price**: Token price evolution over 36 months
- **Treasury Runway**: Months of operation at current burn rate
- **Treasury Balance**: WOO tokens available for burning
- **WOOFi Fees**: Monthly trading fees from WOOFi swap and perpetuals
- **WOO X Fees**: Monthly staker rewards from WOO X volume
- **Price Change %**: Cumulative price change from simulation start
- **Supply Reduction %**: Percentage of initial supply burned
- **Staking Ratio %**: Percentage of total supply currently staked
- **Price-to-Revenue Ratio**: Annual snapshots at 12-month intervals using actual trailing data

### Charts Analysis
- **Treasury & Supply**: Monitor treasury depletion and supply dynamics
- **Price Evolution**: Observe price trends and volatility
- **Token Flows**: Compare burn amounts vs. market purchases
- **Impact Components**: Separate permanent vs. temporary price effects

## 🤝 Contributing

This simulation is designed for transparency and extensibility. Key areas for enhancement:

1. **Additional Mechanisms**: DAO governance, yield farming, cross-chain dynamics
2. **Advanced Modeling**: Monte Carlo simulations, scenario analysis
3. **UI Improvements**: Real-time controls, preset scenarios, export features
4. **Performance**: Optimization for longer simulations or sensitivity analysis

## 📝 License

This project is for educational and analysis purposes. Please ensure compliance with relevant financial modeling and simulation guidelines.

## 🔍 Technical Details

### Dependencies
- **Chart.js**: Data visualization
- **Tailwind CSS**: UI framework
- **Source Sans Pro**: Professional typography
- **CSS Custom Properties**: Corporate color system

### Platform Features
- **Multi-Model Support**: Extensible architecture for multiple model versions
- **Dual Approach System**: System dynamics and agent-based modeling (planned)
- **Research Interface**: Professional platform designed for iterative analysis
- **Configuration Management**: Save/load parameters and export comprehensive results
- **Real-time Analytics**: Live progress tracking with ETA calculations
- **Enhanced Visualizations**: System flow diagrams, multi-chart dashboards
- **Data Export**: Comprehensive data export with metadata for research continuity

### Performance Considerations
- Simulation runs at 75ms intervals for smooth animation
- Charts use `animation: false` and update throttling for performance
- Memory efficient state management with minimal history storage
- Corporate styling with CSS custom properties for consistent theming

### Browser Compatibility
- Chrome/Edge 88+
- Firefox 84+
- Safari 14+

### Corporate Design System
- **Primary Blue**: #1e40af (buttons, primary actions)
- **Secondary Blue**: #0ea5e9 (WOO X treasury, secondary elements)
- **Accent Teal**: #0d9488 (circulating supply, highlights)
- **Neutral Gray**: #6b7280 (secondary text, borders)
- **Source Sans Pro**: Professional, readable typography

---

**Built with ❤️ for the WOO ecosystem** 