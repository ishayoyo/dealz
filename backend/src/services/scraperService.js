const puppeteer = require('puppeteer');

exports.scrapeAliExpressProduct = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    const productData = await page.evaluate(() => {
      const title = document.querySelector('.product-title-text')?.textContent.trim();
      const price = document.querySelector('.product-price-value')?.textContent.trim();
      const imageUrl = document.querySelector('.magnifier-image')?.src;

      return { title, price, imageUrl };
    });

    return productData;
  } catch (error) {
    console.error('Error scraping product:', error);
    throw new Error('Failed to scrape product data');
  } finally {
    await browser.close();
  }
};