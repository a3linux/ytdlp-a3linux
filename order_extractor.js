/**
 * Taobao Order Data Extractor
 * This script extracts and filters order data from Taobao's "已买到的宝贝" (Items I've Bought) page
 */

class TaobaoOrderExtractor {
    constructor() {
        this.orderData = null;
        this.extractedOrders = [];
    }

    /**
     * Extract order data from the page
     * @returns {Object|null} The extracted order data or null if not found
     */
    extractOrderData() {
        try {
            // Look for the data variable in the page
            const scripts = document.querySelectorAll('script');
            let dataScript = null;
            
            for (const script of scripts) {
                if (script.textContent.includes('var data = JSON.parse')) {
                    dataScript = script;
                    break;
                }
            }
            
            if (!dataScript) {
                console.log('Order data script not found');
                return null;
            }

            // Extract the JSON string from the script
            const scriptContent = dataScript.textContent;
            const jsonMatch = scriptContent.match(/var data = JSON\.parse\('(.+?)'\)/);
            
            if (!jsonMatch) {
                console.log('JSON data not found in script');
                return null;
            }

            // Parse the JSON data
            const jsonString = jsonMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            this.orderData = JSON.parse(jsonString);
            
            console.log('Order data extracted successfully');
            return this.orderData;
            
        } catch (error) {
            console.error('Error extracting order data:', error);
            return null;
        }
    }

    /**
     * Get all main orders
     * @returns {Array} Array of main orders
     */
    getMainOrders() {
        if (!this.orderData || !this.orderData.mainOrders) {
            return [];
        }
        return this.orderData.mainOrders;
    }

    /**
     * Filter orders by status
     * @param {string} status - Order status to filter by
     * @returns {Array} Filtered orders
     */
    filterOrdersByStatus(status) {
        const orders = this.getMainOrders();
        return orders.filter(order => {
            if (order.extra && order.extra.tradeStatus) {
                return order.extra.tradeStatus === status;
            }
            if (order.statusInfo && order.statusInfo.text) {
                return order.statusInfo.text.includes(status);
            }
            return false;
        });
    }

    /**
     * Filter orders by date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Array} Filtered orders
     */
    filterOrdersByDateRange(startDate, endDate) {
        const orders = this.getMainOrders();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return orders.filter(order => {
            if (order.orderInfo && order.orderInfo.createDay) {
                const orderDate = new Date(order.orderInfo.createDay);
                return orderDate >= start && orderDate <= end;
            }
            return false;
        });
    }

    /**
     * Filter orders by seller
     * @param {string} sellerName - Seller name to filter by
     * @returns {Array} Filtered orders
     */
    filterOrdersBySeller(sellerName) {
        const orders = this.getMainOrders();
        return orders.filter(order => {
            if (order.seller && order.seller.nick) {
                return order.seller.nick.toLowerCase().includes(sellerName.toLowerCase());
            }
            return false;
        });
    }

    /**
     * Filter orders by price range
     * @param {number} minPrice - Minimum price
     * @param {number} maxPrice - Maximum price
     * @returns {Array} Filtered orders
     */
    filterOrdersByPriceRange(minPrice, maxPrice) {
        const orders = this.getMainOrders();
        return orders.filter(order => {
            if (order.payInfo && order.payInfo.actualFee) {
                const price = parseFloat(order.payInfo.actualFee);
                return price >= minPrice && price <= maxPrice;
            }
            return false;
        });
    }

    /**
     * Get order summary statistics
     * @returns {Object} Summary statistics
     */
    getOrderSummary() {
        const orders = this.getMainOrders();
        if (orders.length === 0) {
            return {
                totalOrders: 0,
                totalAmount: 0,
                averageOrderValue: 0,
                statusBreakdown: {},
                sellerBreakdown: {}
            };
        }

        let totalAmount = 0;
        const statusBreakdown = {};
        const sellerBreakdown = {};

        orders.forEach(order => {
            // Calculate total amount
            if (order.payInfo && order.payInfo.actualFee) {
                totalAmount += parseFloat(order.payInfo.actualFee);
            }

            // Status breakdown
            let status = 'Unknown';
            if (order.extra && order.extra.tradeStatus) {
                status = order.extra.tradeStatus;
            } else if (order.statusInfo && order.statusInfo.text) {
                status = order.statusInfo.text;
            }
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

            // Seller breakdown
            if (order.seller && order.seller.nick) {
                const seller = order.seller.nick;
                sellerBreakdown[seller] = (sellerBreakdown[seller] || 0) + 1;
            }
        });

        return {
            totalOrders: orders.length,
            totalAmount: totalAmount.toFixed(2),
            averageOrderValue: (totalAmount / orders.length).toFixed(2),
            statusBreakdown,
            sellerBreakdown
        };
    }

    /**
     * Export orders to CSV format
     * @param {Array} orders - Orders to export (defaults to all orders)
     * @returns {string} CSV string
     */
    exportToCSV(orders = null) {
        const orderList = orders || this.getMainOrders();
        if (orderList.length === 0) {
            return '';
        }

        const headers = [
            'Order ID',
            'Order Date',
            'Seller',
            'Shop Name',
            'Product Title',
            'Quantity',
            'Original Price',
            'Actual Price',
            'Status',
            'Currency'
        ];

        const csvRows = [headers.join(',')];

        orderList.forEach(order => {
            const orderInfo = order.orderInfo || {};
            const seller = order.seller || {};
            const payInfo = order.payInfo || {};
            
            // Get product information from subOrders
            let productTitle = 'N/A';
            let quantity = 'N/A';
            let originalPrice = 'N/A';
            
            if (order.subOrders && order.subOrders.length > 0) {
                const firstItem = order.subOrders[0];
                if (firstItem.itemInfo) {
                    productTitle = `"${(firstItem.itemInfo.title || 'N/A').replace(/"/g, '""')}"`;
                    quantity = firstItem.quantity || 'N/A';
                }
                if (firstItem.priceInfo) {
                    originalPrice = firstItem.priceInfo.original || 'N/A';
                }
            }

            const row = [
                order.id || 'N/A',
                orderInfo.createDay || 'N/A',
                `"${(seller.nick || 'N/A').replace(/"/g, '""')}"`,
                `"${(seller.shopName || 'N/A').replace(/"/g, '""')}"`,
                productTitle,
                quantity,
                originalPrice,
                payInfo.actualFee || 'N/A',
                order.extra?.tradeStatus || order.statusInfo?.text || 'N/A',
                payInfo.currencySymbol || 'N/A'
            ];

            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Display orders in a formatted table
     * @param {Array} orders - Orders to display (defaults to all orders)
     * @param {HTMLElement} container - Container element to display the table
     */
    displayOrdersTable(orders = null, container = null) {
        const orderList = orders || this.getMainOrders();
        const targetContainer = container || document.body;

        if (orderList.length === 0) {
            targetContainer.innerHTML = '<p>No orders found</p>';
            return;
        }

        const table = document.createElement('table');
        table.style.cssText = 'border-collapse: collapse; width: 100%; margin: 20px 0; font-family: Arial, sans-serif;';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Order ID', 'Date', 'Seller', 'Product', 'Price', 'Status'];
        
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.cssText = 'border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f2f2f2; font-weight: bold;';
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        
        orderList.forEach(order => {
            const row = document.createElement('tr');
            
            // Order ID
            const tdId = document.createElement('td');
            tdId.textContent = order.id || 'N/A';
            tdId.style.cssText = 'border: 1px solid #ddd; padding: 8px;';
            row.appendChild(tdId);

            // Date
            const tdDate = document.createElement('td');
            tdDate.textContent = order.orderInfo?.createDay || 'N/A';
            tdDate.style.cssText = 'border: 1px solid #ddd; padding: 8px;';
            row.appendChild(tdDate);

            // Seller
            const tdSeller = document.createElement('td');
            tdSeller.textContent = order.seller?.nick || 'N/A';
            tdSeller.style.cssText = 'border: 1px solid #ddd; padding: 8px;';
            row.appendChild(tdSeller);

            // Product
            const tdProduct = document.createElement('td');
            let productTitle = 'N/A';
            if (order.subOrders && order.subOrders.length > 0) {
                const firstItem = order.subOrders[0];
                if (firstItem.itemInfo && firstItem.itemInfo.title) {
                    productTitle = firstItem.itemInfo.title.length > 50 
                        ? firstItem.itemInfo.title.substring(0, 50) + '...'
                        : firstItem.itemInfo.title;
                }
            }
            tdProduct.textContent = productTitle;
            tdProduct.style.cssText = 'border: 1px solid #ddd; padding: 8px; max-width: 300px;';
            row.appendChild(tdProduct);

            // Price
            const tdPrice = document.createElement('td');
            tdPrice.textContent = order.payInfo?.actualFee ? `¥${order.payInfo.actualFee}` : 'N/A';
            tdPrice.style.cssText = 'border: 1px solid #ddd; padding: 8px; text-align: right;';
            row.appendChild(tdPrice);

            // Status
            const tdStatus = document.createElement('td');
            const status = order.extra?.tradeStatus || order.statusInfo?.text || 'N/A';
            tdStatus.textContent = status;
            tdStatus.style.cssText = 'border: 1px solid #ddd; padding: 8px;';
            row.appendChild(tdStatus);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        
        // Clear container and add table
        targetContainer.innerHTML = '';
        targetContainer.appendChild(table);
    }

    /**
     * Get detailed information about a specific order
     * @param {string} orderId - Order ID to get details for
     * @returns {Object|null} Order details or null if not found
     */
    getOrderDetails(orderId) {
        const orders = this.getMainOrders();
        return orders.find(order => order.id === orderId) || null;
    }

    /**
     * Search orders by keyword
     * @param {string} keyword - Keyword to search for
     * @returns {Array} Matching orders
     */
    searchOrders(keyword) {
        const orders = this.getMainOrders();
        const searchTerm = keyword.toLowerCase();
        
        return orders.filter(order => {
            // Search in order ID
            if (order.id && order.id.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Search in seller name
            if (order.seller && order.seller.nick && 
                order.seller.nick.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Search in shop name
            if (order.seller && order.seller.shopName && 
                order.seller.shopName.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Search in product titles
            if (order.subOrders) {
                for (const subOrder of order.subOrders) {
                    if (subOrder.itemInfo && subOrder.itemInfo.title && 
                        subOrder.itemInfo.title.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
            }
            
            return false;
        });
    }
}

// Usage examples:
/*
// Initialize the extractor
const extractor = new TaobaoOrderExtractor();

// Extract order data from the page
const orderData = extractor.extractOrderData();

if (orderData) {
    // Get all orders
    const allOrders = extractor.getMainOrders();
    console.log('Total orders:', allOrders.length);
    
    // Filter orders by status
    const pendingOrders = extractor.filterOrdersByStatus('WAIT_SELLER_SEND_GOODS');
    console.log('Pending orders:', pendingOrders.length);
    
    // Filter orders by date range
    const recentOrders = extractor.filterOrdersByDateRange('2025-08-01', '2025-08-31');
    console.log('Recent orders:', recentOrders.length);
    
    // Get order summary
    const summary = extractor.getOrderSummary();
    console.log('Order summary:', summary);
    
    // Search orders
    const searchResults = extractor.searchOrders('儿童');
    console.log('Search results:', searchResults.length);
    
    // Export to CSV
    const csvData = extractor.exportToCSV();
    console.log('CSV data:', csvData);
    
    // Display orders in a table
    extractor.displayOrdersTable(allOrders, document.getElementById('orders-container'));
}
*/

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaobaoOrderExtractor;
}
