exports.getComments = catchAsync(async (req, res, next) => {
  const { dealId } = req.params;
  const comments = await Comment.find({ deal: dealId, status: 'active' })
    .populate('user', 'username profilePicture')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: { comments }
  });
});

exports.createComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const { dealId } = req.params;
  const userId = req.user.id;

  const comment = await Comment.create({
    content,
    user: userId,
    deal: dealId
  });

  const populatedComment = await Comment.findById(comment._id).populate('user', 'username profilePicture');

  res.status(201).json({
    status: 'success',
    data: { comment: populatedComment }
  });
});