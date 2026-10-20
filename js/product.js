(function () {
  const mount = document.getElementById('productView');
  const moreSection = document.getElementById('productMore');
  const relatedGrid = document.getElementById('relatedGrid');
  const breadcrumbName = document.getElementById('breadcrumbName');
  if (!mount) return;

  const escapeHtml = (value) => {
    return String(value).replace(/[&<>"']/g, (character) => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  };

  const price = (value) => {
    if (typeof window.ceramicFormatPrice === 'function') {
      return window.ceramicFormatPrice(value);
    }
    return Number(value).toLocaleString('en-US') + ' USD';
  };

  const id = new URLSearchParams(window.location.search).get('id');
  const product = typeof window.ceramicGetProduct === 'function' ? window.ceramicGetProduct(id) : null;

  const showNotFound = () => {
    document.title = 'Piece not found — Ceramic studio';
    breadcrumbName.textContent = 'Not found';
    moreSection.hidden = true;
    mount.innerHTML =
      '<div class="product-not-found">' +
        '<p class="cart-eyebrow">Ceramic studio</p>' +
        '<h1>This piece has left the shelf.</h1>' +
        '<p>The page may have moved, or the piece is no longer in the collection. The shop is still open.</p>' +
        '<a class="button" href="./shop.html">Back to the shop</a>' +
      '</div>';
  };

  if (!product) {
    showNotFound();
    return;
  }

  document.title = product.name + ' — Ceramic studio';
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', product.short);
  breadcrumbName.textContent = product.name;

  const gallery = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : [product.image];

  const thumbs = gallery.length > 1
    ? '<div class="product-thumbs" aria-label="Product images">' +
        gallery.map((image, index) => {
          return '<button class="product-thumb' + (index === 0 ? ' is-active' : '') + '" type="button" data-image-index="' + index + '" aria-label="View image ' + (index + 1) + '">' +
            '<img src="' + escapeHtml(image) + '" alt="" loading="lazy">' +
          '</button>';
        }).join('') +
      '</div>'
    : '';

  const badge = product.badge
    ? '<span class="product-badge">' + escapeHtml(product.badge) + '</span>'
    : '';

  const details = product.details
    .map((detail) => {
      return '<div><dt>' + escapeHtml(detail.label) + '</dt><dd>' + escapeHtml(detail.value) + '</dd></div>';
    })
    .join('');

  const actionLabel = product.kind === 'workshop' ? 'Book a place' : 'Add to bag';
  const quantityLabel = product.kind === 'workshop' ? 'Places' : 'Quantity';

  mount.innerHTML =
    '<div class="product-layout">' +
      '<div class="product-media">' +
        '<div class="product-main-image"><img id="mainProductImage" src="' + escapeHtml(gallery[0]) + '" alt="' + escapeHtml(product.alt) + '"></div>' +
        thumbs +
      '</div>' +
      '<div class="product-info">' +
        '<p class="product-kicker">' + escapeHtml(product.category) + ' / Handmade in Warsaw</p>' +
        badge +
        '<h1>' + escapeHtml(product.name) + '</h1>' +
        '<p class="product-price">' + price(product.price) + '</p>' +
        '<p class="product-lede">' + escapeHtml(product.short) + '</p>' +
        '<p class="product-description">' + escapeHtml(product.description) + '</p>' +
        '<div class="product-buy">' +
          '<div class="product-quantity-row">' +
            '<span>' + quantityLabel + '</span>' +
            '<div class="product-stepper">' +
              '<button type="button" id="quantityDown" aria-label="Decrease quantity" disabled>&minus;</button>' +
              '<output id="quantityValue" aria-live="polite">1</output>' +
              '<button type="button" id="quantityUp" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
          '<button class="button product-add" type="button" id="productAdd" data-add-to-cart="' + escapeHtml(product.id) + '" data-cart-quantity="1">' + actionLabel + ' \u00b7 ' + price(product.price) + '</button>' +
          '<p class="product-shipping">' + escapeHtml(product.shipping) + '</p>' +
        '</div>' +
        '<dl class="product-details">' + details + '</dl>' +
      '</div>' +
    '</div>';

  const mainImage = document.getElementById('mainProductImage');
  const quantityValue = document.getElementById('quantityValue');
  const quantityDown = document.getElementById('quantityDown');
  const quantityUp = document.getElementById('quantityUp');
  const productAdd = document.getElementById('productAdd');
  let quantity = 1;

  const setQuantity = (next) => {
    quantity = Math.max(1, Math.min(9, next));
    quantityValue.textContent = String(quantity);
    quantityDown.disabled = quantity === 1;
    quantityUp.disabled = quantity === 9;
    productAdd.setAttribute('data-cart-quantity', String(quantity));
    productAdd.textContent = actionLabel + ' \u00b7 ' + price(product.price * quantity);
  };

  quantityDown.addEventListener('click', () => setQuantity(quantity - 1));
  quantityUp.addEventListener('click', () => setQuantity(quantity + 1));

  document.querySelectorAll('[data-image-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.getAttribute('data-image-index'));
      if (!gallery[index]) return;
      mainImage.src = gallery[index];
      document.querySelectorAll('[data-image-index]').forEach((thumb) => {
        thumb.classList.toggle('is-active', thumb === button);
      });
    });
  });

  const related = window.CERAMIC_PRODUCTS
    .filter((item) => item.id !== product.id && item.kind === product.kind)
    .slice(0, 3);

  if (related.length) {
    relatedGrid.innerHTML = related
      .map((item) => {
        const verb = item.kind === 'workshop' ? 'Book' : 'Add';
        return '<article class="related-card">' +
          '<a class="related-media" href="./product.html?id=' + encodeURIComponent(item.id) + '">' +
            '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.alt) + '" loading="lazy">' +
          '</a>' +
          '<div class="related-line">' +
            '<a class="related-name" href="./product.html?id=' + encodeURIComponent(item.id) + '">' + escapeHtml(item.name) + '</a>' +
            '<span class="related-price">' + price(item.price) + '</span>' +
          '</div>' +
          '<button class="add-to-cart" type="button" data-add-to-cart="' + escapeHtml(item.id) + '">' + verb + ' \u00b7 ' + price(item.price) + '</button>' +
        '</article>';
      })
      .join('');
    moreSection.hidden = false;
  }
})();
