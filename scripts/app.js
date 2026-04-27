/* ================================================================
   La Maison des Gâteaux — app.js
   Modules :
     1. Navbar      — sticky + burger mobile
     2. Animations  — IntersectionObserver scroll reveal
     3. Galerie     — lightbox photos
     4. Formulaire  — commande → WhatsApp deeplink
     5. Panier      — add / remove / qty / total / localStorage
     6. FloatBtn    — bouton WA flottant
   ================================================================ */

/* Numéro configuré dans <meta name="wa-number"> du HTML — ne pas modifier ici */
const WA_NUMBER = document.querySelector('meta[name="wa-number"]')?.content || '336XXXXXXXX';

/* ────────────────────────────────────────────────────────────────
   CATALOGUE PRODUITS
   price: null = sur devis (inclus dans le panier, sans calcul prix)
──────────────────────────────────────────────────────────────── */
const CATALOG = {
  anniversaire: { name: "Gâteau d'Anniversaire",  price: 45   },
  mariage:      { name: "Gâteau de Mariage",       price: null },
  evenement:    { name: "Gâteau Événementiel",     price: 80   },
  foret:          { name: "Forêt Noire",              price: 35   },
  fraisier:       { name: "Fraisier",                 price: 38   },
  'cake-topper':  { name: "Cake Topper Personnalisé", price: 2500 },
  'figurine-gateau': { name: "Figurine pour Gâteaux", price: 3500 },
};

/* ────────────────────────────────────────────────────────────────
   POINT D'ENTRÉE
──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initGalerie();
  initCommandeForm();
  initCart();
  initFloatBtn();
  initOrderModal();
  initFilters();
  initScrollProgress();
  initCountUp();
  initCardTilt();
  initRipple();
});


/* ================================================================
   1. NAVBAR
   ================================================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const burger = document.getElementById('navbar-burger');
  const menu   = document.getElementById('navbar-menu');
  if (!navbar) return;

  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    menu?.classList.toggle('is-open', !open);
    document.body.style.overflow = !open ? 'hidden' : '';
  });

  menu?.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', closeMenu)
  );

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  function closeMenu() {
    burger?.setAttribute('aria-expanded', 'false');
    menu?.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}


/* ================================================================
   2. SCROLL ANIMATIONS
   ================================================================ */
function initScrollAnimations() {
  const targets = document.querySelectorAll('[data-animate]');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10) * 80;
      setTimeout(() => el.classList.add('is-visible'), delay);
      observer.unobserve(el);
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}


/* ================================================================
   3. GALERIE — LIGHTBOX
   ================================================================ */
function initGalerie() {
  const items = document.querySelectorAll('.galerie__item');
  const tpl   = document.getElementById('lightbox-tpl');
  if (!items.length || !tpl) return;

  items.forEach(item => {
    item.addEventListener('click',   () => openLightbox(item));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item); }
    });
  });

  function openLightbox(item) {
    const src = item.dataset.src || item.querySelector('img')?.src;
    const alt = item.dataset.alt || '';
    if (!src) return;

    const lb  = tpl.content.cloneNode(true).firstElementChild;
    const img = lb.querySelector('.lightbox__img');
    img.src   = src;
    img.alt   = alt;

    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lightbox__close').focus();

    const close = () => { lb.remove(); document.body.style.overflow = ''; };

    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__backdrop').addEventListener('click', close);
    document.addEventListener('keydown', function h(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', h); }
    });
  }
}


/* ================================================================
   4. FORMULAIRE COMMANDE → WHATSAPP
   ================================================================ */
function initCommandeForm() {
  const form = document.getElementById('commande-form');
  if (!form) return;

  /* Afficher le récap panier dès l'ouverture de la section */
  syncFormCartPreview();

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const prenom  = form.querySelector('#f-prenom')?.value.trim()  || '';
    const tel     = form.querySelector('#f-tel')?.value.trim()     || '';
    const adresse = form.querySelector('#f-adresse')?.value.trim() || '';
    const date    = form.querySelector('#f-date')?.value           || '';
    const message = form.querySelector('#f-message')?.value.trim() || '';

    const dateStr = date
      ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'à définir';

    const sep = '─────────────────────────';
    const lines = [`🎂 *COMMANDE — La Maison des Gâteaux*`, ``];

    /* ── Produits du panier ── */
    const cartItems = loadCart();
    if (cartItems.length > 0) {
      lines.push(`🛒 *PRODUITS COMMANDÉS :*`);
      cartItems.forEach(item => {
        const p     = CATALOG[item.id];
        if (!p) return;
        const prix  = p.price != null ? `${p.price * item.qty} FCFA` : 'Sur devis';
        lines.push(`  • ${p.name} × ${item.qty}  —  ${prix}`);
      });
      const total = cartTotal(cartItems);
      if (total > 0) lines.push(``, `💰 *Total estimé : ${total} FCFA*`);
      lines.push(sep);
    }

    /* ── Informations client ── */
    lines.push(
      `👤 *INFORMATIONS CLIENT :*`,
      `  Prénoms         : ${prenom}`,
      `  Téléphone       : ${tel}`,
      `  Adresse         : ${adresse}`,
      `  Date livraison  : ${dateStr}`,
    );

    if (message) {
      lines.push(``, `💬 *Message :*`, `  ${message}`);
    }

    lines.push(sep, `Merci de confirmer la disponibilité. 🙏`);

    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank', 'noopener,noreferrer'
    );
  });
}

/* Met à jour le récap panier visible dans le formulaire */
function syncFormCartPreview() {
  const wrapper   = document.getElementById('form-cart-preview');
  const itemsList = document.getElementById('form-cart-items');
  const totalEl   = document.getElementById('form-cart-total');
  if (!wrapper || !itemsList || !totalEl) return;

  const items = loadCart();

  if (items.length === 0) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;

  itemsList.innerHTML = items.map(item => {
    const p    = CATALOG[item.id];
    if (!p) return '';
    const prix = p.price != null ? `${p.price * item.qty} FCFA` : 'Sur devis';
    return `
      <li>
        <span class="item-name">${p.name}</span>
        <span class="item-qty">× ${item.qty}</span>
        <span class="item-price">${prix}</span>
      </li>`;
  }).join('');

  const total = cartTotal(items);
  totalEl.textContent = total > 0 ? `${total} FCFA` : '—';
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(input => {
    const field = input.closest('.field');
    if (!input.value.trim()) {
      field?.classList.add('field--error');
      valid = false;
    } else {
      field?.classList.remove('field--error');
    }
  });
  if (!valid) {
    form.querySelectorAll('[required]').forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.trim()) input.closest('.field')?.classList.remove('field--error');
      }, { once: true });
    });
    form.querySelector('.field--error [required]')?.focus();
  }
  return valid;
}


/* ================================================================
   5. PANIER
   ================================================================ */

const CART_KEY = 'mdg_cart_v1';

/* ── Persistance localStorage ───────────────────────────────── */

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

/* ── Mutations ──────────────────────────────────────────────── */

function cartAdd(id) {
  if (!CATALOG[id]) return;
  const items    = loadCart();
  const existing = items.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    items.push({ id, qty: 1 });
  }
  saveCart(items);
}

function cartRemove(id) {
  saveCart(loadCart().filter(i => i.id !== id));
}

function cartUpdateQty(id, delta) {
  const items = loadCart();
  const item  = items.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(items);
}

function cartClear() {
  saveCart([]);
}

/* ── Calculs ────────────────────────────────────────────────── */

function cartCount() {
  return loadCart().reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal(items) {
  return items.reduce((sum, i) => {
    const p = CATALOG[i.id];
    return p?.price != null ? sum + p.price * i.qty : sum;
  }, 0);
}

/* ── Rendu ──────────────────────────────────────────────────── */

function renderBadge() {
  const badge = document.getElementById('cart-badge');
  const btn   = document.getElementById('cart-btn');
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n;
  badge.hidden      = n === 0;
  btn?.setAttribute('aria-label', n > 0
    ? `Voir mon panier (${n} article${n > 1 ? 's' : ''})`
    : 'Voir mon panier'
  );
}

function renderCart() {
  const body = document.getElementById('cart-body');
  const foot = document.getElementById('cart-foot');
  if (!body || !foot) return;
  syncFormCartPreview(); /* Sync le récap dans le formulaire à chaque changement */

  const items = loadCart();

  /* ── État vide ── */
  if (items.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1" stroke-linecap="round" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <p>Votre panier est vide.</p>
        <a href="#creations" class="btn btn--outline btn--sm">Voir nos créations</a>
      </div>`;
    foot.innerHTML = '';
    return;
  }

  /* ── Liste articles ── */
  body.innerHTML = items.map(item => {
    const product  = CATALOG[item.id];
    if (!product) return '';
    const unitLabel  = product.price != null ? `${product.price} FCFA / unité` : 'Sur devis';
    const subtotal   = product.price != null ? `${product.price * item.qty} FCFA` : 'Devis';

    return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__info">
          <span class="cart-item__name">${product.name}</span>
          <span class="cart-item__unit">${unitLabel}</span>
        </div>
        <div class="cart-item__controls">
          <div class="cart-item__qty" role="group" aria-label="Quantité">
            <button class="cart-item__qty-btn" data-dec="${item.id}"
                    aria-label="Diminuer la quantité">−</button>
            <span  class="cart-item__qty-val" aria-live="polite">${item.qty}</span>
            <button class="cart-item__qty-btn" data-inc="${item.id}"
                    aria-label="Augmenter la quantité">+</button>
          </div>
          <span class="cart-item__subtotal">${subtotal}</span>
          <button class="cart-item__remove" data-remove="${item.id}"
                  aria-label="Supprimer ${product.name} du panier">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>`;
  }).join('');

  /* Listeners sur les contrôles injectés */
  body.querySelectorAll('[data-dec]').forEach(btn =>
    btn.addEventListener('click', () => { cartUpdateQty(btn.dataset.dec, -1); renderCart(); renderBadge(); })
  );
  body.querySelectorAll('[data-inc]').forEach(btn =>
    btn.addEventListener('click', () => { cartUpdateQty(btn.dataset.inc, +1); renderCart(); renderBadge(); })
  );
  body.querySelectorAll('[data-remove]').forEach(btn =>
    btn.addEventListener('click', () => { cartRemove(btn.dataset.remove); renderCart(); renderBadge(); })
  );

  /* ── Pied : total + actions ── */
  const total    = cartTotal(items);
  const hasDevis = items.some(i => CATALOG[i.id]?.price == null);

  foot.innerHTML = `
    <div class="cart-total">
      <span class="cart-total__label">Total estimé</span>
      <span class="cart-total__amount">${total > 0 ? total + ' FCFA' : '—'}</span>
    </div>
    ${hasDevis ? `<p class="cart-notice">* Les articles sur devis ne sont pas inclus dans le total.</p>` : ''}
    <button class="btn btn--wa btn--lg" id="cart-checkout" style="width:100%">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L.057 23.617a.75.75 0 00.918.924l5.909-1.459A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.892 0-3.667-.5-5.2-1.375l-.374-.215-3.874.956.983-3.77-.235-.388A9.938 9.938 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
      Commander
    </button>
    <button class="btn btn--ghost cart-clear btn--sm" id="cart-clear" style="width:100%">
      Vider le panier
    </button>`;

  document.getElementById('cart-checkout')?.addEventListener('click', cartCheckout);
  document.getElementById('cart-clear')?.addEventListener('click', () => {
    cartClear(); renderCart(); renderBadge();
  });
}

/* ── Checkout → ouvre la modale formulaire ──────────────────── */

function cartCheckout() {
  /* Fermer le drawer d'abord */
  document.getElementById('cart-drawer')?.classList.remove('is-open');
  document.getElementById('cart-overlay')?.classList.remove('is-visible');
  document.body.style.overflow = '';

  openOrderModal();
}

function openOrderModal() {
  renderModalRecap();
  const overlay = document.getElementById('order-overlay');
  const modal   = document.getElementById('order-modal');
  overlay?.classList.add('is-visible');
  overlay?.removeAttribute('aria-hidden');
  modal?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('m-prenom')?.focus(), 50);
}

function closeOrderModal() {
  const overlay = document.getElementById('order-overlay');
  const modal   = document.getElementById('order-modal');
  overlay?.classList.remove('is-visible');
  overlay?.setAttribute('aria-hidden', 'true');
  modal?.classList.remove('is-open');
  document.body.style.overflow = '';
}

function renderModalRecap() {
  const recap = document.getElementById('modal-cart-recap');
  if (!recap) return;
  const items = loadCart();
  if (items.length === 0) { recap.innerHTML = ''; return; }

  const total = cartTotal(items);
  recap.innerHTML = `
    <div class="commande__cart-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      Votre sélection
    </div>
    <ul class="commande__cart-items">
      ${items.map(item => {
        const p = CATALOG[item.id];
        if (!p) return '';
        const prix = p.price != null ? `${p.price * item.qty} FCFA` : 'Sur devis';
        return `<li>
          <span class="item-name">${p.name}</span>
          <span class="item-qty">× ${item.qty}</span>
          <span class="item-price">${prix}</span>
        </li>`;
      }).join('')}
    </ul>
    <div class="commande__cart-total">
      <span>Total estimé</span>
      <strong>${total > 0 ? total + ' FCFA' : '—'}</strong>
    </div>`;
}

/* ── Toast ──────────────────────────────────────────────────── */

function showToast(productName) {
  const existing = document.querySelector('.cart-toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.5 6.5l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06L7 8.94l3.47-3.47a.75.75 0 111.06 1.06z"/>
    </svg>
    <span><strong>${productName}</strong> ajouté au panier</span>`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 2800);
}

/* ── Initialisation du module ───────────────────────────────── */

function initCart() {
  const btn     = document.getElementById('cart-btn');
  const overlay = document.getElementById('cart-overlay');
  const drawer  = document.getElementById('cart-drawer');
  const closeBtn= document.getElementById('cart-close');

  /* Ouvrir / fermer le drawer */
  btn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-open')) closeDrawer();
  });

  /* Boutons "Ajouter au panier" sur les cards */
  document.querySelectorAll('[data-cart-add]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.cartAdd;
      if (!CATALOG[id]) return;

      cartAdd(id);
      renderBadge();
      renderCart();

      /* Feedback visuel */
      showToast(CATALOG[id].name);
      flashBadge();

      /* Ouvrir le drawer uniquement sur desktop */
      if (window.innerWidth >= 768) openDrawer();
    });
  });

  /* Rendu initial (restaure le panier depuis localStorage) */
  renderBadge();
  renderCart();

  /* ── Helpers locaux ── */

  function openDrawer() {
    drawer?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function closeDrawer() {
    drawer?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  function flashBadge() {
    btn?.classList.add('is-added');
    btn?.addEventListener('animationend', () => btn.classList.remove('is-added'), { once: true });
  }
}


/* ================================================================
   6. MODALE FINALISATION COMMANDE (initOrderModal)
   ================================================================ */
function initOrderModal() {
  const overlay  = document.getElementById('order-overlay');
  const modal    = document.getElementById('order-modal');
  const closeBtn = document.getElementById('order-modal-close');
  const form     = document.getElementById('order-modal-form');
  if (!modal) return;

  closeBtn?.addEventListener('click', closeOrderModal);
  overlay?.addEventListener('click', closeOrderModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeOrderModal();
  });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const prenom  = form.querySelector('#m-prenom')?.value.trim()  || '';
    const tel     = form.querySelector('#m-tel')?.value.trim()     || '';
    const adresse = form.querySelector('#m-adresse')?.value.trim() || '';
    const date    = form.querySelector('#m-date')?.value           || '';
    const message = form.querySelector('#m-message')?.value.trim() || '';

    const dateStr = date
      ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'à définir';

    const sep   = '─────────────────────────';
    const lines = [`🎂 *COMMANDE — La Maison des Gâteaux*`, ``];

    const cartItems = loadCart();
    if (cartItems.length > 0) {
      lines.push(`🛒 *PRODUITS COMMANDÉS :*`);
      cartItems.forEach(item => {
        const p = CATALOG[item.id];
        if (!p) return;
        const prix = p.price != null ? `${p.price * item.qty} FCFA` : 'Sur devis';
        lines.push(`  • ${p.name} × ${item.qty}  —  ${prix}`);
      });
      const total = cartTotal(cartItems);
      if (total > 0) lines.push(``, `💰 *Total estimé : ${total} FCFA*`);
      lines.push(sep);
    }

    lines.push(
      `👤 *INFORMATIONS CLIENT :*`,
      `  Prénoms         : ${prenom}`,
      `  Téléphone       : ${tel}`,
      `  Adresse         : ${adresse}`,
      `  Date livraison  : ${dateStr}`,
    );

    if (message) lines.push(``, `💬 *Message :*`, `  ${message}`);
    lines.push(sep, `Merci de confirmer la disponibilité. 🙏`);

    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank', 'noopener,noreferrer'
    );

    closeOrderModal();
    form.reset();
    cartClear();
    renderCart();
    renderBadge();
  });
}


/* ================================================================
   7. MICRO-ANIMATIONS PREMIUM
   ================================================================ */

/* ── Barre de progression de lecture ─────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const update = () => {
    const scrolled = window.scrollY;
    const max      = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── Count-up sur les stats À propos ─────────────────────────── */
function initCountUp() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TARGETS = [
    { el: null, from: 2010, to: 2016, suffix: '' },
    { el: null, from:    0, to:  100, suffix: ' %' },
    { el: null, from:    0, to:   48, suffix: ' h'  },
  ];

  const stats = document.querySelectorAll('.apropos__stats strong');
  if (stats.length < 3) return;
  stats.forEach((el, i) => { TARGETS[i].el = el; });

  const run = target => {
    const { el, from, to, suffix } = target;
    const duration = 1200;
    const start    = performance.now();
    const step = now => {
      const progress = Math.min((now - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
      el.textContent = Math.round(from + (to - from) * ease) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx = [...stats].indexOf(entry.target);
      if (TARGETS[idx]) run(TARGETS[idx]);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  stats.forEach(el => observer.observe(el));
}

/* ── Tilt 3D magnétique sur les cards ────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return; /* skip tactile */

  const MAX = 7; /* degrés max */

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5; /* -0.5 → 0.5 */
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.setProperty('--tilt-x', `${(-y * MAX).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${ (x * MAX).toFixed(2)}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

/* ── Effet ripple sur boutons et filtres ─────────────────────── */
function initRipple() {
  const targets = document.querySelectorAll('.btn--primary, .btn--wa, .filter-tab');

  targets.forEach(btn => {
    btn.addEventListener('click', e => {
      const r    = btn.getBoundingClientRect();
      const span = document.createElement('span');
      span.className   = 'filter-tab__ripple';
      span.style.left  = `${e.clientX - r.left - 4}px`;
      span.style.top   = `${e.clientY - r.top  - 4}px`;
      btn.appendChild(span);
      span.addEventListener('animationend', () => span.remove(), { once: true });
    });
  });
}


/* ================================================================
   8. FILTRES CRÉATIONS
   ================================================================ */
function initFilters() {
  const tabs  = document.querySelectorAll('.filter-tab');
  const items = document.querySelectorAll('.creations__grid > [data-filter]');
  if (!tabs.length || !items.length) return;

  const applyFilter = filter => {
    items.forEach(item => {
      /* data-filter peut contenir plusieurs catégories séparées par des espaces */
      const cats  = (item.dataset.filter || '').split(' ');
      const match = filter === 'all' || cats.includes(filter);

      item.hidden = !match;

      /* Ré-anime les cards visibles */
      if (match) {
        const card = item.querySelector('[data-animate]');
        if (card) {
          card.classList.remove('is-visible');
          requestAnimationFrame(() =>
            setTimeout(() => card.classList.add('is-visible'), 60)
          );
        }
      }
    });
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-pressed', 'true');
      applyFilter(tab.dataset.filter);
    });
  });

  /* État ARIA initial */
  tabs.forEach(t =>
    t.setAttribute('aria-pressed', t.classList.contains('is-active') ? 'true' : 'false')
  );
}


/* ================================================================
   8. BOUTON FLOTTANT WHATSAPP
   ================================================================ */
function initFloatBtn() {
  const btn     = document.getElementById('btn-float-wa');
  const section = document.getElementById('commander');
  if (!btn) return;

  const toggle = () => {
    const scrolled = window.scrollY > 300;
    const inCta    = section
      ? section.getBoundingClientRect().top < window.innerHeight &&
        section.getBoundingClientRect().bottom > 0
      : false;
    btn.hidden = !scrolled || inCta;
  };

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}
