/**
 * Main application entry point for WOO Tokenomics Simulation
 */

class WOOTokenomicsApp {
    constructor() {
        this.simulation = new WOOSimulation();
        this.chartManager = new ChartManager();
        this.uiManager = new UIManager();
        this.simInterval = null;
        this.simulationStartTime = null;
        this.lastChartUpdate = 0;
        this.chartUpdateThrottle = 100; // Update charts every 100ms max
    }

    /**
     * Initialize the application
     */
    initialize() {
        try {
            console.log('Initializing WOO Tokenomics Simulator...');
            
            // Initialize UI first
            this.uiManager.initialize();
            
            // Initialize simulation with UI control values and default model
            this.simulation.initialize(this.uiManager.getControlValues(), 'v2');
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Create initial charts
            this.chartManager.createCharts();
            
            
            console.log('WOO Tokenomics Simulator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.uiManager.showError('Failed to initialize application');
        }
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        // Model selection handlers
        const modelV0Radio = document.getElementById('modelV0');
        const modelV1Radio = document.getElementById('modelV1');
        
        if (modelV0Radio) {
            modelV0Radio.addEventListener('change', () => {
                if (modelV0Radio.checked) {
                    this.switchModel('v0');
                }
            });
        }
        
        if (modelV1Radio) {
            modelV1Radio.addEventListener('change', () => {
                if (modelV1Radio.checked) {
                    this.switchModel('v1');
                }
            });
        }

        // Simulation control handlers
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const exportButton = document.getElementById('exportButton');
        const resetButton = document.getElementById('resetButton');

        if (startButton) {
            startButton.addEventListener('click', () => this.startSimulation());
        }

        if (stopButton) {
            stopButton.addEventListener('click', () => this.stopSimulation());
        }

        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportDataAsCSV());
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetSimulation());
        }

        // Documentation button
        const docButton = document.getElementById('docButton');
        if (docButton) {
            docButton.addEventListener('click', () => this.showDocumentation('overview'));
        }

        // Full screen table button
        const fullScreenTableButton = document.getElementById('fullScreenTableButton');
        if (fullScreenTableButton) {
            fullScreenTableButton.addEventListener('click', () => this.showFullScreenTable());
        }
        
        // Export results button (different from main export button)
        const exportResultsButton = document.getElementById('exportResultsButton');
        if (exportResultsButton) {
            exportResultsButton.addEventListener('click', () => this.exportResultsTableAsCSV());
        }

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }

        // Initialize model-specific UI
        this.updateModelSpecificUI();
        
        // Setup enhanced tooltip positioning for table
        this.setupTooltipPositioning();
    }
    
    /**
     * Setup enhanced tooltip positioning for table context
     */
    setupTooltipPositioning() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('info-icon')) {
                const tooltip = e.target.querySelector('.tooltip');
                if (tooltip) {
                    const rect = e.target.getBoundingClientRect();
                    tooltip.style.left = rect.left + 'px';
                    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
                }
            }
        });
    }

    /**
     * Start the simulation
     */
    startSimulation() {
        try {
            // Get current model selection
            const selectedModel = document.querySelector('input[name="tokenomicsModel"]:checked')?.value || 'v2';
            
            // Initialize simulation with current parameter values and model
            this.simulation.initialize(this.uiManager.getControlValues(), selectedModel);
            
            // Update button states
            this.uiManager.setSimulationRunning(true);
            
            // Record start time
            this.simulationStartTime = Date.now();
            
            // Start simulation loop
            this.simInterval = setInterval(() => {
                try {
                    const continueSimulation = this.simulation.simulationStep();
                    
                    // Get state after step
                    const currentState = this.simulation.getState();
                    const currentMonth = currentState.month;
                    
                    this.updateDisplay();
                    
                    // Debug simulation stopping
                    if (!continueSimulation) {
                        console.log(`Simulation stopped at month ${currentMonth}`);
                        // Alert if simulation stops unexpectedly early
                        if (currentMonth < this.simulation.simParams.simulation_months) {
                            console.error(`Simulation stopped early at month ${currentMonth}, expected ${this.simulation.simParams.simulation_months}`);
                        }
                        this.stopSimulation();
                    }
                    
                } catch (error) {
                    console.error('Error in simulation loop:', error);
                    this.stopSimulation();
                }
            }, 75); // Slower interval to prevent race conditions
            
        } catch (error) {
            console.error('Failed to start simulation:', error);
            this.uiManager.showError('Failed to start simulation');
        }
    }

    /**
     * Execute one simulation step
     */
    simulationStep() {
        try {
            const continueSimulation = this.simulation.simulationStep();
            
            // Update progress
            const currentMonth = this.simulation.getState().month;
            const totalMonths = this.simulation.simParams.simulation_months;
            const progress = (currentMonth / totalMonths) * 100;
            
            // Calculate ETA
            const elapsed = Date.now() - this.simulationStartTime;
            const eta = progress > 0 ? ((elapsed / progress) * (100 - progress)) / 1000 : 0;
            const etaText = eta > 60 ? `${Math.round(eta/60)}m` : `${Math.round(eta)}s`;
            
            this.uiManager.updateProgress(progress, etaText);
            
            if (!continueSimulation) {
                // Simulation ended
                this.stopSimulation();
                this.uiManager.setSimulationFinished();
                this.uiManager.updateProgress(100, '0s');
                this.updateDisplay(true); // Force final chart update
                console.log('Simulation completed');
                return;
            }
            
            // Update display with new state
            this.updateDisplay();
            
        } catch (error) {
            console.error('Simulation step failed:', error);
            this.stopSimulation();
            this.uiManager.updateSimulationStatus('error', 'Simulation error occurred');
            this.uiManager.showError('Simulation encountered an error');
            this.uiManager.resetButton();
        }
    }

    /**
     * Stop the simulation
     */
    stopSimulation() {
        if (this.simInterval) {
            clearInterval(this.simInterval);
            this.simInterval = null;
        }
        this.uiManager.setSimulationFinished();
    }

    /**
     * Update all display elements
     */
    updateDisplay(forceChartUpdate = false) {
        const simState = this.simulation.getState();
        
        // Always update UI displays (they're lightweight)
        this.uiManager.updateDisplay(simState);
        
        // Always update charts - remove throttling that was causing issues
        try {
            this.chartManager.updateCharts(simState);
        } catch (error) {
            console.error('❌ Error updating charts:', error);
        }
    }

    /**
     * Restart the simulation (reset + new parameters)
     */
    restartSimulation() {
        this.resetSimulation();
        console.log('Simulation restarted with current parameters');
    }

    /**
     * Reset simulation to initial state
     */
    resetSimulation() {
        this.stopSimulation();
        this.simulation.initialize(this.uiManager.getControlValues());
        this.chartManager.createCharts();
        this.updateDisplay(true);
        this.uiManager.resetButton();
    }


    /**
     * Set up model selection (placeholder for future versions)
     */
    setupModelSelection() {
        const modelOptions = document.querySelectorAll('.model-option');
        const approachOptions = document.querySelectorAll('.approach-option');
        
        modelOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                if (!option.classList.contains('opacity-50')) {
                    // Handle model selection when other models are available
                    console.log('Model selection:', option.dataset.model);
                }
            });
        });
        
        approachOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                if (!option.classList.contains('opacity-50')) {
                    // Handle approach selection when agent-based is available
                    console.log('Approach selection:', option.dataset.approach);
                }
            });
        });
    }

    /**
     * Load configuration from file
     */
    loadConfiguration() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const config = JSON.parse(e.target.result);
                        this.applyConfiguration(config);
                    } catch (error) {
                        this.uiManager.showError('Invalid configuration file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /**
     * Apply loaded configuration
     */
    applyConfiguration(config) {
        if (config.parameters) {
            Object.keys(config.parameters).forEach(key => {
                if (this.uiManager.controls[key]) {
                    this.uiManager.controls[key].value = config.parameters[key];
                }
            });
            
            // Trigger change events to update displays
            Object.keys(this.uiManager.controls).forEach(key => {
                if (this.uiManager.controls[key].dispatchEvent) {
                    this.uiManager.controls[key].dispatchEvent(new Event('input'));
                }
            });
            
            this.updateButtonText();
            console.log('Configuration loaded successfully');
        }
    }

    /**
     * Show documentation modal
     */
    showDocumentation(section = 'overview') {
        let content = '';
        
        switch(section) {
            case 'v0-dynamics':
                content = this.getV0SystemDynamicsContent();
                break;
            case 'v1-dynamics':
                content = this.getV1SystemDynamicsContent();
                break;
            case 'price-modeling':
                content = this.getPriceModelingContent();
                break;
            default:
                content = this.getOverviewContent();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-xl" style="background-color: var(--neutral-white);">
                <div class="flex items-center justify-between p-6 border-b" style="border-color: var(--border-color);">
                    <div class="flex space-x-1">
                        <button class="doc-tab px-3 py-2 text-sm font-medium rounded transition-colors ${section === 'overview' ? 'active' : ''}" 
                                style="background-color: ${section === 'overview' ? 'var(--primary-blue)' : 'transparent'}; color: ${section === 'overview' ? 'white' : 'var(--text-secondary)'};"
                                onclick="app.showDocumentation('overview')">Overview</button>
                        <button class="doc-tab px-3 py-2 text-sm font-medium rounded transition-colors ${section === 'v0-dynamics' ? 'active' : ''}"
                                style="background-color: ${section === 'v0-dynamics' ? 'var(--primary-blue)' : 'transparent'}; color: ${section === 'v0-dynamics' ? 'white' : 'var(--text-secondary)'};"
                                onclick="app.showDocumentation('v0-dynamics')">V0 - Match & Burn</button>
                        <button class="doc-tab px-3 py-2 text-sm font-medium rounded transition-colors ${section === 'v1-dynamics' ? 'active' : ''}"
                                style="background-color: ${section === 'v1-dynamics' ? 'var(--success-green)' : 'transparent'}; color: ${section === 'v1-dynamics' ? 'white' : 'var(--text-secondary)'};"
                                onclick="app.showDocumentation('v1-dynamics')">V1 - Buyback & Burn</button>
                        <button class="doc-tab px-3 py-2 text-sm font-medium rounded transition-colors ${section === 'price-modeling' ? 'active' : ''}"
                                style="background-color: ${section === 'price-modeling' ? 'var(--primary-blue)' : 'transparent'}; color: ${section === 'price-modeling' ? 'white' : 'var(--text-secondary)'};"
                                onclick="app.showDocumentation('price-modeling')">Price Modeling</button>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    ${content}
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.querySelector('.fixed.inset-0');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.appendChild(modal);
    }

    /**
     * Get overview documentation content
     */
    getOverviewContent() {
        return `
            <h1 class="text-3xl font-bold mb-6" style="color: var(--primary-blue);">WOO Tokenomics Research Platform</h1>
            
            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Platform Architecture</h2>
                <p class="mb-4" style="color: var(--text-secondary);">
                    This research platform is designed for iterative tokenomics modeling using multiple model versions and approaches. 
                    Currently, we support <strong>Version 0</strong> of the WOO tokenomics system with a <strong>System Dynamics</strong> approach.
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="border rounded-lg p-4" style="border-color: var(--border-color);">
                        <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Model Versions</h3>
                        <ul class="space-y-2 text-sm" style="color: var(--text-secondary);">
                            <li>• <strong>Version 0:</strong> Current WOO system (Active)</li>
                            <li>• <strong>Version 1:</strong> Enhanced mechanisms (Planned)</li>
                            <li>• <strong>Version 1.2:</strong> Optimized parameters (Planned)</li>
                        </ul>
                    </div>
                    <div class="border rounded-lg p-4" style="border-color: var(--border-color);">
                        <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Modeling Approaches</h3>
                        <ul class="space-y-2 text-sm" style="color: var(--text-secondary);">
                            <li>• <strong>System Dynamics:</strong> Stock & flow modeling (Active)</li>
                            <li>• <strong>Agent-Based:</strong> Individual agent behaviors (Planned)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Current Model (V0) - Core Components</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="border rounded-lg p-4" style="border-color: var(--accent-teal);">
                        <h4 class="font-semibold mb-2" style="color: var(--accent-teal);">Fee Generation</h4>
                        <p class="text-sm" style="color: var(--text-secondary);">
                            Trading fees from WOOFi (swap + perp) and WOO X volume
                        </p>
                    </div>
                    <div class="border rounded-lg p-4" style="border-color: var(--primary-blue);">
                        <h4 class="font-semibold mb-2" style="color: var(--primary-blue);">Match & Burn</h4>
                        <p class="text-sm" style="color: var(--text-secondary);">
                            V2: Direct buyback & burn program from protocol fees
                        </p>
                    </div>
                    <div class="border rounded-lg p-4" style="border-color: var(--warning-amber);">
                        <h4 class="font-semibold mb-2" style="color: var(--warning-amber);">Price Impact</h4>
                        <p class="text-sm" style="color: var(--text-secondary);">
                            Dual-impact model: permanent (burns) + temporary (buying pressure)
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Research Workflow</h2>
                <ol class="list-decimal list-inside space-y-2" style="color: var(--text-secondary);">
                    <li><strong>Configure Model:</strong> Select version and approach</li>
                    <li><strong>Set Parameters:</strong> Adjust economic variables and simulation settings</li>
                    <li><strong>Run Analysis:</strong> Execute simulation with real-time progress tracking</li>
                    <li><strong>Review Results:</strong> Analyze charts, tables, and system flow diagrams</li>
                    <li><strong>Export Data:</strong> Save parameters and results for further analysis</li>
                    <li><strong>Iterate:</strong> Load configurations and compare different scenarios</li>
                </ol>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Research Focus</h3>
                <p class="text-sm" style="color: var(--text-secondary);">
                    This platform enables systematic exploration of WOO tokenomics under different parameter sets, 
                    providing insights into treasury sustainability, price dynamics, and economic incentives.
                </p>
            </div>
        `;
    }

    /**
     * Get V0 System Dynamics documentation content
     */
    getV0SystemDynamicsContent() {
        return `
            <h1 class="text-3xl font-bold mb-6" style="color: var(--primary-blue);">Version 0 - Match & Burn Model</h1>
            
            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Model Architecture</h2>
                <p class="mb-4" style="color: var(--text-secondary);">
                    The V0 Match & Burn model represents the current WOO tokenomics system using stock-and-flow methodology. 
                    Stakers can choose between USDC rewards or auto-compounding, with treasury matching burns for auto-compound purchases.
                </p>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Key Features</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border rounded-lg p-4" style="border-color: var(--border-color);">
                        <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Auto-Compound Choice</h3>
                        <p class="text-sm" style="color: var(--text-secondary);">
                            Stakers can choose between receiving USDC rewards or auto-compounding into more WOO tokens.
                            Auto-compound rate is configurable (default: 40%).
                        </p>
                    </div>
                    <div class="border rounded-lg p-4" style="border-color: var(--border-color);">
                        <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Match & Burn Mechanism</h3>
                        <p class="text-sm" style="color: var(--text-secondary);">
                            For every token purchased by auto-compounding stakers, the treasury burns an equivalent amount.
                            Creates 2:1 deflationary effect but constrains burns to treasury balance.
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Fee Distribution</h2>
                
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold mb-2">WOOFi Swap Fees</h4>
                        <div class="text-sm space-y-1">
                            <div>• 80% → Stakers</div>
                            <div>• 20% → Treasury</div>
                            <div class="text-xs text-gray-600">No affiliate cut applied</div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold mb-2">WOOFi Perp Fees</h4>
                        <div class="text-sm space-y-1">
                            <div>• 60% → Orderly/Affiliates</div>
                            <div>• 32% → Stakers (80% of remaining 40%)</div>
                            <div>• 8% → Treasury (20% of remaining 40%)</div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold mb-2">WOO X Fees</h4>
                        <div class="text-sm space-y-1">
                            <div>• 0.1 bps → Stakers</div>
                            <div>• 0.9 bps → WOO X Treasury</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Model Characteristics</h3>
                <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                    <li>• Variable burn rate depends on auto-compound adoption</li>
                    <li>• Treasury sustainability constraint (burns limited by balance)</li>
                    <li>• Complex fee treatment (swap vs perp differences)</li>
                    <li>• Staker choice creates behavioral variability</li>
                </ul>
            </div>
        `;
    }

    /**
     * Get V1 System Dynamics documentation content
     */
    getV1SystemDynamicsContent() {
        return `
            <h1 class="text-3xl font-bold mb-6" style="color: var(--success-green);">Version 1 - Buyback & Burn Model</h1>
            
            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Model Architecture</h2>
                <p class="mb-4" style="color: var(--text-secondary);">
                    The V1 Buyback & Burn model simplifies tokenomics with fixed percentage allocations. 
                    Eliminates auto-compound choice and implements direct market buyback for consistent burn rate.
                </p>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Key Changes from V0</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border rounded-lg p-4" style="border-color: var(--success-green);">
                        <h3 class="font-semibold mb-2" style="color: var(--success-green);">Simplified Distribution</h3>
                        <p class="text-sm" style="color: var(--text-secondary);">
                            Fixed 50%/30%/20% split eliminates complexity. No auto-compound choice - all staker rewards paid as USDC.
                        </p>
                    </div>
                    <div class="border rounded-lg p-4" style="border-color: var(--success-green);">
                        <h3 class="font-semibold mb-2" style="color: var(--success-green);">Direct Buyback & Burn</h3>
                        <p class="text-sm" style="color: var(--text-secondary);">
                            50% of fees directly purchase and burn tokens. No treasury constraint, ensuring consistent deflationary pressure.
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">V1 Fee Distribution</h2>
                
                <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold mb-2">WOOFi Swap Fees</h4>
                        <div class="text-sm space-y-1">
                            <div>• 50% → Buyback & Burn</div>
                            <div>• 30% → Stakers (USDC)</div>
                            <div>• 20% → Treasury</div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold mb-2">WOOFi Perp Fees</h4>
                        <div class="text-sm space-y-1">
                            <div>• 60% → Orderly/Affiliates (unchanged)</div>
                            <div>• 20% → Buyback & Burn (50% of remaining 40%)</div>
                            <div>• 12% → Stakers (30% of remaining 40%)</div>
                            <div>• 8% → Treasury (20% of remaining 40%)</div>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 class="font-semibold mb-2">WOO X Fees (Unchanged)</h4>
                        <div class="text-sm space-y-1">
                            <div>• 0.1 bps → Stakers</div>
                            <div>• 0.9 bps → WOO X Treasury</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Buyback & Burn Mechanism</h2>
                
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <div class="font-mono text-sm space-y-2">
                        <div><strong>Step 1:</strong> buyback_fund = 50% of swap fees + 20% of gross perp fees</div>
                        <div><strong>Step 2:</strong> tokens_to_purchase = buyback_fund ÷ woo_price</div>
                        <div><strong>Step 3:</strong> tokens_to_burn = tokens_to_purchase (1:1 burn)</div>
                        <div><strong>Step 4:</strong> Update supply: circulating -= burned, total -= burned</div>
                    </div>
                </div>
                
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 class="font-semibold mb-2" style="color: var(--warning-amber);">Key Advantage: No Treasury Constraint</h5>
                    <p class="text-sm" style="color: var(--text-secondary);">
                        Unlike V0's match & burn which is limited by treasury balance, V1's direct buyback ensures consistent burns
                        proportional to trading activity, regardless of treasury levels.
                    </p>
                </div>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 class="font-semibold mb-2" style="color: var(--success-green);">V1 Model Advantages</h3>
                <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                    <li>• Predictable burn rate (50% of fees → direct burns)</li>
                    <li>• Simplified staker experience (USDC only, no choices)</li>
                    <li>• Treasury sustainability (reduced burn dependency)</li>
                    <li>• Consistent deflationary pressure</li>
                </ul>
            </div>
        `;
    }

    /**
     * Get price modeling documentation content
     */
    getPriceModelingContent() {
        return `
            <h1 class="text-3xl font-bold mb-6" style="color: var(--primary-blue);">WOO Price Modeling System</h1>
            
            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">System Overview</h2>
                <p class="mb-4" style="color: var(--text-secondary);">
                    The price modeling system uses a dual-impact approach that separates permanent and temporary price effects, 
                    reflecting real-world market dynamics where different mechanisms have different persistence characteristics.
                </p>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Core Components</h2>
                
                <div class="space-y-6">
                    <div class="border-l-4 pl-4" style="border-color: var(--error-red);">
                        <h3 class="text-xl font-semibold mb-4" style="color: var(--error-red);">A. Permanent Impact (Supply Reduction)</h3>
                        
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <div class="font-mono text-sm mb-2">
                                <div>supply_reduction_pct = tokens_to_burn ÷ circulating_supply</div>
                                <div>permanent_impact = supply_reduction_pct × supply_elasticity</div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <h4 class="font-semibold mb-2">Cause</h4>
                                <p class="text-sm" style="color: var(--text-secondary);">Token burns from treasury</p>
                            </div>
                            <div>
                                <h4 class="font-semibold mb-2">Effect</h4>
                                <p class="text-sm" style="color: var(--text-secondary);">Permanent reduction in circulating supply</p>
                            </div>
                            <div>
                                <h4 class="font-semibold mb-2">Persistence</h4>
                                <p class="text-sm" style="color: var(--text-secondary);">Forever (never decays)</p>
                            </div>
                        </div>
                        
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h5 class="font-semibold mb-2" style="color: var(--error-red);">Economic Logic</h5>
                            <p class="text-sm" style="color: var(--text-secondary);">
                                <strong>Supply Elasticity = 10.0</strong><br>
                                For every 1% reduction in circulating supply, price increases by 10%. 
                                This reflects the scarcity premium - as tokens become rarer, their value increases disproportionately.
                            </p>
                        </div>
                    </div>

                    <div class="border-l-4 pl-4" style="border-color: var(--accent-teal);">
                        <h3 class="text-xl font-semibold mb-4" style="color: var(--accent-teal);">B. Temporary Impact (Buying Pressure)</h3>
                        
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <div class="font-mono text-sm mb-2">
                                <div>market_depth_proxy = (woofi_volume + woox_volume) ÷ 30</div>
                                <div>buy_pressure_ratio = auto_compound_usd ÷ market_depth_proxy</div>
                                <div>new_temporary_impact = buy_pressure_ratio × buying_pressure_elasticity</div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <h4 class="font-semibold mb-2">Cause</h4>
                                <p class="text-sm" style="color: var(--text-secondary);">Market purchases from auto-compound</p>
                            </div>
                            <div>
                                <h4 class="font-semibold mb-2">Effect</h4>
                                <p class="text-sm" style="color: var(--text-secondary);">Temporary price increase from buying pressure</p>
                            </div>
                            <div>
                                <h4 class="font-semibold mb-2">Persistence</h4>
                                <p class="text-sm" style="color: var(--text-secondary);">Decays over time (15% per month)</p>
                            </div>
                        </div>
                        
                        <div class="bg-teal-50 border border-teal-200 rounded-lg p-4">
                            <h5 class="font-semibold mb-2" style="color: var(--accent-teal);">Economic Logic</h5>
                            <p class="text-sm" style="color: var(--text-secondary);">
                                <strong>Buying Pressure Elasticity = 1.5</strong><br>
                                Large buys relative to market depth create temporary price spikes. 
                                Markets eventually absorb this pressure, so the effect decays naturally.
                            </p>
                        </div>
                    </div>

                    <div class="border-l-4 pl-4" style="border-color: var(--warning-amber);">
                        <h3 class="text-xl font-semibold mb-4" style="color: var(--warning-amber);">C. Temporal Decay Mechanism</h3>
                        
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <div class="font-mono text-sm mb-2">
                                <div>decayed_impact = previous_temporary_impact × (1 - decay_rate)</div>
                                <div>total_temporary_impact = decayed_impact + new_temporary_impact</div>
                            </div>
                        </div>
                        
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h5 class="font-semibold mb-2" style="color: var(--warning-amber);">Decay Logic</h5>
                            <p class="text-sm" style="color: var(--text-secondary);">
                                <strong>Decay Rate = 15% per month</strong><br>
                                Temporary impact loses 15% of its strength each month, representing market absorption of buying pressure.
                                Example: 10% impact → 8.5% next month → 7.225% after that.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Price Update Mechanism</h2>
                
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <div class="font-mono text-sm mb-2">
                        <div>price_change_multiplier = 1 + permanent_impact + total_temporary_impact</div>
                        <div>new_price = base_price × price_change_multiplier</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold mb-2">Impact Combination</h4>
                        <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                            <li>• <strong>Additive:</strong> Both impacts are summed</li>
                            <li>• <strong>Multiplicative:</strong> Applied as % changes to base price</li>
                            <li>• <strong>Safety:</strong> Price cannot go below $0.0001</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Economic Logic</h4>
                        <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                            <li>• Burns create lasting value (permanent)</li>
                            <li>• Buying creates short-term pumps (temporary)</li>
                            <li>• Market eventually normalizes (decay)</li>
                            <li>• Both effects can coexist (additive)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Mathematical Flow Example</h2>
                
                <div class="space-y-4">
                    <div class="border rounded-lg p-4" style="border-color: var(--primary-blue);">
                        <h4 class="font-semibold mb-3" style="color: var(--primary-blue);">Month 1 Calculation</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="mb-2"><strong>Inputs:</strong></div>
                                <div>• Tokens burned: 3.54M</div>
                                <div>• Circulating supply: 1.909B</div>
                                <div>• Auto-compound: $230K</div>
                                <div>• Daily volume: $37.8M</div>
                            </div>
                            <div>
                                <div class="mb-2"><strong>Calculations:</strong></div>
                                <div>• Permanent: (3.54M ÷ 1.909B) × 10.0 = 1.85%</div>
                                <div>• Temporary: ($230K ÷ $37.8M) × 1.5 = 0.91%</div>
                                <div>• Total impact: 1.85% + 0.91% = 2.76%</div>
                                <div>• New price: $0.065 × 1.0276 = $0.0668</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border rounded-lg p-4" style="border-color: var(--accent-teal);">
                        <h4 class="font-semibold mb-3" style="color: var(--accent-teal);">Month 2 Calculation</h4>
                        <div class="text-sm">
                            <div>• Previous temporary impact decays: 0.91% × 0.85 = 0.77%</div>
                            <div>• New temporary impact: 0.91% (same conditions)</div>
                            <div>• New permanent impact: 1.85% (cumulative with previous)</div>
                            <div>• Total: Previous permanent + New permanent + Decayed temporary + New temporary</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Model Approach & Limitations</h3>
                <p class="text-sm mb-3" style="color: var(--text-secondary);">This dual-impact system provides a proxy for price impact with current WOO mechanisms:</p>
                <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                    <li>• <strong>Burns:</strong> Create lasting value through permanent scarcity</li>
                    <li>• <strong>Buying pressure:</strong> Creates short-term price pumps</li>
                    <li>• <strong>Market normalization:</strong> Temporary effects decay naturally</li>
                    <li>• <strong>Coexistence:</strong> Both effects operate simultaneously</li>
                </ul>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <h3 class="font-semibold mb-2" style="color: var(--error-red);">⚠️ Important Disclaimer</h3>
                <p class="text-sm mb-2" style="color: var(--text-secondary);">
                    <strong>This price modeling approach is a simplified proxy and does not account for all factors that affect token price.</strong>
                </p>
                <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                    <li>• <strong>Market factors:</strong> External market conditions, sentiment, macroeconomic events</li>
                    <li>• <strong>Liquidity dynamics:</strong> Order book depth, market maker behavior, slippage</li>
                    <li>• <strong>Technical factors:</strong> Trading algorithms, arbitrage, derivatives activity</li>
                    <li>• <strong>Fundamental factors:</strong> Protocol adoption, competitive landscape, regulatory changes</li>
                </ul>
                <p class="text-sm mt-3 font-medium" style="color: var(--error-red);">
                    <strong>This model cannot be taken as a reliable measurement for actual price behavior.</strong> 
                    It should be used only for relative scenario comparison and understanding mechanism relationships within the WOO ecosystem.
                </p>
            </div>
        `;
    }

    /**
     * Get metrics documentation content
     */
    getMetricsContent() {
        return `
            <h1 class="text-3xl font-bold mb-6" style="color: var(--primary-blue);">Key Metrics & Analytics</h1>
            
            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Dashboard Metrics</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border rounded-lg p-4" style="border-color: var(--primary-blue);">
                        <h3 class="font-semibold mb-3" style="color: var(--primary-blue);">WOO Price</h3>
                        <p class="text-sm mb-2" style="color: var(--text-secondary);">
                            Current token price in USD, updated each simulation month based on dual price impact model.
                        </p>
                        <div class="text-xs" style="color: var(--text-secondary);">
                            <strong>Formula:</strong> Base price × (1 + permanent_impact + temporary_impact)
                        </div>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--accent-teal);">
                        <h3 class="font-semibold mb-3" style="color: var(--accent-teal);">Treasury Runway</h3>
                        <p class="text-sm mb-2" style="color: var(--text-secondary);">
                            Months of operation remaining at current burn rate. Critical for sustainability analysis.
                        </p>
                        <div class="text-xs" style="color: var(--text-secondary);">
                            <strong>Formula:</strong> WOOFi Treasury Balance ÷ Monthly Burn Rate
                        </div>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--warning-amber);">
                        <h3 class="font-semibold mb-3" style="color: var(--warning-amber);">Price-to-Value Distributed Ratio</h3>
                        <p class="text-sm mb-2" style="color: var(--text-secondary);">
                            How much an investor pays today to receive one dollar of annual value distribution. 
                            <strong>Calculated only at 12-month intervals</strong> using actual trailing year data.
                        </p>
                        <div class="text-xs mb-2" style="color: var(--text-secondary);">
                            <strong>Formula:</strong> Market Cap ÷ Actual 12-Month Value Distribution
                        </div>
                        
                        <div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <h4 class="text-xs font-semibold mb-1">Annual Value Distribution includes:</h4>
                            <ul class="text-xs space-y-1" style="color: var(--text-secondary);">
                                <li>• USDC distributions to stakers (direct cash)</li>
                                <li>• Value from token burns (supply reduction)</li>
                                <li>• Value from auto-compound purchases (buying pressure)</li>
                            </ul>
                            <p class="text-xs mt-2 font-medium" style="color: var(--warning-amber);">
                                Displays as "Year 1: 15.3x", "Year 2: 12.1x", etc.
                            </p>
                        </div>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--secondary-blue);">
                        <h3 class="font-semibold mb-3" style="color: var(--secondary-blue);">Treasury Balances</h3>
                        <p class="text-sm mb-2" style="color: var(--text-secondary);">
                            Separate tracking of WOOFi and WOO X treasury holdings. WOOFi treasury is used for burns.
                        </p>
                        <div class="text-xs" style="color: var(--text-secondary);">
                            <strong>WOOFi:</strong> Active treasury for burn mechanism<br>
                            <strong>WOO X:</strong> Static treasury (not used in current model)
                        </div>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--accent-teal);">
                        <h3 class="font-semibold mb-3" style="color: var(--accent-teal);">Circulating Supply</h3>
                        <p class="text-sm mb-2" style="color: var(--text-secondary);">
                            Tokens available in the market, reduced by burns and market purchases.
                        </p>
                        <div class="text-xs" style="color: var(--text-secondary);">
                            <strong>Updates:</strong> Decreases with burns and auto-compound purchases
                        </div>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--neutral-gray);">
                        <h3 class="font-semibold mb-3" style="color: var(--neutral-gray);">Simulation Month</h3>
                        <p class="text-sm mb-2" style="color: var(--text-secondary);">
                            Current month in the simulation timeline, used to track progress and calculate metrics.
                        </p>
                        <div class="text-xs" style="color: var(--text-secondary);">
                            <strong>Range:</strong> 1 to selected simulation duration
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Results Table Metrics</h2>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                        <thead>
                            <tr class="border-b-2" style="border-color: var(--border-color);">
                                <th class="text-left p-3 font-semibold" style="color: var(--text-primary);">Metric</th>
                                <th class="text-left p-3 font-semibold" style="color: var(--text-primary);">Description</th>
                                <th class="text-left p-3 font-semibold" style="color: var(--text-primary);">Units</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Month</td>
                                <td class="p-3" style="color: var(--text-secondary);">Simulation timestep</td>
                                <td class="p-3" style="color: var(--text-secondary);">Integer</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Price</td>
                                <td class="p-3" style="color: var(--text-secondary);">WOO token price</td>
                                <td class="p-3" style="color: var(--text-secondary);">USD</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">WOOFi Treasury</td>
                                <td class="p-3" style="color: var(--text-secondary);">Active treasury balance</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million WOO</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">WOO X Treasury</td>
                                <td class="p-3" style="color: var(--text-secondary);">Static treasury balance</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million WOO</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Circulating</td>
                                <td class="p-3" style="color: var(--text-secondary);">Tokens in market circulation</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million WOO</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Burned</td>
                                <td class="p-3" style="color: var(--text-secondary);">Tokens burned that month</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million WOO</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">WOOFi Fees</td>
                                <td class="p-3" style="color: var(--text-secondary);">Trading fees from WOOFi swap + perp</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million USD</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">WOO X Fees</td>
                                <td class="p-3" style="color: var(--text-secondary);">Staker rewards from WOO X volume</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million USD</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">USDC Dist.</td>
                                <td class="p-3" style="color: var(--text-secondary);">Direct cash distributed to stakers</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million USD</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Treasury Runway</td>
                                <td class="p-3" style="color: var(--text-secondary);">Months remaining at current burn rate</td>
                                <td class="p-3" style="color: var(--text-secondary);">Months</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Price Change %</td>
                                <td class="p-3" style="color: var(--text-secondary);">Cumulative price change from start</td>
                                <td class="p-3" style="color: var(--text-secondary);">Percentage</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Supply Reduction %</td>
                                <td class="p-3" style="color: var(--text-secondary);">Percentage of supply burned</td>
                                <td class="p-3" style="color: var(--text-secondary);">Percentage</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Staking Ratio %</td>
                                <td class="p-3" style="color: var(--text-secondary);">Percentage of total supply staked</td>
                                <td class="p-3" style="color: var(--text-secondary);">Percentage</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Supply Burned %</td>
                                <td class="p-3" style="color: var(--text-secondary);">Percentage of max supply permanently burned</td>
                                <td class="p-3" style="color: var(--text-secondary);">Percentage</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Max Supply</td>
                                <td class="p-3" style="color: var(--text-secondary);">Fixed maximum of 3B WOO tokens (from whitepaper)</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million WOO</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Annual P/V Ratios</td>
                                <td class="p-3" style="color: var(--text-secondary);">Separate cards showing Price-to-Value Distributed ratio for each year</td>
                                <td class="p-3" style="color: var(--text-secondary);">Market Cap ÷ Annual Value</td>
                            </tr>
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <td class="p-3 font-medium">Affiliate Cut</td>
                                <td class="p-3" style="color: var(--text-secondary);">Fees paid to affiliates/Orderly (from perp fees only)</td>
                                <td class="p-3" style="color: var(--text-secondary);">Million USD</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Chart Analytics</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border rounded-lg p-4" style="border-color: var(--primary-blue);">
                        <h3 class="font-semibold mb-3" style="color: var(--primary-blue);">Treasury & Supply Dynamics</h3>
                        <p class="text-sm mb-3" style="color: var(--text-secondary);">
                            Multi-line chart showing the evolution of key stock variables over time.
                        </p>
                        <ul class="text-xs space-y-1" style="color: var(--text-secondary);">
                            <li>• <strong>WOOFi Treasury:</strong> Active burn treasury</li>
                            <li>• <strong>WOO X Treasury:</strong> Static treasury</li>
                            <li>• <strong>Circulating Supply:</strong> Market tokens</li>
                            <li>• <strong>Total Staked:</strong> Staked tokens</li>
                        </ul>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--warning-amber);">
                        <h3 class="font-semibold mb-3" style="color: var(--warning-amber);">Price Evolution</h3>
                        <p class="text-sm mb-3" style="color: var(--text-secondary);">
                            Area chart showing WOO token price changes over the simulation period.
                        </p>
                        <ul class="text-xs space-y-1" style="color: var(--text-secondary);">
                            <li>• Shows both permanent and temporary price impacts</li>
                            <li>• Filled area emphasizes price appreciation</li>
                            <li>• Critical for ROI analysis</li>
                        </ul>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--accent-teal);">
                        <h3 class="font-semibold mb-3" style="color: var(--accent-teal);">Monthly Token Flows</h3>
                        <p class="text-sm mb-3" style="color: var(--text-secondary);">
                            Stacked bar chart showing monthly token movements.
                        </p>
                        <ul class="text-xs space-y-1" style="color: var(--text-secondary);">
                            <li>• <strong>Monthly Burned:</strong> Treasury burns</li>
                            <li>• <strong>Market Purchases:</strong> Auto-compound buys</li>
                            <li>• Visual comparison of flow magnitudes</li>
                        </ul>
                    </div>

                    <div class="border rounded-lg p-4" style="border-color: var(--secondary-blue);">
                        <h3 class="font-semibold mb-3" style="color: var(--secondary-blue);">Price Impact Components</h3>
                        <p class="text-sm mb-3" style="color: var(--text-secondary);">
                            Line chart separating permanent and temporary price impacts.
                        </p>
                        <ul class="text-xs space-y-1" style="color: var(--text-secondary);">
                            <li>• <strong>Permanent Impact:</strong> From supply burns</li>
                            <li>• <strong>Temporary Impact:</strong> From buying pressure</li>
                            <li>• Shows decay of temporary effects</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Interpreting Results</h2>
                
                <div class="space-y-4">
                    <div class="border rounded-lg p-4" style="border-color: var(--success-green);">
                        <h3 class="font-semibold mb-2" style="color: var(--success-green);">Positive Indicators</h3>
                        <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                            <li>• <strong>Rising Price:</strong> Effective burn mechanism</li>
                            <li>• <strong>Stable Treasury Runway:</strong> Sustainable economics</li>
                            <li>• <strong>Decreasing P/V Ratio:</strong> Better value for holders</li>
                            <li>• <strong>Consistent Burns:</strong> Active mechanism engagement</li>
                        </ul>
                    </div>
                    
                    <div class="border rounded-lg p-4" style="border-color: var(--error-red);">
                        <h3 class="font-semibold mb-2" style="color: var(--error-red);">Warning Signs</h3>
                        <ul class="text-sm space-y-1" style="color: var(--text-secondary);">
                            <li>• <strong>Treasury Runway < 12 months:</strong> Sustainability risk</li>
                            <li>• <strong>Stagnant Price:</strong> Ineffective tokenomics</li>
                            <li>• <strong>Rising P/V Ratio:</strong> Overvaluation risk</li>
                            <li>• <strong>Declining Burns:</strong> Treasury depletion</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold mb-2" style="color: var(--primary-blue);">Model Calibration</h3>
                <p class="text-sm mb-3" style="color: var(--text-secondary);">
                    These metrics can be used to calibrate model parameters and validate against real-world data. 
                    The P/V ratio is particularly useful for comparing different tokenomics scenarios and 
                    assessing the value proposition for token holders.
                </p>
                <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <h4 class="text-sm font-semibold mb-1" style="color: var(--warning-amber);">P/V Ratio: Annual Snapshots Only</h4>
                    <p class="text-xs" style="color: var(--text-secondary);">
                        The Price-to-Value Distributed ratio is now calculated only at 12-month intervals (Year 1, Year 2, Year 3) 
                        using actual trailing year data. This provides more meaningful, comparable annual metrics 
                        rather than artificial monthly fluctuations.
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Setup dark mode toggle functionality
     */
    setupDarkModeToggle() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeIcon = document.getElementById('darkModeIcon');
        
        if (!darkModeToggle || !darkModeIcon) return;

        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('woo-theme') || 'light';
        this.setTheme(savedTheme);

        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
            localStorage.setItem('woo-theme', newTheme);
        });
    }

    /**
     * Set the theme (light or dark)
     */
    setTheme(theme) {
        const darkModeIcon = document.getElementById('darkModeIcon');
        
        document.documentElement.setAttribute('data-theme', theme);
        
        if (darkModeIcon) {
            darkModeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        // Update charts if they exist to reflect new theme
        if (this.chartManager && this.simulation) {
            // Small delay to allow CSS variables to update
            setTimeout(() => {
                this.chartManager.createCharts();
                this.updateDisplay(true);
            }, 100);
        }
    }

    /**
     * Export simulation data
     */
    exportData() {
        const simState = this.simulation.getState();
        const data = {
            metadata: {
                platform: 'WOO Tokenomics Research Platform',
                version: '1.0',
                model: 'v0',
                approach: 'system-dynamics',
                timestamp: new Date().toISOString(),
                duration_months: this.simulation.simParams?.simulation_months || 0
            },
            parameters: this.simulation.simParams,
            results: simState.history,
            finalState: {
                month: simState.month,
                woo_price: simState.woo_price,
                woofi_treasury_balance: simState.woofi_treasury_balance,
                woox_treasury_balance: simState.woox_treasury_balance,
                circulating_supply: simState.circulating_supply,
                total_staked: simState.total_staked_woo,
                usdc_distribution: simState.usdc_distribution,
                auto_compound_usd: simState.auto_compound_usd
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `woo-research-v0-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export simulation data as CSV
     */
    exportDataAsCSV() {
        const simState = this.simulation.getState();
        const history = simState.history;
        if (!history || history.months.length === 0) {
            this.uiManager.showError('No simulation data to export');
            return;
        }

        // Prepare CSV headers
        const headers = [
            'Month',
            'WOO Price',
            'Circulating Supply',
            'Total Staked',
            'WOOFi Treasury',
            'WOO X Treasury',
            'Monthly Burned',
            'Staker Fees (USD)',
            'Treasury Fees (USD)',
            'Orderly Fees (USD)',
            'Buyback Fees (USD)'
        ];

        // Prepare CSV data
        const csvData = [headers];
        
        for (let i = 0; i < history.months.length; i++) {
            const row = [
                history.months[i],
                history.price[i],
                history.circulating[i] * 1e6, // Convert back to actual tokens
                history.staked[i] * 1e6,
                history.woofi_treasury[i] * 1e6,
                history.woox_treasury[i] * 1e6,
                history.monthlyBurned[i] * 1e6,
                (history.staker_fees_received && history.staker_fees_received[i] ? history.staker_fees_received[i] * 1e6 : 0),
                (history.treasury_fees_received && history.treasury_fees_received[i] ? history.treasury_fees_received[i] * 1e6 : 0),
                (history.orderly_fees_received && history.orderly_fees_received[i] ? history.orderly_fees_received[i] * 1e6 : 0),
                (history.buyback_fees_received && history.buyback_fees_received[i] ? history.buyback_fees_received[i] * 1e6 : 0)
            ];
            csvData.push(row);
        }

        // Convert to CSV string
        const csvString = csvData.map(row => row.join(',')).join('\n');

        // Create and download file
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'woo-tokenomics-simulation.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    /**
     * Export results table as CSV (same as main export)
     */
    exportResultsTableAsCSV() {
        this.exportDataAsCSV();
    }
    
    /**
     * Show full screen table view
     */
    showFullScreenTable() {
        const table = document.getElementById('resultsTable');
        if (!table) {
            alert('No table data available');
            return;
        }
        
        // Create modal for full screen view
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-full overflow-hidden" style="background-color: var(--neutral-white);">
                <div class="flex items-center justify-between p-4 border-b" style="border-color: var(--border-color);">
                    <h2 class="text-xl font-semibold" style="color: var(--text-primary);">Simulation Results - Full View</h2>
                    <button id="closeFullScreenTable" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
                </div>
                <div class="overflow-auto max-h-[80vh] p-4">
                    ${table.outerHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button handler
        modal.querySelector('#closeFullScreenTable').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Open full screen table view
     */
    openFullScreenTable() {
        const simState = this.simulation.getState();
        if (!simState.history.months.length) {
            alert('No simulation data to display. Please run a simulation first.');
            return;
        }

        // Create modal for full screen table
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col" style="background-color: var(--neutral-white);">
                <div class="flex items-center justify-between p-6 border-b" style="border-color: var(--border-color);">
                    <h2 class="text-xl font-semibold" style="color: var(--text-primary);">Complete Simulation Results</h2>
                    <div class="flex space-x-3">
                        <button id="fullScreenExportCSV" class="px-4 py-2 border rounded text-sm font-medium" style="border-color: var(--primary-blue); color: var(--primary-blue);">
                            Export CSV
                        </button>
                        <button id="closeFullScreenTable" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
                    </div>
                </div>
                <div class="flex-1 overflow-auto p-6">
                    <table class="w-full text-sm border-collapse">
                        <thead class="sticky top-0" style="background-color: var(--neutral-white);">
                            <tr class="border-b" style="border-color: var(--border-color);">
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">Month</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">Price</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">WOOFi Treasury</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">WOO X Treasury</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">Circulating</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">Staked</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">Monthly Burned</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">WOOFi Fees</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">WOO X Fees</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">USDC Dist.</th>
                                <th class="text-left py-2 px-3 border-r" style="color: var(--text-secondary); border-color: var(--border-color);">Treasury Runway</th>
                                <th class="text-left py-2 px-3" style="color: var(--text-secondary);">Price Change %</th>
                            </tr>
                        </thead>
                        <tbody id="fullScreenTableBody">
                            ${this.generateFullTableRows(simState)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('closeFullScreenTable').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('fullScreenExportCSV').addEventListener('click', () => {
            this.exportDataAsCSV();
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Generate full table rows for modal
     */
    generateFullTableRows(simState) {
        const history = simState.history;
        return history.months.map((month, index) => `
            <tr class="border-b hover:bg-gray-50" style="border-color: var(--border-color);">
                <td class="py-2 px-3 border-r font-medium" style="border-color: var(--border-color);">${month}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">$${history.price[index].toFixed(4)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">${this.constructor.formatValue(history.woofi_treasury[index] * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">${this.constructor.formatValue(history.woox_treasury[index] * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">${this.constructor.formatValue(history.circulating[index] * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">${this.constructor.formatValue(history.staked[index] * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">${this.constructor.formatValue(history.monthlyBurned[index] * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">$${this.constructor.formatValue((history.staker_fees_received && history.staker_fees_received[index] || 0) * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">$${this.constructor.formatValue((history.treasury_fees_received && history.treasury_fees_received[index] || 0) * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">$${this.constructor.formatValue((history.orderly_fees_received && history.orderly_fees_received[index] || 0) * 1e6)}</td>
                <td class="py-2 px-3 border-r" style="border-color: var(--border-color);">${(history.treasury_runway_months && history.treasury_runway_months[index] !== undefined ? (isFinite(history.treasury_runway_months[index]) ? history.treasury_runway_months[index].toFixed(1) : 'Inf') : '--')}</td>
                <td class="py-2 px-3" style="border-color: var(--border-color);">${(history.price_change_pct && history.price_change_pct[index] || 0).toFixed(2)}%</td>
            </tr>
        `).join('');
    }

    /**
     * Static formatting method for use in templates
     */
    static formatValue(value, decimals = 2) {
        if (value === 0) return '0';
        
        const absValue = Math.abs(value);
        
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
}

// Global application instance
let app;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new WOOTokenomicsApp();
    app.init();
    
    // Make app available globally for debugging and research
    window.wooApp = app;
    window.wooResearch = {
        app: app,
        exportFullData: () => app.exportData(),
        getSimulationState: () => app.simulation.getState(),
        getParameters: () => app.simulation.simParams,
        version: '1.0',
        model: 'v0',
        approach: 'system-dynamics'
    };
    
    console.log('🔬 WOO Tokenomics Research Platform initialized');
    console.log('📊 Available in window.wooResearch for programmatic access');
}); 