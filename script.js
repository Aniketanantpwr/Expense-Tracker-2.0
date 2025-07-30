const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const totalAmountDisplay = document.getElementById("total-amount");
const billSelect = document.getElementById("bill");
const billImageGroup = document.getElementById("bill-image-group");
const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const budgetAmountDisplay = document.getElementById("budget-amount");
const remainingBudgetDisplay = document.getElementById("remaining-budget");
const budgetInput = document.getElementById("budget");
const setBudgetBtn = document.getElementById("set-budget");
const progressFill = document.getElementById("progress-fill");

let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let budget = Number(localStorage.getItem("budget") || 0);

billSelect.addEventListener("change", () => {
  billImageGroup.style.display = billSelect.value === "Yes" ? "block" : "none";
});

setBudgetBtn.addEventListener("click", () => {
  budget = Number(budgetInput.value) || 0;
  localStorage.setItem("budget", budget);
  updateTotals();
});

function updateTotals() {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  totalAmountDisplay.textContent = total;
  budgetAmountDisplay.textContent = budget;

  const remaining = budget - total;
  remainingBudgetDisplay.textContent = remaining;

  let percentage = 0;
  if (budget > 0) {
    percentage = Math.max(0, Math.min(100, ((remaining / budget) * 100)));
  }

  progressFill.style.width = percentage + "%";
  progressFill.textContent = percentage.toFixed(0) + "%";

  if (remaining >= 0) {
    if (percentage > 50) {
      progressFill.style.background = "#4CAF50";
    } else if (percentage > 20) {
      progressFill.style.background = "#FF9800";
    } else {
      progressFill.style.background = "#f44336";
    }
  } else {
    progressFill.style.background = "#f44336";
    progressFill.textContent = "Over Budget!";
  }

  remainingBudgetDisplay.style.color = remaining < 0 ? "#f44336" : "#4CAF50";
}

function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `
      <span><strong>Type:</strong> ${item.type}</span>
      <span><strong>Description:</strong> ${item.description}</span>
      <span><strong>Amount:</strong> ₹${item.amount}</span>
      <span><strong>Bill:</strong> ${item.bill}${item.image ? ` - <a href="#" onclick="showImage('${item.image}')">View</a>` : ""}</span>
      <span><strong>Date:</strong> ${item.date}</span>
      <button class="edit-btn" onclick="openEditPopup(${index})">✎</button>
      <button class="delete-btn" onclick="deleteExpense(${index})">×</button>
    `;
    expenseList.appendChild(div);
  });
  updateTotals();
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// ✅ Force Clear Inputs
function clearInputs() {
  document.getElementById("type").selectedIndex = 0;
  document.getElementById("description").value = "";
  document.getElementById("amount").value = "";
  billSelect.value = "No";
  billImageGroup.style.display = "none";
  document.getElementById("date").value = "";

  // 🔁 Replace file input with clone to reset it on all browsers
  const oldInput = document.getElementById("bill-image");
  const newInput = oldInput.cloneNode(true);
  oldInput.parentNode.replaceChild(newInput, oldInput);
}

function deleteExpense(index) {
  expenses.splice(index, 1);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  renderExpenses();
}

expenseForm.addEventListener("submit", e => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const description = document.getElementById("description").value;
  const amount = Number(document.getElementById("amount").value);
  const bill = billSelect.value;
  const date = document.getElementById("date").value;
  const billImageInput = document.getElementById("bill-image");
  const billImage = billImageInput.files[0];

  if (bill === "Yes" && billImage) {
    const reader = new FileReader();
    reader.onloadend = () => {
      expenses.push({ type, description, amount, bill, date, image: reader.result });
      localStorage.setItem("expenses", JSON.stringify(expenses));
      renderExpenses();
      clearInputs();
    };
    reader.readAsDataURL(billImage);
  } else {
    expenses.push({ type, description, amount, bill, date, image: null });
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    clearInputs();
  }
});

document.getElementById("export-csv").addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8,Type,Description,Amount,Bill,Date\n";
  expenses.forEach(item => {
    const row = [item.type, item.description, item.amount, item.bill, item.date].join(",");
    csvContent += row + "\n";
  });
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "expenses.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.getElementById("export-pdf").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.text(`Budget: ₹${budget} | Remaining: ₹${budget - expenses.reduce((s, e) => s + Number(e.amount), 0)}`, 10, y);
  y += 10;

  expenses.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.date} | ${item.type} | ₹${item.amount}`, 10, y);
    y += 7;
    doc.text(`Description: ${item.description}`, 10, y);
    y += 7;
    if (item.image) {
      try {
        doc.addImage(item.image, 'JPEG', 10, y, 50, 30);
        y += 35;
      } catch (err) {
        y += 5;
      }
    }
    y += 5;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });
  doc.save("expenses.pdf");
});

function openEditPopup(index) {
  const item = expenses[index];
  document.getElementById("edit-index").value = index;
  document.getElementById("edit-type").value = item.type;
  document.getElementById("edit-description").value = item.description;
  document.getElementById("edit-amount").value = item.amount;
  document.getElementById("edit-bill").value = item.bill;
  document.getElementById("edit-date").value = item.date;
  document.getElementById("edit-popup").style.display = "flex";
}

document.getElementById("cancel-edit").addEventListener("click", () => {
  document.getElementById("edit-popup").style.display = "none";
});

document.getElementById("edit-form").addEventListener("submit", e => {
  e.preventDefault();
  const index = document.getElementById("edit-index").value;
  expenses[index] = {
    ...expenses[index],
    type: document.getElementById("edit-type").value,
    description: document.getElementById("edit-description").value,
    amount: Number(document.getElementById("edit-amount").value),
    bill: document.getElementById("edit-bill").value,
    date: document.getElementById("edit-date").value
  };
  document.getElementById("edit-popup").style.display = "none";
  localStorage.setItem("expenses", JSON.stringify(expenses));
  renderExpenses();
});

function showImage(src) {
  modal.style.display = "block";
  modalImage.src = src;
}

function closeImageModal() {
  modal.style.display = "none";
}

updateTotals();
renderExpenses();
