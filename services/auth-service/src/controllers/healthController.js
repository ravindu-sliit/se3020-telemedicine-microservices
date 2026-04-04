const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'auth-service',
    message: 'Service is healthy'
  });
};

module.exports = {
  healthCheck
};
