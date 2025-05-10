const adminMiddleware = (req, res, next) => {
  if (req.session.userType !== 'Admin') {
    return res.redirect('/login');
  }
  next();
};

const driverMiddleware = (req, res, next) => {
  if (req.session.userType !== 'Driver') {
    return res.redirect('/login');
  }
  next();
};

const examinerMiddleware = (req, res, next) => {
  if (req.session.userType !== 'Examiner') {
    return res.redirect('/login');
  }
  next();
};

const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  driverMiddleware,
  examinerMiddleware
};