let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let typeFilter = 'all'; // 'all' | 'pemasukan' | 'pengeluaran'

function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTable();
}

function addTransaction() {
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (!date || !category || !amount) {
    alert("Isi semua data dengan benar!");
    return;
  }

  transactions.push({ id: Date.now(), date, type, category, amount, note });
  saveData();

  // kosongkan input
  document.getElementById("date").value = "";
  document.getElementById("category").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
}

// Modal handlers
function openModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  // apply theme based on selected type
  applyModalTheme();
  // focus first input
  setTimeout(() => { const d = document.getElementById('date'); if (d) d.focus(); }, 50);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.style.display = 'none';
}

function submitModal() {
  // validate here briefly then call addTransaction()
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  if (!date || !category || !amount) {
    alert("Isi semua data dengan benar!");
    return;
  }

  const editId = document.getElementById('editId').value;
  if (editId) {
    // save edits
    saveEditedTransaction(parseInt(editId, 10));
  } else {
    // reuse existing function to add
    addTransaction();
  }
  closeModal();
}

// open modal to edit an existing transaction
function openEditModal(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  document.getElementById('modalTitle').innerText = 'Edit Transaksi';
  document.getElementById('date').value = t.date;
  document.getElementById('type').value = t.type;
  document.getElementById('category').value = t.category;
  document.getElementById('amount').value = t.amount;
  document.getElementById('note').value = t.note;
  document.getElementById('editId').value = t.id;
  applyModalTheme();
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.style.display = 'block';
}

function saveEditedTransaction(id) {
  const idx = transactions.findIndex(t => t.id === id);
  if (idx === -1) return;
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (!date || !category || !amount) {
    alert("Isi semua data dengan benar!");
    return;
  }

  transactions[idx] = { id, date, type, category, amount, note };
  // clear editId
  document.getElementById('editId').value = '';
  document.getElementById('modalTitle').innerText = 'Tambah Transaksi';
  saveData();
}

function setTypeFilter(filter) {
  typeFilter = filter;
  // update active button UI
  document.querySelectorAll('.type-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
  if (filter === 'all') document.getElementById('toggle-all').classList.add('active');
  if (filter === 'pemasukan') document.getElementById('toggle-income').classList.add('active');
  if (filter === 'pengeluaran') document.getElementById('toggle-expense').classList.add('active');
  renderTable();
}

// apply modal theme (income/expense) by toggling classes on .modal
function applyModalTheme() {
  const sel = document.getElementById('type');
  const modal = document.querySelector('#modalOverlay .modal');
  if (!modal || !sel) return;
  modal.classList.remove('income','expense');
  if (sel.value === 'pemasukan') modal.classList.add('income');
  else modal.classList.add('expense');
}

// ensure theme updates when user changes the select
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('type');
  if (sel) sel.addEventListener('change', applyModalTheme);
});

function renderTable() {
  const tbody = document.querySelector("#transactionTable tbody");
  tbody.innerHTML = "";
  // build month filter options
  populateMonthFilter();

  const selected = document.getElementById("monthFilter").value;

  // group transactions by YYYY-MM
  const groups = {};
  transactions.forEach((t) => {
    const monthKey = t.date.slice(0, 7); // YYYY-MM
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(t);
  });

  // sort month keys descending
  const monthKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  let totalIncome = 0, totalExpense = 0;

  monthKeys.forEach((mk) => {
    // if filter is set and doesn't match, skip
    if (selected !== 'all' && selected !== mk) return;

    // add month header row
    const monthRow = document.createElement('tr');
    monthRow.className = 'month-header';
    const th = document.createElement('td');
    th.colSpan = 6;
    th.innerText = formatMonthLabel(mk);
    monthRow.appendChild(th);
    tbody.appendChild(monthRow);

    // sort transactions by date ascending within the month
    groups[mk].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => {
      // apply type filter (toggle)
      if (typeFilter !== 'all' && t.type !== typeFilter) return;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${t.amount.toLocaleString()}</td>
        <td>${t.note}</td>
        <td>
          <button class="edit" onclick="openEditModal(${t.id})">Edit</button>
          <button class="delete" onclick="deleteTransaction(${t.id})">Hapus</button>
        </td>
      `;
      tbody.appendChild(row);

      if (t.type === "pemasukan") {
        if (selected === 'all' || selected === mk) totalIncome += t.amount;
      } else {
        if (selected === 'all' || selected === mk) totalExpense += t.amount;
      }
    });
  });

  document.getElementById("income").innerText = totalIncome.toLocaleString();
  document.getElementById("expense").innerText = totalExpense.toLocaleString();
  document.getElementById("balance").innerText = (totalIncome - totalExpense).toLocaleString();
}

// populate month filter with available months
function populateMonthFilter() {
  const select = document.getElementById('monthFilter');
  // remember current selection
  const current = select.value || 'all';
  // collect unique months
  const months = new Set();
  transactions.forEach(t => months.add(t.date.slice(0,7)));

  // clear existing (keep 'all')
  select.innerHTML = '<option value="all">Semua Bulan</option>';

  // sort ascending so oldest first
  Array.from(months).sort((a,b) => b.localeCompare(a)).forEach(mk => {
    const opt = document.createElement('option');
    opt.value = mk;
    opt.innerText = formatMonthLabel(mk);
    select.appendChild(opt);
  });

  // restore selection if still available
  if (current && Array.from(select.options).some(o => o.value === current)) select.value = current;
}

function formatMonthLabel(ym) {
  // ym = 'YYYY-MM'
  const [y, m] = ym.split('-');
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const mi = parseInt(m,10) - 1;
  return `${monthNames[mi]} ${y}`;
}

// Jalankan saat halaman dibuka
renderTable();
