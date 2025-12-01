/***************************************************************
 *  GLOBAL SETTINGS & API CONFIG
 ***************************************************************/
const API_BASE_URL = "https://hotelreservation-v3-2.onrender.com/api/v1";

/***************************************************************
 *  HOMEPAGE SCRIPTS — TESTIMONIAL CAROUSEL
 ***************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const testimonialTrack = document.querySelector(".testimonial-track");
  const testimonialSlides = document.querySelectorAll(".testimonial-slide");
  const testimonialDots = document.querySelectorAll(".testimonial-nav span");

  if (testimonialTrack && testimonialSlides.length > 0) {
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
 *  ROOMS PAGE — SET DEFAULT DATES
 ***************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const checkInInput = document.getElementById("check_in");
  const checkOutInput = document.getElementById("check_out");

  if (checkInInput && checkOutInput) {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (!checkInInput.value) checkInInput.value = today;
    if (!checkOutInput.value) checkOutInput.value = tomorrow;
  }
});

/***************************************************************
 *  ROOMS PAGE — SEARCH, RENDER, AND IMAGES
 ***************************************************************/
async function searchRooms(event) {
  event.preventDefault();
  const checkInInput = document.getElementById("check_in");
  const checkOutInput = document.getElementById("check_out");
  if (!checkInInput || !checkOutInput) return;
  if (!checkInInput.value || !checkOutInput.value) {
    alert("Please select check-in and check-out dates.");
    return;
  }

  const query = `?check_in=${checkInInput.value}&check_out=${checkOutInput.value}`;
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/available${query}`);
    const data = await res.json();
    renderRooms(
      res.ok && Array.isArray(data.rooms) ? data.rooms : getSampleRooms()
    );
  } catch {
    renderRooms(getSampleRooms());
  }
}

function renderRooms(rooms) {
  const container = document.getElementById("roomsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!rooms || rooms.length === 0) {
    container.innerHTML = "<p>No rooms available.</p>";
    return;
  }

  rooms.forEach(room => {
    const card = document.createElement("div");
    card.className = "room-item";

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

    const reserveBtn = document.createElement("button");
    reserveBtn.className = "btn";
    reserveBtn.textContent = "Reserve";
    reserveBtn.onclick = () => reserveRoom(room.room_id);

    details.appendChild(reserveBtn);
    card.appendChild(img);
    card.appendChild(details);
    container.appendChild(card);
  });
}

/**
 * Return a specific image for each room number.
 * If no match is found, returns the basic placeholder.
 */
function getRoomImage(room) {
  switch (room.room_number) {
    case "101": return "images/basic1.jpg";
    case "102": return "images/double1.jpg";
    case "201": return "images/Queen1.jpg";
    case "202": return "images/King1.jpg";
    case "301": return "images/deluxe1.jpg";
    default: return "images/basic1.jpg";
  }
}

/***************************************************************
 *  SAMPLE ROOMS (fallback when API fails)
 ***************************************************************/
function getSampleRooms() {
  return [
    { room_id: 1, room_number: "101", room_type: "Single", price_per_night: 79.99, capacity: 1, description: "Cozy room for one guest." },
    { room_id: 2, room_number: "102", room_type: "Double", price_per_night: 99.99, capacity: 2, description: "Comfortable double room." },
    { room_id: 3, room_number: "201", room_type: "Queen Suite", price_per_night: 129.99, capacity: 3, description: "Modern queen suite." },
    { room_id: 4, room_number: "202", room_type: "King Suite", price_per_night: 149.99, capacity: 3, description: "Spacious king suite." },
    { room_id: 5, room_number: "301", room_type: "Deluxe Suite", price_per_night: 199.99, capacity: 4, description: "Luxury suite with ocean views." },
  ];
}

/***************************************************************
 *  RESERVATIONS PAGE — CARD LAYOUT LOADER
 ***************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const reservationsContainer = document.getElementById("reservationsContainer");
  if (reservationsContainer) {
    loadUserReservations();
  }
});

/**
 * Fetch reservations for the logged-in user and display them as cards.
 */
async function loadUserReservations() {
  const container = document.getElementById("reservationsContainer");
  const userId = localStorage.getItem("userId");
  if (!container) return;
  if (!userId) {
    container.innerHTML = "<p>You must log in to view your reservations.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/reservations/${userId}`);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data.reservations) || data.reservations.length === 0) {
      container.innerHTML = "<p>No reservations found.</p>";
      return;
    }

    renderReservations(data.reservations);
  } catch {
    container.innerHTML = "<p>Error loading reservations.</p>";
  }
}

/**
 * Render each reservation as a card with an image and details.
 */
function renderReservations(reservations) {
  const container = document.getElementById("reservationsContainer");
  if (!container) return;
  container.innerHTML = "";

  reservations.forEach(resv => {
    const card = document.createElement("div");
    card.className = "reservation-item";

    const img = document.createElement("img");
    img.src = "images/basic1.jpg";
    img.alt = `Room ${resv.room_id}`;

    const details = document.createElement("div");
    details.className = "reservation-details";
    details.innerHTML = `
      <h3>Reservation #${resv.reservation_id}</h3>
      <p class="res-room">Room ${resv.room_id}</p>
      <p class="res-dates">${resv.check_in_date} → ${resv.check_out_date}</p>
      <p class="res-price">$${resv.total_price}</p>
      <p class="res-status">${resv.status}</p>
    `;

    card.appendChild(img);
    card.appendChild(details);
    container.appendChild(card);
  });
}

/***************************************************************
 *  AUTHENTICATION — REGISTER AND LOGIN HANDLERS
 ***************************************************************/
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;

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
      alert("Account created!");
      form.reset();
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch {
    alert("An error occurred.");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;

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
      alert("Login successful!");
      window.location.href = "rooms.html";
    } else {
      alert(data.message || "Login failed.");
    }
  } catch {
    alert("An error occurred.");
  }
}

/***************************************************************
 *  RESERVE ROOM — SHARED FUNCTION FOR ROOMS PAGE
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

  try {
    const res = await fetch(`${API_BASE_URL}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        room_id: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      alert("Reservation created!");
    } else {
      alert(data.message || "Failed to reserve room.");
    }
  } catch {
    alert("An error occurred.");
  }
}
