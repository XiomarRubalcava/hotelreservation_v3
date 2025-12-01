/***************************************************************
 *  GLOBAL CONFIG
 ***************************************************************/
const API_BASE_URL = "https://hotelreservation-v3-2.onrender.com/api/v1";

/***************************************************************
 *  DOMContentLoaded – INITIALIZE PAGE FEATURES
 ***************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation toggle (optional, only works if you add navToggle/navMenu)
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
    });
  }

  // Attach handlers to register, login and reservation forms (if they exist)
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const reservationForm = document.getElementById("reservationForm");

  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (reservationForm) reservationForm.addEventListener("submit", handleReservation);

  // Prepopulate dates on the rooms page
  const checkInInput = document.getElementById("check_in");
  const checkOutInput = document.getElementById("check_out");
  if (checkInInput && checkOutInput) {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (!checkInInput.value) checkInInput.value = today;
    if (!checkOutInput.value) checkOutInput.value = tomorrow;
  }

  // Load reservations if we are on the reservations page
  const reservationsContainer = document.getElementById("reservationsContainer");
  if (reservationsContainer) {
    loadUserReservations();
  }

  // Load reservations table if an older table-based design is present
  const reservationsTableBody = document.getElementById("reservationsTableBody");
  if (reservationsTableBody) {
    loadUserReservations();
  }

  // Testimonials slider for the homepage
  const testimonialTrack = document.querySelector(".testimonial-track");
  const testimonialSlides = document.querySelectorAll(".testimonial-slide");
  const testimonialDots = document.querySelectorAll(".testimonial-nav span");
  if (testimonialTrack && testimonialSlides.length > 0 && testimonialDots.length > 0) {
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
    setInterval(() => {
      testimonialIndex = (testimonialIndex + 1) % testimonialSlides.length;
      updateTestimonialSlider(testimonialIndex);
    }, 6000);
    window.addEventListener("resize", () => updateTestimonialSlider(testimonialIndex));
  }
});

/***************************************************************
 *  AUTHENTICATION FUNCTIONS
 ***************************************************************/
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
  } catch {
    showMessage(form, "Failed to register user.", "error");
  }
}

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
      localStorage.setItem("userId", data.user_id);
      showMessage(form, "Login successful. Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "rooms.html";
      }, 1000);
    } else {
      showMessage(form, data.message || "Login failed.", "error");
    }
  } catch {
    showMessage(form, "Login failed.", "error");
  }
}

/***************************************************************
 *  ROOMS PAGE FUNCTIONS
 ***************************************************************/
async function searchRooms(event) {
  event.preventDefault();
  const checkIn = document.getElementById("check_in");
  const checkOut = document.getElementById("check_out");
  if (!checkIn || !checkOut) return;
  if (!checkIn.value || !checkOut.value) {
    alert("Please select check-in and check-out dates.");
    return;
  }
  const query = `?check_in=${checkIn.value}&check_out=${checkOut.value}`;
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/available${query}`);
    const data = await res.json();
    if (res.ok && Array.isArray(data.rooms)) {
      renderRooms(data.rooms);
    } else {
      renderRooms(getSampleRooms());
    }
  } catch {
    renderRooms(getSampleRooms());
  }
}

function renderRooms(rooms) {
  const container = document.getElementById("roomsContainer");
  if (!container) return;
  container.innerHTML = "";
  if (!rooms || rooms.length === 0) {
    container.innerHTML = "<p>No rooms available for the selected dates.</p>";
    return;
  }
  rooms.forEach(room => {
    const item = document.createElement("div");
    item.className = "room-item";
    const img = document.createElement("img");
    img.src = getRoomImage(room);
    img.alt = `${room.room_type} room`;
    const details = document.createElement("div");
    details.className = "room-details";
    details.innerHTML = `
      <h3>Room ${room.room_number}</h3>
      <p class="room-type">${room.room_type}</p>
      <p class="price">$${room.price_per_night} per night</p>
      <p class="capacity">Sleeps ${room.capacity}</p>
      <p>${room.description || ""}</p>
    `;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Reserve";
    btn.onclick = () => reserveRoom(room.room_id);
    details.appendChild(btn);
    item.appendChild(img);
    item.appendChild(details);
    container.appendChild(item);
  });
}

function getRoomImage(room) {
  // Replace this with a room-specific image lookup if desired
  return "images/basic1.jpg";
}

function getSampleRooms() {
  return [
    { room_id: 1, room_number: "101", room_type: "Single", price_per_night: 79.99, capacity: 1, description: "Cozy single room perfect for a solo traveller." },
    { room_id: 2, room_number: "102", room_type: "Double", price_per_night: 99.99, capacity: 2, description: "Comfortable double room ideal for couples or friends." },
    { room_id: 3, room_number: "201", room_type: "Queen Suite", price_per_night: 129.99, capacity: 3, description: "Modern queen suite with stylish decor and plenty of space." },
    { room_id: 4, room_number: "202", room_type: "King Suite", price_per_night: 149.99, capacity: 3, description: "Spacious king suite with elegant furnishings and panoramic views." },
    { room_id: 5, room_number: "301", room_type: "Deluxe Suite", price_per_night: 199.99, capacity: 4, description: "Luxury suite with upgraded amenities and a private balcony." },
  ];
}

/***************************************************************
 *  SHARED FUNCTION TO RESERVE A ROOM
 ***************************************************************/
async function reserveRoom(roomId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please log in first.");
    return;
  }
  const checkIn = document.getElementById("check_in")?.value;
  const checkOut = document.getElementById("check_out")?.value;
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
  } catch {
    alert("Failed to create reservation.");
  }
}

/***************************************************************
 *  LOAD USER RESERVATIONS (CARDS LAYOUT)
 ***************************************************************/
async function loadUserReservations() {
  const container = document.getElementById("reservationsContainer");
  if (!container) return;
  const userId = localStorage.getItem("userId");
  if (!userId) {
    container.innerHTML = "<p>Please log in to view your reservations.</p>";
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/reservations/${userId}`);
    const data = await res.json();
    if (res.ok && Array.isArray(data.reservations) && data.reservations.length > 0) {
      renderReservations(data.reservations);
    } else {
      renderReservations([]);
    }
  } catch {
    container.innerHTML = "<p>Error loading reservations.</p>";
  }
}

function renderReservations(reservations) {
  const container = document.getElementById("reservationsContainer");
  if (!container) return;
  container.innerHTML = "";
  if (!reservations || reservations.length === 0) {
    container.innerHTML = "<p>No reservations found.</p>";
    return;
  }
  reservations.forEach(resv => {
    const item = document.createElement("div");
    item.className = "reservation-item";
    const img = document.createElement("img");
    img.src = "images/basic1.jpg";
    img.alt = `Room ${resv.room_id}`;
    const details = document.createElement("div");
    details.className = "reservation-details";
    details.innerHTML = `
      <h3>Reservation #${resv.reservation_id}</h3>
      <p class="res-room">Room ${resv.room_id}</p>
      <p class="res-dates">${resv.check_in_date} &ndash; ${resv.check_out_date}</p>
      <p class="res-price">$${resv.total_price}</p>
      <p class="res-status">${resv.status}</p>
    `;
    item.appendChild(img);
    item.appendChild(details);
    container.appendChild(item);
  });
}

/***************************************************************
 *  RESERVATION FORM HANDLER (OPTIONAL)
 ***************************************************************/
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
  } catch {
    showMessage(form, "Failed to create reservation.", "error");
  }
}

/***************************************************************
 *  FORM MESSAGE HELPERS
 ***************************************************************/
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
