/*
 * Common JavaScript for the hotel reservation front‑end
 * This script handles login/registration, searching rooms, creating reservations
 * and loading reservation history. It depends on elements present on each page
 * and therefore guards operations based on the existence of specific forms.
 */

// Base URL for your API endpoints (update port if your backend runs on a different port)
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------------------
   * Toggle between login and registration forms
   */
  const loginToggleButton = document.getElementById('show-login');
  const registerToggleButton = document.getElementById('show-register');
  const loginFormContainer = document.getElementById('login-form');
  const registerFormContainer = document.getElementById('register-form');
  if (loginToggleButton && registerToggleButton && loginFormContainer && registerFormContainer) {
    // Helper to update active classes on buttons and forms
    function showForm(formName) {
      if (formName === 'login') {
        loginFormContainer.classList.add('active');
        registerFormContainer.classList.remove('active');
        loginToggleButton.classList.add('active');
        registerToggleButton.classList.remove('active');
      } else {
        registerFormContainer.classList.add('active');
        loginFormContainer.classList.remove('active');
        registerToggleButton.classList.add('active');
        loginToggleButton.classList.remove('active');
      }
    }
    // Attach click listeners for toggling
    loginToggleButton.addEventListener('click', () => showForm('login'));
    registerToggleButton.addEventListener('click', () => showForm('register'));
  }

  /* --------------------------------------------------------------------------
   * Handle Login
   */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const messageEl = document.getElementById('loginMessage');
      messageEl.textContent = '';
      try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
          // Assume API returns the user ID
          const userId = data.userId || data.user_id || (data.user && data.user.user_id);
          if (userId) {
            localStorage.setItem('userId', userId);
          }
          // Optionally store a token if provided
          if (data.token) {
            localStorage.setItem('authToken', data.token);
          }
          // Redirect to rooms page upon successful login
          window.location.href = 'rooms.html';
        } else {
          messageEl.textContent = data.message || 'Login failed. Please try again.';
        }
      } catch (error) {
        console.error('Login error:', error);
        messageEl.textContent = 'An error occurred while attempting to login.';
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Handle Registration
   */
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const firstName = document.getElementById('registerFirstName').value.trim();
      const lastName = document.getElementById('registerLastName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      const phoneNumber = document.getElementById('registerPhone').value.trim();
      const messageEl = document.getElementById('registerMessage');
      messageEl.textContent = '';
      try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, phone_number: phoneNumber }),
        });
        const data = await response.json();
        if (response.ok) {
          // Registration success: show a message and optionally switch to login form
          messageEl.style.color = 'green';
          messageEl.textContent = data.message || 'Registration successful. You can now log in.';
          // Switch to login view
          if (loginToggleButton) {
            loginToggleButton.click();
          }
        } else {
          messageEl.style.color = '#c0392b';
          messageEl.textContent = data.message || 'Registration failed. Please try again.';
        }
      } catch (error) {
        console.error('Registration error:', error);
        messageEl.style.color = '#c0392b';
        messageEl.textContent = 'An error occurred while attempting to register.';
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Search and display available rooms
   */
  const searchForm = document.getElementById('searchForm');
  const roomsContainer = document.getElementById('roomsContainer');
  if (searchForm && roomsContainer) {
    searchForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const checkIn = document.getElementById('checkIn').value;
      const checkOut = document.getElementById('checkOut').value;
      // Clear any previous results
      roomsContainer.innerHTML = '';
      if (!checkIn || !checkOut) {
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
        const data = await response.json();
        if (response.ok) {
          renderRooms(data.rooms || [], checkIn, checkOut);
        } else {
          roomsContainer.innerHTML = `<p>${data.message || 'Failed to fetch available rooms.'}</p>`;
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        roomsContainer.innerHTML = '<p>An error occurred while fetching rooms.</p>';
      }
    });
    // Attach click listener to handle room reservation (event delegation)
    roomsContainer.addEventListener('click', async (event) => {
      const button = event.target;
      if (button.classList.contains('reserve-btn')) {
        const roomId = button.dataset.roomId;
        const pricePerNight = parseFloat(button.dataset.price);
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        // Ensure user is logged in
        const userId = localStorage.getItem('userId');
        if (!userId) {
          alert('Please log in before making a reservation.');
          window.location.href = 'login.html';
          return;
        }
        // Calculate total price based on number of nights
        const nights = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
        const totalPrice = isNaN(pricePerNight) ? 0 : pricePerNight * nights;
        try {
          const response = await fetch(`${API_BASE_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: parseInt(userId, 10),
              room_id: parseInt(roomId, 10),
              check_in_date: checkIn,
              check_out_date: checkOut,
              total_price: totalPrice,
            }),
          });
          const data = await response.json();
          if (response.ok) {
            alert(data.message || 'Reservation created successfully.');
            // Redirect to reservations page after booking
            window.location.href = 'reservations.html';
          } else {
            alert(data.message || 'Failed to create reservation.');
          }
        } catch (error) {
          console.error('Error creating reservation:', error);
          alert('An error occurred while creating the reservation.');
        }
      }
    });
  }

  // Function to render rooms in the DOM
  function renderRooms(rooms, checkIn, checkOut) {
    roomsContainer.innerHTML = '';
    if (!rooms.length) {
      roomsContainer.innerHTML = '<p>No rooms available for the selected dates.</p>';
      return;
    }
    rooms.forEach((room) => {
      const card = document.createElement('div');
      card.classList.add('room-card');
      card.innerHTML = `
        <div>
          <h3>Room ${room.room_number || room.room_id}</h3>
          <p>Type: ${room.room_type}</p>
          <p>Price per night: $${Number(room.price_per_night).toFixed(2)}</p>
          <p>Capacity: ${room.capacity}</p>
          <p>${room.description || ''}</p>
        </div>
        <button class="btn-primary reserve-btn" data-room-id="${room.room_id}" data-price="${room.price_per_night}">Reserve</button>
      `;
      roomsContainer.appendChild(card);
    });
  }

  /* --------------------------------------------------------------------------
   * Load and display user's reservations
   */
  const reservationsTable = document.querySelector('#reservationsTable tbody');
  const reservationsMessage = document.getElementById('reservationsMessage');
  if (reservationsTable && reservationsMessage) {
    loadReservations();
  }

  async function loadReservations() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      reservationsMessage.textContent = 'Please log in to view your reservations.';
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${userId}`);
      const data = await response.json();
      if (response.ok) {
        const reservations = data.reservations || data || [];
        if (!reservations.length) {
          reservationsMessage.textContent = 'You do not have any reservations yet.';
          return;
        }
        reservationsMessage.textContent = '';
        reservationsTable.innerHTML = '';
        reservations.forEach((res) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${res.reservation_id}</td>
            <td>${res.room_id}</td>
            <td>${formatDate(res.check_in_date)}</td>
            <td>${formatDate(res.check_out_date)}</td>
            <td>$${Number(res.total_price).toFixed(2)}</td>
            <td>${res.status}</td>
          `;
          reservationsTable.appendChild(tr);
        });
      } else {
        reservationsMessage.textContent = data.message || 'Failed to retrieve reservations.';
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
      reservationsMessage.textContent = 'An error occurred while loading your reservations.';
    }
  }

  // Utility function to format dates in YYYY-MM-DD format
  function formatDate(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toISOString().split('T')[0];
  }
});