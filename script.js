let data = [];
try {
  data = JSON.parse(localStorage.getItem("keuangan") || "[]");
} catch (e) {}
const $ = (id) => document.getElementById(id);
const rp = (n) => "Rp " + n.toLocaleString("id-ID");
const form = $("f");
const submitEntry = $("submit-entry");
const cancelEditButton = $("cancel-edit");
const themeToggle = $("theme-toggle");
let savedTheme = null;
try {
  savedTheme = localStorage.getItem("tema");
} catch (e) {}
if (savedTheme === "light" || savedTheme === "dark") {
  document.documentElement.dataset.theme = savedTheme;
}
function isDarkTheme() {
  const theme = document.documentElement.dataset.theme;
  return theme
    ? theme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function updateThemeToggle() {
  const isDark = isDarkTheme();
  themeToggle.textContent = isDark ? "Mode terang" : "Mode gelap";
  themeToggle.setAttribute("aria-pressed", String(isDark));
}
themeToggle.addEventListener("click", () => {
  const theme = isDarkTheme() ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("tema", theme);
  } catch (e) {}
  updateThemeToggle();
});
updateThemeToggle();
const tgl = (s) =>
  new Date(s + "T00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
$("f").tgl.value = new Date().toISOString().slice(0, 10);
function save() {
  try {
    localStorage.setItem("keuangan", JSON.stringify(data));
  } catch (e) {}
}
function resetEdit() {
  delete form.dataset.editId;
  form.reset();
  form.tgl.value = new Date().toISOString().slice(0, 10);
  submitEntry.textContent = "Tambah catatan";
  cancelEditButton.hidden = true;
}
cancelEditButton.addEventListener("click", resetEdit);
function esc(s) {
  return s.replace(
    /[&<>\"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[c],
  );
}
function render() {
  let sum = { in: 0, out: 0 };
  for (const j of ["in", "out"]) {
    const items = data
      .filter((d) => d.jenis === j)
      .sort((a, b) => b.tgl.localeCompare(a.tgl));
    sum[j] = items.reduce((a, d) => a + d.nominal, 0);
    $("l" + j).innerHTML = items.length
      ? items
          .map(
            (d) =>
              `<li><div>${esc(d.ket)}<small>${tgl(d.tgl)}</small></div><div class="entry-actions"><span class="amt">${rp(d.nominal)}</span><button type="button" class="edit-button" data-edit-id="${d.id}" aria-label="Edit catatan">Edit</button><button type="button" data-id="${d.id}" aria-label="Hapus">×</button></div></li>`,
          )
          .join("")
      : '<div class="empty">Belum ada catatan.</div>';
    $("t" + j).textContent = rp(sum[j]);
  }
  $("saldo").textContent = rp(sum.in - sum.out);
}
$("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const editId = f.dataset.editId;
  const entry = {
    id: editId ? Number(editId) : Date.now(),
    jenis: f.jenis.value,
    nominal: +f.nominal.value,
    tgl: f.tgl.value,
    ket: f.ket.value.trim(),
  };
  if (editId) {
    const index = data.findIndex((d) => String(d.id) === editId);
    if (index !== -1) data[index] = entry;
  } else {
    data.push(entry);
  }
  save();
  render();
  resetEdit();
  f.nominal.focus();
});
document.addEventListener("click", (e) => {
  const editId = e.target.dataset && e.target.dataset.editId;
  if (editId) {
    const entry = data.find((d) => String(d.id) === editId);
    if (!entry) return;
    form.dataset.editId = editId;
    form.jenis.value = entry.jenis;
    form.nominal.value = entry.nominal;
    form.tgl.value = entry.tgl;
    form.ket.value = entry.ket;
    submitEntry.textContent = "Simpan perubahan";
    cancelEditButton.hidden = false;
    form.nominal.focus();
    return;
  }
  const id = e.target.dataset && e.target.dataset.id;
  if (id) {
    if (form.dataset.editId === id) resetEdit();
    data = data.filter((d) => d.id != id);
    save();
    render();
  }
});
render();
