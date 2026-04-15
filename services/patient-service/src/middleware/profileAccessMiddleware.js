const authorizeProfileAccess = (req, res, next) => {
  const { user } = req;
  const { userId } = req.params;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if (user.role === 'admin' || user.role === 'doctor') {
    return next();
  }

  if (user.role === 'patient' && user.id === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden: you can only access your own patient profile'
  });
};

module.exports = authorizeProfileAccess;
