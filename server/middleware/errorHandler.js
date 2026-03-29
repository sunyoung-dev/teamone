function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'FILE_WRITE_ERROR') {
    return res.status(500).json({
      success: false,
      error: { code: 'FILE_WRITE_ERROR', message: err.message }
    });
  }

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' }
  });
}

module.exports = errorHandler;
