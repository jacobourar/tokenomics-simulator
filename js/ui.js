/**
 * UI management for WOO tokenomics simulation
 */

class UIManager {
    constructor() {
        this.controls = {};
        this.controlValues = {};
        this.outputs = {};
        this.startButton = null;
        this.initializeElements();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Control elements
        this.controls = {
            simulationDuration: document.getElementById('simulationDuration'),
            woofiSwapVolume: document.getElementById('woofiSwapVolume'),
            woofiPerpVolume: document.getElementById('woofiPerpVolume'),
            wooxVolume: document.getElementById('wooxVolume'),
            woofiTradingFeeRate: document.getElementById('woofiTradingFeeRate'),
            // V1: Auto-compound controls
            autoCompoundRate: document.getElementById('autoCompoundRate'),
            woofiStakerShare: document.getElementById('woofiStakerShare'),
            // V2: Fee distribution controls
            buybackBurnShare: document.getElementById('buybackBurnShare'),
            stakerShare: document.getElementById('stakerShare'),
            treasuryShare: document.getElementById('treasuryShare'),
            // V2: WOO X distribution controls
            wooxStakerBps: document.getElementById('wooxStakerBps'),
            affiliateCut: document.getElementById('affiliateCut'),
            circulatingSupply: document.getElementById('circulatingSupply'),
            initialStaked: document.getElementById('initialStaked'),
            initialWoofiTreasury: document.getElementById('initialWoofiTreasury'),
            initialWooxTreasury: document.getElementById('initialWooxTreasury'),
            supplyElasticity: document.getElementById('supplyElasticity'),
            buyingPressureElasticity: document.getElementById('buyingPressureElasticity'),
            buyingPressureDecay: document.getElementById('buyingPressureDecay')
        };

        // Control value display elements
        this.controlValues = {
            woofiSwapVolume: document.getElementById('woofiSwapVolumeValue'),
            woofiPerpVolume: document.getElementById('woofiPerpVolumeValue'),
            wooxVolume: document.getElementById('wooxVolumeValue'),
            woofiTradingFeeRate: document.getElementById('woofiTradingFeeRateValue'),
            // V1: Auto-compound value displays
            autoCompoundRate: document.getElementById('autoCompoundRateValue'),
            woofiStakerShare: document.getElementById('woofiStakerShareValue'),
            // V2: Fee distribution value displays
            buybackBurnShare: document.getElementById('buybackBurnShareValue'),
            stakerShare: document.getElementById('stakerShareValue'),
            treasuryShare: document.getElementById('treasuryShareValue'),
            // V2: WOO X distribution value displays
            wooxStakerBps: document.getElementById('wooxStakerBpsValue'),
            affiliateCut: document.getElementById('affiliateCutValue'),
            supplyElasticity: document.getElementById('supplyElasticityValue'),
            buyingPressureElasticity: document.getElementById('buyingPressureElasticityValue'),
            buyingPressureDecay: document.getElementById('buyingPressureDecayValue'),
            circulatingSupply: document.getElementById('circulatingSupplyValue'),
            // Initial state value displays
            initialStaked: document.getElementById('initialStakedValue'),
            initialWoofiTreasury: document.getElementById('initialWoofiTreasuryValue'),
            initialWooxTreasury: document.getElementById('initialWooxTreasuryValue'),
        };

        // Output elements
        this.outputs = {
            simMonth: document.getElementById('simMonth'),
            wooPrice: document.getElementById('wooPrice'),
            woofiTreasuryHoldings: document.getElementById('woofiTreasuryHoldings'),
            wooxTreasuryHoldings: document.getElementById('wooxTreasuryHoldings'),
            totalStaked: document.getElementById('totalStaked') || null, // Make optional
            treasuryRunway: document.getElementById('treasuryRunway'),
            // Supply overview elements
            maxSupply: document.getElementById('maxSupply'),
            totalSupply: document.getElementById('totalSupply'),
            circulatingSupplyDisplay: document.getElementById('circulatingSupplyDisplay'),
            supplyBurnedPercent: document.getElementById('supplyBurnedPercent'),
            monthlyBurned: document.getElementById('monthlyBurned')
        };

        // Buttons
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.exportButton = document.getElementById('exportButton');
        this.resetButton = document.getElementById('resetButton');
        // V2: New reset buttons
        this.resetFeeDistribution = document.getElementById('resetFeeDistribution');
        this.resetWooxBps = document.getElementById('resetWooxBps');
        
        // Status elements
        this.simulationStatus = document.getElementById('simulationStatus');
        this.simulationProgress = document.getElementById('simulationProgress');
        this.simulationETA = document.getElementById('simulationETA');
    }

    /**
     * Initialize the UI manager
     */
    initialize() {
        this.setupEventListeners();
        this.setupModelSelection();
        this.createPriceToRevenueCards(36); // Default simulation duration
        this.switchToModel('v2'); // Default to V2
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // V2: Set up auto-balancing sliders
        this.setupFeeDistributionSliders();
        this.setupWooxBpsInput();
        
        // Set up slider value updates
        Object.keys(this.controls).forEach(key => {
            const input = this.controls[key];
            const display = this.controlValues[key];
            
            // Skip dropdown controls (no display element)
            if (key === 'simulationDuration') {
                // Special handling for simulation duration changes
                input.addEventListener('change', () => {
                    this.createPriceToRevenueCards(parseInt(input.value));
                });
                return;
            }
            
            const updateDisplay = () => {
                let value = parseFloat(input.value);
                if (key.includes('Volume')) {
                    display.textContent = `${value.toFixed(1)}M`;
                } else if (key === 'woofiTradingFeeRate') {
                    display.textContent = `${value.toFixed(2)}%`;
                } else if (key.includes('Rate') || key.includes('Cut') || key.includes('Decay') || key.includes('Share') || key === 'autoCompoundRate') {
                    display.textContent = `${value.toFixed(0)}%`;
                } else if (key === 'circulatingSupply' || key.includes('initial') || key.includes('Treasury') || key.includes('Staked')) {
                    display.textContent = `${value.toFixed(1)}M`;
                } else {
                    display.textContent = value.toFixed(1);
                }
            };
            
            updateDisplay(); // Initial display
            input.addEventListener('input', updateDisplay);
        });
        
        // V2: Set up reset buttons
        this.resetFeeDistribution?.addEventListener('click', () => {
            this.controls.buybackBurnShare.value = 50;
            this.controls.stakerShare.value = 30;
            this.controls.treasuryShare.value = 20;
            this.updateFeeDistributionDisplay();
        });
        
        this.resetWooxBps?.addEventListener('click', () => {
            this.controls.wooxStakerBps.value = 0.1;
            this.updateWooxBpsDisplay();
        });
    }
    
    /**
     * V2: Set up auto-balancing fee distribution sliders
     */
    setupFeeDistributionSliders() {
        const sliders = ['buybackBurnShare', 'stakerShare', 'treasuryShare'];
        
        sliders.forEach(sliderKey => {
            const slider = this.controls[sliderKey];
            if (!slider) return;
            
            slider.addEventListener('input', (e) => {
                const changedValue = parseInt(e.target.value);
                const otherSliders = sliders.filter(key => key !== sliderKey);
                
                // Calculate remaining percentage for other sliders
                const remaining = 100 - changedValue;
                
                // Get current values of other sliders
                const otherValues = otherSliders.map(key => parseInt(this.controls[key].value));
                const otherTotal = otherValues.reduce((sum, val) => sum + val, 0);
                
                // Proportionally adjust other sliders
                if (otherTotal > 0) {
                    otherSliders.forEach((key, index) => {
                        const proportion = otherValues[index] / otherTotal;
                        const newValue = Math.round(remaining * proportion);
                        this.controls[key].value = Math.max(0, newValue);
                    });
                } else {
                    // If other sliders are 0, distribute equally
                    const equalShare = Math.floor(remaining / otherSliders.length);
                    otherSliders.forEach(key => {
                        this.controls[key].value = equalShare;
                    });
                }
                
                this.updateFeeDistributionDisplay();
            });
        });
        
        // Initial display update
        this.updateFeeDistributionDisplay();
    }
    
    /**
     * V2: Set up WOO X basis points input
     */
    setupWooxBpsInput() {
        const input = this.controls.wooxStakerBps;
        if (!input) return;
        
        input.addEventListener('input', () => {
            this.updateWooxBpsDisplay();
        });
        
        // Initial display update
        this.updateWooxBpsDisplay();
    }

    /**
     * Set up model selection event listeners
     */
    setupModelSelection() {
        const modelRadios = document.querySelectorAll('input[name="tokenomicsModel"]');
        modelRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.switchToModel(e.target.value);
                }
            });
        });
    }

    /**
     * Switch to selected model (V1 or V2)
     */
    switchToModel(modelVersion) {
        this.currentModel = modelVersion;
        
        // Show/hide model-specific controls
        const v1Elements = document.querySelectorAll('.v1-only');
        const v2Elements = document.querySelectorAll('.v2-only');
        
        if (modelVersion === 'v1') {
            v1Elements.forEach(el => el.style.display = 'block');
            v2Elements.forEach(el => el.style.display = 'none');
        } else {
            v1Elements.forEach(el => el.style.display = 'none');
            v2Elements.forEach(el => el.style.display = 'block');
        }
        
        // Clear previous model state and reset ratio displays
        this.clearModelState();
        
        // Update P/V ratio cards display based on model
        this.updateRatioCardsForModel(modelVersion);
        
        // Update ratio description text based on model
        this.updateRatioDescription(modelVersion);
        
        // Trigger simulation restart if running
        if (window.app && window.app.simInterval) {
            window.app.stopSimulation();
        }
        
        console.log(`Switched to ${modelVersion.toUpperCase()} model`);
    }

    /**
     * Update ratio cards display based on model
     */
    updateRatioCardsForModel(modelVersion) {
        // Recreate the cards with proper structure for current model
        const simulationDuration = parseInt(this.controls.simulationDuration.value) || 36;
        this.createPriceToRevenueCards(simulationDuration);
    }
    
    /**
     * Update ratio description text based on model
     */
    updateRatioDescription(modelVersion) {
        const descriptionElement = document.getElementById('ratioModelDescription');
        if (descriptionElement) {
            if (modelVersion === 'v1') {
                descriptionElement.textContent = 'V1: Shows single P/R ratio - Market Cap ÷ (USDC + Token Burns + Auto-compound spending)';
            } else {
                descriptionElement.textContent = 'V2: Shows dual ratios - USD spent (cash flow) vs current token value (market value)';
            }
        }
    }
    
    /**
     * Clear previous model state when switching models
     */
    clearModelState() {
        // Clear any existing simulation state
        if (window.app && window.app.simulation) {
            // Reset simulation state arrays
            if (window.app.simulation.simState) {
                window.app.simulation.simState.annual_pr_ratios = [];
                window.app.simulation.simState.annual_pv_ratios_usd = [];
                window.app.simulation.simState.annual_pv_ratios_market = [];
            }
        }
        
        // Reset all ratio displays to '--'
        const allRatioElements = document.querySelectorAll('[id^="prRatio"], [id^="pvRatio"]');
        allRatioElements.forEach(element => {
            element.textContent = '--';
        });
        
        // Reset charts if they exist
        if (window.app && window.app.charts) {
            Object.values(window.app.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            window.app.charts = {};
        }
    }
    
    /**
     * V2: Update fee distribution display values and total
     */
    updateFeeDistributionDisplay() {
        const buyback = parseInt(this.controls.buybackBurnShare?.value || 50);
        const staker = parseInt(this.controls.stakerShare?.value || 30);
        const treasury = parseInt(this.controls.treasuryShare?.value || 20);
        const total = buyback + staker + treasury;
        
        if (this.controlValues.buybackBurnShare) this.controlValues.buybackBurnShare.textContent = `${buyback}%`;
        if (this.controlValues.stakerShare) this.controlValues.stakerShare.textContent = `${staker}%`;
        if (this.controlValues.treasuryShare) this.controlValues.treasuryShare.textContent = `${treasury}%`;
        
        const totalElement = document.getElementById('feeDistributionTotal');
        if (totalElement) {
            totalElement.textContent = total;
            totalElement.style.color = total === 100 ? 'var(--primary-blue)' : 'var(--text-secondary)';
        }
    }
    
    /**
     * V2: Update WOO X basis points display
     */
    updateWooxBpsDisplay() {
        const bps = parseFloat(this.controls.wooxStakerBps?.value || 0.1);
        const percentage = (bps / 100).toFixed(4); // Convert bps to percentage
        
        if (this.controlValues.wooxStakerBps) {
            this.controlValues.wooxStakerBps.textContent = `${bps} bps (${percentage}%)`;
        }
    }

    /**
     * Update the display with current simulation state
     */
    updateDisplay(simState) {
        // Update main metrics
        this.outputs.simMonth.textContent = simState.month;
        this.outputs.wooPrice.textContent = `$${simState.woo_price.toFixed(4)}`;
        this.outputs.woofiTreasuryHoldings.textContent = UIManager.formatValue(simState.woofi_treasury_balance);
        this.outputs.wooxTreasuryHoldings.textContent = UIManager.formatValue(simState.woox_treasury_balance);
        
        // Update supply overview
        if (this.outputs.maxSupply) {
            this.outputs.maxSupply.textContent = UIManager.formatValue(simState.max_supply);
        }
        if (this.outputs.totalSupply) {
            this.outputs.totalSupply.textContent = UIManager.formatValue(simState.total_supply);
        }
        if (this.outputs.circulatingSupplyDisplay) {
            this.outputs.circulatingSupplyDisplay.textContent = UIManager.formatValue(simState.circulating_supply);
        }
        if (this.outputs.supplyBurnedPercent) {
            const burnedPercent = (simState.cumulative_tokens_burned / simState.max_supply) * 100;
            this.outputs.supplyBurnedPercent.textContent = `${burnedPercent.toFixed(2)}%`;
        }
        if (this.outputs.monthlyBurned && simState.history.monthlyBurned.length > 0) {
            const lastMonthBurned = simState.history.monthlyBurned[simState.history.monthlyBurned.length - 1] * 1e6;
            this.outputs.monthlyBurned.textContent = UIManager.formatValue(lastMonthBurned);
        }

        // Calculate treasury runway (WOOFi treasury only, as per radCAD logic)
        const lastMonthBurn = simState.history.monthlyBurned.length > 0 ? 
            simState.history.monthlyBurned[simState.history.monthlyBurned.length - 1] * 1e6 : 0;
        const runway = lastMonthBurn > 0 ? simState.woofi_treasury_balance / lastMonthBurn : Infinity;

        // Update treasury runway display
        const treasuryRunwayElement = document.getElementById('treasuryRunway');
        if (treasuryRunwayElement) {
            treasuryRunwayElement.textContent = isFinite(runway) ? runway.toFixed(1) : 'Inf';
        }

        // Update total staked display
        if (this.outputs.totalStaked) {
            this.outputs.totalStaked.textContent = UIManager.formatValue(simState.total_staked_woo);
        }
        
        // Update P/V ratio cards
        this.updatePriceToRevenueCards(simState);
        
        // Update results table
        this.updateResultsTable(simState);
    }

    /**
     * Update the results table with simulation data
     */
    updateResultsTable(simState) {
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody || !simState.history || simState.history.months.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="py-8 text-center" style="color: var(--text-secondary);">No simulation data available</td></tr>';
            return;
        }

        // V2: Show all months (fixed from "last 12 months" limitation)
        const history = simState.history;
        const startIdx = 0; // Show all months from beginning
        
        let tableHTML = '';
        for (let i = startIdx; i < history.months.length; i++) {
            tableHTML += `
                <tr class="hover:bg-gray-50 transition-colors duration-150">
                    <td class="py-2 px-4 border-b text-sm font-medium" style="border-color: var(--border-color); color: var(--text-primary);">${history.months[i]}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">$${UIManager.formatValue(history.price[i])}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">${UIManager.formatValue(history.circulating[i] * 1e6)}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">${UIManager.formatValue(history.staked[i] * 1e6)}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">${UIManager.formatValue(history.woofi_treasury[i] * 1e6)}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">${UIManager.formatValue(history.woox_treasury[i] * 1e6)}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">${UIManager.formatValue(history.monthlyBurned[i] * 1e6)}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">$${UIManager.formatValue((history.staker_fees_received && history.staker_fees_received[i] ? history.staker_fees_received[i] * 1e6 : 0))}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">$${UIManager.formatValue((history.treasury_fees_received && history.treasury_fees_received[i] ? history.treasury_fees_received[i] * 1e6 : 0))}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">$${UIManager.formatValue((history.orderly_fees_received && history.orderly_fees_received[i] ? history.orderly_fees_received[i] * 1e6 : 0))}</td>
                    <td class="py-2 px-4 border-b text-sm text-right" style="border-color: var(--border-color); color: var(--text-secondary);">$${UIManager.formatValue((history.buyback_fees_received && history.buyback_fees_received[i] ? history.buyback_fees_received[i] * 1e6 : 0))}</td>
                </tr>
            `;
        }
        
        tbody.innerHTML = tableHTML;
    }

    /**
     * Create P/V ratio cards based on simulation duration
     */
    createPriceToRevenueCards(simulationMonths) {
        const container = document.getElementById('prRatioCardsContainer');
        if (!container) return;

        const years = Math.floor(simulationMonths / 12);
        let cardsHTML = '';

        for (let year = 1; year <= years; year++) {
            if (this.currentModel === 'v1') {
                // V1: Single P/R ratio card
                cardsHTML += `
                    <div class="border rounded-lg p-4 text-center" style="border-color: var(--border-color); background-color: var(--neutral-light);">
                        <h4 class="text-sm font-medium mb-2 flex items-center justify-center" style="color: var(--text-secondary);">
                            Year ${year}
                            <span class="info-icon ml-1">
                                i
                                <div class="tooltip">P/R ratio for Year ${year}. Market Cap ÷ (USDC + Current value of burned tokens + Auto-compound USD spending) for months ${(year - 1) * 12 + 1}-${year * 12}. The 3 components: USDC to stakers, burn value, auto-compound spending.</div>
                            </span>
                        </h4>
                        <p id="prRatio${year}" class="text-lg font-semibold" style="color: var(--primary-blue);">--</p>
                        <p class="text-xs mt-1" style="color: var(--text-secondary);">P/R Ratio</p>
                    </div>
                `;
            } else {
                // V2: Dual P/V ratio cards
                cardsHTML += `
                    <div class="border rounded-lg p-4 text-center" style="border-color: var(--border-color); background-color: var(--neutral-light);">
                        <h4 class="text-sm font-medium mb-2 flex items-center justify-center" style="color: var(--text-secondary);">
                            Year ${year} P/V Ratios
                            <span class="info-icon ml-1">
                                i
                                <div class="tooltip">Price-to-Value Distributed ratios for Year ${year}. USD Spent: Market Cap ÷ (USDC + USD spent on buyback). Token Value: Market Cap ÷ (USDC + current value of tokens burned).</div>
                            </span>
                        </h4>
                        <div class="space-y-1">
                            <div>
                                <p id="pvRatioUSD${year}" class="text-sm font-semibold" style="color: var(--primary-blue);">--</p>
                                <p class="text-xs" style="color: var(--text-secondary);">USD Spent</p>
                            </div>
                            <div>
                                <p id="pvRatioMarket${year}" class="text-sm font-semibold" style="color: var(--accent-teal);">--</p>
                                <p class="text-xs" style="color: var(--text-secondary);">Token Value</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = cardsHTML;
    }

    updatePriceToRevenueCards(simState) {
        if (this.currentModel === 'v1') {
            // V1: Update single P/R ratio cards
            if (simState.annual_pr_ratios && simState.annual_pr_ratios.length > 0) {
                simState.annual_pr_ratios.forEach((ratio, index) => {
                    const yearElement = document.getElementById(`prRatio${index + 1}`);
                    if (yearElement) {
                        if (ratio !== null && ratio !== undefined && isFinite(ratio)) {
                            yearElement.textContent = `${ratio.toFixed(1)}x`;
                        } else {
                            yearElement.textContent = '--';
                        }
                    }
                });
            }
            
            // Show current year progress for V1
            const currentMonth = simState.month;
            const currentYear = Math.floor(currentMonth / 12) + 1;
            const monthInYear = currentMonth % 12;
            
            if (monthInYear > 0 && monthInYear < 12) {
                const currentYearElement = document.getElementById(`prRatio${currentYear}`);
                if (currentYearElement && currentYearElement.textContent === '--') {
                    currentYearElement.textContent = `${monthInYear}/12`;
                }
            }
        } else {
            // V2: Update dual P/V ratio cards
            if (simState.annual_pv_ratios_usd && simState.annual_pv_ratios_usd.length > 0) {
                simState.annual_pv_ratios_usd.forEach((ratio, index) => {
                    const yearElementUSD = document.getElementById(`pvRatioUSD${index + 1}`);
                    if (yearElementUSD) {
                        if (ratio !== null && ratio !== undefined && isFinite(ratio)) {
                            yearElementUSD.textContent = `${ratio.toFixed(1)}x`;
                        } else {
                            yearElementUSD.textContent = '--';
                        }
                    }
                });
            }
            
            if (simState.annual_pv_ratios_market && simState.annual_pv_ratios_market.length > 0) {
                simState.annual_pv_ratios_market.forEach((ratio, index) => {
                    const yearElementMarket = document.getElementById(`pvRatioMarket${index + 1}`);
                    if (yearElementMarket) {
                        if (ratio !== null && ratio !== undefined && isFinite(ratio)) {
                            yearElementMarket.textContent = `${ratio.toFixed(1)}x`;
                        } else {
                            yearElementMarket.textContent = '--';
                        }
                    }
                });
            }
            
            // Show current year progress for V2
            const currentMonth = simState.month;
            const currentYear = Math.floor(currentMonth / 12) + 1;
            const monthInYear = currentMonth % 12;
            
            if (monthInYear > 0 && monthInYear < 12) {
                const currentYearUSDElement = document.getElementById(`pvRatioUSD${currentYear}`);
                const currentYearMarketElement = document.getElementById(`pvRatioMarket${currentYear}`);
                
                if (currentYearUSDElement && currentYearUSDElement.textContent === '--') {
                    currentYearUSDElement.textContent = `${monthInYear}/12`;
                }
                if (currentYearMarketElement && currentYearMarketElement.textContent === '--') {
                    currentYearMarketElement.textContent = `${monthInYear}/12`;
                }
            }
        }
    }

    /**
     * Reset all displays to initial state
     */
    resetDisplays() {
        // Reset key metrics
        this.outputs.simMonth.textContent = '0';
        this.outputs.wooPrice.textContent = '$0.00';
        this.outputs.woofiTreasuryHoldings.textContent = '0';
        this.outputs.wooxTreasuryHoldings.textContent = '0';
        
        // Reset supply overview
        if (this.outputs.totalSupply) this.outputs.totalSupply.textContent = '0';
        if (this.outputs.circulatingSupplyDisplay) this.outputs.circulatingSupplyDisplay.textContent = '0';
        if (this.outputs.supplyBurnedPercent) this.outputs.supplyBurnedPercent.textContent = '0.0%';
        if (this.outputs.monthlyBurned) this.outputs.monthlyBurned.textContent = '0';
        
        // Reset treasury runway
        const treasuryRunway = document.getElementById('treasuryRunway');
        if (treasuryRunway) treasuryRunway.textContent = 'Inf';
        
        // Reset total staked if element exists
        if (this.outputs.totalStaked) {
            this.outputs.totalStaked.textContent = '0';
        }
        
        // Reset table
        this.updateResultsTable({ history: { months: [] } });
        
        // Reset P/V ratio cards (both V1 and V2)
        const pvCardsUSD = document.querySelectorAll('[id^="pvRatioUSD"]');
        const pvCardsMarket = document.querySelectorAll('[id^="pvRatioMarket"]');
        const prCards = document.querySelectorAll('[id^="prRatio"]');
        pvCardsUSD.forEach(card => card.textContent = '--');
        pvCardsMarket.forEach(card => card.textContent = '--');
        prCards.forEach(card => card.textContent = '--');
    }

    /**
     * Set simulation as running
     */
    setSimulationRunning(isRunning) {
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const exportButton = document.getElementById('exportButton');
        const buttonText = document.getElementById('buttonText');
        
        if (startButton) {
            startButton.disabled = isRunning;
            if (buttonText) {
                buttonText.textContent = isRunning ? 'Running...' : 'Start Simulation';
            }
        }
        
        if (stopButton) {
            stopButton.disabled = !isRunning;
        }
        
        if (exportButton) {
            exportButton.disabled = isRunning;
        }
        
        if (isRunning) {
            this.updateSimulationStatus('running', 'Simulation in progress...');
        }
    }

    /**
     * Set simulation as finished
     */
    setSimulationFinished() {
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const exportButton = document.getElementById('exportButton');
        const buttonText = document.getElementById('buttonText');
        
        if (startButton) {
            startButton.disabled = false;
            if (buttonText) {
                buttonText.textContent = 'Start Simulation';
            }
        }
        
        if (stopButton) {
            stopButton.disabled = true;
        }
        
        if (exportButton) {
            exportButton.disabled = false;
        }
        
        this.updateSimulationStatus('completed', 'Simulation completed successfully');
        this.updateProgress(100, '0s');
    }

    /**
     * Reset button states to initial
     */
    resetButton() {
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const exportButton = document.getElementById('exportButton');
        const buttonText = document.getElementById('buttonText');
        
        if (startButton) {
            startButton.disabled = false;
            if (buttonText) {
                buttonText.textContent = 'Start Simulation';
            }
        }
        
        if (stopButton) {
            stopButton.disabled = true;
        }
        
        if (exportButton) {
            exportButton.disabled = false;
        }
        
        this.updateSimulationStatus('ready', 'Ready to simulate');
        this.updateProgress(0);
    }

    /**
     * Get start button element
     */
    getStartButton() {
        return this.startButton;
    }

    /**
     * Get restart button element
     */
    getRestartButton() {
        return this.restartButton;
    }

    /**
     * Initialize with default values
     */
    initializeWithDefaults() {
        Object.keys(DEFAULT_VALUES).forEach(key => {
            if (this.controls[key]) {
                this.controls[key].value = DEFAULT_VALUES[key];
            }
        });
        
        // Create initial P/V cards based on default duration
        this.createPriceToRevenueCards(DEFAULT_VALUES.simulationDuration);
    }

    /**
     * Format number for display with appropriate units
     */
    static formatValue(value, decimals = 2, forceUnit = null) {
        if (value === 0) return '0';
        
        const absValue = Math.abs(value);
        
        if (forceUnit) {
            if (forceUnit === 'M') return (value / 1e6).toFixed(decimals) + 'M';
            if (forceUnit === 'K') return (value / 1e3).toFixed(decimals) + 'K';
            if (forceUnit === 'B') return (value / 1e9).toFixed(decimals) + 'B';
            return value.toFixed(decimals);
        }
        
        if (absValue >= 1e9) {
            return (value / 1e9).toFixed(decimals) + 'B';
        } else if (absValue >= 1e6) {
            return (value / 1e6).toFixed(decimals) + 'M';
        } else if (absValue >= 1e3) {
            return (value / 1e3).toFixed(decimals) + 'K';
        } else if (absValue >= 1) {
            return value.toFixed(decimals);
        } else if (absValue >= 0.001) {
            return value.toFixed(3);
        } else {
            return value.toExponential(2);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Simulation Error:', message);
        // Could add a modal or toast notification here
        alert(`Simulation Error: ${message}`);
    }

    /**
     * Update simulation status
     */
    updateSimulationStatus(status, message) {
        if (!this.simulationStatus) return;
        
        const statusColors = {
            ready: 'var(--neutral-gray)',
            running: 'var(--warning-amber)', 
            completed: 'var(--success-green)',
            error: 'var(--error-red)'
        };
        
        const statusDot = this.simulationStatus.querySelector('div');
        const statusText = this.simulationStatus.querySelector('span');
        
        if (statusDot) statusDot.style.backgroundColor = statusColors[status];
        if (statusText) statusText.textContent = message;
    }

    /**
     * Update simulation progress
     */
    updateProgress(percentage, eta = null) {
        if (this.simulationProgress) {
            this.simulationProgress.textContent = `${Math.round(percentage)}%`;
        }
        if (this.simulationETA && eta) {
            this.simulationETA.textContent = eta;
        } else if (this.simulationETA && percentage === 0) {
            this.simulationETA.textContent = '--';
        }
    }

    /**
     * Save current parameters configuration
     */
    saveParameters() {
        const params = {};
        Object.keys(this.controls).forEach(key => {
            params[key] = this.controls[key].value;
        });
        
        const config = {
            timestamp: new Date().toISOString(),
            model: 'v0',
            approach: 'system-dynamics',
            parameters: params
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `woo-params-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log('Simulation Success:', message);
        // Could add a success notification here
    }

    /**
     * Get current control values
     */
    getControlValues() {
        const values = {};
        Object.keys(this.controls).forEach(key => {
            const control = this.controls[key];
            if (control) {
                values[key] = control; // Return the DOM element so simulation can access .value
            }
        });
        return values;
    }

    /**
     * Get current model selection
     */
    getCurrentModel() {
        return this.currentModel || 'v2';
    }
} 