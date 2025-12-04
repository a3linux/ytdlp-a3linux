// Simple Taobao Order Downloader - Just run this one script!
(function() {
    console.log('🚀 Starting Taobao Order Downloader...');
    
    try {
        // Find the order data
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
        
        const orders = orderData.mainOrders;
        console.log(`✅ Found ${orders.length} orders!`);
        
        // Create CSV data
        const csvRows = [
            ['Order ID', 'Date', 'Seller', 'Shop Name', 'Product', 'Quantity', 'Price', 'Status', 'Currency']
        ];
        
        orders.forEach(order => {
            const orderInfo = order.orderInfo || {};
            const seller = order.seller || {};
            const payInfo = order.payInfo || {};
            
            // Get product info
            let productTitle = 'N/A';
            let quantity = 'N/A';
            
            if (order.subOrders && order.subOrders.length > 0) {
                const firstItem = order.subOrders[0];
                if (firstItem.itemInfo) {
                    productTitle = firstItem.itemInfo.title || 'N/A';
                    quantity = firstItem.quantity || 'N/A';
                }
            }
            
            csvRows.push([
                order.id || 'N/A',
                orderInfo.createDay || 'N/A',
                seller.nick || 'N/A',
                seller.shopName || 'N/A',
                `"${productTitle.replace(/"/g, '""')}"`,
                quantity,
                payInfo.actualFee || 'N/A',
                order.extra?.tradeStatus || order.statusInfo?.text || 'N/A',
                payInfo.currencySymbol || 'N/A'
            ]);
        });
        
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `taobao_orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #28a745; color: white; padding: 15px; 
            border-radius: 8px; z-index: 10000; font-family: Arial;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        successDiv.innerHTML = `
            ✅ <strong>Download Complete!</strong><br>
            ${orders.length} orders exported to CSV
        `;
        document.body.appendChild(successDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 5000);
        
        console.log('🎉 CSV file downloaded successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #dc3545; color: white; padding: 15px; 
            border-radius: 8px; z-index: 10000; font-family: Arial;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            ❌ <strong>Download Failed!</strong><br>
            ${error.message}
        `;
        errorDiv.parentNode.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
})();
