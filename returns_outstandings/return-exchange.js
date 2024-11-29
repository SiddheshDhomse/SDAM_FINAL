
const firebaseConfig = {
    apiKey: "AIzaSyA5pGlTZSMznAy-x1bORDGTdpgdVR6z-m8",
    authDomain: "sdamnew-ea5d2.firebaseapp.com",
    databaseURL: "https://sdamnew-ea5d2-default-rtdb.firebaseio.com",
    projectId: "sdamnew-ea5d2",
    storageBucket: "sdamnew-ea5d2.firebasestorage.app",
    messagingSenderId: "539880950865",
    appId: "1:539880950865:web:6a9f1ed625d893a769fc70",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();


fetch('../header.html')
    .then((response) => response.text())
    .then((data) => {
        document.getElementById('header-placeholder').innerHTML = data;
    })
    .catch((error) => console.error('Error loading header:', error));


function searchSalesByPhone(phone) {
    const salesRef = database.ref('purchases');
    salesRef
        .orderByChild('customerPhone')
        .equalTo(phone)
        .once('value', (snapshot) => {
            const salesHistoryBody = document.getElementById('salesHistoryBody');
            salesHistoryBody.innerHTML = ''; // Clear existing rows

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const purchase = childSnapshot.val();
                    const purchaseDate = new Date(purchase.timestamp).toLocaleDateString(); // Format date
                    const items = purchase.items ? Object.values(purchase.items) : [];

                    const row = `
                        <tr>
                            <td>${purchaseDate}</td>
                            <td>${purchase.customerName}</td>
                            <td>Rs ${parseFloat(purchase.finalAmountPaid).toFixed(2)}</td>
                            <td>${items.map((item) => item.name).join(', ')}</td>
                            <td>
                                <button class="btn btn-danger" onclick="onButtonClick('${childSnapshot.key}')">Select</button>
                            </td>
                        </tr>
                    `;
                    salesHistoryBody.innerHTML += row;
                });
            } else {
                console.log('No data found for the given phone number.');
            }
        })
        .catch((error) => console.error('Error fetching sales data:', error));
}


function onButtonClick(billId) {
    const salesHistoryBody = document.getElementById('salesHistoryBody');
    salesHistoryBody.innerHTML = '';

    const itemsRef = database.ref(`purchases/${billId}/items`);
    itemsRef
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const item = childSnapshot.val();
                    const row = `
                        <tr>
                            <td>${item.name}</td>
                            <td>Rs ${parseFloat(item.price).toFixed(2)}</td>
                            <td>${item.barcode}</td>
                            <td>
                                <button class="btn btn-danger mx-2" onclick="deleteItem('${billId}', '${item.barcode}')">Delete</button>
                                <button class="btn btn-primary" onclick="updateItem('${billId}', '${item.barcode}')">Update</button>
                            </td>
                        </tr>
                    `;
                    salesHistoryBody.innerHTML += row;
                });
            } else {
                console.log('No items found for this bill.');
            }
        })
        .catch((error) => console.error('Error fetching items:', error));
}


function updateItem(billId, oldBarcode) {
    const newBarcode = prompt('Enter the new barcode for the product:', oldBarcode);
    const newQuantity = prompt('Enter the new quantity for the product:', '1');

    if (newBarcode && newQuantity) {
        const productsRef = database.ref('products');
        productsRef
            .orderByChild('barcode')
            .equalTo(newBarcode)
            .once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const product = Object.values(snapshot.val())[0];

                    const itemsRef = database.ref(`purchases/${billId}/items`);
                    itemsRef
                        .orderByChild('barcode')
                        .equalTo(oldBarcode)
                        .once('value')
                        .then((itemSnapshot) => {
                            const itemKey = Object.keys(itemSnapshot.val())[0];
                            const itemRef = database.ref(`purchases/${billId}/items/${itemKey}`);

                            itemRef
                                .update({
                                    name: product.name,
                                    price: parseFloat(product.price),
                                    barcode: product.barcode,
                                    quantity: parseInt(newQuantity),
                                })
                                .then(() => {
                                    console.log('Item updated successfully.');
                                    appendUpdateLog(billId, 'update', product.barcode, newQuantity);
                                    recalculateTotalPrice(billId);
                                })
                                .catch((error) => console.error('Error updating item:', error));
                        });
                } else {
                    console.log('No product found with the given barcode.');
                }
            })
            .catch((error) => console.error('Error fetching product data:', error));
    } else {
        console.log('Update canceled.');
    }
}


function deleteItem(billId, barcode) {
    const itemsRef = database.ref(`purchases/${billId}/items`);
    itemsRef
        .orderByChild('barcode')
        .equalTo(barcode)
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const itemKey = Object.keys(snapshot.val())[0];
                const itemRef = database.ref(`purchases/${billId}/items/${itemKey}`);
                itemRef
                    .remove()
                    .then(() => {
                        console.log('Item deleted successfully.');
                        appendUpdateLog(billId, 'delete', barcode, null);
                        recalculateTotalPrice(billId);
                    })
                    .catch((error) => console.error('Error deleting item:', error));
            } else {
                console.log('Item not found for the given barcode.');
            }
        })
        .catch((error) => console.error('Error fetching items for deletion:', error));
}


function appendUpdateLog(billId, action, barcode, quantity) {
    const logsRef = database.ref(`purchases/${billId}/changeLogs`);
    const newLog = {
        action: action,
        barcode: barcode,
        quantity: quantity,
        timestamp: new Date().toISOString(),
    };

    logsRef
        .push(newLog)
        .then(() => console.log('Change logged successfully:', newLog))
        .catch((error) => console.error('Error logging changes:', error));
}


function recalculateTotalPrice(billId) {
    const itemsRef = database.ref(`purchases/${billId}/items`);
    itemsRef
        .once('value')
        .then((snapshot) => {
            let totalPrice = 0;
            snapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val();
                totalPrice += parseFloat(item.price) * (item.quantity || 1);
            });

            const totalPriceRef = database.ref(`purchases/${billId}/totalPrice`);
            totalPriceRef
                .set(totalPrice.toFixed(2))
                .then(() => {
                    console.log('Total price recalculated successfully.');
                    onButtonClick(billId); 
                })
                .catch((error) => console.error('Error updating total price:', error));
        })
        .catch((error) => console.error('Error fetching items for total price calculation:', error));
}


document.getElementById('searchButton').addEventListener('click', () => {
    const phoneInput = document.getElementById('phoneInput').value;
    searchSalesByPhone(phoneInput);
});
