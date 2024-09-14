const axios = require('axios');
const cheerio = require('cheerio');

class ImageFetcherService {
	async fetchImageUrl(url) {
		console.log(`Fetching image URL for: ${url}`);
		
		if (url.includes('amazon')) {
			return this.fetchAmazonImageUrl(url);
		}
		
		try {
			const response = await axios.get(url);
			const $ = cheerio.load(response.data);
			
			let imageUrl = $('meta[property="og:image"]').attr('content');
			
			if (!imageUrl) {
				imageUrl = $('img').first().attr('src');
			}
			
			if (imageUrl && !imageUrl.startsWith('http')) {
				const baseUrl = new URL(url).origin;
				imageUrl = new URL(imageUrl, baseUrl).href;
			}

			console.log('Image URL found:', imageUrl);
			return imageUrl;
		} catch (error) {
			console.error('Error fetching image URL:', error.message);
			return null;
		}
	}

	fetchAmazonImageUrl(url) {
		const asin = this.extractAmazonASIN(url);
		if (asin) {
			const imageUrl = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCRM_.jpg`;
			console.log('Amazon image URL constructed:', imageUrl);
			return imageUrl;
		}
		console.error('Could not extract ASIN from Amazon URL');
		return null;
	}

	extractAmazonASIN(url) {
		const match = url.match(/\/dp\/(\w{10})/);
		return match ? match[1] : null;
	}
}

module.exports = ImageFetcherService;