let transactions =
  JSON.parse(localStorage.getItem("transactions")) || [];

let typeFilter = "all";

function saveData() {
  localStorage.setItem(
    "transactions",
    JSON.stringify(transactions)
  );

  renderTable();
}

function openModal() {
  document.getElementById("modalOverlay").style.display = "flex";
}

function closeModal() {
  document.getElementById("modalOverlay").style.display = "none";

  document.getElementById("editId").value = "";
  document.getElementById("modalTitle").innerText =
    "Tambah Transaksi";

  clearForm();
}

function clearForm() {
  document.getElementById("date").value = "";
  document.getElementById("category").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
}

function submitModal() {

  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const amount = parseFloat(
    document.getElementById("amount").value
  );
  const note = document.getElementById("note").value;

  if (!date || !category || !amount) {
    alert("Isi semua data!");
    return;
  }

  const editId =
    document.getElementById("editId").value;

  if (editId) {

    const index = transactions.findIndex(
      (t) => t.id == editId
    );

    transactions[index] = {
      id: Number(editId),
      date,
      type,
      category,
      amount,
      note,
    };

  } else {

    transactions.push({
      id: Date.now(),
      date,
      type,
      category,
      amount,
      note,
    });

  }

  saveData();
  closeModal();
}

function openEditModal(id) {

  const t = transactions.find(
    (item) => item.id === id
  );

  if (!t) return;

  document.getElementById("modalTitle").innerText =
    "Edit Transaksi";

  document.getElementById("editId").value = t.id;
  document.getElementById("date").value = t.date;
  document.getElementById("type").value = t.type;
  document.getElementById("category").value = t.category;
  document.getElementById("amount").value = t.amount;
  document.getElementById("note").value = t.note;

  openModal();
}

function deleteTransaction(id) {

  if (!confirm("Hapus transaksi ini?")) return;

  transactions = transactions.filter(
    (t) => t.id !== id
  );

  saveData();
}

function setTypeFilter(filter) {

  typeFilter = filter;

  document
    .querySelectorAll(".toggle-btn")
    .forEach((btn) =>
      btn.classList.remove("active")
    );

  if (filter === "all")
    document
      .getElementById("toggle-all")
      .classList.add("active");

  if (filter === "pemasukan")
    document
      .getElementById("toggle-income")
      .classList.add("active");

  if (filter === "pengeluaran")
    document
      .getElementById("toggle-expense")
      .classList.add("active");

  renderTable();
}

function renderTable() {

  const tbody =
    document.querySelector(
      "#transactionTable tbody"
    );

  tbody.innerHTML = "";

  populateMonthFilter();

  const selectedMonth =
    document.getElementById("monthFilter").value;

  let income = 0;
  let expense = 0;

  const grouped = {};

  transactions.forEach((t) => {

    const monthKey = t.date.slice(0, 7);

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }

    grouped[monthKey].push(t);
  });

  const monthKeys = Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a));

  monthKeys.forEach((month) => {

    if (
      selectedMonth !== "all" &&
      selectedMonth !== month
    ) return;

    const header = document.createElement("tr");
    header.classList.add("month-header");

    header.innerHTML = `
      <td colspan="6">
        ${formatMonthLabel(month)}
      </td>
    `;

    tbody.appendChild(header);

    grouped[month]
      .sort((a, b) =>
        b.date.localeCompare(a.date)
      )

      .forEach((t) => {

        if (
          typeFilter !== "all" &&
          t.type !== typeFilter
        ) return;

        if (t.type === "pemasukan") {
          income += t.amount;
        } else {
          expense += t.amount;
        }

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${t.date}</td>

          <td>
            ${
              t.type === "pemasukan"
                ? "🟢 Pemasukan"
                : "🔴 Pengeluaran"
            }
          </td>

          <td>${t.category}</td>

          <td>
            Rp ${t.amount.toLocaleString("id-ID")}
          </td>

          <td>${t.note || "-"}</td>

          <td>
            <button class="edit"
              onclick="openEditModal(${t.id})">
              Edit
            </button>

            <button class="delete"
              onclick="deleteTransaction(${t.id})">
              Hapus
            </button>
          </td>
        `;

        tbody.appendChild(row);
      });
  });

  document.getElementById("income").innerText =
    "Rp " + income.toLocaleString("id-ID");

  document.getElementById("expense").innerText =
    "Rp " + expense.toLocaleString("id-ID");

  document.getElementById("balance").innerText =
    "Rp " +
    (income - expense).toLocaleString("id-ID");
}

function populateMonthFilter() {

  const select =
    document.getElementById("monthFilter");

  const current = select.value || "all";

  const months = new Set();

  transactions.forEach((t) => {
    months.add(t.date.slice(0, 7));
  });

  select.innerHTML =
    '<option value="all">Semua Bulan</option>';

  Array.from(months)
    .sort((a, b) => b.localeCompare(a))

    .forEach((month) => {

      const option =
        document.createElement("option");

      option.value = month;
      option.innerText =
        formatMonthLabel(month);

      select.appendChild(option);
    });

  select.value = current;
}

function formatMonthLabel(month) {

  const [year, monthNumber] =
    month.split("-");

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return `${
    months[parseInt(monthNumber) - 1]
  } ${year}`;
}

renderTable();
