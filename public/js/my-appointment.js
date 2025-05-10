document.addEventListener("DOMContentLoaded", function () {
  // Modal initialization and event listeners
  const cancelModal = document.getElementById("cancelModal");

  if (cancelModal) {
    cancelModal.addEventListener("show.bs.modal", function (event) {
      // Button that triggered the modal
      const button = event.relatedTarget;

      // Extract data attributes
      const appointmentId = button.getAttribute("data-id");
      const date = button.getAttribute("data-date");
      const time = button.getAttribute("data-time");
      const type = button.getAttribute("data-type");
      const isWithin24Hours = button.getAttribute("data-within-24") === "true";

      // Update modal content
      document.getElementById("modal-date").textContent = date;
      document.getElementById("modal-time").textContent = time;
      document.getElementById("modal-type").textContent = type;

      // Show warning if within 24 hours
      const warningMessage = document.getElementById("warning-message");
      if (isWithin24Hours) {
        warningMessage.classList.remove("d-none");
      } else {
        warningMessage.classList.add("d-none");
      }

      // Set appointment ID for the confirm button
      const confirmButton = document.getElementById("confirm-cancel");
      confirmButton.setAttribute("data-id", appointmentId);
    });
  }

  // Confirm cancel button event listener
  const confirmCancelButton = document.getElementById("confirm-cancel");
  if (confirmCancelButton) {
    confirmCancelButton.addEventListener("click", function () {
      const appointmentId = this.getAttribute("data-id");
      cancelAppointment(appointmentId);
    });
  }

  // Function to send the cancel appointment request
  function cancelAppointment(appointmentId) {
    // Show loading state
    const confirmButton = document.getElementById("confirm-cancel");
    const originalText = confirmButton.textContent;
    confirmButton.disabled = true;
    confirmButton.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

    // Send the API request
    fetch("/appointment/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointmentId: appointmentId }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Hide the modal
        const modalElement = document.getElementById("cancelModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();

        if (data.success) {
          showAlert(
            "success",
            data.message || "Appointment cancelled successfully."
          );

          // Remove the cancelled appointment card from the UI
          const appointmentElements = document.querySelectorAll(
            `[data-id="${appointmentId}"]`
          );
          appointmentElements.forEach((element) => {
            const card = element.closest(".col");
            if (card) {
              card.remove();
            }
          });

          // Check if there are no more appointments
          const appointmentsContainer = document.querySelector(".row-cols-1");
          if (
            appointmentsContainer &&
            appointmentsContainer.children.length === 0
          ) {
            // Reload to show the "no appointments" message
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } else {
          showAlert("danger", data.message || "Failed to cancel appointment.");
        }
      })
      .catch((error) => {
        console.error("Error cancelling appointment:", error);
        showAlert("danger", "An error occurred while processing your request.");
      })
      .finally(() => {
        // Reset button state
        confirmButton.disabled = false;
        confirmButton.textContent = originalText;
      });
  }

  // Function to show alerts
  function showAlert(type, message) {
    const alertContainer = document.getElementById("alert-container");
    if (!alertContainer) return;

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

    alertContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      alert.classList.remove("show");
      setTimeout(() => alert.remove(), 150);
    }, 5000);
  }
});
