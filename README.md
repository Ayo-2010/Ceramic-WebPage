# Ceramic Studio

A handmade ceramics storefront built with plain HTML, CSS and JavaScript. It includes the studio site, a filterable shop, product pages, a persistent shopping bag and a demo checkout.

## Features

- Shared header and footer included with a small fetch-based include script
- Product catalog for tableware and workshops
- Product detail pages with image thumbnails, quantity controls and related pieces
- Persistent bag stored in `localStorage`
- Slide-out cart with quantity controls, removal and live totals
- Checkout form with validation, delivery calculation and an order confirmation
- Responsive layouts for desktop, tablet and mobile
- No build step and no framework

## Pages

- `index.html` — studio home and bestsellers
- `shop.html` — full catalog
- `shop-new.html` — new pieces and workshop dates
- `shop-products.html` — tableware only
- `product.html?id=sara-mug` — product detail
- `workshop.html` — workshop information and booking links
- `blog.html` — studio journal
- `contact.html` — contact details and form

## Files

```
cart.css                 shared bag, header and add-to-bag styles
product.css              product detail styles
product.html             product detail page
js/products.js           product catalog and price helpers
js/cart.js               bag state, drawer and checkout
js/shop.js               shop and bestseller rendering
js/product.js            product detail rendering
js/include.js            shared header/footer loader
includes/                shared header and footer markup
```

## Running it

Serve the folder with any static server, for example:

```
npx serve .
```

The shared header and footer use `fetch`, so the pages need to be served over HTTP rather than opened directly from disk.

## Checkout

The checkout is a front-end demo. It validates the form, calculates delivery and shows an order confirmation, but it does not take payment or send an order to a server.
