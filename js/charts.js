/**
 * Chart management for WOO tokenomics simulation
 */

class ChartManager {
    constructor() {
        this.charts = {};
    }

    /**
     * Initialize all charts
     */
    createCharts() {
        // Destroy existing charts
        this.destroyCharts();

        // Wait for DOM to be fully ready
        if (document.readyState !== 'complete') {
            document.addEventListener('DOMContentLoaded', () => this.createCharts());
            return;
        }

        // Chart configurations
        const chartConfigs = {
            stocksChart: this.getStocksChartConfig(),
            priceChart: this.getPriceChartConfig(),
            flowsChart: this.getFlowsChartConfig(),
            impactChart: this.getImpactChartConfig()
        };
        
        // Create charts with error handling
        Object.keys(chartConfigs).forEach(id => {
            try {
                console.log(`🔧 Creating chart: ${id}`);
                
                const canvas = document.getElementById(id);
                if (!canvas) {
                    console.error(`❌ Canvas element with id '${id}' not found`);
                    return;
                }
                console.log(`✅ Found canvas for ${id}`);
                
                // Ensure canvas is properly sized
                const container = canvas.parentElement;
                if (container) {
                    canvas.style.width = '100%';
                    canvas.style.height = '300px';
                    canvas.width = container.offsetWidth || 800;
                    canvas.height = 300;
                    console.log(`✅ Sized canvas ${id}: ${canvas.width}x${canvas.height}`);
                }
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error(`❌ Could not get 2D context for canvas '${id}'`);
                    return;
                }
                console.log(`✅ Got 2D context for ${id}`);
                
                // Check Chart.js availability
                if (typeof Chart === 'undefined') {
                    console.error('❌ Chart.js not loaded');
                    return;
                }
                console.log(`✅ Chart.js available for ${id}`);
                
                this.charts[id] = new Chart(ctx, chartConfigs[id]);
                console.log(`✅ Created chart: ${id}`);
                
            } catch (error) {
                console.error(`❌ Failed to create chart ${id}:`, error);
                console.error('Stack trace:', error.stack);
            }
        });
        
        console.log(`Charts created: ${Object.keys(this.charts).join(', ')}`);
    }

    /**
     * Treasury & Supply Dynamics chart configuration
     */
    getStocksChartConfig() {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'WOOFi Treasury',
                        data: [],
                        borderColor: CONFIG.CHART_COLORS.woofi_treasury,
                        backgroundColor: CONFIG.CHART_COLORS.woofi_treasury + '20',
                        yAxisID: 'y',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'WOO X Treasury',
                        data: [],
                        borderColor: CONFIG.CHART_COLORS.woox_treasury,
                        backgroundColor: CONFIG.CHART_COLORS.woox_treasury + '20',
                        yAxisID: 'y',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Circulating Supply',
                        data: [],
                        borderColor: CONFIG.CHART_COLORS.circulating,
                        backgroundColor: CONFIG.CHART_COLORS.circulating + '20',
                        yAxisID: 'y',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Total Staked',
                        data: [],
                        borderColor: CONFIG.CHART_COLORS.staked,
                        backgroundColor: CONFIG.CHART_COLORS.staked + '20',
                        yAxisID: 'y',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Tokens (M)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        };
    }

    /**
     * Price Evolution chart configuration
     */
    getPriceChartConfig() {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'WOO Price (USD)',
                        data: [],
                        borderColor: CONFIG.CHART_COLORS.price,
                        backgroundColor: CONFIG.CHART_COLORS.price + '20',
                        tension: 0.2,
                        borderWidth: 3,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Price (USD)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        };
    }

    /**
     * Monthly Token Flows chart configuration
     */
    getFlowsChartConfig() {
        return {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Monthly Burned',
                        data: [],
                        backgroundColor: CONFIG.CHART_COLORS.burned,
                        borderColor: CONFIG.CHART_COLORS.burned,
                        borderWidth: 1
                    },
                    {
                        label: 'Market Purchases',
                        data: [],
                        backgroundColor: CONFIG.CHART_COLORS.purchases,
                        borderColor: CONFIG.CHART_COLORS.purchases,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Tokens (M)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        };
    }

    /**
     * Price Impact Components chart configuration
     */
    getImpactChartConfig() {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Permanent Impact',
                        data: [],
                        borderColor: CONFIG.CHART_COLORS.permanent,
                        backgroundColor: CONFIG.CHART_COLORS.permanent + '20',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Temporary Impact',
                        data: [],
                        borderColor: CONFIG.CHART_COLORS.temporary,
                        backgroundColor: CONFIG.CHART_COLORS.temporary + '20',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Impact (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        };
    }

    /**
     * Update all charts with new data
     */
    updateCharts(simState) {
        console.log('📊 Updating charts with simState:', simState);
        
        if (!simState || !simState.history) {
            console.error('❌ No history data in simState');
            return;
        }
        
        const history = simState.history;
        console.log('📊 History data:', {
            months: history.months?.length,
            woofi_treasury: history.woofi_treasury?.length,
            woox_treasury: history.woox_treasury?.length,
            circulating: history.circulating?.length,
            staked: history.staked?.length,
            price: history.price?.length,
            monthlyBurned: history.monthlyBurned?.length,
            marketPurchases: history.marketPurchases?.length,
            permImpact: history.permImpact?.length,
            tempImpact: history.tempImpact?.length
        });

        // Check if charts exist
        if (!this.charts.stocksChart) {
            console.error('❌ stocksChart not found');
            return;
        }

        try {
            // Update Treasury & Supply Dynamics
            this.charts.stocksChart.data.labels = [...history.months];
            this.charts.stocksChart.data.datasets[0].data = [...history.woofi_treasury];
            this.charts.stocksChart.data.datasets[1].data = [...history.woox_treasury];
            this.charts.stocksChart.data.datasets[2].data = [...history.circulating];
            this.charts.stocksChart.data.datasets[3].data = [...history.staked];
            this.charts.stocksChart.update('none');
            console.log('✅ Updated stocksChart');

            // Update Price Evolution
            this.charts.priceChart.data.labels = [...history.months];
            this.charts.priceChart.data.datasets[0].data = [...history.price];
            this.charts.priceChart.update('none');
            console.log('✅ Updated priceChart');

            // Update Monthly Token Flows
            this.charts.flowsChart.data.labels = [...history.months];
            this.charts.flowsChart.data.datasets[0].data = [...history.monthlyBurned];
            this.charts.flowsChart.data.datasets[1].data = [...history.marketPurchases];
            this.charts.flowsChart.data.datasets[1].label = 'Market Purchases';
            this.charts.flowsChart.update('none');
            console.log('✅ Updated flowsChart');

            // Update Price Impact Components
            this.charts.impactChart.data.labels = [...history.months];
            this.charts.impactChart.data.datasets[0].data = [...history.permImpact];
            this.charts.impactChart.data.datasets[1].data = [...history.tempImpact];
            this.charts.impactChart.update('none');
            console.log('✅ Updated impactChart');
            
        } catch (error) {
            console.error('❌ Error updating charts:', error);
        }
    }

    /**
     * Destroy all charts
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            try {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            } catch (error) {
                console.warn('Error destroying chart:', error);
            }
        });
        this.charts = {};
    }
} 