document.addEventListener("DOMContentLoaded", function () {
  // Determine test type based on the current page
  const isGTest = window.location.pathname.includes("G_Page");
  const testType = isGTest ? "G" : "G2";
  const apiEndpoint = isGTest ? "/api/g-slots" : "/api/g2-slots";
  const bookingEndpoint = isGTest
    ? "/appointment/book-g"
    : "/appointment/book-g2";

  console.log(`Booking page initialized for ${testType} test`);
  console.log(`Using API endpoint: ${apiEndpoint}`);
  console.log(`Using booking endpoint: ${bookingEndpoint}`);

  // Date filter functionality
  const dateFilter = document.getElementById("slotDateFilter");
  if (dateFilter) {
    dateFilter.addEventListener("change", function () {
      const selectedDate = this.value;
      if (selectedDate) {
        fetchAvailableSlots(selectedDate);
      }
    });
  }

  // Set today's date as default for the filter
  if (dateFilter) {
    const today = new Date().toISOString().split("T")[0];
    dateFilter.value = today;
    fetchAvailableSlots(today); // Load today's slots by default
  }

  // Initial setup for booking buttons
  setupBookingButtons();

  // Function to fetch available slots for a date
  function fetchAvailableSlots(date) {
    fetch(`${apiEndpoint}?date=${date}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((slots) => {
        updateSlotsDisplay(slots);
      })
      .catch((error) => {
        console.error("Error fetching slots:", error);
        document.getElementById(
          "slotsContainer"
        ).innerHTML = `<div class="alert alert-danger">Error loading available slots: ${error.message}</div>`;
      });
  }

  // Function to update the slots display with fetched data
  function updateSlotsDisplay(slots) {
    const container = document.getElementById("slotsContainer");

    if (!slots || slots.length === 0) {
      container.innerHTML = `
                <div class="alert alert-info">
                    No available ${testType} test slots for this date. Please try another date.
                </div>
            `;
      return;
    }

    // Build the HTML for the slots
    let html = `<div class="row row-cols-1 row-cols-md-3 g-4">`;

    slots.forEach((slot) => {
      const slotDate = new Date(slot.date).toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      html += `
                <div class="col">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${slotDate}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${
                              slot.time
                            }</h6>
                            <button class="btn btn-primary book-slot-btn" 
                                    data-id="${slot._id}"
                                    data-date="${
                                      new Date(slot.date)
                                        .toISOString()
                                        .split("T")[0]
                                    }"
                                    data-time="${slot.time}">
                                Book This Slot
                            </button>
                        </div>
                    </div>
                </div>
            `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Reattach event listeners to the new buttons
    setupBookingButtons();
  }

  // Function to setup event listeners for booking buttons
  function setupBookingButtons() {
    const bookingButtons = document.querySelectorAll(".book-slot-btn");

    bookingButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const slotId = this.getAttribute("data-id");
        bookAppointment(slotId);
      });
    });
  }

  // Function to send booking request
  function bookAppointment(appointmentId) {
    // First confirm with the user
    if (!confirm(`Are you sure you want to book this ${testType} test slot?`)) {
      return;
    }

    // Send the booking request
    fetch(bookingEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointmentId: appointmentId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Add success alert
          const alerts = document.getElementById("booking-alerts");
          alerts.innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        ${data.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;

          // Refresh available slots
          const dateFilter = document.getElementById("slotDateFilter");
          if (dateFilter && dateFilter.value) {
            fetchAvailableSlots(dateFilter.value);
          }

          // Redirect to my appointments page after a delay
          setTimeout(() => {
            window.location.href = "/my-appointments";
          }, 2000);
        } else {
          // Add error alert
          const alerts = document.getElementById("booking-alerts");
          alerts.innerHTML = `
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        ${data.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
        }
      })
      .catch((error) => {
        console.error("Error booking appointment:", error);
        const alerts = document.getElementById("booking-alerts");
        alerts.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    An error occurred while booking your appointment. Please try again.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
      });
  }
});
