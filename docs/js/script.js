// docs/js/script.js
// Base URL for your API endpoints on Render
const API_BASE_URL = "https://hotelreservation-v3-2.onrender.com/api/v1";

// Navigation toggle for mobile
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
    });
  }

  // Setup event handlers on forms if present
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const reservationForm = document.getElementById("reservationForm");

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (reservationForm) {
    reservationForm.addEventListener("submit", handleReservation);
  }

  // Load user reservations if we are on the reservations page
  const reservationsTableBody = document.getElementById("reservationsTableBody");
  if (reservationsTableBody) {
    loadUserReservations();
  }
});

// Register user
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  clearMessages(form);

  const body = {
    first_name: form.first_name.value.trim(),
    last_name: form.last_name.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    phone_number: form.phone_number.value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showMessage(form, "Account created successfully!", "success");
      form.reset();
    } else {
      showMessage(form, data.message || "Failed to register user.", "error");
    }
  } catch (err) {
    showMessage(form, "Failed to register user.", "error");
  }
}

// Log in user
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  clearMessages(form);

  const body = {
    email: form.email.value.trim(),
    password: form.password.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      // Save userId in localStorage
      localStorage.setItem("userId", data.user_id);
      showMessage(form, "Login successful. Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "rooms.html";
      }, 1000);
    } else {
      showMessage(form, data.message || "Login failed.", "error");
    }
  } catch (err) {
    showMessage(form, "Login failed.", "error");
  }
}

// Load rooms based on search
async function searchRooms(event) {
  event.preventDefault();
  const checkInInput = document.getElementById("check_in");
  const checkOutInput = document.getElementById("check_out");

  if (!checkInInput.value || !checkOutInput.value) {
    alert("Please select check-in and check-out dates.");
    return;
  }

  const query = `?check_in=${checkInInput.value}&check_out=${checkOutInput.value}`;

  try {
    const res = await fetch(`${API_BASE_URL}/rooms/available${query}`);
    const data = await res.json();
    if (res.ok) {
      renderRooms(data.rooms);
    } else {
      renderRooms([]);
    }
  } catch (err) {
    renderRooms([]);
  }
}

// Render rooms on the page
function renderRooms(rooms) {
  const roomsContainer = document.getElementById("roomsContainer");
  roomsContainer.innerHTML = "";
  if (!rooms || rooms.length === 0) {
    roomsContainer.innerHTML = "<p>No rooms available for the selected dates.</p>";
    return;
  }
  rooms.forEach((room) => {
    const card = document.createElement("div");
    card.className = "room-card";
    card.innerHTML = `
      <h3>Room ${room.room_number}</h3>
      <p>Type: ${room.room_type}</p>
      <p>Price per night: $${room.price_per_night}</p>
      <p>Capacity: ${room.capacity}</p>
      <p>${room.description || ""}</p>
    `;
    const reserveBtn = document.createElement("button");
    reserveBtn.textContent = "Reserve";
    reserveBtn.addEventListener("click", () => reserveRoom(room.room_id));
    card.appendChild(reserveBtn);
    roomsContainer.appendChild(card);
  });
}

// Reserve a specific room
async function reserveRoom(roomId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please log in first.");
    return;
  }

  // Use the date inputs from rooms page
  const checkIn = document.getElementById("check_in").value;
  const checkOut = document.getElementById("check_out").value;
  if (!checkIn || !checkOut) {
    alert("Please select dates.");
    return;
  }

  const body = {
    user_id: userId,
    room_id: roomId,
    check_in_date: checkIn,
    check_out_date: checkOut,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Reservation successfully created.");
    } else {
      alert(data.message || "Failed to create reservation.");
    }
  } catch (err) {
    alert("Failed to create reservation.");
  }
}

// Load reservations for logged-in user
async function loadUserReservations() {
  const userId = localStorage.getItem("userId");
  const reservationsTableBody = document.getElementById("reservationsTableBody");
  if (!userId || !reservationsTableBody) return;

  try {
    const res = await fetch(`${API_BASE_URL}/reservations/${userId}`);
    const data = await res.json();
    reservationsTableBody.innerHTML = "";
    if (res.ok && data.reservations) {
      data.reservations.forEach((resv) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${resv.reservation_id}</td>
          <td>${resv.room_id}</td>
          <td>${resv.check_in_date}</td>
          <td>${resv.check_out_date}</td>
          <td>$${resv.total_price}</td>
          <td>${resv.status}</td>
        `;
        reservationsTableBody.appendChild(row);
      });
    } else {
      reservationsTableBody.innerHTML = "<tr><td colspan='6'>No reservations found.</td></tr>";
    }
  } catch (err) {
    reservationsTableBody.innerHTML = "<tr><td colspan='6'>Error loading reservations.</td></tr>";
  }
}

// Helper functions for messages
function showMessage(form, message, type) {
  clearMessages(form);
  const div = document.createElement("div");
  div.className = type === "success" ? "success" : "error";
  div.textContent = message;
  form.appendChild(div);
}

function clearMessages(form) {
  const existing = form.querySelectorAll(".success, .error");
  existing.forEach((msg) => msg.remove());
}

document.addEventListener('DOMContentLoaded', function () {
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(document.querySelectorAll('.carousel-item'));
  const prevButton = document.querySelector('.carousel-button.prev');
  const nextButton = document.querySelector('.carousel-button.next');
  const dotsContainer = document.querySelector('.carousel-dots');

  let currentIndex = 0;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.dataset.index = i;
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
  });

  // Update slide position
  function updateSlider(index) {
    const slideWidth = slides[0].clientWidth;
    track.style.transform = `translateX(-${index * slideWidth}px)`;
    dotsContainer.querySelectorAll('span').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.index == index);
    });
  }

  // Next & previous controls
  nextButton.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider(currentIndex);
  });

  prevButton.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlider(currentIndex);
  });

  // Dots control
  dotsContainer.addEventListener('click', (e) => {
    if (e.target.dataset.index) {
      currentIndex = parseInt(e.target.dataset.index, 10);
      updateSlider(currentIndex);
    }
  });

  // Optional auto‑slide every 5 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider(currentIndex);
  }, 5000);

  // Re‑calculate on window resize
  window.addEventListener('resize', () => updateSlider(currentIndex));
});
