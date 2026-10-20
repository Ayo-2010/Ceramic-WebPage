(function () {
  const products = window.CERAMIC_PRODUCTS || [];

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

  const card = (product, className) => {
    const action = product.kind === 'workshop' ? 'Book a place' : 'Add to bag';
    return '<article class="' + className + '">' +
      '<a class="product-media" href="./product.html?id=' + encodeURIComponent(product.id) + '">' +
        '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.alt) + '" loading="lazy">' +
      '</a>' +
      '<div class="product-line">' +
        '<p class="productName"><a href="./product.html?id=' + encodeURIComponent(product.id) + '">' + escapeHtml(product.name) + '</a></p>' +
        '<p class="productPrice">' + price(product.price) + '</p>' +
      '</div>' +
      '<button class="add-to-cart" type="button" data-add-to-cart="' + escapeHtml(product.id) + '" data-cart-quantity="1">' + action + '</button>' +
    '</article>';
  };

  const renderShop = (grid) => {
    const collection = grid.getAttribute('data-collection') || 'all';
    let selection = products;
    if (collection === 'new') {
      selection = products.filter((product) => product.isNew);
    } else if (collection === 'products') {
      selection = products.filter((product) => product.kind === 'piece');
    }
    const rows = [];
    for (let index = 0; index < selection.length; index += 3) {
      const group = selection.slice(index, index + 3);
      rows.push('<div class="sec">' + group.map((product) => card(product, 'shopContain1')).join('') + '</div>');
    }
    grid.innerHTML = rows.join('');
  };

  const renderBestsellers = (grid) => {
    const names = ['sara-mug', 'star-set', 'nordic-container', 'moon-plate'];
    const selection = names
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
    grid.innerHTML = selection.map((product) => card(product, 'shopContain')).join('');
  };

  const shopGrid = document.getElementById('shopGrid');
  const bestsellerGrid = document.getElementById('bestsellerGrid');

  if (shopGrid) renderShop(shopGrid);
  if (bestsellerGrid) renderBestsellers(bestsellerGrid);
})();
