const Notification = require('../models/Notification.Model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getNotifications = catchAsync(async (req, res, next) => {
  console.log('Fetching notifications for user:', req.user.id);
  
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort('-createdAt')
    .limit(20);
  
  console.log('Fetched notifications:', notifications);

  res.status(200).json({
    status: 'success',
    data: { notifications }
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { read: true },  // Changed from isRead to read
    { new: true }
  );

  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { notification }
  });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
  console.log('Marking all notifications as read for user:', req.user.id);
  
  const updateResult = await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );
  
  console.log('Update result:', updateResult);
  
  const updatedNotifications = await Notification.find({ recipient: req.user.id })
    .sort('-createdAt')
    .limit(20);

  console.log('Updated notifications:', updatedNotifications);

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read',
    data: { notifications: updatedNotifications }
  });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });

  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});