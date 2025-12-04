// Nuclear Taobao Order Downloader - Bypasses ALL caching issues
(function() {
    console.log('☢️ Starting Nuclear Taobao Order Downloader...');
    
    // Store all orders across pages
    if (!window.allOrders) {
        window.allOrders = [];
        window.currentPage = 1;
    }
    
    // Function to completely bypass cache and get fresh data
    function nuclearDataExtraction() {
        console.log('☢️ Using nuclear extraction method...');
        
        try {
            // Method 1: Try to find data in DOM elements first
            let orderData = extractFromDOM();
            
            if (!orderData) {
                // Method 2: Try to find data in script tags
                orderData = extractFromScripts();
            }
            
            if (!orderData) {
                // Method 3: Try to find data in global variables
                orderData = extractFromGlobalVars();
            }
            
            if (!orderData) {
                // Method 4: Try to find data in network requests
                orderData = extractFromNetwork();
            }
            
            if (!orderData) {
                throw new Error('All extraction methods failed - page may not be fully loaded');
            }
            
            return orderData;
            
        } catch (error) {
            console.error('Nuclear extraction failed:', error);
            return null;
        }
    }
    
    // Method 1: Extract from DOM elements
    function extractFromDOM() {
        console.log('🔍 Method 1: Extracting from DOM elements...');
        
        try {
            // Look for order containers in the DOM
            const orderElements = document.querySelectorAll('[class*="order"], [class*="item"], [class*="trade"]');
            
            if (orderElements.length === 0) {
                console.log('No order elements found in DOM');
                return null;
            }
            
            console.log(`Found ${orderElements.length} potential order elements`);
            
            // Try to extract order information from DOM
            const orders = [];
            orderElements.forEach((element, index) => {
                try {
                    // Look for common order data patterns
                    const orderId = element.querySelector('[class*="id"], [class*="order"]')?.textContent?.trim();
                    const title = element.querySelector('[class*="title"], [class*="name"]')?.textContent?.trim();
                    const price = element.querySelector('[class*="price"], [class*="fee"]')?.textContent?.trim();
                    const status = element.querySelector('[class*="status"]')?.textContent?.trim();
                    
                    if (orderId || title) {
                        orders.push({
                            id: orderId || `DOM_${index}`,
                            title: title || 'Unknown Product',
                            price: price || 'N/A',
                            status: status || 'N/A'
                        });
                    }
                } catch (e) {
                    // Skip this element if it fails
                }
            });
            
            if (orders.length > 0) {
                console.log(`Extracted ${orders.length} orders from DOM`);
                return { mainOrders: orders };
            }
            
        } catch (error) {
            console.log('DOM extraction failed:', error.message);
        }
        
        return null;
    }
    
    // Method 2: Extract from script tags (original method)
    function extractFromScripts() {
        console.log('🔍 Method 2: Extracting from script tags...');
        
        try {
            const scripts = document.querySelectorAll('script');
            let orderData = null;
            
            for (const script of scripts) {
                if (script.textContent.includes('var data = JSON.parse')) {
                    const match = script.textContent.match(/var data = JSON\.parse\('(.+?)'\)/);
                    if (match) {
                        const jsonString = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                        orderData = JSON.parse(jsonString);
                        console.log('Found data in script tag');
                        break;
                    }
                }
            }
            
            return orderData;
            
        } catch (error) {
            console.log('Script extraction failed:', error.message);
            return null;
        }
    }
    
    // Method 3: Extract from global variables
    function extractFromGlobalVars() {
        console.log('🔍 Method 3: Extracting from global variables...');
        
        try {
            // Check if data is available in global scope
            if (window.data && window.data.mainOrders) {
                console.log('Found data in global window.data');
                return window.data;
            }
            
            // Check other common variable names
            const possibleVars = ['orderData', 'taobaoData', 'tradeData', 'boughtData'];
            for (const varName of possibleVars) {
                if (window[varName] && window[varName].mainOrders) {
                    console.log(`Found data in global window.${varName}`);
                    return window[varName];
                }
            }
            
        } catch (error) {
            console.log('Global variable extraction failed:', error.message);
        }
        
        return null;
    }
    
    // Method 4: Extract from network requests
    function extractFromNetwork() {
        console.log('🔍 Method 4: Extracting from network requests...');
        
        try {
            // This is a fallback - we can't actually intercept network requests from console
            // But we can check if there are any recent XHR requests
            console.log('Network extraction not available from console - this is informational only');
            
        } catch (error) {
            console.log('Network extraction failed:', error.message);
        }
        
        return null;
    }
    
    // Function to process and download orders
    function processOrders(orderData) {
        try {
            // Extract orders from current page
            const currentPageOrders = orderData.mainOrders.map(order => ({
                orderId: order.id || order.orderId || 'N/A',
                date: order.orderInfo?.createTime || order.createTime || order.date || new Date().toISOString(),
                seller: order.seller?.nick || order.sellerNick || order.seller || 'N/A',
                shopName: order.seller?.shopName || 'N/A',
                product: order.subOrders?.[0]?.itemInfo?.title || order.title || order.productName || order.title || 'N/A',
                quantity: order.subOrders?.[0]?.quantity || order.quantity || 1,
                price: order.payInfo?.actualFee || order.price || order.totalPrice || order.price || 'N/A',
                status: order.statusInfo?.text || order.statusText || order.status || order.status || 'N/A',
                currency: order.extra?.currency || 'CNY'
            }));
            
            // Add to global collection (avoid duplicates)
            const newOrders = currentPageOrders.filter(newOrder => 
                !window.allOrders.some(existingOrder => existingOrder.orderId === newOrder.orderId)
            );
            
            if (newOrders.length === 0) {
                console.log('⚠️ No new orders found - this might be the same page data');
                console.log('💡 Try the nuclear refresh option below');
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
        console.log('☢️ Starting nuclear data extraction...');
        
        // Try nuclear extraction
        let orderData = nuclearDataExtraction();
        
        if (orderData) {
            if (processOrders(orderData)) {
                console.log('💡 Tip: Navigate to next page and run this script again to collect more orders');
            } else {
                console.log('💡 Tip: If you just navigated to a new page, wait a moment for the page to fully load, then run this script again');
            }
        } else {
            throw new Error('All extraction methods failed - page may not be fully loaded');
        }
        
    } catch (error) {
        console.error('❌ Nuclear extraction failed:', error.message);
        
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
        errorMessage.innerHTML = `❌ Nuclear extraction failed: ${error.message}`;
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
    }
    
    // Add nuclear helper functions
    window.nuclearRefreshTaobao = function() {
        console.log('☢️ Nuclear refresh - completely reloading page...');
        // Clear all caches and reload
        if (window.caches) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        // Force reload with cache clearing
        window.location.reload(true);
    };
    
    window.nuclearExtractTaobao = function() {
        console.log('☢️ Nuclear extraction - trying all methods again...');
        const orderData = nuclearDataExtraction();
        if (orderData) {
            processOrders(orderData);
        }
    };
    
    window.manualTaobaoExtract = function() {
        console.log('🔧 Manual extraction - you can manually inspect the page...');
        console.log('💡 Check the Network tab in DevTools for API calls');
        console.log('💡 Look for XHR requests to trade/itemlist endpoints');
        console.log('💡 Check if there are any global variables with order data');
    };
    
    console.log('☢️ Nuclear helper functions added:');
    console.log('   - window.nuclearRefreshTaobao() - Nuclear page refresh');
    console.log('   - window.nuclearExtractTaobao() - Nuclear data extraction');
    console.log('   - window.manualTaobaoExtract() - Manual inspection guide');
    
})();
