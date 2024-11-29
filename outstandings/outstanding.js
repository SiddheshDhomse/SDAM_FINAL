const firebaseConfig = {
    apiKey: "AIzaSyA5pGlTZSMznAy-x1bORDGTdpgdVR6z-m8",
    authDomain: "sdamnew-ea5d2.firebaseapp.com",
    databaseURL: "https://sdamnew-ea5d2-default-rtdb.firebaseio.com",
    projectId: "sdamnew-ea5d2",
    storageBucket: "sdamnew-ea5d2.firebasestorage.app",
    messagingSenderId: "539880950865",
    appId: "1:539880950865:web:6a9f1ed625d893a769fc70"
  };

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

fetch('../header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
    });

function searchSalesByPhone(phone) {
    const salesRef = database.ref('purchases');
    salesRef.orderByChild('customerPhone').equalTo(phone).once('value', snapshot => {
        const salesHistoryBody = document.getElementById('salesHistoryBody');
        const totalOutstandingElement = document.getElementById('totalOutstanding');
        salesHistoryBody.innerHTML = ''; 
        let totalOutstanding = 0; 

        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const purchase = childSnapshot.val();
                const isPaid = purchase.paymentStatus === 'Paid';
                const outstandingAmount = isPaid ? 0 : purchase.outstandingAmount;

                totalOutstanding += outstandingAmount; 

                const row = `
                    <tr>
                        <td>${purchase.items ? purchase.items.map(item => item.name).join(', ') : 'N/A'}</td>
                        <td>${purchase.customerName}</td>
                        <td>Rs ${parseFloat(purchase.finalAmount).toFixed(2)}</td>
                        <td id="amountPaid-${childSnapshot.key}">Rs ${parseFloat(purchase.finalAmountPaid || 0).toFixed(2)}</td>
                        <td>
                            <span id="outstanding-${childSnapshot.key}">
                                ${isPaid ? 'No Outstanding' : `Rs ${parseFloat(outstandingAmount).toFixed(2)}`}
                            </span>
                        </td>
                        <td>
                            <div class="d-flex">
                                <input type="number" id="paymentInput-${childSnapshot.key}" class="form-control" placeholder="Amount Paid" min="0" ${isPaid ? 'disabled' : ''}>
                                <button class="btn btn-success ml-2" onclick="updatePayment('${childSnapshot.key}')" ${isPaid ? 'disabled' : ''}>Update</button>
                            </div>
                        </td>
                    </tr>
                `;
                salesHistoryBody.innerHTML += row; 
            });

            
            totalOutstandingElement.textContent = `Rs ${totalOutstanding.toFixed(2)}`;
        } else {
            const noDataRow = `<tr><td colspan="6" class="text-center">No data available for the given phone number.</td></tr>`;
            salesHistoryBody.innerHTML = noDataRow;
            totalOutstandingElement.textContent = `Rs 0.00`; 
        }
    }).catch(error => {
        console.error("Error fetching sales by phone:", error);
    });
}


function updatePayment(billId) {
    const paymentInput = parseFloat(document.getElementById(`paymentInput-${billId}`).value);

    if (!isNaN(paymentInput) && paymentInput >= 0) {
        const purchaseRef = database.ref(`purchases/${billId}`);

        purchaseRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const purchase = snapshot.val();

                const currentAmountPaid = purchase.finalAmountPaid || 0; 
                const newAmountPaid = currentAmountPaid + paymentInput;
                const newOutstanding = purchase.finalAmount - newAmountPaid;

                purchaseRef.update({
                    finalAmountPaid: newAmountPaid,
                    outstandingAmount: newOutstanding >= 0 ? newOutstanding : 0,
                    paymentStatus: newOutstanding === 0 ? 'Paid' : purchase.paymentStatus 
                }).then(() => {
                    console.log('Payment updated successfully');

                    const outstandingElement = document.getElementById(`outstanding-${billId}`);
                    const amountPaidElement = document.getElementById(`amountPaid-${billId}`);
                    const isPaid = newOutstanding === 0;

                    outstandingElement.textContent = isPaid ? 'No Outstanding' : `Rs ${Math.max(newOutstanding, 0).toFixed(2)}`; // Update outstanding amount in UI
                    amountPaidElement.textContent = `Rs ${newAmountPaid.toFixed(2)}`; 

                    if (isPaid) {
                        document.getElementById(`paymentInput-${billId}`).disabled = true;
                        document.getElementById(`paymentInput-${billId}`).nextElementSibling.disabled = true;
                    }
                }).catch(error => {
                    console.error('Error updating payment:', error);
                    alert('Error updating the payment. Please try again.');
                });
            } else {
                console.error('Purchase not found in the database.');
                alert('The purchase record does not exist. Please check the phone number and try again.');
            }
        }).catch(error => {
            console.error('Error fetching purchase data:', error);
            alert('Error fetching purchase data. Please try again.');
        });
    } else {
        alert('Please enter a valid number for the payment amount (0 or greater).');
    }
}

document.getElementById('searchButton').addEventListener('click', () => {
    const phoneInput = document.getElementById('phoneInput').value;
    if (phoneInput) {
        searchSalesByPhone(phoneInput);
    } else {
        alert('Please enter a phone number.');
    }
});