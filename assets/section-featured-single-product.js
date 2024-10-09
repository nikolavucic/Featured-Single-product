/* Specific sripts for Featured single product section */

/**
 * Initialize Slick slider
 * 
 * Initialization uses jQuery (as per Slick slider's documentation)
 */
$('.slider-for').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    fade: true,
    asNavFor: '.slider-nav'
});
$('.slider-nav').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    asNavFor: '.slider-for',
    dots: false,
    centerMode: true,
    focusOnSelect: true
});

/**
 * Add product to cart with AJAX
 * 
 * Prevent the usual add-to-cart behavior and add the product to the cart.
 */
document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('form[action="/cart/add"]').addEventListener('submit', function(event) {
    // First step, stop the usual add-to-cart behavior
    event.preventDefault();
    
    let bubbleWrapper = document.getElementById('cart-icon-bubble');
    let bubble = document.createElement('div');
    bubble.classList.add('cart-count-bubble');
    bubble.innerHTML = "<span aria-hidden='true'></span>";
    bubbleWrapper.appendChild(bubble);
    
    let form = this;
    let formData = new FormData(form);
    let productId = formData.get('id'); // Product variant ID
    
    // Send the first request
    fetch('/cart/add', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            // Send the second request to get the cart details
            return fetch('/cart.json');
        } else {
            throw new Error('Error adding product to cart');
        }
    })
    .then(response => response.json())
    .then(cart => {
        // Get the last item added to the cart
        let addedItem = cart.items.find(item => item.id == productId);
        
        // Extract variant information
        let variantOptions = addedItem.variant_options;
        let color = variantOptions[0];  // First option is color
        let size = variantOptions[1];   // Second option is size
        
        // Extract product name without variant information
        let productName = addedItem.title.split(' - ')[0];
        
        // Update cart count bubble
        document.querySelectorAll('.cart-count-bubble span').forEach(function(span) {
            span.textContent = cart.item_count;
        });
        
        // Update popup with the added item details
        document.querySelector('.cart-popup-image').src = addedItem.image;
        document.querySelector('.cart-popup-title').textContent = productName;
        document.querySelector('.cart-popup-size').textContent = size;
        
        // Update color swatch
        document.querySelector('.cart-popup-color-swatch').style.backgroundColor = color;
        
        // Show the popup
        let popup = document.getElementById('cart-popup');
        popup.style.display = 'block';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    })
    .catch(error => console.error('Error:', error));
  });
});


/**
 * Formats a given amount of money into a human-readable string.
 *
 * @param {string|number} cents - The amount of money in cents.
 * @param {string} [format="${{amount}}"] - The format of the output string.
 * @return {string} The formatted string representation of the money.
 */
function formatMoney(cents, format = "${{amount}}") {
  if (typeof cents === 'string') {
    cents = cents.replace('.', '');
  }
  let value = '';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;

  function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
    if (isNaN(number) || number == null) return '';

    number = (number / 100.0).toFixed(precision);
    const parts = number.split('.');
    const dollarsAmount = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${thousands}`);
    const centsAmount = parts[1] ? decimal + parts[1] : '';

    return dollarsAmount + centsAmount;
  }

  const match = format.match(placeholderRegex);
  if (match) {
    switch (match[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
    }
  }

  return format.replace(placeholderRegex, value);
}


/**
 * Updates the price of a product variant on the button.
 *
 * @param {string} variantID - The ID of the product variant.
 * @param {HTMLElement} productForm - The product form div.
 */
function updatePrice(variantID, productForm) {

  // Find the variant object by ID
  var variant = product.variants.find(function(v) {
    return v.id === variantID;
  });

  if (variant) {
    var priceElement = productForm.querySelector(".featured-single-price");
    var productButton = productForm.querySelector(".button--featured-single-add-to-cart");

    if (variant.available) {
      // Enable the add button if the variant is available
      productButton.removeAttribute("disabled");

      // Update ative price
      priceElement.querySelector(".featured-single-text").textContent = "ADD TO CART - ";
      priceElement.querySelector(".featured-single-active-price").textContent = formatMoney(variant.price);

      // Update compar at price
      if (variant.compare_at_price != "") {
        priceElement.querySelector(".featured-single-compare_at_price").textContent = formatMoney(variant.compare_at_price);
      } else {
        priceElement.querySelector(".featured-single-compare_at_price").textContent = "";
      }
    } else {
      // Actions to take when variant is not available
      productButton.setAttribute("disabled", "disabled");
      priceElement.querySelector(".featured-single-active-price").textContent = "";
      priceElement.querySelector(".featured-single-compare_at_price").textContent = "";
      priceElement.querySelector(".featured-single-text").textContent = "OUT OF STOCK";
    }
  }
}


/**
 * Updates the product image in the slider based on the selected variant.
 *
 * @param {number} variantID - The ID of the variant to update the image for
 */
function updateImageInSlider(variantID) {

  // Find the variant object by ID
  var variant = product.variants.find(function(v) {
    return v.id === variantID;
  });

  if (variant) {
    // Update the image on variant switch
    var productGallery = document.querySelector('.featured-single-product__gallery');
    var productGalleryActiveSlide = productGallery.querySelector(".variant-image-wrapp.slick-active");

    if (variant.featured_image) {
      // Update the image with the variant image
      var variantImage = productGalleryActiveSlide.querySelector('.js-variant-image');
      if (variantImage) {
        variantImage.src = variant.featured_image.src;
      }
    } else {
      console.log('This product variant does not have "assigned" image, so it uses the featured image.');
    }
  }

}


/**
 * Handles color changes for a product and updates the variant ID, price, and image accordingly.
 *
 * @param {Event} event - The event object triggered by the color change.
 */
function handleColorChange(event) {
  var productForm = event.target.closest(".featured-single-product__form");
  // Getting the selected color
  var selectedColor = event.target.value;

  // Getting the selected size
  var selectedSize = productForm.querySelector(".select__select").value;

  // Getting the correct product variant ID
  var variantId = getVariantId(product, selectedColor, selectedSize);

  if (variantId) {
    // Assign the variant ID to the hidden input
    let productInput = productForm.querySelector(".product-variant-id");
    productInput.value = variantId;

    // Update price on the button
    updatePrice(variantId, productForm);

    // Update image on the slider
    updateImageInSlider(variantId);

  } else {
    console.log('Variant not found');
  }
}


/**
 * Handles size changes for a product and updates the variant ID, price, and image accordingly.
 *
 * @param {Event} event - The event object triggered by the size change.
 */
function handleSizeChange(event) {
  var productForm = event.target.closest(".featured-single-product__form");
  // Getting the selected size
  var selectedSize = event.target.value;

  var selectedColorElement = productForm.querySelector(".swatch-input__input:checked");
  // Getting the selected color
  var selectedColor = selectedColorElement ? selectedColorElement.value : null;

  // Getting the correct product variant ID
  var variant = getVariantId(product, selectedColor, selectedSize);

  if (variant) {
    // Assign the variant ID to the hidden input
    var productInput = productForm.querySelector(".product-variant-id");
    productInput.value = variant;

    // Update price on the button
    updatePrice(variant, productForm);

    // Update image on the slider
    updateImageInSlider(variant);

  } else {
    console.log('Variant not found');
  }
}


/**
 * Retrieves the variant ID of a product based on the selected color and size.
 *
 * @param {Object} product - The product object containing the variants.
 * @param {string} selectedColorId - The ID of the selected color.
 * @param {string} selectedSizeId - The ID of the selected size.
 * @return {string|null} The variant ID if a match is found, or null if no match is found.
 */
function getVariantId(product, selectedColorId, selectedSizeId) {
  // Loop through all variants of the product
  for (var i = 0; i < product.variants.length; i++) {
    var variant = product.variants[i];

    // Check if both the color (option1) and size (option2) match
    if (variant.option1 == selectedColorId && variant.option2 == selectedSizeId) {
      return variant.id; // Return the unique variant ID
    }
  }
  
  // If no match found
  console.log("There is no variant with these entered parameters");
}


/**  
* Event handlers
* Monitoring when color and size changes occur
*/
document.addEventListener("DOMContentLoaded", function () {
  var swatches = document.querySelectorAll(".swatch-input__input");
  swatches.forEach(function(swatch) {
    swatch.addEventListener("click", handleColorChange);
  });

  var sizeSelectors = document.querySelectorAll(".select__select");
  sizeSelectors.forEach(function(sizeSelector) {
    sizeSelector.addEventListener("change", handleSizeChange);
  });
});


/**
* After DOM load - add styles to options dropdown - This not working for all browsers 
* 
* TO DO: Proveri neke exsterne biblioteke (npr. Bootstrap Select Library i sl.), da vidis kako oni dodaju stilove
*/
document.addEventListener("DOMContentLoaded", function() {
  // Select all <option> tags inside the select element
  const options = document.querySelectorAll('.select__select option');

  // Loop through each option and apply inline styles
  options.forEach(option => {
      option.style.color = "#61402E";
      option.style.fontSize = "16px";
      option.style.fontWeight = "500";
      option.style.textTransform = "uppercase";
      option.style.backgroundColor = "#FCF4EE";
  });
});
