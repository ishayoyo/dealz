const ImageFetcherService = require('./services/imageFetcherService');

async function testImageFetcher() {
  const testUrls = [
    'https://he.aliexpress.com/item/1005004763702938.html?spm=a2g0o.tm1000007309.2459882340.dundefined.54f76f3dyxh01R&pdp_ext_f=%7B%22ship_from%22:%22CN%22,%22sku_id%22:%2212000035244868987%22%7D&pdp_npi=4%40dis%21ILS%21%E2%82%AA%20114.34%21%E2%82%AA%2038.08%21%21%2129.97%219.98%21%402103085c17263319782914988ed468%2112000035244868987%21gdf%21IL%211657335144%21X&aecmd=true',
    'https://www.amazon.co.uk/Columbia-Classics-Collection-Blu-ray-Region/dp/B0DBH9NKMN/ref=sr_1_1?crid=YXGIJLRSHTSV&dib=eyJ2IjoiMSJ9.44NZBkQ3nrt6hHgj1dycKlkV8A9kw8aakrdJYBmvrGDjrwjmr2VkQidqe1p5P5uJAANn9p8QKQvL6DPOO9Y89HxCGwVFSDiINmtrNmrXSfsTkooFQn2Eq7Umhd8AScCG6-vJPgrmLiGRbWTF77xkXyKMlh6X5PDMNyReZNgGPCMDE3yf-L-9qfL4adQeBaAB.I72NBnAR_XQvXPS1F81_V25PF-7F-mUFAuW7EG9B4Rc&dib_tag=se&keywords=columbia+classics+4k+volume+5&qid=1726332076&sprefix=columbia%2Caps%2C158&sr=8-1',
    'https://www.ebay.com/itm/334109845538?_trksid=p4375194.c101800.m5481',
    'https://www.lastprice.co.il/p/100004176/%D7%9E%D7%99%D7%A7%D7%A1%D7%A8%2D%D7%9E%D7%A7%D7%A6%D7%95%D7%A2%D7%99%2D4.8%2D%D7%9C%D7%99%D7%98%D7%A8%2DKitchenAid/KitchenAid-Artisan%2D5KSM125EAC%2D%D7%A9%D7%A7%D7%93'
  ];

  const imageFetcher = new ImageFetcherService();

  for (const url of testUrls) {
    console.log(`\nTesting URL: ${url}`);
    try {
      const imageUrl = await imageFetcher.fetchImageUrl(url);
      console.log('Image URL:', imageUrl);
    } catch (error) {
      console.error('Error fetching image URL:', error.message);
    }
    console.log('-------------------');
  }
}

testImageFetcher();