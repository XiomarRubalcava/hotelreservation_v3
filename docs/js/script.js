/* docs/js/script.js */

/* Base URL for your API endpoints on Render */
const API_BASE_URL = "https://hotelreservation-v3-2.onrender.com/api/v1";

/* Navigation toggle for mobile and form setup */
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
    });
  }

  // Forms
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

  // If we're on the reservations page, load the reservations table
  const reservationsTableBody = document.getElementById("reservationsTableBody");
  if (reservationsTableBody) {
    loadUserReservations();
  }

  // Testimonials carousel setup
  const testimonialTrack = document.querySelector(".testimonial-track");
  if (testimonialTrack) {
    const testimonialSlides = document.querySelectorAll(".testimonial-slide");
    const testimonialDots = document.querySelectorAll(".testimonial-nav span");
    let testimonialIndex = 0;

    function updateTestimonialSlider(index) {
      const slideWidth = testimonialSlides[0].clientWidth;
      testimonialTrack.style.transform = `translateX(-${index * slideWidth}px)`;
      testimonialDots.forEach(dot => dot.classList.remove("active"));
      testimonialDots[index].classList.add("active");
    }

    testimonialDots.forEach(dot => {
      dot.addEventListener("click", () => {
        testimonialIndex = parseInt(dot.dataset.index, 10);
        updateTestimonialSlider(testimonialIndex);
      });
    });

    // Auto slide every 6 seconds
    setInterval(() => {
      testimonialIndex = (testimonialIndex + 1) % testimonialSlides.length;
      updateTestimonialSlider(testimonialIndex);
    }, 6000);

    window.addEventListener("resize", () => updateTestimonialSlider(testimonialIndex));
  }
});

/* Register user */
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

/* Log in user */
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

/* Reservation form handler (if you have one) */
async function handleReservation(event) {
  event.preventDefault();
  const form = event.target;
  clearMessages(form);

  const body = {
    user_id: localStorage.getItem("userId"),
    room_id: form.room_id.value,
    check_in_date: form.check_in.value,
    check_out_date: form.check_out.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showMessage(form, "Reservation created successfully!", "success");
      form.reset();
    } else {
      showMessage(form, data.message || "Failed to create reservation.", "error");
    }
  } catch (err) {
    showMessage(form, "Failed to create reservation.", "error");
  }
}

/* Search available rooms */
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

/* Render rooms on the page */
function renderRooms(rooms) {
  const roomsContainer = document.getElementById("roomsContainer");
  if (!roomsContainer) return;
  roomsContainer.innerHTML = "";
  if (!rooms || rooms.length === 0) {
    roomsContainer.innerHTML = "<p>No rooms available for the selected dates.</p>";
    return;
  }
  rooms.forEach(room => {
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

/* Reserve a specific room */
async function reserveRoom(roomId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please log in first.");
    return;
  }

  // Use the date inputs from the rooms page
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

/* Load reservations for logged-in user */
async function loadUserReservations() {
  const userId = localStorage.getItem("userId");
  const reservationsTableBody = document.getElementById("reservationsTableBody");
  if (!userId || !reservationsTableBody) return;

  try {
    const res = await fetch(`${API_BASE_URL}/reservations/${userId}`);
    const data = await res.json();
    reservationsTableBody.innerHTML = "";
    if (res.ok && data.reservations) {
      data.reservations.forEach(resv => {
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

/* Helper functions for messages */
function showMessage(form, message, type) {
  clearMessages(form);
  const div = document.createElement("div");
  div.className = type === "success" ? "success" : "error";
  div.textContent = message;
  form.appendChild(div);
}

function clearMessages(form) {
  const existing = form.querySelectorAll(".success, .error");
  existing.forEach(msg => msg.remove());
}
