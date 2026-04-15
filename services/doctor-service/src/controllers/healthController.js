const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'doctor-service',
    message: 'Service is healthy'
  });
};

module.exports = {
  healthCheck
};
