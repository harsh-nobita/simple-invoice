let logoDataUrl = "";

// ===== Add new item row =====
function addItem() {
  const tbody = document.getElementById("itemsBody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text" class="desc"></td>
    <td><input type="number" class="qty" value="1"></td>
    <td><input type="number" class="price" value="0"></td>
    <td><input type="number" class="discount" value="0"></td>
    <td class="rowTotal">0</td>
    <td><button type="button" onclick="this.parentElement.parentElement.remove()">X</button></td>
  `;

  tbody.appendChild(row);

  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", updateRowTotal);
  });
}

// ===== Update row total =====
function updateRowTotal() {
  const row = this.closest("tr");
  const qty = parseFloat(row.querySelector(".qty").value) || 0;
  const price = parseFloat(row.querySelector(".price").value) || 0;
  const discount = parseFloat(row.querySelector(".discount").value) || 0;
  const total = qty * price - discount;
  row.querySelector(".rowTotal").textContent = total.toFixed(2);
}

// ===== Save invoice =====
function saveInvoice() {
  const items = [];
  document.querySelectorAll("#itemsBody tr").forEach(row => {
    items.push({
      desc: row.querySelector(".desc").value,
      qty: row.querySelector(".qty").value,
      price: row.querySelector(".price").value,
      discount: row.querySelector(".discount").value,
      total: row.querySelector(".rowTotal").textContent
    });
  });

  const invoiceData = {
    number: document.getElementById("invoiceNumber").value,
    date: document.getElementById("invoiceDate").value,
    due: document.getElementById("dueDate").value,
    terms: document.getElementById("paymentTerms").value,
    currency: document.getElementById("currency").value,
    from: document.getElementById("fromDetails").value,
    billTo: document.getElementById("billToDetails").value,
    paymentMethod: document.getElementById("paymentMethod").value,
    bank: document.getElementById("bankDetails").value,
    tax: document.getElementById("taxPercent").value,
    shipping: document.getElementById("shipping").value,
    notes: document.getElementById("notes").value,
    termsText: document.getElementById("terms").value,
    logo: logoDataUrl,
    items
  };

  localStorage.setItem("invoice", JSON.stringify(invoiceData));
  renderInvoice(invoiceData);
}

// ===== Render invoice preview =====
function renderInvoice(data) {
  const currencySymbol = getCurrencySymbol(data.currency);

  document.getElementById("previewNumber").textContent = data.number || "";
  document.getElementById("previewDate").textContent = data.date || "";
  document.getElementById("previewDue").textContent = data.due || "";
  document.getElementById("previewTerms").textContent = data.terms || "";
  document.getElementById("previewCurrency").textContent = data.currency || "";
  document.getElementById("previewFrom").textContent = data.from || "";
  document.getElementById("previewBillTo").textContent = data.billTo || "";
  document.getElementById("previewPaymentMethod").textContent = data.paymentMethod || "";
  
  // Show bank details only if payment method is Bank Transfer
  document.getElementById("previewBank").textContent =
    data.paymentMethod === "Bank Transfer" ? data.bank : "";

  document.getElementById("previewNotes").textContent = data.notes || "";
  document.getElementById("previewTerms2").textContent = data.termsText || "";

  // Logo
  const logo = document.getElementById("previewLogo");
  if (data.logo) {
    logo.src = data.logo;
    logo.style.display = "block";
  } else {
    logo.style.display = "none";
  }

  // Items
  const tbody = document.getElementById("previewItems");
  tbody.innerHTML = "";
  let subtotal = 0;
  data.items.forEach(item => {
    subtotal += parseFloat(item.total) || 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.desc}</td>
      <td>${item.qty}</td>
      <td>${currencySymbol}${parseFloat(item.price).toFixed(2)}</td>
      <td>${currencySymbol}${parseFloat(item.discount).toFixed(2)}</td>
      <td>${currencySymbol}${parseFloat(item.total).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  const tax = (subtotal * (parseFloat(data.tax) || 0)) / 100;
  const shipping = parseFloat(data.shipping) || 0;
  const grandTotal = subtotal + tax + shipping;

  document.getElementById("previewTax").textContent = currencySymbol + tax.toFixed(2);
  document.getElementById("previewShipping").textContent = currencySymbol + shipping.toFixed(2);
  document.getElementById("previewGrandTotal").textContent = currencySymbol + grandTotal.toFixed(2);
}

// ===== Get currency symbol =====
function getCurrencySymbol(currency) {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    case "INR": return "₹";
    default: return "";
  }
}

// ===== Logo upload =====
document.getElementById("logoUpload").addEventListener("change", function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function() {
    logoDataUrl = reader.result;
  };
  if (file) reader.readAsDataURL(file);
});

// ===== Download PDF with proper settings =====
document.getElementById("downloadBtn").addEventListener("click", () => {
  const invoice = document.getElementById("invoicePreview");

  // Temporarily remove max-height and overflow for PDF
  invoice.style.maxHeight = "none";
  invoice.style.overflow = "visible";

  const invoiceNumber = document.getElementById("invoiceNumber").value || 'New';
  const opt = {
    margin:       [10,10,10,10],
    filename:     `Invoice_${invoiceNumber}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(invoice).save().then(() => {
    // Restore the scrollable layout after PDF is generated
    invoice.style.maxHeight = "90vh";
    invoice.style.overflow = "auto";
  });
});

// ===== Clear invoice =====
document.getElementById("clearBtn").addEventListener("click", () => {
  localStorage.removeItem("invoice");
  renderInvoice({});
  document.getElementById("invoiceForm").reset();
  document.getElementById("itemsBody").innerHTML = "";
});

// ===== Load saved invoice on page load =====
window.onload = () => {
  const saved = localStorage.getItem("invoice");
  if (saved) {
    renderInvoice(JSON.parse(saved));
  }
};
