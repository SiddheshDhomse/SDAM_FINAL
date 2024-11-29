document.addEventListener('DOMContentLoaded', () => {
    
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

    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');
    const dogBreedInput = document.getElementById('dogBreed');
    const dogSexInput = document.getElementById('dogSex');
    const dogAgeInput = document.getElementById('dogAge');
    const barcodeInput = document.getElementById('barcodeInput');
    const proceedButton = document.querySelector('button[onclick="proceedToCheckout()"]');

    const namePattern = /^[a-zA-Z\s]*$/; 
    const phonePattern = /^[0-9]{10}$/;  
    const breedPattern = /^[a-zA-Z\s]*$/; 

    function validateInput(input, pattern, errorMessage) {
        if (!pattern.test(input.value.trim())) {
            input.setCustomValidity(errorMessage);
            input.reportValidity();
        } else {
            input.setCustomValidity('');
        }
    }

    customerNameInput.addEventListener('input', () =>
        validateInput(customerNameInput, namePattern, 'Name should only contain letters and spaces.')
    );

    customerPhoneInput.addEventListener('input', () =>
        validateInput(customerPhoneInput, phonePattern, 'Phone number should be exactly 10 digits.')
    );

    dogBreedInput.addEventListener('input', () =>
        validateInput(dogBreedInput, breedPattern, "Dog breed should only contain letters and spaces.")
    );

    function checkFormValidity() {
        const isNameValid = customerNameInput.value.trim() !== '';
        const isPhoneValid = customerPhoneInput.value.trim() !== '';
        proceedButton.disabled = !(isNameValid && isPhoneValid);
    }

    [customerNameInput, customerPhoneInput].forEach(input =>
        input.addEventListener('input', checkFormValidity)
    );

    barcodeInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            const barcode = barcodeInput.value.trim();
            if (barcode) {
                addProductToBill(barcode);
                barcodeInput.value = ''; 
            } else {
                console.error('Barcode input is empty');
            }
        }
    });

    let totalAmount = 0;
    let discountAmount = 0;

    function addProductToBill(barcode) {
        database.ref('products').orderByChild('barcode').equalTo(barcode).once('value', snapshot => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const product = childSnapshot.val();
                    const tableBody = document.querySelector('#billTable tbody');

                    let row = Array.from(tableBody.getElementsByTagName('tr')).find(
                        row => row.cells[0].textContent === barcode
                    );

                    if (row) {
                        const quantityCell = row.cells[2];
                        const priceCell = row.cells[3];
                        const quantity = parseInt(quantityCell.textContent) + 1;
                        const totalPrice = product.price * quantity;

                        quantityCell.textContent = quantity;
                        priceCell.textContent = totalPrice.toFixed(2);
                    } else {
                        row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${product.barcode}</td>
                            <td>${product.name}</td>
                            <td>1</td>
                            <td>${product.price.toFixed(2)}</td>
                            <td><button type="button" onclick="removeProduct(this)">Remove</button></td>
                        `;
                        tableBody.appendChild(row);
                    }

                    updateTotals();
                });
            } else {
                console.error('No such product!');
            }
        }).catch(error => {
            console.error('Error fetching product:', error);
        });
    }

    window.removeProduct = function(button) {
        const row = button.closest('tr');
        const price = parseFloat(row.cells[3].textContent);
        const quantity = parseInt(row.cells[2].textContent);
        totalAmount -= price * quantity;
        row.remove();
        updateTotals();
    };

    function updateTotals() {
        totalAmount = Array.from(document.querySelectorAll('#billTable tbody tr')).reduce((sum, row) => {
            const quantity = parseInt(row.cells[2].textContent);
            const price = parseFloat(row.cells[3].textContent) / quantity;
            return sum + (quantity * price);
        }, 0);

        const discountValue = (discountAmount / 100) * totalAmount;
        const finalAmount = totalAmount - discountValue;

        document.getElementById('totalAmount').textContent = `Rs${totalAmount.toFixed(2)}`;
        document.getElementById('discountAmount').textContent = `Rs${discountValue.toFixed(2)}`;
        document.getElementById('finalAmount').textContent = `Rs${finalAmount.toFixed(2)}`;
    }

    window.proceedToCheckout = function() {
        const cartItems = Array.from(document.querySelectorAll('#billTable tbody tr'));
        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add products before proceeding to checkout.');
            return;
        }

        const customerName = customerNameInput.value.trim();
        const customerPhone = customerPhoneInput.value.trim();

        if (!customerName || !customerPhone) {
            alert('Please fill in your name and phone number before proceeding.');
            return;
        }

        const cartDetails = cartItems.map(row => ({
            barcode: row.cells[0].textContent,
            name: row.cells[1].textContent,
            quantity: parseInt(row.cells[2].textContent),
            price: parseFloat(row.cells[3].textContent)
        }));

        sessionStorage.setItem('customerName', customerName);
        sessionStorage.setItem('customerPhone', customerPhone);
        sessionStorage.setItem('cartItems', JSON.stringify(cartDetails));
        sessionStorage.setItem('discount', discountAmount);

        window.location.href = 'checkout.html';
    };
});
