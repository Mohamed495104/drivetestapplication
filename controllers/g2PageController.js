const User = require('../models/user');
const Appointment = require('../models/appointment');

module.exports = async (req, res) => {
    try {
        if (!req.session.userId) return res.redirect('/login');

        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/login');

        // Get available G2 test slots (not booked and future dates)
        const availableSlots = await Appointment.find({
            isBooked: false,
            testType: 'G2',
            date: { $gte: new Date().setHours(0, 0, 0, 0) }
        }).sort({ date: 1, time: 1 });

        // Format user data for form
        const modifiedUser = {
            ...user._doc,
            firstname: user.firstname === "default" ? "" : user.firstname,
            lastname: user.lastname === "default" ? "" : user.lastname,
            age: user.age === "default" ? "" : user.age,
            LicenseNo: user.LicenseNo.startsWith("default-") ? "" : user.LicenseNo,
            car_details: {
                make: user.car_details.make === "default" ? "" : user.car_details.make,
                model: user.car_details.model === "default" ? "" : user.car_details.model,
                year: user.car_details.year === "0" ? "" : user.car_details.year,
                platno: user.car_details.platno === "default" ? "" : user.car_details.platno
            }
        };

        res.render('G2_Page', {
            user: modifiedUser,
            isDefaultData: user.LicenseNo.startsWith("default-"),
            userType: req.session.userType,
            availableSlots: availableSlots || []
        });
    } catch (error) {
        console.error('Error in g2PageController:', error);
        res.status(500).render('error', {
            message: 'Error loading G2 page',
            error: error
        });
    }
};