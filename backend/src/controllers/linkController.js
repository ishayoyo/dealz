const affiliateLinkService = require('../services/affiliateLinkService');
const catchAsync = require('../utils/catchAsync');

exports.handleOutgoingLink = catchAsync(async (req, res, next) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: 'error', message: 'URL parameter is required' });
  }

  const processedUrl = await affiliateLinkService.processLink(url);

  res.redirect(processedUrl);
});