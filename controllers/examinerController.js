const Appointment = require('../models/appointment');
const User = require('../models/user');

module.exports = {
    dashboard: async (req, res) => {
        try {
            const drivers = await User.find({
                userType: 'Driver',
                'appointments.0': { $exists: true }
            }).populate('appointments');

            res.render('examiner/dashboard', {
                drivers,
                filteredTestType: null,
                userType: req.session.userType,
                loggedIn: true
            });
        } catch (error) {
            console.error("Error fetching drivers:", error);
            res.status(500).render('error', {
                message: 'Error loading examiner dashboard',
                error
            });
        }
    },

    filterByTestType: async (req, res) => {
        try {
            const drivers = await User.find({
                userType: 'Driver',
                testType: req.params.testType,
                'appointments.0': { $exists: true }
            }).populate('appointments');

            res.render('examiner/dashboard', {
                drivers,
                filteredTestType: req.params.testType,
                userType: req.session.userType,
                loggedIn: true
            });
        } catch (error) {
            console.error("Error filtering drivers:", error);
            res.status(500).render('error', {
                message: 'Error filtering drivers',
                error
            });
        }
    },

    viewDriver: async (req, res) => {
        try {
            const driver = await User.findById(req.params.id)
                .populate('appointments')
                .populate('testResult.examiner');

            if (!driver) {
                return res.status(404).render('error', {
                    message: 'Driver not found'
                });
            }

            res.render('examiner/driverDetails', {
                driver,
                userType: req.session.userType,
                loggedIn: true
            });
        } catch (error) {
            console.error("Error fetching driver details:", error);
            res.status(500).render('error', {
                message: 'Error loading driver details',
                error
            });
        }
    },

    submitTestResult: async (req, res) => {
        try {
            const { driverId, passed, comments } = req.body;
            
            await User.findByIdAndUpdate(driverId, {
                'testResult.passed': passed === 'true',
                'testResult.comments': comments,
                'testResult.examiner': req.session.userId,
                'testResult.date': new Date()
            });

            req.flash('success', 'Test results submitted successfully');
            res.redirect('/examiner');
        } catch (error) {
            console.error("Error submitting test results:", error);
            req.flash('error', 'Failed to submit test results');
            res.redirect(`/examiner/driver/${driverId}`);
        }
    }
};