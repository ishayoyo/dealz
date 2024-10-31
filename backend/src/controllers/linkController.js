const affiliateLinkService = require('../services/affiliateLinkService');
const catchAsync = require('../utils/catchAsync');

exports.handleOutgoingLink = catchAsync(async (req, res, next) => {
  const { url, dealId } = req.query;
  const userId = req.user ? req.user._id : null;

  if (!url) {
    return res.status(400).json({ status: 'error', message: 'URL parameter is required' });
  }

  const { processedUrl } = await affiliateLinkService.processLink(url, dealId, userId);

  console.log('Redirecting to:', processedUrl);
  res.redirect(processedUrl);
});
