const User = require('../models/user');
const bcrypt = require('bcrypt');

module.exports = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.render('login', { 
                error: 'Username not found. Please sign up first.',
                username: username // Preserve entered username
            });
        }

        // Compare passwords using async/await instead of callback
        const passwordMatch = await bcrypt.compare(password.trim(), user.password);

        if (!passwordMatch) {
            return res.render('login', { 
                error: 'Invalid password. Please try again.',
                username: username // Preserve entered username
            });
        }

        // Store user session
        req.session.userId = user._id;
        req.session.userType = user.userType;
        req.session.username = user.username; // Store username in session if needed
        console.log(`User logged in: ${user.username} (${user.userType})`);

        // Redirect based on user type
        switch(user.userType) {
            case 'Driver':
                return res.redirect('/G2_Page');
            case 'Examiner':
                return res.redirect('/examiner'); 
            case 'Admin':
                return res.redirect('/appointment');
            default:
                return res.redirect('/');
        }

    } catch (error) {
        console.error('Login error:', error);
        return res.render('login', { 
            error: 'An error occurred during login. Please try again.',
            username: username // Preserve entered username on error
        });
    }
};