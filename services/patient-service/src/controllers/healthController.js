const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'patient-service',
    message: 'Service is healthy'
  });
};

module.exports = {
  healthCheck
};
