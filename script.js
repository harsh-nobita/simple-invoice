let logoDataUrl = "";

// ===== Add New Item =====
function addItem() {
  const tbody = document.getElementById("itemsBody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text" class="desc"></td>
    <td><input type="number" class="qty" value="1" min="0"></td>
    <td><input type="number" class="price" value="0" min="0"></td>
    <td><input type="number" class="discount" value="0" min="0"></td>
    <td class="rowTotal">0</td>
    <td><button type="button" onclick="this.parentElement.parentElement.remove()">X</button></td>
  `;

  tbody.appendChild(row);
  row.querySelectorAll("input").forEach(input => input.addEventListener("input", updateRowTotal));
}

// ===== Update Row Total with Percentage Discount =====
function updateRowTotal() {
  const row = this.closest("tr");
  const qty = parseFloat(row.querySelector(".qty").value) || 0;
  const price = parseFloat(row.querySelector(".price").value) || 0;
  const discount = parseFloat(row.querySelector(".discount").value) || 0;
  const total = qty * price * (1 - discount / 100);
  row.querySelector(".rowTotal").textContent = total.toFixed(2);
}

// ===== Save Invoice to localStorage =====
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
    gstPercent: document.getElementById("gstPercent").value || 0,
    tax: document.getElementById("taxPercent").value || 0,
    shipping: parseFloat(document.getElementById("shipping").value) || 0,
    notes: document.getElementById("notes").value,
    termsText: document.getElementById("terms").value,
    logo: logoDataUrl,
    items
  };

  localStorage.setItem("invoice", JSON.stringify(invoiceData));
  alert("Invoice saved successfully!");
}

// ===== Logo Upload =====
document.getElementById("logoUpload").addEventListener("change", function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function() { logoDataUrl = reader.result; };
  if(file) reader.readAsDataURL(file);
});

// ===== Download PDF =====
document.getElementById("downloadBtn").addEventListener("click", () => {
  const saved = JSON.parse(localStorage.getItem("invoice") || "{}");
  if (!saved.items || saved.items.length === 0) {
    alert("Please add at least one item!");
    return;
  }

  const currencySymbol = saved.currency === "INR" ? "₹" : saved.currency === "USD" ? "$" : "€";
  let subtotal = 0;
  saved.items.forEach(item => subtotal += parseFloat(item.total) || 0);

  let taxText = "";
  let totalTax = 0;
  if(saved.currency === "INR") {
    const gst = parseFloat(saved.gstPercent) || 0;
    const sgst = subtotal * gst / 200;
    const cgst = subtotal * gst / 200;
    totalTax = sgst + cgst;
    taxText = `SGST (${gst/2}%) : ${currencySymbol}${sgst.toFixed(2)}\nCGST (${gst/2}%) : ${currencySymbol}${cgst.toFixed(2)}`;
  } else {
    const taxPercent = parseFloat(saved.tax) || 0;
    totalTax = subtotal * taxPercent / 100;
    taxText = `Tax (${taxPercent}%) : ${currencySymbol}${totalTax.toFixed(2)}`;
  }

  const grandTotal = subtotal + totalTax + (parseFloat(saved.shipping) || 0);

  // Create temporary div for PDF
  const tempDiv = document.createElement("div");
  tempDiv.style.padding = "20px";
  tempDiv.style.fontFamily = "Arial, Helvetica, sans-serif";
  tempDiv.innerHTML = `
    ${saved.logo ? `<img src="${saved.logo}" style="height:60px;margin-bottom:10px;">` : ""}
    <h2 style="color:#4f46e5;">Invoice #${saved.number || ""}</h2>
    <p><strong>Date:</strong> ${saved.date || ""} | <strong>Due:</strong> ${saved.due || ""} | <strong>Currency:</strong> ${saved.currency}</p>
    <p><strong>From:</strong><br>${saved.from.replace(/\n/g,"<br>")}</p>
    <p><strong>Bill To:</strong><br>${saved.billTo.replace(/\n/g,"<br>")}</p>
    <table style="width:100%; border-collapse: collapse; margin-top:15px;">
      <thead>
        <tr style="background:#4f46e5; color:white;">
          <th>Description</th><th>Qty</th><th>Price</th><th>Discount %</th><th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${saved.items.filter(i => i.desc.trim()!=="").map(item => `
          <tr>
            <td>${item.desc}</td>
            <td>${item.qty}</td>
            <td>${currencySymbol}${parseFloat(item.price).toFixed(2)}</td>
            <td>${item.discount}</td>
            <td>${currencySymbol}${parseFloat(item.total).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <p style="text-align:right; margin-top:10px;">
      <strong>Subtotal:</strong> ${currencySymbol}${subtotal.toFixed(2)}<br>
      ${taxText.split("\n").join("<br>")}<br>
      <strong>Shipping:</strong> ${currencySymbol}${(parseFloat(saved.shipping)||0).toFixed(2)}<br>
      <strong>Grand Total:</strong> ${currencySymbol}${grandTotal.toFixed(2)}
    </p>
    <p><strong>Payment Method:</strong> ${saved.paymentMethod} | <strong>Bank:</strong> ${saved.bank}</p>
    <p><strong>Notes:</strong> ${saved.notes}</p>
    <p><strong>Terms:</strong> ${saved.termsText}</p>
    <p style="text-align:center; margin-top:20px; font-size:12px; color:#555;">
      Crafted with ease using HNS Invoice Generator. Please visit abc.com for creating free professional invoices.
    </p>
  `;

  html2pdf().set({
    margin:10,
    filename:`Invoice_${saved.number||"HNS"}.pdf`,
    image:{type:'jpeg', quality:0.98},
    html2canvas:{scale:2, scrollY:0},
    jsPDF:{unit:'mm', format:'a4', orientation:'portrait'}
  }).from(tempDiv).save();
});

// ===== Clear Invoice =====
document.getElementById("clearBtn").addEventListener("click", () => {
  localStorage.removeItem("invoice");
  document.getElementById("invoiceForm").reset();
  document.getElementById("itemsBody").innerHTML = "";
});

// ===== Load saved invoice =====
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("invoice") || "{}");
  if(!saved.items) return;

  // Populate items
  saved.items.forEach(() => addItem());
  const rows = document.querySelectorAll("#itemsBody tr");
  saved.items.forEach((item,i)=>{
    rows[i].querySelector(".desc").value = item.desc;
    rows[i].querySelector(".qty").value = item.qty;
    rows[i].querySelector(".price").value = item.price;
    rows[i].querySelector(".discount").value = item.discount;
    updateRowTotal.call(rows[i].querySelector(".qty"));
  });

  // Populate other fields
  document.getElementById("invoiceNumber").value = saved.number || '';
  document.getElementById("invoiceDate").value = saved.date || '';
  document.getElementById("dueDate").value = saved.due || '';
  document.getElementById("paymentTerms").value = saved.terms || '';
  document.getElementById("currency").value = saved.currency || '';
  document.getElementById("fromDetails").value = saved.from || '';
  document.getElementById("billToDetails").value = saved.billTo || '';
  document.getElementById("paymentMethod").value = saved.paymentMethod || '';
  document.getElementById("bankDetails").value = saved.bank || '';
  document.getElementById("gstPercent").value = saved.gstPercent || 18;
  document.getElementById("taxPercent").value = saved.tax || 0;
  document.getElementById("shipping").value = saved.shipping || 0;
  document.getElementById("notes").value = saved.notes || '';
  document.getElementById("terms").value = saved.termsText || '';
};
