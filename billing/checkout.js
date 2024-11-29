// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA5pGlTZSMznAy-x1bORDGTdpgdVR6z-m8",
    authDomain: "sdamnew-ea5d2.firebaseapp.com",
    databaseURL: "https://sdamnew-ea5d2-default-rtdb.firebaseio.com",
    projectId: "sdamnew-ea5d2",
    storageBucket: "sdamnew-ea5d2.firebasestorage.app",
    messagingSenderId: "539880950865",
    appId: "1:539880950865:web:6a9f1ed625d893a769fc70"
  };
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

fetch('../header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
    });

// Populate checkout table and calculations
function populateCheckout() {
    const customerName = sessionStorage.getItem('customerName');
    const customerPhone = sessionStorage.getItem('customerPhone');
    const cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
    const discount = parseFloat(sessionStorage.getItem('discount')) || 0;

    document.getElementById('customerName').value = customerName || '';
    document.getElementById('customerPhone').value = customerPhone || '';

    const checkoutTableBody = document.getElementById('checkoutTable').getElementsByTagName('tbody')[0];
    checkoutTableBody.innerHTML = '';

    let totalPrice = 0;

    cartItems.forEach(item => {
        const row = checkoutTableBody.insertRow();
        row.insertCell(0).textContent = item.barcode;
        row.insertCell(1).textContent = item.name;
        row.insertCell(2).textContent = item.quantity;
        const itemTotal = item.price * item.quantity;
        row.insertCell(3).textContent = itemTotal.toFixed(2);
        totalPrice += itemTotal;
    });

    const discountAmount = (totalPrice * (discount / 100)).toFixed(2);
    const finalAmount = (totalPrice - discountAmount).toFixed(2);

    document.getElementById('totalPrice').textContent = `Rs ${totalPrice.toFixed(2)}`;
    document.getElementById('discountAmount').textContent = `Rs ${discountAmount}`;
    document.getElementById('finalAmount').textContent = `Rs ${finalAmount}`;

    document.getElementById('outstandingAmount').textContent = 'Rs 0.00';
}

function calculateOutstandingAmount() {
    const totalAmount = parseFloat(document.getElementById('finalAmount').innerText.replace('Rs ', '')) || 0;
    const paidAmountInput = document.getElementById('finalAmountPaid');
    const outstandingAmountElement = document.getElementById('outstandingAmount');
    
    let paidAmount = parseFloat(paidAmountInput.value) || 0;

    if (paidAmount < 0) {
        alert("Paid amount cannot be negative.");
        paidAmountInput.value = '';
        paidAmount = 0;
    } else if (paidAmount > totalAmount) {
        alert("Paid amount cannot exceed the total amount.");
        paidAmountInput.value = '';
        paidAmount = 0;
    }

  
    const outstandingAmount = totalAmount - paidAmount;

   
    outstandingAmountElement.textContent = 'Rs ' + outstandingAmount.toFixed(2);

   
    if (outstandingAmount === 0) {
        outstandingAmountElement.classList.remove('text-danger');
        outstandingAmountElement.classList.add('text-success');
    } else {
        outstandingAmountElement.classList.remove('text-success');
        outstandingAmountElement.classList.add('text-danger');
    }
}


document.getElementById('finalAmountPaid').addEventListener('input', (event) => {
    const inputValue = event.target.value;
    if (inputValue < 0) {
        alert("Amount entered cannot be negative.");
        event.target.value = '';
    }
});


function completePurchase() {
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const finalAmount = parseFloat(document.getElementById('finalAmount').textContent.replace('Rs ', '')) || 0;
    const finalAmountPaid = parseFloat(document.getElementById('finalAmountPaid').value) || 0;
    const outstandingAmount = finalAmount - finalAmountPaid;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentStatus = outstandingAmount > 0 ? 'Unpaid' : 'Paid';

    const cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];

   
    const timestamp = Date.now(); // Returns the timestamp in milliseconds

    const purchaseData = {
        customerName,
        customerPhone,
        finalAmount,
        finalAmountPaid,
        outstandingAmount,
        paymentMethod,
        paymentStatus,
        items: cartItems, 
        timestamp 
    };

    const newPurchaseKey = firebase.database().ref().child('purchases').push().key;
    firebase.database().ref('purchases/' + newPurchaseKey).set(purchaseData)
        .then(() => {
            alert('Purchase completed successfully!');
        })
        .catch((error) => {
            alert('Error completing purchase: ' + error.message);
        });
}


function printPDF() {
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const finalAmount = document.getElementById('finalAmount').textContent;
    const finalAmountPaid = document.getElementById('finalAmountPaid').value;
    const outstandingAmount = document.getElementById('outstandingAmount').textContent;
    const paymentStatus = outstandingAmount === 'Rs 0.00' ? 'Paid' : 'Unpaid';

    const docDefinition = {
        content: [
            { text: 'Invoice', style: 'header' },
            {
                columns: [
                    { width: '*', text: `Customer Name: ${customerName}` },
                    { width: '*', text: `Phone: ${customerPhone}` }
                ]
            },
            { text: 'Items', style: 'subheader', margin: [0, 20] },
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        ['Product Name', 'Quantity', 'Price (Rs)', 'Total (Rs)'],
                        ...JSON.parse(sessionStorage.getItem('cartItems')).map(item => [
                            item.name,
                            item.quantity,
                            item.price,
                            item.price * item.quantity
                        ]),
                    ]
                }
            },
            { text: `Total: Rs ${document.getElementById('totalPrice').textContent.replace('Rs ', '')}`, margin: [0, 20] },
            { text: `Discount: Rs ${document.getElementById('discountAmount').textContent.replace('Rs ', '')}`, margin: [0, 5] },
            { text: `Final Amount: Rs ${document.getElementById('finalAmount').textContent.replace('Rs ', '')}`, margin: [0, 5] },
            { text: `Final Payment: Rs ${finalAmountPaid}`, margin: [0, 5] },
            { text: `Outstanding Amount: Rs ${outstandingAmount}`, margin: [0, 5] },
            { text: `Payment Status: ${paymentStatus}`, margin: [0, 5] },
        ],
        styles: {
            header: { fontSize: 18, bold: true, alignment: 'center' },
            subheader: { fontSize: 14, bold: true }
        }
    };

    pdfMake.createPdf(docDefinition).download('invoice.pdf');
}

window.onload = populateCheckout;
