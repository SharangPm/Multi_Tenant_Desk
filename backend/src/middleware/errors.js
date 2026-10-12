export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}
export function errors(err, req, res, next) {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that email exists' });
  }
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Server error'
      : err.message || 'Server error';
  res.status(status).json({ message });
}
