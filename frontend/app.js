const API_BASE = "http://localhost:8080/api";

// Utilities
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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

// Dashboard Logic
if (window.location.href.includes("index.html")) {
  checkAuth();

  const menuGrid = document.getElementById("menu-grid");
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("itemModal");
  const addItemBtn = document.getElementById("addItemBtn");
  const closeBtn = document.querySelector(".close");
  const searchInput = document.getElementById("searchInput");

  // Display User
  document.getElementById(
    "welcome-msg"
  ).textContent = `Hello, ${localStorage.getItem("username")}`;

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // Modal Handling
  addItemBtn.onclick = () => (modal.style.display = "block");
  closeBtn.onclick = () => (modal.style.display = "none");
  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = "none";
  };

  // Fetch Menu
  const fetchMenu = async (search = "") => {
    try {
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
      renderMenu(items);
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
                  item.imageUrl || "https://via.placeholder.com/300"
                }')"></div>
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.description}</p>
                    <div class="card-footer">
                        <span class="price">$${item.price}</span>
                        <button class="delete-btn" onclick="deleteItem(${
                          item.id
                        })">Delete</button>
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
  document.getElementById("itemForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("itemImage");
    let imageUrl = "";

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

    const res = await fetch(`${API_BASE}/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(item),
    });

    if (res.ok) {
      modal.style.display = "none";
      e.target.reset();
      fetchMenu();
    } else {
      alert("Failed to save item");
    }
  });

  // Delete Item
  window.deleteItem = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
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
