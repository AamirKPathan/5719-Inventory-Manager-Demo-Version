
"use strict";

const CATEGORIES = [
  "Bearings & Bushings",
  "Raw Materials & Stock",
  "Fasteners & Hardware",
  "Gears, Chains & Power Transmission",
  "Motors & Mechanical Assemblies",
  "Electronics & Controls",
  "Pneumatics",
  "Custom & Fabricated Parts",
  "Other / Miscellaneous"
];

const CATEGORY_FIELDS = {
  "Bearings & Bushings": [
    { key: "innerDiameter", label: "Inner diameter", unit: "in" },
    { key: "outerDiameter", label: "Outer diameter", unit: "in" },
    { key: "width", label: "Width", unit: "in" }
  ],
  "Raw Materials & Stock": [
    { key: "material", label: "Material", unit: "" },
    { key: "length", label: "Length", unit: "in" },
    { key: "width", label: "Width", unit: "in" },
    { key: "height", label: "Height / thickness", unit: "in" }
  ],
  "Fasteners & Hardware": [
    { key: "diameter", label: "Diameter / size", unit: "in" },
    { key: "length", label: "Length", unit: "in" },
    { key: "thread", label: "Thread / pitch", unit: "" }
  ],
  "Gears, Chains & Power Transmission": [
    { key: "teeth", label: "Number of teeth", unit: "" },
    { key: "pitch", label: "Pitch", unit: "in" },
    { key: "bore", label: "Bore diameter", unit: "in" },
    { key: "ratio", label: "Gear ratio", unit: "" }
  ],
  "Motors & Mechanical Assemblies": [
    { key: "model", label: "Model / part number", unit: "" },
    { key: "voltage", label: "Voltage", unit: "V" },
    { key: "ratio", label: "Gear ratio", unit: "" }
  ],
  "Electronics & Controls": [
    { key: "model", label: "Model / part number", unit: "" },
    { key: "voltage", label: "Voltage", unit: "V" },
    { key: "connector", label: "Connector type", unit: "" }
  ],
  "Pneumatics": [
    { key: "port", label: "Port size", unit: "" },
    { key: "pressure", label: "Rated pressure", unit: "psi" },
    { key: "bore", label: "Bore diameter", unit: "in" }
  ],
  "Custom & Fabricated Parts": [
    { key: "material", label: "Material", unit: "" },
    { key: "length", label: "Length", unit: "in" },
    { key: "width", label: "Width", unit: "in" },
    { key: "height", label: "Height / thickness", unit: "in" }
  ],
  "Other / Miscellaneous": [
    { key: "model", label: "Model / part number", unit: "" },
    { key: "dimensions", label: "Dimensions", unit: "in" }
  ]
};

const STORAGE_ITEMS = "frc5719_inventory_items_v1";
const STORAGE_LOG = "frc5719_inventory_activity_v1";

const $ = (id) => document.getElementById(id);

let items = loadJSON(STORAGE_ITEMS, []);
let activity = loadJSON(STORAGE_LOG, []);

function loadJSON(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items));
  localStorage.setItem(STORAGE_LOG, JSON.stringify(activity));
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeImageURL(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function getItem(id) {
  return items.find((item) => item.id === id);
}

function getCheckedOut(item) {
  return activity.reduce((total, entry) => {
    if (entry.itemId !== item.id) return total;
    if (entry.type === "checkout") return total + entry.quantity;
    if (entry.type === "return") return total - entry.quantity;
    return total;
  }, 0);
}

function getStockStatus(item) {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.threshold) return "low";
  return "available";
}

function statusLabel(item) {
  const status = getStockStatus(item);
  if (status === "out") return "Out of stock";
  if (status === "low") return "Low stock";
  return "In stock";
}

function statusClass(item) {
  const status = getStockStatus(item);
  if (status === "out") return "out-of-stock";
  if (status === "low") return "low-stock";
  return "in-stock";
}

function recordActivity(type, item, person, quantity, details = "") {
  activity.unshift({
    id: createId(),
    itemId: item.id,
    itemName: item.name,
    type,
    person: person.trim(),
    quantity,
    details,
    timestamp: new Date().toISOString()
  });

  // Keep the newest 1,000 records in this browser.
  activity = activity.slice(0, 1000);
}

function populateCategories() {
  $("itemCategory").innerHTML = CATEGORIES.map((category) =>
    `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
  ).join("");

  $("categoryFilter").innerHTML =
    '<option value="">All categories</option>' +
    CATEGORIES.map((category) =>
      `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
    ).join("");
}

function renderSpecFields(category, values = {}) {
  const fields = CATEGORY_FIELDS[category] || [];

  $("specFields").innerHTML = fields.map((field) => `
    <label>
      ${escapeHTML(field.label)}${field.unit ? ` (${escapeHTML(field.unit)})` : ""}
      <input
        data-spec="${escapeHTML(field.key)}"
        value="${escapeHTML(values[field.key] ?? "")}"
        maxlength="100"
        placeholder="${escapeHTML(field.label)}"
      >
    </label>
  `).join("");
}

function readSpecs() {
  const result = {};
  $("specFields").querySelectorAll("[data-spec]").forEach((input) => {
    result[input.dataset.spec] = input.value.trim();
  });
  return result;
}

function specSummary(item) {
  const fields = CATEGORY_FIELDS[item.category] || [];
  return fields
    .filter((field) => item.specs?.[field.key])
    .map((field) =>
      `${field.label}: ${item.specs[field.key]}${field.unit ? ` ${field.unit}` : ""}`
    )
    .join(" · ");
}

function renderStats() {
  $("totalItems").textContent = items.length;
  $("totalQuantity").textContent = items.reduce(
    (sum, item) => sum + item.quantity, 0
  );
  $("lowStock").textContent = items.filter(
    (item) => getStockStatus(item) === "low" || getStockStatus(item) === "out"
  ).length;
  $("checkedOut").textContent = items.reduce(
    (sum, item) => sum + getCheckedOut(item), 0
  );
}

function renderInventory() {
  const search = $("searchInput").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const status = $("statusFilter").value;

  const filtered = items.filter((item) => {
    const searchable = [
      item.name,
      item.category,
      item.notes,
      specSummary(item)
    ].join(" ").toLowerCase();

    return searchable.includes(search) &&
      (!category || item.category === category) &&
      (!status || getStockStatus(item) === status);
  });

  $("inventoryGrid").innerHTML = filtered.map((item) => {
    const imageURL = item.imageData || safeImageURL(item.imageUrl || "");
    const image = imageURL
      ? `<img src="${escapeHTML(imageURL)}" alt="${escapeHTML(item.name)}" loading="lazy">`
      : `<span class="image-placeholder">＋</span>`;

    return `
      <article class="item-card">
        <div class="item-image">${image}</div>
        <div class="item-content">
          <div class="item-title-row">
            <div>
              <h4>${escapeHTML(item.name)}</h4>
              <div class="category-label">${escapeHTML(item.category)}</div>
            </div>
            <span class="stock-badge ${statusClass(item)}">
              ${statusLabel(item)}
            </span>
          </div>

          <div class="item-quantity">
            ${item.quantity}
            <small>in stock</small>
          </div>

          <div class="item-specs">${escapeHTML(specSummary(item))}</div>
          ${item.notes ? `<div class="item-notes">${escapeHTML(item.notes)}</div>` : ""}

          <div class="item-actions">
            <button class="primary" data-action="checkout" data-id="${item.id}"
              ${item.quantity < 1 ? "disabled" : ""}>Sign out</button>
            <button class="secondary" data-action="return" data-id="${item.id}"
              ${getCheckedOut(item) < 1 ? "disabled" : ""}>Return</button>
            <button class="secondary" data-action="adjust" data-id="${item.id}">Adjust</button>
            <button class="secondary" data-action="edit" data-id="${item.id}">Edit</button>
            <button class="danger-button" data-action="delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  $("emptyInventory").classList.toggle("hidden", filtered.length > 0);
}

const ACTION_LABELS = {
  checkout: "Signed out",
  return: "Returned",
  add: "Stock added",
  remove: "Stock removed",
  set: "Stock set",
  create: "Item created",
  edit: "Item edited",
  delete: "Item deleted"
};

function renderActivity() {
  $("activityBody").innerHTML = activity.slice(0, 100).map((entry) => `
    <tr>
      <td>${escapeHTML(formatDate(entry.timestamp))}</td>
      <td>${escapeHTML(ACTION_LABELS[entry.type] || entry.type)}</td>
      <td>${escapeHTML(entry.itemName)}</td>
      <td>${escapeHTML(entry.person || "—")}</td>
      <td>${entry.quantity === null ? "—" : escapeHTML(entry.quantity)}</td>
    </tr>
  `).join("");

  $("emptyActivity").classList.toggle("hidden", activity.length > 0);
}

function renderAll() {
  renderStats();
  renderInventory();
  renderActivity();
}

function openItemDialog(item = null) {
  $("itemForm").reset();
  $("itemId").value = item?.id || "";
  $("itemDialogTitle").textContent = item ? "Edit inventory item" : "Add inventory item";
  $("itemName").value = item?.name || "";
  $("itemCategory").value = item?.category || CATEGORIES[0];
  $("itemQuantity").value = item?.quantity ?? 0;
  $("itemThreshold").value = item?.threshold ?? 2;
  $("itemImageUrl").value = item?.imageUrl || "";
  $("itemNotes").value = item?.notes || "";
  $("itemImageFile").value = "";

  renderSpecFields($("itemCategory").value, item?.specs || {});
  $("itemDialog").showModal();
}

function openTransactionDialog(item, type) {
  if (!item) return;

  if (type === "checkout" && item.quantity < 1) {
    alert("There are no units available to sign out.");
    return;
  }

  if (type === "return" && getCheckedOut(item) < 1) {
    alert("There are no outstanding checkouts recorded for this item.");
    return;
  }

  $("transactionForm").reset();
  $("transactionItemId").value = item.id;
  $("transactionType").value = type;
  $("transactionTitle").textContent =
    type === "checkout" ? "Sign out item" : "Return item";
  $("transactionItemName").textContent =
    `${item.name} · ${item.quantity} currently in stock`;
  $("transactionQuantity").value = 1;
  $("transactionQuantity").max = type === "checkout"
    ? item.quantity
    : getCheckedOut(item);

  $("transactionDialog").showModal();
}

function openAdjustDialog(item) {
  $("adjustForm").reset();
  $("adjustItemId").value = item.id;
  $("adjustItemName").textContent =
    `${item.name} · Current stock: ${item.quantity}`;
  $("adjustQuantity").value = 1;
  $("adjustMode").value = "add";
  $("adjustDialog").showModal();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");

    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      reject(new Error("Image must be 1.5 MB or smaller."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

$("itemCategory").addEventListener("change", () => {
  renderSpecFields($("itemCategory").value);
});

$("addItemBtn").addEventListener("click", () => openItemDialog());

["searchInput", "categoryFilter", "statusFilter"].forEach((id) => {
  $(id).addEventListener("input", renderInventory);
  $(id).addEventListener("change", renderInventory);
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    $(button.dataset.close).close();
  });
});

$("inventoryGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const item = getItem(button.dataset.id);
  if (!item) return;

  switch (button.dataset.action) {
    case "checkout":
    case "return":
      openTransactionDialog(item, button.dataset.action);
      break;

    case "adjust":
      openAdjustDialog(item);
      break;

    case "edit":
      openItemDialog(item);
      break;

    case "delete": {
      const confirmed = confirm(
        `Delete "${item.name}"? This cannot be undone.`
      );

      if (!confirmed) return;

      recordActivity("delete", item, "Inventory manager", null);
      items = items.filter((entry) => entry.id !== item.id);
      saveData();
      renderAll();
      break;
    }
  }
});

$("itemForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = $("itemId").value;
  const oldItem = id ? getItem(id) : null;
  const name = $("itemName").value.trim();
  const category = $("itemCategory").value;
  const quantity = Number($("itemQuantity").value);
  const threshold = Number($("itemThreshold").value);
  const imageUrl = safeImageURL($("itemImageUrl").value.trim());
  const file = $("itemImageFile").files[0];

  if (!name) {
    alert("Enter an item name.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 0 ||
      !Number.isInteger(threshold) || threshold < 0) {
    alert("Quantity and low-stock threshold must be whole numbers of zero or more.");
    return;
  }

  if ($("itemImageUrl").value.trim() && !imageUrl) {
    alert("Enter a valid HTTP or HTTPS image URL.");
    return;
  }

  try {
    const imageData = file
      ? await readFileAsDataURL(file)
      : oldItem?.imageData || "";

    const item = {
      id: id || createId(),
      name,
      category,
      quantity,
      threshold,
      imageUrl,
      imageData,
      notes: $("itemNotes").value.trim(),
      specs: readSpecs(),
      createdAt: oldItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (oldItem) {
      // Preserve the existing stock level. Use Adjust to record stock changes.
      item.quantity = oldItem.quantity;
      items = items.map((entry) => entry.id === id ? item : entry);
      recordActivity("edit", item, "Inventory manager", null);
    } else {
      items.unshift(item);
      recordActivity("create", item, "Inventory manager", quantity);
    }

    saveData();
    renderAll();
    $("itemDialog").close();
  } catch (error) {
    alert(error.message || "Could not save the item.");
  }
});

$("transactionForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const item = getItem($("transactionItemId").value);
  if (!item) return;

  const type = $("transactionType").value;
  const person = $("transactionPerson").value.trim();
  const quantity = Number($("transactionQuantity").value);

  if (!person) {
    alert("Enter the person's name.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    alert("Quantity must be a whole number greater than zero.");
    return;
  }

  if (type === "checkout") {
    if (quantity > item.quantity) {
      alert("There is not enough stock available.");
      return;
    }

    item.quantity -= quantity;
    recordActivity("checkout", item, person, quantity);
  } else {
    if (quantity > getCheckedOut(item)) {
      alert("The return quantity exceeds the recorded outstanding checkouts.");
      return;
    }

    item.quantity += quantity;
    recordActivity("return", item, person, quantity);
  }

  item.updatedAt = new Date().toISOString();
  saveData();
  renderAll();
  $("transactionDialog").close();
});

$("adjustForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const item = getItem($("adjustItemId").value);
  if (!item) return;

  const person = $("adjustPerson").value.trim();
  const quantity = Number($("adjustQuantity").value);
  const mode = $("adjustMode").value;

  if (!person) {
    alert("Enter the person's name.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    alert("Enter a whole number of zero or more.");
    return;
  }

  if (mode === "add") {
    item.quantity += quantity;
  } else if (mode === "remove") {
    if (quantity > item.quantity) {
      alert("You cannot remove more than the current stock.");
      return;
    }
    item.quantity -= quantity;
  } else {
    item.quantity = quantity;
  }

  item.updatedAt = new Date().toISOString();
  recordActivity(mode, item, person, quantity);
  saveData();
  renderAll();
  $("adjustDialog").close();
});

$("exportBtn").addEventListener("click", () => {
  const headers = [
    "Name", "Category", "Quantity", "Low-stock threshold",
    "Checked out", "Specifications", "Notes", "Image URL"
  ];

  const rows = items.map((item) => [
    item.name,
    item.category,
    item.quantity,
    item.threshold,
    getCheckedOut(item),
    specSummary(item),
    item.notes,
    item.imageUrl
  ]);

  const csvCell = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "frc5719-inventory.csv";
  link.click();
  URL.revokeObjectURL(url);
});

populateCategories();
renderAll();
