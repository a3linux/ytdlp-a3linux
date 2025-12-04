// Enhanced Taobao Order Downloader with Page Change Detection
(function() {
    console.log('🚀 Starting Enhanced Taobao Order Downloader...');
    
    // Store all orders across pages
    if (!window.allOrders) {
        window.allOrders = [];
        window.currentPage = 1;
        window.lastDataHash = '';
    }
    
    // Function to create a hash of the current data to detect changes
    function createDataHash(data) {
        if (!data || !data.mainOrders) return '';
        return JSON.stringify(data.mainOrders.map(order => order.id)).slice(0, 100);
    }
    
    // Function to extract order data from the current page
    function extractOrderData() {
        try {
            // Look for the data variable in the page
            const scripts = document.querySelectorAll('script');
            let orderData = null;
            
            for (const script of scripts) {
                if (script.textContent.includes('var data = JSON.parse')) {
                    const match = script.textContent.match(/var data = JSON\.parse\('(.+?)'\)/);
                    if (match) {
                        const jsonString = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                        orderData = JSON.parse(jsonString);
                        break;
                    }
                }
            }
            
            if (!orderData || !orderData.mainOrders) {
                throw new Error('No order data found on this page');
            }
            
            return orderData;
        } catch (error) {
            console.error('Error extracting data:', error);
            return null;
        }
    }
    
    // Function to process and download orders
    function processOrders(orderData) {
        try {
            // Create hash of current data to check if it's new
            const currentDataHash = createDataHash(orderData);
            
            // Check if this is the same data as before
            if (currentDataHash === window.lastDataHash) {
                console.log('⚠️ Same data detected - page may not have updated yet');
                return false;
            }
            
            // Update the hash
            window.lastDataHash = currentDataHash;
            
            // Extract orders from current page
            const currentPageOrders = orderData.mainOrders.map(order => ({
                orderId: order.id || order.orderId || 'N/A',
                date: order.orderInfo?.createTime || order.createTime || order.date || 'N/A',
                seller: order.seller?.nick || order.sellerNick || order.seller || 'N/A',
                shopName: order.seller?.shopName || 'N/A',
                product: order.subOrders?.[0]?.itemInfo?.title || order.title || order.productName || 'N/A',
                quantity: order.subOrders?.[0]?.quantity || order.quantity || 1,
                price: order.payInfo?.actualFee || order.price || order.totalPrice || 'N/A',
                status: order.statusInfo?.text || order.statusText || order.status || 'N/A',
                currency: order.extra?.currency || 'CNY'
            }));
            
            // Add to global collection (avoid duplicates)
            const newOrders = currentPageOrders.filter(newOrder => 
                !window.allOrders.some(existingOrder => existingOrder.orderId === newOrder.orderId)
            );
            
            if (newOrders.length === 0) {
                console.log('⚠️ No new orders found on this page');
                return false;
            }
            
            window.allOrders = window.allOrders.concat(newOrders);
            
            console.log(`📄 Page ${window.currentPage}: Found ${newOrders.length} new orders`);
            console.log(`📊 Total orders collected: ${window.allOrders.length}`);
            
            // Create CSV content
            const csvContent = [
                ['Order ID', 'Date', 'Seller', 'Shop Name', 'Product', 'Quantity', 'Price', 'Status', 'Currency'],
                ...window.allOrders.map(order => [
                    order.orderId,
                    order.date,
                    order.seller,
                    order.shopName,
                    order.product,
                    order.quantity,
                    order.price,
                    order.status,
                    order.currency
                ])
            ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
            
            // Download CSV file
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `taobao_orders_page_${window.currentPage}_total_${window.allOrders.length}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            const message = document.createElement('div');
            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px;
                border-radius: 5px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;
            message.innerHTML = `
                ✅ Page ${window.currentPage} Downloaded!<br>
                📊 New Orders: ${newOrders.length}<br>
                📊 Total Orders: ${window.allOrders.length}<br>
                📁 File: taobao_orders_page_${window.currentPage}_total_${window.allOrders.length}.csv
            `;
            document.body.appendChild(message);
            
            // Auto-remove message after 5 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 5000);
            
            // Increment page counter
            window.currentPage++;
            
            console.log('✅ Download completed successfully!');
            return true;
            
        } catch (error) {
            console.error('❌ Error processing orders:', error.message);
            return false;
        }
    }
    
    // Main execution
    try {
        // Try to extract data immediately
        let orderData = extractOrderData();
        
        if (orderData) {
            if (processOrders(orderData)) {
                console.log('💡 Tip: Navigate to next page and run this script again to collect more orders');
            } else {
                console.log('💡 Tip: If you just navigated to a new page, wait a moment for the page to fully load, then run this script again');
            }
        } else {
            throw new Error('Could not extract order data from the page');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        errorMessage.innerHTML = `❌ Error: ${error.message}`;
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
    }
    
    // Add a helper function to manually refresh data
    window.refreshTaobaoData = function() {
        console.log('🔄 Manually refreshing data...');
        const orderData = extractOrderData();
        if (orderData) {
            processOrders(orderData);
        }
    };
    
    console.log('💡 Helper function added: window.refreshTaobaoData() - use this if the page seems stuck');
    
})();
