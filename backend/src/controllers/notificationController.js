const Notification = require('../models/Notification.Model');
const catchAsync = require('../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort('-createdAt')
    .limit(20);
  res.status(200).json({
    status: 'success',
    data: { notifications }
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.status(200).json({
    status: 'success',
    message: 'Notification marked as read'
  });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany({ recipient: req.user.id }, { isRead: true });
  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});