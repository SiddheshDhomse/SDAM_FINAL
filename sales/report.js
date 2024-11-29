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

const datePicker = document.getElementById('hiddenDatePicker');
const dateDisplay = document.getElementById('dateDisplay');

function searchSalesByDate(selectedDate) {
    const salesRef = database.ref('purchases');
    
    const startOfDay = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999));
    salesRef.orderByChild('timestamp').startAt(startOfDay.getTime()).endAt(endOfDay.getTime()).once('value', snapshot => {
        const productTableBody = document.getElementById('productTable').getElementsByTagName('tbody')[0];
        productTableBody.innerHTML = ''; 

        let totalAmount = 0; 
        let totalProductsSold = 0; 

        snapshot.forEach(childSnapshot => {
            const purchase = childSnapshot.val();
            totalAmount += parseFloat(purchase.finalAmount); 
            totalProductsSold += purchase.items ? purchase.items.length : 1; 

            const row = `
                <tr>
                    <td>${purchase.items ? purchase.items.map(item => item.name).join(', ') : 'N/A'}</td>
                    <td>${purchase.customerName}</td>
                    <td>Rs ${parseFloat(purchase.finalAmount).toFixed(2)}</td>
                    <td>${purchase.paymentMethod}</td>
                    <td>${purchase.paymentStatus}</td> <!-- Payment status displayed here -->
                </tr>
            `;
            productTableBody.innerHTML += row; 
        });

        document.getElementById('totalExpenses').textContent = `Rs ${totalAmount.toFixed(2)}`;

        document.getElementById('totalProductsSold').textContent = totalProductsSold;
    });
}



datePicker.addEventListener('change', function () {
    const selectedDate = new Date(this.value);
    
    if (isNaN(selectedDate.getTime())) {
        console.error('Invalid date selected:', this.value);
        return;
    }

    const formattedDate = selectedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    dateDisplay.textContent = formattedDate; 

    
    searchSalesByDate(selectedDate);
});
