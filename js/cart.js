(function () {
  const STORAGE_KEY = 'ceramic-bag-v1';
  const FREE_DELIVERY = 300;
  const DELIVERY = 18;
  let cart = [];
  let drawer;
  let backdrop;
  let itemsView;
  let itemsList;
  let emptyState;
  let foot;
  let checkoutButton;
  let checkoutForm;
  let confirmView;
  let titleLabel;
  let titleCount;
  let subtotalNode;
  let checkoutSubtotal;
  let checkoutDelivery;
  let checkoutTotal;
  let placeOrderButton;
  let lastFocus = null;
  let currentPanel = 'bag';

  const price = (value) => {
    if (typeof window.ceramicFormatPrice === 'function') {
      return window.ceramicFormatPrice(value);
    }
    return Number(value).toLocaleString('en-US') + ' USD';
  };

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

  const getProduct = (id) => {
    if (typeof window.ceramicGetProduct !== 'function') return null;
    return window.ceramicGetProduct(id);
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        cart = [];
        return;
      }
      const merged = new Map();
      parsed.forEach((item) => {
        if (!item || typeof item.id !== 'string') return;
        const quantity = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
        if (merged.has(item.id)) {
          merged.set(item.id, Math.min(99, merged.get(item.id) + quantity));
        } else {
          merged.set(item.id, quantity);
        }
      });
      cart = Array.from(merged, ([id, qty]) => ({ id, qty }))
        .filter((item) => typeof window.ceramicGetProduct !== 'function' || window.ceramicGetProduct(item.id));
    } catch (error) {
      cart = [];
    }
  };

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      return;
    }
  };

  const lines = () => {
    return cart
      .map((item) => {
        const product = getProduct(item.id);
        return product ? { id: item.id, qty: item.qty, product } : null;
      })
      .filter(Boolean);
  };

  const itemCount = () => cart.reduce((sum, item) => sum + item.qty, 0);

  const subtotal = () => {
    return lines().reduce((sum, line) => sum + line.product.price * line.qty, 0);
  };

  const deliveryCost = () => {
    const current = lines();
    const hasPiece = current.some((line) => line.product.kind === 'piece');
    if (!current.length || !hasPiece || subtotal() >= FREE_DELIVERY) return 0;
    return DELIVERY;
  };

  const total = () => subtotal() + deliveryCost();

  const syncHeader = () => {
    const count = itemCount();
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      node.textContent = String(count);
      node.hidden = count === 0;
    });
    document.querySelectorAll('[data-cart-open]').forEach((node) => {
      node.setAttribute('aria-label', 'Open bag, ' + count + ' ' + (count === 1 ? 'item' : 'items'));
    });
  };

  const render = () => {
    if (!drawer) return;
    const current = lines();
    const count = itemCount();
    titleLabel.textContent = currentPanel === 'checkout' ? 'Checkout' : currentPanel === 'confirm' ? 'Order placed' : 'Your bag';
    titleCount.textContent = '(' + count + ')';
    titleCount.hidden = currentPanel !== 'bag';
    itemsList.innerHTML = current
      .map((line) => {
        const product = line.product;
        const lineTotal = price(product.price * line.qty);
        return (
          '<li class="cart-item" data-cart-id="' + escapeHtml(product.id) + '">' +
            '<a class="cart-item-media" href="./product.html?id=' + encodeURIComponent(product.id) + '">' +
              '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.alt) + '" loading="lazy">' +
            '</a>' +
            '<div class="cart-item-info">' +
              '<a class="cart-item-name" href="./product.html?id=' + encodeURIComponent(product.id) + '">' + escapeHtml(product.name) + '</a>' +
              '<p class="cart-item-meta">' + escapeHtml(product.category) + '</p>' +
              '<p class="cart-item-price">' + price(product.price) + '</p>' +
              '<div class="cart-item-controls">' +
                '<div class="cart-qty" aria-label="Quantity for ' + escapeHtml(product.name) + '">' +
                  '<button type="button" data-cart-dec aria-label="Decrease quantity">&minus;</button>' +
                  '<span>' + line.qty + '</span>' +
                  '<button type="button" data-cart-inc aria-label="Increase quantity">+</button>' +
                '</div>' +
                '<button class="cart-remove" type="button" data-cart-remove>Remove</button>' +
              '</div>' +
            '</div>' +
            '<strong class="cart-line-total">' + lineTotal + '</strong>' +
          '</li>'
        );
      })
      .join('');
    itemsList.hidden = current.length === 0;
    emptyState.hidden = current.length > 0;
    subtotalNode.textContent = price(subtotal());
    checkoutButton.disabled = current.length === 0;
    syncHeader();
  };

  const setPanel = (panel) => {
    currentPanel = panel;
    itemsView.hidden = panel !== 'bag';
    checkoutForm.hidden = panel !== 'checkout';
    confirmView.hidden = panel !== 'confirm';
    foot.hidden = panel !== 'bag';
    titleCount.hidden = panel !== 'bag';
    titleLabel.textContent = panel === 'checkout' ? 'Checkout' : panel === 'confirm' ? 'Order placed' : 'Your bag';
    titleCount.textContent = '(' + itemCount() + ')';
  };

  const updateCheckout = () => {
    const delivery = deliveryCost();
    const orderTotal = total();
    checkoutSubtotal.textContent = price(subtotal());
    checkoutDelivery.textContent = delivery === 0 ? 'Free' : price(delivery);
    checkoutTotal.textContent = price(orderTotal);
    placeOrderButton.textContent = 'Place order \u00b7 ' + price(orderTotal);
  };

  const open = () => {
    if (!drawer) return;
    lastFocus = document.activeElement;
    setPanel('bag');
    render();
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    window.setTimeout(() => {
      const closeButton = drawer.querySelector('.cart-close');
      if (closeButton) closeButton.focus();
    }, 40);
  };

  const close = () => {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    document.body.classList.remove('cart-open');
    if (lastFocus && typeof lastFocus.focus === 'function' && !drawer.contains(lastFocus)) {
      lastFocus.focus();
    }
  };

  const add = (id, quantity) => {
    const product = getProduct(id);
    if (!product) return false;
    const amount = Math.max(1, Math.min(99, parseInt(quantity, 10) || 1));
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + amount);
    } else {
      cart.push({ id, qty: amount });
    }
    persist();
    render();
    return true;
  };

  const changeQuantity = (id, delta) => {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    item.qty = Math.min(99, item.qty + delta);
    if (item.qty <= 0) {
      cart = cart.filter((entry) => entry.id !== id);
    }
    persist();
    render();
  };

  const remove = (id) => {
    cart = cart.filter((entry) => entry.id !== id);
    persist();
    render();
  };

  const resetPanels = () => {
    setPanel('bag');
  };

  const createDrawer = () => {
    const root = document.createElement('div');
    root.className = 'cart-root';
    root.innerHTML =
      '<div class="cart-backdrop" data-cart-close></div>' +
      '<aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden="true" inert>' +
        '<div class="cart-head">' +
          '<div>' +
            '<p class="cart-eyebrow">Ceramic studio</p>' +
            '<h2 id="cartTitle"><span id="cartTitleLabel">Your bag</span> <span id="cartTitleCount">(0)</span></h2>' +
          '</div>' +
          '<button class="cart-close" type="button" data-cart-close aria-label="Close bag">&times;</button>' +
        '</div>' +
        '<div class="cart-body">' +
          '<div id="cartItemsView">' +
            '<ul class="cart-items" id="cartItems"></ul>' +
            '<div class="cart-empty" id="cartEmpty" hidden>' +
              '<div class="cart-empty-art">CS</div>' +
              '<h3>Your bag is empty</h3>' +
              '<p>Small, useful objects are waiting in the shop.</p>' +
              '<a class="button" href="./shop.html">Browse the shop</a>' +
            '</div>' +
          '</div>' +
          '<form class="checkout-form" id="checkoutForm" hidden>' +
            '<div class="checkout-intro">' +
              '<h3>Delivery details</h3>' +
              '<p>Tell us where this should go. We will send a confirmation by email.</p>' +
            '</div>' +
            '<div class="checkout-grid">' +
              '<label class="checkout-field checkout-span">Full name<input type="text" name="name" autocomplete="name" required></label>' +
              '<label class="checkout-field checkout-span">Email<input type="email" name="email" autocomplete="email" required></label>' +
              '<label class="checkout-field checkout-span">Address<input type="text" name="address" autocomplete="street-address" required></label>' +
              '<label class="checkout-field">City<input type="text" name="city" autocomplete="address-level2" required></label>' +
              '<label class="checkout-field">Postcode<input type="text" name="postcode" autocomplete="postal-code" required></label>' +
              '<label class="checkout-field checkout-span">Country<input type="text" name="country" autocomplete="country-name" value="Poland" required></label>' +
            '</div>' +
            '<div class="checkout-summary">' +
              '<p><span>Subtotal</span><strong id="checkoutSubtotal"></strong></p>' +
              '<p><span>Delivery</span><strong id="checkoutDelivery"></strong></p>' +
              '<p class="checkout-total"><span>Total</span><strong id="checkoutTotal"></strong></p>' +
            '</div>' +
            '<button class="button cart-place-order" type="submit" id="placeOrder">Place order</button>' +
            '<button class="cart-back" type="button" id="checkoutBack">Back to bag</button>' +
            '<p class="checkout-demo">Demo checkout. No payment will be taken.</p>' +
          '</form>' +
          '<div class="cart-confirm" id="cartConfirm" hidden>' +
            '<div class="cart-confirm-mark">&#10003;</div>' +
            '<p class="cart-eyebrow">Order placed</p>' +
            '<h3>Thank you<span id="confirmName"></span>.</h3>' +
            '<p>Order <strong id="confirmOrder"></strong> is confirmed. A receipt is on its way to <span id="confirmEmail"></span>.</p>' +
            '<p class="confirm-total">Total <strong id="confirmTotal"></strong></p>' +
            '<button class="button" type="button" data-cart-close>Continue shopping</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-foot" id="cartFoot">' +
          '<div class="cart-subtotal"><span>Subtotal</span><strong id="cartSubtotal"></strong></div>' +
          '<p class="cart-note">Taxes and delivery calculated at checkout.</p>' +
          '<button class="button cart-checkout" type="button" id="cartCheckout">Checkout</button>' +
          '<button class="cart-continue" type="button" data-cart-close>Continue shopping</button>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(root);

    drawer = root.querySelector('#cartDrawer');
    backdrop = root.querySelector('.cart-backdrop');
    itemsView = root.querySelector('#cartItemsView');
    itemsList = root.querySelector('#cartItems');
    emptyState = root.querySelector('#cartEmpty');
    foot = root.querySelector('#cartFoot');
    checkoutButton = root.querySelector('#cartCheckout');
    checkoutForm = root.querySelector('#checkoutForm');
    confirmView = root.querySelector('#cartConfirm');
    titleLabel = root.querySelector('#cartTitleLabel');
    titleCount = root.querySelector('#cartTitleCount');
    subtotalNode = root.querySelector('#cartSubtotal');
    checkoutSubtotal = root.querySelector('#checkoutSubtotal');
    checkoutDelivery = root.querySelector('#checkoutDelivery');
    checkoutTotal = root.querySelector('#checkoutTotal');
    placeOrderButton = root.querySelector('#placeOrder');

    root.querySelector('#checkoutBack').addEventListener('click', () => {
      setPanel('bag');
      render();
      checkoutButton.focus();
    });

    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!checkoutForm.reportValidity()) return;
      const values = new FormData(checkoutForm);
      const name = String(values.get('name') || '').trim();
      const email = String(values.get('email') || '').trim();
      const orderTotal = total();
      const orderNumber = 'CS-' + String(Date.now()).slice(-6);
      const firstName = name.split(/\s+/)[0];
      cart = [];
      persist();
      render();
      root.querySelector('#confirmName').textContent = firstName ? ', ' + firstName : '';
      root.querySelector('#confirmOrder').textContent = orderNumber;
      root.querySelector('#confirmEmail').textContent = email;
      root.querySelector('#confirmTotal').textContent = price(orderTotal);
      checkoutForm.reset();
      setPanel('confirm');
      syncHeader();
    });

    checkoutButton.addEventListener('click', () => {
      if (!lines().length) return;
      updateCheckout();
      setPanel('checkout');
      window.setTimeout(() => {
        const firstField = checkoutForm.querySelector('input');
        if (firstField) firstField.focus();
      }, 40);
    });

    document.addEventListener('keydown', (event) => {
      if (!drawer.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        drawer.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select, textarea')
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-cart-open]');
    if (opener) {
      event.preventDefault();
      open();
      return;
    }

    const closer = event.target.closest('[data-cart-close]');
    if (closer) {
      event.preventDefault();
      close();
      return;
    }

    const addButton = event.target.closest('[data-add-to-cart]');
    if (addButton) {
      event.preventDefault();
      const quantity = addButton.getAttribute('data-cart-quantity') || 1;
      if (!add(addButton.getAttribute('data-add-to-cart'), quantity)) return;
      open();
      const label = addButton.getAttribute('data-label') || addButton.textContent;
      addButton.setAttribute('data-label', label);
      addButton.textContent = 'Added to bag';
      addButton.disabled = true;
      window.setTimeout(() => {
        addButton.textContent = label;
        addButton.disabled = false;
        addButton.removeAttribute('data-label');
      }, 1200);
      return;
    }

    const item = event.target.closest('[data-cart-id]');
    if (!item) return;
    const id = item.getAttribute('data-cart-id');
    if (event.target.closest('[data-cart-inc]')) {
      changeQuantity(id, 1);
    } else if (event.target.closest('[data-cart-dec]')) {
      changeQuantity(id, -1);
    } else if (event.target.closest('[data-cart-remove]')) {
      remove(id);
    }
  });

  document.addEventListener('includes:loaded', syncHeader);

  window.addEventListener('load', syncHeader);

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    load();
    render();
  });

  window.CeramicBag = {
    open,
    close,
    add,
    count: itemCount
  };

  const init = () => {
    load();
    createDrawer();
    resetPanels();
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
