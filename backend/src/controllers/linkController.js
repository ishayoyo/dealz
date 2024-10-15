const affiliateLinkService = require('../services/affiliateLinkService');
const catchAsync = require('../utils/catchAsync');

exports.handleOutgoingLink = catchAsync(async (req, res, next) => {
  const { url } = req.query;
  const { dealId, userId } = req.body;

  if (!url) {
    return res.status(400).json({ status: 'error', message: 'URL parameter is required' });
  }

  const { processedUrl } = await affiliateLinkService.processLink(url, dealId, userId);

  res.redirect(processedUrl);
});
