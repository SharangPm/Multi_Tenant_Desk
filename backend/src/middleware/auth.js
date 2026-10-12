import jwt from 'jsonwebtoken';
export function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    );
    next();
  } catch {
    res.status(401).json({ message: 'Authentication required' });
  }
}
export const allow =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ message: 'Access denied' });
export const tenant = (req, res, next) => {
  req.organizationId = req.user.organizationId;
  next();
};
