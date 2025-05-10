const User = require('../models/user');

module.exports = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.render('G_Page', { error: 'User not found', userType: req.session.userType });
    }

    res.render('G_Page', { user, userType: req.session.userType });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.render('G_Page', { error: 'Error fetching user data', userType: req.session.userType });
  }
};
