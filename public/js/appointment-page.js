// Constants
const TIME_SLOT_STATUS = {
    BOOKED: 'booked',
    AVAILABLE: 'available',
    PAST: 'past'
  };
  
  // DOM Elements
  const elements = {
    appointmentsData: document.getElementById('appointments-data'),
    dateInput: document.getElementById('appointmentDate'),
    timeSlots: document.querySelectorAll('.time-slot'),
    timeInput: document.getElementById('appointmentTime'),
    testTypeInput: document.getElementById('appointmentTestType'),
    form: document.getElementById('createAppointmentForm'),
    deleteButtons: document.querySelectorAll('.delete-btn'),
    alertContainer: document.getElementById('alert-container')
  };
  
  // State
  let allAppointments = [];
  
  // Initialize
  function init() {
    if (elements.appointmentsData) {
      allAppointments = JSON.parse(elements.appointmentsData.textContent);
    }
    
    disablePastDates();
    if (elements.dateInput.value && elements.testTypeInput.value) {
      updateTimeSlots();
    }
    
    setupEventListeners();
  }
  
  // Date Functions
  function disablePastDates() {
    const today = new Date().toISOString().split('T')[0];
    elements.dateInput.min = today;
  }
  
  function isDateInPast(dateString, timeString) {
    if (!dateString || !timeString) return false;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const slotDateTime = new Date(dateString);
    slotDateTime.setHours(hours, minutes);
    
    return slotDateTime < new Date();
  }
  
  // Time Slot Management
  function updateTimeSlots() {
    const selectedDate = elements.dateInput.value;
    const selectedTestType = elements.testTypeInput.value;
    
    if (!selectedDate || !selectedTestType) return;
  
    const dateAppointments = allAppointments.filter(app => 
      app.date === selectedDate && 
      app.testType === selectedTestType
    );
  
    elements.timeSlots.forEach(slot => {
      const slotTime = slot.dataset.time;
      const status = getTimeSlotStatus(selectedDate, slotTime, dateAppointments);
      
      updateSlotUI(slot, status);
    });
  }
  
  function getTimeSlotStatus(date, time, appointments) {
    if (appointments.some(app => app.time === time)) {
      return TIME_SLOT_STATUS.BOOKED;
    }
    if (isDateInPast(date, time)) {
      return TIME_SLOT_STATUS.PAST;
    }
    return TIME_SLOT_STATUS.AVAILABLE;
  }
  
  function updateSlotUI(slot, status) {
    // Reset classes
    slot.classList.remove('selected', 'booked');
    slot.disabled = false;
    
    switch(status) {
      case TIME_SLOT_STATUS.BOOKED:
        slot.classList.add('booked');
        slot.disabled = true;
        slot.title = 'This slot is already booked';
        break;
        
      case TIME_SLOT_STATUS.PAST:
        slot.classList.add('booked');
        slot.disabled = true;
        slot.title = 'Cannot book past time slots';
        break;
        
      default:
        slot.title = 'Available for booking';
    }
  }
  
  // Event Handlers
  function setupEventListeners() {
    elements.dateInput.addEventListener('change', handleDateChange);
    elements.testTypeInput.addEventListener('change', handleTestTypeChange);
    
    elements.timeSlots.forEach(slot => {
      slot.addEventListener('click', handleTimeSlotClick);
    });
    
    elements.form.addEventListener('submit', handleFormSubmit);
    
    elements.deleteButtons.forEach(button => {
      button.addEventListener('click', handleDelete);
    });
  }
  
  function handleDateChange() {
    clearSelectedTime();
    updateTimeSlots();
  }
  
  function handleTestTypeChange() {
    clearSelectedTime();
    updateTimeSlots();
  }
  
  function clearSelectedTime() {
    elements.timeSlots.forEach(s => s.classList.remove('selected'));
    elements.timeInput.value = '';
  }
  
  function handleTimeSlotClick() {
    if (this.disabled) return;
    
    clearSelectedTime();
    this.classList.add('selected');
    elements.timeInput.value = this.dataset.time;
  }
  
  // Form Handling
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('Please fill all fields including date, time and test type', 'danger');
      return;
    }
  
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Creating... <span class="spinner-border spinner-border-sm"></span>';
  
    try {
      const response = await fetch('/appointment/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          date: elements.dateInput.value,
          time: elements.timeInput.value,
          testType: elements.testTypeInput.value
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create appointment');
      }
      
      showAlert('Appointment slot created successfully', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error:', error);
      showAlert(error.message, 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  }
  
  function validateForm() {
    return elements.dateInput.value && 
           elements.timeInput.value && 
           elements.testTypeInput.value;
  }
  
  // Delete Handling
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this appointment slot?')) return;
    
    const button = this;
    const originalContent = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = 'Deleting... <span class="spinner-border spinner-border-sm"></span>';
  
    try {
      const response = await fetch(`/appointment/delete/${this.dataset.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete appointment');
      }
      
      showAlert('Appointment slot deleted successfully', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error:', error);
      showAlert(error.message, 'danger');
      button.disabled = false;
      button.innerHTML = originalContent;
    }
  }
  
  // Alert System
  function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    if (elements.alertContainer) {
      elements.alertContainer.prepend(alertDiv);
    } else {
      document.querySelector('.appointment-container')?.prepend(alertDiv);
    }
    
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 150);
    }, type === 'danger' ? 5000 : 3000);
  }
  
  // Initialize the application
  document.addEventListener('DOMContentLoaded', init);