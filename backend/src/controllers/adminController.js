const User = require('../models/User.Model');
const Deal = require('../models/Deal.Model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const NotificationService = require('../services/NotificationService');
const Comment = require('../models/Comment.Model');
const AffiliateClick = require('../models/AffiliateClick.Model');

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password');
  res.status(200).json({
    status: 'success',
    data: { users }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getDeals = catchAsync(async (req, res, next) => {
  const deals = await Deal.find()
    .populate('user', 'username')
    .sort('-createdAt');

  // Add the full image URL to each deal
  const dealsWithImageUrls = deals.map(deal => {
    const dealObj = deal.toObject();
    if (dealObj.image) {
      dealObj.image = `${process.env.BASE_URL}/images/${dealObj.image}`;
    }
    return dealObj;
  });

  res.status(200).json({
    status: 'success',
    data: { deals: dealsWithImageUrls }
  });
});

exports.deleteDeal = catchAsync(async (req, res, next) => {
  const deal = await Deal.findByIdAndDelete(req.params.id);
  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.moderateDeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const deal = await Deal.findByIdAndUpdate(id, { status }, { new: true }).populate('user', 'username');

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  const io = req.app.get('io');
  if (status === 'approved') {
    io.emit('newDeal', { deal, status: 'approved' });
    
    // Create a notification for the deal owner
    const notificationService = new NotificationService(io);
    await notificationService.createDealApprovalNotification(deal.user._id, deal._id, deal.title);
  }

  res.status(200).json({
    status: 'success',
    data: { deal }
  });
});

exports.getAnalytics = catchAsync(async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDeals = await Deal.countDocuments();
    const pendingDeals = await Deal.countDocuments({ status: 'pending' });
    const totalComments = await Comment.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalDeals,
        pendingDeals,
        totalComments
      }
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching analytics'
    });
  }
});

exports.getDealsChartData = catchAsync(async (req, res, next) => {
  const last30Days = [...Array(30)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dealsData = await Deal.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(last30Days[0]) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ])

  const chartData = last30Days.map(date => ({
    date,
    count: dealsData.find(d => d._id === date)?.count || 0
  }))

  res.status(200).json({
    status: 'success',
    data: {
      labels: chartData.map(d => d.date),
      values: chartData.map(d => d.count)
    }
  })
});

exports.getUsersChartData = catchAsync(async (req, res, next) => {
  try {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const usersData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(last30Days[0]) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartData = last30Days.map(date => ({
      date,
      count: usersData.find(d => d._id === date)?.count || 0
    }));

    res.status(200).json({
      status: 'success',
      data: {
        labels: chartData.map(d => d.date),
        values: chartData.map(d => d.count)
      }
    });
  } catch (error) {
    console.error('Error in getUsersChartData:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching users chart data'
    });
  }
});

exports.getRecentActivities = catchAsync(async (req, res, next) => {
  const activities = await Promise.all([
    Deal.find().sort('-createdAt').limit(5).populate('user', 'username'),
    Comment.find().sort('-createdAt').limit(5).populate('user', 'username').populate('deal', 'title'),
    User.find().sort('-createdAt').limit(5)
  ])

  const [recentDeals, recentComments, recentUsers] = activities

  const formattedActivities = [
    ...recentDeals.map(deal => ({
      _id: deal._id,
      description: `New deal "${deal.title}" created by ${deal.user.username}`,
      createdAt: deal.createdAt
    })),
    ...recentComments.map(comment => ({
      _id: comment._id,
      description: `New comment on deal "${comment.deal.title}" by ${comment.user.username}`,
      createdAt: comment.createdAt
    })),
    ...recentUsers.map(user => ({
      _id: user._id,
      description: `New user registered: ${user.username}`,
      createdAt: user.createdAt
    }))
  ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10)

  res.status(200).json({
    status: 'success',
    data: {
      activities: formattedActivities
    }
  })
})

exports.getPendingDeals = catchAsync(async (req, res, next) => {
  const pendingDeals = await Deal.find({ status: 'pending' })
    .sort('-createdAt')
    .populate('user', 'username')
    .limit(10)

  res.status(200).json({
    status: 'success',
    data: {
      deals: pendingDeals
    }
  })
});

exports.editDeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, price, category, image } = req.body;

  const deal = await Deal.findByIdAndUpdate(
    id,
    { title, description, price, category, image },
    { new: true, runValidators: true }
  ).populate('user', 'username');

  if (!deal) {
    return next(new AppError('No deal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { deal }
  });
});

exports.getAffiliateStats = async (req, res) => {
  try {
    const totalClicks = await AffiliateClick.countDocuments();
    const clicksOverTime = await AffiliateClick.aggregate([
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalClicks,
      clicksOverTime: clicksOverTime.map(item => ({ date: item._id, count: item.count }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching affiliate statistics', error });
  }
};
