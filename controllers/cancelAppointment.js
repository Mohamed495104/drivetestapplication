// Cancel appointment (for drivers)
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.session.userId;

    console.log(
      `Cancel attempt - Appointment ID: ${appointmentId}, User ID: ${userId}`
    );

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify that this appointment belongs to the current user
    if (!appointment.driver || appointment.driver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own appointments",
      });
    }

    // Update the appointment to mark it as not booked and remove driver
    appointment.isBooked = false;
    appointment.driver = undefined;
    await appointment.save();

    // Remove the appointment reference from the user
    await User.findByIdAndUpdate(userId, {
      $pull: { appointments: appointmentId },
    });

    console.log("Appointment cancelled successfully");

    res.json({
      success: true,
      message: "Your appointment has been cancelled successfully",
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment: " + error.message,
    });
  }
};
