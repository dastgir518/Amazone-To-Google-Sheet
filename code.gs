/**
 * Fetches Keepa data for a LEGO set number and returns key product info for multiple products.
 * @param {string} setNo The LEGO set number.
 * @return {Array} Array of product info: [ASIN, Best FBA Price, Buy Box Price, 30d Avg Price, Reference Price, Sales Rank, Est. Sales/Month]
 * @customfunction
 */
function GET_LEGO_KEEPA_DATA(setNo) {
	if (!setNo) return [["No set number provided"]];
	var allResults = manger(setNo);
	if (allResults.length > 0 && allResults[0].price !== null) {
		var firstObj = allResults[0];
		var priceWithIncrease = firstObj.price * 1.05; // Add 5%
		return [[firstObj.asin, priceWithIncrease, firstObj.type]];
	} else {
		return [[allResults[0].type || "No price data found", "", ""]];
	}
}


function manger(setNo) {
	if (!setNo) return [{ price: null, asin: null, type: "No set number provided", priority: 99 }];
	var allResults = [];
	var apiKey = 'YOUR API KEY';
	var products = [];
	try {
		var searchUrl = "https://api.keepa.com/search?key=" + apiKey + "&domain=3&type=product&term=LEGO+" + encodeURIComponent(setNo);
		var searchResp = UrlFetchApp.fetch(searchUrl);
		var searchData = JSON.parse(searchResp.getContentText());
		products = searchData.products || [];
		for (var i = 0; i < products.length; i++) {
			var product = products[i];
			// Buy Box
			if (product.csv && product.csv[18] && product.csv[18].length > 0) {
				var lastBuyBox = product.csv[18][product.csv[18].length - 1];
				if (lastBuyBox !== -1) {
					allResults.push({ price: lastBuyBox / 100, asin: product.asin, type: "Latest Buy Box", priority: 1 });
					continue;
				}
			}
			// New FBA
			if (product.csv && product.csv[10] && product.csv[10].length > 0) {
				var newfbprice = product.csv[10][product.csv[10].length - 1];
				if (newfbprice !== -1) {
					allResults.push({ price: newfbprice / 100, asin: product.asin, type: "New FBA Price", priority: 2 });
					continue;
				}
			}
			// New Amazon
			if (product.csv && product.csv[1] && product.csv[1].length > 0) {
				var newamazonprice = product.csv[1][product.csv[1].length - 1];
				if (newamazonprice !== -1) {
					allResults.push({ price: newamazonprice / 100, asin: product.asin, type: "New Amazon Price", priority: 3 });
				}
			}
		}
	} catch (error) {
		Logger.log('Fetch error: ' + error);
		allResults.push({ price: null, asin: null, type: "API error: " + error.toString(), priority: 99 });
	}
	return allResults.length > 0 ? allResults : [{ price: null, asin: null, type: "No data found", priority: 99 }];
}
  
