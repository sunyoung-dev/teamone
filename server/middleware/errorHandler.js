function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] SERVER ERROR`);
  console.error(`  ${req.method} ${req.originalUrl}`);
  console.error(`  ${err.name || 'Error'}: ${err.message}`);
  if (err.stack) console.error(err.stack);

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
