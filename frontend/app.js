const API_BASE = "http://localhost:8080/api";

// Utilities
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Custom Popup Logic ---
const injectPopupStyles = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    .custom-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .custom-popup-overlay.active {
      opacity: 1;
      pointer-events: all;
    }
    .custom-popup-content {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      transform: translateY(20px);
      transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    }
    .custom-popup-overlay.active .custom-popup-content {
      transform: translateY(0);
    }
    .custom-popup-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #2d3436;
      margin-bottom: 0.5rem;
    }
    .custom-popup-message {
      color: #636e72;
      margin-bottom: 1.5rem;
      font-size: 1rem;
    }
    .custom-popup-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    .popup-btn {
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .popup-btn:active { transform: scale(0.95); }
    .popup-btn-confirm { background: #4796ff; color: white; flex: 1; }
    .popup-btn-cancel { background: #f1f2f6; color: #636e72; flex: 1; }
    .popup-btn-danger { background: #ff4757; color: white; flex: 1; }
  `;
  document.head.appendChild(style);
};

const createPopupHTML = () => {
  if (document.getElementById("custom-popup")) return;
  const div = document.createElement("div");
  div.id = "custom-popup";
  div.className = "custom-popup-overlay";
  div.innerHTML = `
    <div class="custom-popup-content">
      <div id="popup-title" class="custom-popup-title"></div>
      <div id="popup-message" class="custom-popup-message"></div>
      <div id="popup-actions" class="custom-popup-actions"></div>
    </div>
  `;
  document.body.appendChild(div);
};

// Initialize
injectPopupStyles();
document.addEventListener("DOMContentLoaded", createPopupHTML);

// Global Custom Alert
window.showToast = (message, title = "Notification") => {
  // Simple implementation reusing the popup structure for now, can be separate
  return new Promise((resolve) => {
    createPopupHTML();
    const popup = document.getElementById("custom-popup");
    const titleEl = document.getElementById("popup-title");
    const msgEl = document.getElementById("popup-message");
    const actionsEl = document.getElementById("popup-actions");

    titleEl.textContent = title;
    msgEl.textContent = message;
    actionsEl.innerHTML = `<button class="popup-btn popup-btn-confirm">OK</button>`;

    const btn = actionsEl.querySelector("button");
    btn.onclick = () => {
      popup.classList.remove("active");
      setTimeout(resolve, 300);
    };

    popup.classList.add("active");
  });
};

// Global Custom Confirm
window.showConfirm = (message, title = "Confirm Action", isDanger = false) => {
  return new Promise((resolve) => {
    createPopupHTML();
    const popup = document.getElementById("custom-popup");
    const titleEl = document.getElementById("popup-title");
    const msgEl = document.getElementById("popup-message");
    const actionsEl = document.getElementById("popup-actions");

    titleEl.textContent = title;
    msgEl.textContent = message;

    const confirmBtnClass = isDanger ? "popup-btn-danger" : "popup-btn-confirm";
    actionsEl.innerHTML = `
      <button class="popup-btn popup-btn-cancel">Cancel</button>
      <button class="popup-btn ${confirmBtnClass}">Confirm</button>
    `;

    const cancelBtn = actionsEl.querySelector(".popup-btn-cancel");
    const confirmBtn = actionsEl.querySelector(`.${confirmBtnClass}`);

    cancelBtn.onclick = () => {
      popup.classList.remove("active");
      resolve(false);
    };
    confirmBtn.onclick = () => {
      popup.classList.remove("active");
      resolve(true);
    };

    popup.classList.add("active");
  });
};

const checkAuth = () => {
  if (
    !localStorage.getItem("token") &&
    !window.location.href.includes("login.html")
  ) {
    window.location.href = "login.html";
  }
};

// Login Logic
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const errorMsg = document.getElementById("error-message");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        window.location.href = "index.html";
      } else {
        errorMsg.textContent = "Invalid credentials";
      }
    } catch (err) {
      errorMsg.textContent = "Server error. Please try again.";
    }
  });
}

// Register Logic
if (document.getElementById("registerForm")) {
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = e.target.username.value;
      const password = e.target.password.value;
      const confirmPassword = e.target.confirmPassword.value;
      const errorMsg = document.getElementById("error-message");
      errorMsg.textContent = ""; // Clear previous errors

      if (password !== confirmPassword) {
        errorMsg.textContent = "Passwords do not match";
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
          await window.showToast(
            "Registration successful! Please login.",
            "Success"
          );
          window.location.href = "login.html";
        } else {
          errorMsg.textContent = data.message || "Registration failed";
        }
      } catch (err) {
        errorMsg.textContent = "Server error. Please try again.";
      }
    });
}

// Dashboard Logic
if (window.location.href.includes("index.html")) {
  checkAuth();

  const menuGrid = document.getElementById("menu-grid");
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("itemModal");
  const addItemBtn = document.getElementById("addItemBtn");
  const closeBtn = document.querySelector(".close");
  const searchInput = document.getElementById("searchInput");

  // Theme Toggle
  const themeToggle = document.getElementById("themeToggle");
  const currentTheme = localStorage.getItem("theme");

  if (currentTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    if (document.body.getAttribute("data-theme") === "dark") {
      document.body.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      themeToggle.textContent = "🌙";
    } else {
      document.body.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      themeToggle.textContent = "☀️";
    }
  });

  // Display User
  document.getElementById(
    "welcome-msg"
  ).textContent = `Hello, ${localStorage.getItem("username")}`;

  // Logout
  logoutBtn.addEventListener("click", async () => {
    const confirmed = await window.showConfirm(
      "Are you sure you want to logout?",
      "Logout"
    );
    if (confirmed) {
      localStorage.clear();
      window.location.href = "login.html";
    }
  });

  // Modal Handling
  addItemBtn.onclick = () => {
    document.getElementById("itemForm").reset();
    document.getElementById("itemId").value = "";
    document.getElementById("modalTitle").innerText = "Add Menu Item";
    modal.style.display = "flex";
  };
  closeBtn.onclick = () => (modal.style.display = "none");
  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = "none";
  };

  // Edit Item
  window.editItem = (id) => {
    const item = window.menuItems.find((i) => i.id === id);
    if (!item) return;

    document.getElementById("itemId").value = item.id;
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemDesc").value = item.description;
    document.getElementById("itemPrice").value = item.price;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("imageUrl").value = item.imageUrl || "";

    document.getElementById("modalTitle").innerText = "Edit Menu Item";
    modal.style.display = "flex";
  };

  // Search & Filter
  let currentCategory = "All";
  let currentSearch = "";

  // Filter Tabs Logic
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update Active State
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Update Filter
      currentCategory = tab.dataset.category;
      applyFilters();
    });
  });

  const applyFilters = () => {
    let filtered = window.menuItems;

    // Filter by Category
    if (currentCategory !== "All") {
      filtered = filtered.filter((item) => item.category === currentCategory);
    }

    // Filter by Search (Client-side refinement if needed, but we fetch new data on search usually)
    // Since fetchMenu fetches by search from backend, we might want to combine.
    // Strategy: Use client-side filtering for category on the *fetched* results.
    // If search is active, fetchMenu gets searched items, then we filter by category.

    renderMenu(filtered);
  };

  // Override Fetch to apply category after fetching
  const fetchMenu = async (search = "") => {
    try {
      currentSearch = search; // Store current search
      const url = search
        ? `${API_BASE}/menu?search=${search}`
        : `${API_BASE}/menu`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.status === 403 || res.status === 401) {
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
      const items = await res.json();
      window.menuItems = items; // Update source of truth
      applyFilters(); // Apply current category filter
    } catch (err) {
      console.error("Failed to fetch menu", err);
    }
  };

  const renderMenu = (items) => {
    menuGrid.innerHTML = items
      .map(
        (item) => `
            <div class="menu-card">
                <div class="card-img" style="background-image: url('${
                  item.imageUrl && !item.imageUrl.startsWith("http")
                    ? `http://localhost:8080${
                        item.imageUrl.startsWith("/") ? "" : "/"
                      }${item.imageUrl}`
                    : item.imageUrl || "https://via.placeholder.com/300"
                }')"></div>
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.description}</p>
                    <div class="card-footer">
                        <span class="price">$${item.price}</span>
                        <div class="action-buttons">
                            <button class="edit-btn" onclick="editItem(${
                              item.id
                            })">Edit</button>
                            <button class="delete-btn" onclick="deleteItem(${
                              item.id
                            })">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  };

  // Search
  let debounceTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchMenu(e.target.value), 300);
  });

  // Add Item Form
  // Add/Edit Item Form
  document.getElementById("itemForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Submitting item form...");

    try {
      const fileInput = document.getElementById("itemImage");
      let imageUrl = document.getElementById("imageUrl").value; // Keep existing if not changed

      if (fileInput.files[0]) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        const uploadRes = await fetch(`${API_BASE}/menu/upload`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });

        if (uploadRes.ok) {
          imageUrl = await uploadRes.text(); // Returns URL string
        }
      }

      const item = {
        name: document.getElementById("itemName").value,
        description: document.getElementById("itemDesc").value,
        price: parseFloat(document.getElementById("itemPrice").value),
        category: document.getElementById("itemCategory").value,
        imageUrl: imageUrl,
      };

      const itemId = document.getElementById("itemId").value;
      if (itemId) item.id = parseInt(itemId);

      const url = itemId ? `${API_BASE}/menu/${itemId}` : `${API_BASE}/menu`;
      const method = itemId ? "PUT" : "POST";

      console.log(`Sending ${method} request to ${url}`, item);

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        console.log("Item saved successfully");
        modal.style.display = "none";
        e.target.reset();
        document.getElementById("itemId").value = "";
        fetchMenu();
      } else {
        const errText = await res.text();
        console.error("Failed to save item:", res.status, errText);
        await window.showToast("Failed to save item: " + errText, "Error");
      }
    } catch (error) {
      console.error("Error in submit handler:", error);
      await window.showToast(
        "An error occurred while saving.",
        "Network Error"
      );
    }
  });

  // Delete Item
  window.deleteItem = async (id) => {
    const confirmed = await window.showConfirm(
      "Are you sure you want to delete this item?",
      "Delete Item",
      true
    );
    if (confirmed) {
      const res = await fetch(`${API_BASE}/menu/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) fetchMenu();
    }
  };

  // Initial Fetch
  fetchMenu();
}
