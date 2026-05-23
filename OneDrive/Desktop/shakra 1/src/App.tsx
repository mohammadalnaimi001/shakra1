import { Check, ChevronRight, CreditCard, Crown, Heart, Instagram, Lock, Menu, MessageCircle, Minus, Package, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Star, User, X } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { BRAND, collections, products, reviews, sampleOrders } from "./data";
import { categoryLabel, lc, legalContent, lp, t } from "./i18n";
import { useStore } from "./store";
import type { Language, Product } from "./types";
import AdminPanel from "./admin/AdminPanel";


function Logo({ compact = false }: { compact?: boolean }) {
  const { language, logoMarkUrl } = useStore();
  return (
    <Link to="/" className={compact ? "logo compact" : "logo"} aria-label={t(language, "logoAlt")}>
      <span className="logo-mark"><img src={logoMarkUrl} alt="" /></span>
      {!compact && (
        <div>
          <strong>{t(language, "brandName")}</strong>
          <small>{t(language, "domain")}</small>
        </div>
      )}
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { cart, wishlist, currency, setCurrency, language, toggleLanguage } = useStore();
  const nav = [
    ["/shop", t(language, "shop")],
    ["/collections", t(language, "collections")],
    ["/about", t(language, "about")],
    ["/contact", t(language, "contact")]
  ];
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="site-header">
      <Logo />
      <nav className="desktop-nav" aria-label={t(language, "openMenu")}>
        {nav.map(([href, label]) => <NavLink key={href} to={href}>{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <a className="icon-button" href={BRAND.instagram} target="_blank" rel="noreferrer" aria-label={t(language, "instagram")}><Instagram size={18} /></a>
        <button className="pill-button ghost" onClick={() => setCurrency(currency === "JOD" ? "USD" : "JOD")}>{currency}</button>
        <button className="pill-button ghost" onClick={toggleLanguage}>{language === "en" ? "AR" : "EN"}</button>
        <Link className="icon-button with-count" to="/wishlist" aria-label={t(language, "wishlist")}><Heart size={18} /><span>{wishlist.length}</span></Link>
        <Link className="icon-button with-count cart-link" to="/cart" aria-label={t(language, "shoppingCart")}><ShoppingBag size={18} /><span>{cartCount}</span></Link>
        <button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label={t(language, "openMenu")}><Menu size={20} /></button>
      </div>
      {open && (
          <div className="mobile-panel page-enter">
            <button className="icon-button close-menu" onClick={() => setOpen(false)} aria-label={t(language, "closeMenu")}><X size={20} /></button>
            <Logo />
            {nav.map(([href, label]) => <NavLink key={href} to={href} onClick={() => setOpen(false)}>{label}</NavLink>)}
            <NavLink to="/dashboard" onClick={() => setOpen(false)}>{t(language, "account")}</NavLink>
            <NavLink to="/admin" onClick={() => setOpen(false)}>{t(language, "admin")}</NavLink>
            <div className="mobile-switches">
              <button className="pill-button ghost" onClick={() => setCurrency(currency === "JOD" ? "USD" : "JOD")}>{currency}</button>
              <button className="pill-button ghost" onClick={toggleLanguage}>{language === "en" ? "AR" : "EN"}</button>
            </div>
            <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="primary-button"><MessageCircle size={18} /> {t(language, "whatsapp")}</a>
          </div>
        )}
    </header>
  );
}

function AppLoader() {
  const { logoMarkUrl, language } = useStore();
  return <div className="loader" aria-hidden="true"><span><img src={logoMarkUrl} alt={t(language, "logoAlt")} /></span></div>;
}

function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`bottle-stage ${large ? "large" : ""}`} style={{ background: product.image }}>
      <div className="bottle"><span>SP</span></div>
      <div className="bottle-shadow" />
    </div>
  );
}

function AddButton({ productId, labelKey = "add", className = "mini-button" }: { productId: string; labelKey?: "add" | "reserve"; className?: string }) {
  const { addToCart, language } = useStore();
  return <button className={className} onClick={() => addToCart(productId)}><Plus size={16} /> {t(language, labelKey)}</button>;
}

function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, wishlist, formatPrice, language } = useStore();
  const display = lp(language, product);
  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} aria-label={display.name}><ProductVisual product={product} /></Link>
      <div className="product-meta">
        <div>
          <p className="eyebrow">{lc(language, product.collection)}</p>
          <h3>{display.name}</h3>
        </div>
        <button className="icon-button" onClick={() => toggleWishlist(product.id)} aria-label={t(language, "toggleWishlist")}>
          <Heart size={18} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <p>{display.aura}</p>
      <div className="card-footer">
        <strong>{formatPrice(product.priceJod)}</strong>
        <AddButton productId={product.id} />
      </div>
    </article>
  );
}

function Home() {
  const { formatPrice, getRecommendations, language } = useStore();
  const heroProduct = products[0];
  const heroDisplay = lp(language, heroProduct);
  return (
    <main className="page-enter">
      <section className="hero">
        <div className="hero-media" />
        <div className="hero-content">
          <p className="eyebrow">{t(language, "homeEyebrow")}</p>
          <h1>{t(language, "homeTitle")}</h1>
          <p>{t(language, "homeCopy")}</p>
          <div className="hero-actions">
            <Link to="/shop" className="primary-button">{t(language, "discoverHouse")} <ChevronRight size={18} /></Link>
            <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="secondary-button"><MessageCircle size={18} /> {t(language, "privateConcierge")}</a>
          </div>
        </div>
        <div className="hero-card glass">
          <Sparkles size={20} />
          <span>{t(language, "signatureLaunch")}</span>
          <strong>{heroDisplay.name}</strong>
          <small>{formatPrice(heroProduct.priceJod)} · {heroProduct.concentration}</small>
          <AddButton productId={heroProduct.id} labelKey="reserve" />
        </div>
      </section>
      <section className="brand-strip" aria-label={t(language, "brandIdentity")}>
        {["brandPillar1", "brandPillar2", "brandPillar3", "brandPillar4"].map((key) => <span key={key}>{t(language, key as Parameters<typeof t>[1])}</span>)}
      </section>
      <section className="section-grid">
        <div className="section-copy">
          <p className="eyebrow">{t(language, "houseCodes")}</p>
          <h2>{t(language, "houseCodesTitle")}</h2>
          <p>{t(language, "houseCodesCopy")}</p>
        </div>
        <div className="ritual-grid">
          {collections.map((collection) => (
            <Link to="/collections" className="collection-tile" key={collection.name} style={{ background: collection.image }}>
              <span>{lc(language, collection.name)}</span>
              <p>{collectionLine(language, collection.name)}</p>
            </Link>
          ))}
        </div>
      </section>
      <SectionHead eyebrow={t(language, "aiRecommended")} title={t(language, "selectedAura")} link="/shop" linkLabel={t(language, "shopAll")} />
      <div className="product-grid">{getRecommendations().map((product) => <ProductCard key={product.id} product={product} />)}</div>
      <Testimonials language={language} />
    </main>
  );
}

function Shop() {
  const { language } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.category)))];
  const filtered = useMemo(() => {
    return products
      .filter((product) => category === "All" || product.category === category)
      .filter((product) => {
        const display = lp(language, product);
        const haystack = [product.name, product.arabicName, display.aura, display.description, product.collection, display.collection, product.category, display.category, ...display.tags, ...display.notes.top, ...display.notes.heart, ...display.notes.base].join(" ").toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => {
        if (sort === "price-low") return a.priceJod - b.priceJod;
        if (sort === "price-high") return b.priceJod - a.priceJod;
        if (sort === "rating") return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      });
  }, [category, query, sort, language]);
  return (
    <main className="page page-enter">
      <PageTitle eyebrow={t(language, "boutiqueEyebrow")} title={t(language, "boutiqueTitle")} copy={t(language, "boutiqueCopy")} />
      <div className="shop-controls glass">
        <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(language, "search")} /></label>
        <div className="chip-row">{categories.map((item) => <button key={item} className={item === category ? "chip active" : "chip"} onClick={() => setCategory(item)}>{categoryLabel(language, item)}</button>)}</div>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label={t(language, "sortLabel")}>
          <option value="featured">{t(language, "featured")}</option>
          <option value="rating">{t(language, "highestRated")}</option>
          <option value="price-low">{t(language, "priceLow")}</option>
          <option value="price-high">{t(language, "priceHigh")}</option>
        </select>
      </div>
      <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    </main>
  );
}

function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleWishlist, wishlist, formatPrice, getRecommendations, language } = useStore();
  const product = products.find((entry) => entry.slug === slug) ?? products[0];
  const display = lp(language, product);
  const productReviews = reviews.filter((review) => review.productId === product.id);
  return (
    <main className="page product-detail-page page-enter">
      <section className="product-detail">
        <ProductVisual product={product} large />
        <div className="detail-copy">
          <p className="eyebrow">{lc(language, product.collection)}</p>
          <h1>{display.name}</h1>
          <p>{display.description}</p>
          <div className="rating-row"><Star size={18} fill="currentColor" /> {product.rating} ({product.reviewCount} {t(language, "reviews")})</div>
          <strong className="detail-price">{formatPrice(product.priceJod)}</strong>
          <div className="detail-actions">
            <AddButton productId={product.id} className="primary-button" />
            <button className="secondary-button" onClick={() => toggleWishlist(product.id)}><Heart size={18} fill={wishlist.includes(product.id) ? "currentColor" : "none"} /> {t(language, "save")}</button>
            <button className="secondary-button" onClick={() => navigate("/checkout")}>{t(language, "checkout")}</button>
          </div>
          <div className="note-grid">
            {(["top", "heart", "base"] as const).map((level) => (
              <div key={level}><span>{t(language, `note${level[0].toUpperCase()}${level.slice(1)}` as Parameters<typeof t>[1])}</span><p>{display.notes[level].join(language === "ar" ? "، " : ", ")}</p></div>
            ))}
          </div>
        </div>
      </section>
      <SectionHead eyebrow={t(language, "recommendationEngine")} title={t(language, "pairsWith")} />
      <div className="product-grid">{getRecommendations(product).map((item) => <ProductCard key={item.id} product={item} />)}</div>
      {productReviews.length ? <Testimonials language={language} productId={product.id} /> : <section className="testimonial-band"><blockquote><p>{t(language, "noReviews")}</p></blockquote></section>}
    </main>
  );
}

function Collections() {
  const { language } = useStore();
  return (
    <main className="page page-enter">
      <PageTitle eyebrow={t(language, "collectionsEyebrow")} title={t(language, "collectionsTitle")} copy={t(language, "collectionsCopy")} />
      <div className="collection-page-grid">
        {collections.map((collection) => (
          <section className="collection-feature" key={collection.name} style={{ background: collection.image }}>
            <p className="eyebrow">{t(language, "brandName")}</p>
            <h2>{lc(language, collection.name)}</h2>
            <p>{collectionLine(language, collection.name)}</p>
            <Link to="/shop" className="secondary-button">{t(language, "exploreCollection")}</Link>
          </section>
        ))}
      </div>
    </main>
  );
}

function About() {
  const { language } = useStore();
  return (
    <main className="page page-enter">
      <PageTitle eyebrow={t(language, "brandIdentity")} title={t(language, "aboutTitle")} copy={t(language, "aboutCopy")} />
      <section className="about-grid">
        <div className="glass manifesto"><Crown size={28} /><h2>{t(language, "luxuryWithoutNoise")}</h2><p>{t(language, "luxuryWithoutNoiseCopy")}</p></div>
        <div className="stat-panel"><span>2026</span><p>{t(language, "digitalFlagship")} {BRAND.domain}</p></div>
        <div className="stat-panel"><span>3</span><p>{t(language, "signatureCollections")}</p></div>
      </section>
    </main>
  );
}

function Contact() {
  const { language } = useStore();
  return (
    <main className="page page-enter">
      <PageTitle eyebrow={t(language, "contactEyebrow")} title={t(language, "contactTitle")} copy={t(language, "contactCopy")} />
      <section className="contact-grid">
        <div className="glass contact-card">
          <h2>{t(language, "conciergeDetails")}</h2>
          <a href={`tel:${BRAND.phone}`} className="contact-line">{BRAND.phone}</a>
          <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="primary-button"><MessageCircle size={18} /> {t(language, "whatsappNow")}</a>
          <a href={BRAND.instagram} target="_blank" rel="noreferrer" className="secondary-button"><Instagram size={18} /> {t(language, "instagram")}</a>
        </div>
        <form className="glass form-card">
          <label>{t(language, "name")}<input required placeholder={t(language, "yourName")} /></label>
          <label>{t(language, "email")}<input required type="email" placeholder={t(language, "clientEmail")} /></label>
          <label>{t(language, "message")}<textarea required placeholder={t(language, "contactMessagePlaceholder")} /></label>
          <button className="primary-button" type="submit">{t(language, "sendRequest")}</button>
        </form>
      </section>
    </main>
  );
}

function Cart() {
  const { cart, updateQuantity, removeFromCart, totals, formatPrice, language } = useStore();
  const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId)! }));
  return (
    <main className="page page-enter">
      <PageTitle eyebrow={t(language, "orderEdit")} title={t(language, "cart")} copy={t(language, "cartCopy")} />
      <section className="commerce-layout">
        <div className="line-items">
          {items.length ? items.map(({ product, quantity }) => {
            const display = lp(language, product);
            return (
              <div className="line-item glass" key={product.id}>
                <ProductVisual product={product} />
                <div><h3>{display.name}</h3><p>{display.aura}</p><strong>{formatPrice(product.priceJod)}</strong></div>
                <div className="quantity"><button onClick={() => updateQuantity(product.id, quantity - 1)}><Minus size={16} /></button><span>{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1)}><Plus size={16} /></button></div>
                <button className="icon-button" onClick={() => removeFromCart(product.id)} aria-label={t(language, "removeItem")}><X size={18} /></button>
              </div>
            );
          }) : <EmptyState title={t(language, "cartEmptyTitle")} copy={t(language, "cartEmptyCopy")} />}
        </div>
        <OrderSummary subtotal={totals.subtotalJod} delivery={totals.deliveryJod} total={totals.totalJod} cta="/checkout" />
      </section>
    </main>
  );
}

function Checkout() {
  const { cart, totals, formatPrice, language } = useStore();
  const [payment, setPayment] = useState<"card" | "cod">("card");
  const [complete, setComplete] = useState(false);
  const phonePattern = "^(\\+?962|0)?7[789][0-9]{7}$";
  return (
    <main className="page checkout-page page-enter">
      <div className="checkout-logo-row"><Logo /></div>
      <PageTitle eyebrow={t(language, "secureCheckout")} title={t(language, "checkoutTitle")} copy={t(language, "checkoutCopy")} />
      {complete ? (
        <section className="success-state glass"><Check size={42} /><h2>{t(language, "orderReceived")}</h2><p>{t(language, "orderReceivedCopy")}</p><Link to="/dashboard" className="primary-button">{t(language, "trackOrder")}</Link></section>
      ) : (
        <form className="checkout-grid" onSubmit={(event) => { event.preventDefault(); setComplete(true); }}>
          <div className="glass form-card">
            <h2>{t(language, "deliveryInfo")}</h2>
            <label>{t(language, "fullName")}<input required minLength={3} placeholder={t(language, "fullName")} /></label>
            <label>{t(language, "phone")}<input required pattern={phonePattern} placeholder="+962785828950" /></label>
            <label>{t(language, "email")}<input required type="email" placeholder={t(language, "clientEmail")} /></label>
            <label>{t(language, "address")}<textarea required minLength={10} placeholder={t(language, "addressPlaceholder")} /></label>
            <h2>{t(language, "paymentMethod")}</h2>
            <div className="payment-options">
              <label className={payment === "card" ? "payment active" : "payment"}><input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} /><CreditCard size={20} /> {t(language, "card")}</label>
              <label className={payment === "cod" ? "payment active" : "payment"}><input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} /><Package size={20} /> {t(language, "cod")}</label>
            </div>
            {payment === "card" && <div className="card-fields"><label>{t(language, "cardNumber")}<input required inputMode="numeric" minLength={16} maxLength={19} placeholder="4242 4242 4242 4242" /></label><div className="field-row"><label>{t(language, "expiry")}<input required placeholder="MM/YY" /></label><label>{t(language, "cvc")}<input required inputMode="numeric" minLength={3} maxLength={4} placeholder="123" /></label></div></div>}
            <p className="secure-note"><Lock size={16} /> {t(language, "secureNote")}</p>
          </div>
          <div><OrderSummary subtotal={totals.subtotalJod} delivery={totals.deliveryJod} total={totals.totalJod} /><button className="primary-button full" type="submit" disabled={!cart.length}>{t(language, "confirmOrder")} · {formatPrice(totals.totalJod)}</button></div>
        </form>
      )}
    </main>
  );
}

function LoginRegister() {
  const { login, user, logout, language } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <main className="page auth-page page-enter">
      <form className="glass form-card auth-card" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); login(String(data.get("email")), String(data.get("name") || t(language, "privateClient"))); }}>
        <Logo />
        <div className="tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>{t(language, "login")}</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>{t(language, "register")}</button></div>
        {mode === "register" && <label>{t(language, "name")}<input name="name" required placeholder={t(language, "yourName")} /></label>}
        <label>{t(language, "email")}<input name="email" type="email" required placeholder={t(language, "clientEmail")} /></label>
        <label>{t(language, "password")}<input type="password" required minLength={8} placeholder={t(language, "minPassword")} /></label>
        <button className="primary-button" type="submit">{mode === "login" ? t(language, "enterAccount") : t(language, "createAccount")}</button>
        {user && <button className="secondary-button" type="button" onClick={logout}>{t(language, "logoutCurrent")}</button>}
      </form>
    </main>
  );
}

function Dashboard() {
  const { user, wishlist, formatPrice, language } = useStore();
  return (
    <main className="page page-enter">
      <PageTitle eyebrow={t(language, "privateClient")} title={user?.name ?? t(language, "guestProfile")} copy={t(language, "dashboardCopy")} />
      <section className="dashboard-grid">
        <div className="glass dashboard-card"><User size={24} /><h2>{user?.tier ?? t(language, "guest")}</h2><p>{user?.email ?? t(language, "signInPersonalize")}</p><Link to="/login" className="secondary-button">{t(language, "manageLogin")}</Link></div>
        <div className="glass dashboard-card"><Heart size={24} /><h2>{wishlist.length} {t(language, "savedScents")}</h2><Link to="/wishlist" className="secondary-button">{t(language, "viewWishlist")}</Link></div>
        {sampleOrders.map((order) => <div className="glass dashboard-card" key={order.id}><Package size={24} /><h2>{order.id}</h2><p>{orderStatus(language, order.status)} · {order.date}</p><strong>{formatPrice(order.totalJod)}</strong></div>)}
      </section>
    </main>
  );
}

function Wishlist() {
  const { wishlist, language } = useStore();
  const saved = products.filter((product) => wishlist.includes(product.id));
  return (
    <main className="page page-enter">
      <PageTitle eyebrow={t(language, "wishlistEyebrow")} title={t(language, "wishlist")} copy={t(language, "wishlistCopy")} />
      {saved.length ? <div className="product-grid">{saved.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title={t(language, "noSavedTitle")} copy={t(language, "noSavedCopy")} />}
    </main>
  );
}

function Admin() {
  return <AdminPanel />;
}

function Policy({ type }: { type: "privacy" | "terms" | "faq" }) {
  const { language } = useStore();
  const title = type === "faq" ? t(language, "faq") : type === "privacy" ? t(language, "privacy") : t(language, "terms");
  return (
    <main className="page legal-page page-enter">
      <PageTitle eyebrow={t(language, "clientCare")} title={title} copy={t(language, "policyCopy")} />
      <div className="glass legal-card">{legalContent[language][type].map((item, index) => <section key={item}><h2>{index + 1}</h2><p>{item}</p></section>)}</div>
    </main>
  );
}

function OrderSummary({ subtotal, delivery, total, cta }: { subtotal: number; delivery: number; total: number; cta?: string }) {
  const { formatPrice, language } = useStore();
  return (
    <aside className="glass order-summary">
      <h2>{t(language, "orderSummary")}</h2>
      <div><span>{t(language, "subtotal")}</span><strong>{formatPrice(subtotal)}</strong></div>
      <div><span>{t(language, "delivery")}</span><strong>{formatPrice(delivery)}</strong></div>
      <div className="summary-total"><span>{t(language, "total")}</span><strong>{formatPrice(total)}</strong></div>
      <p><ShieldCheck size={16} /> {t(language, "summaryNote")}</p>
      {cta && <Link to={cta} className="primary-button full">{t(language, "proceedCheckout")}</Link>}
    </aside>
  );
}

function CartToast() {
  const { toast, dismissToast, language, formatPrice } = useStore();
  const product = toast ? products.find((item) => item.id === toast.productId) : undefined;
  if (!toast || !product) return null;
  const display = lp(language, product);
  return (
    <aside className="cart-toast glass page-enter" role="status">
        <button className="icon-button toast-close" onClick={dismissToast} aria-label={t(language, "closeMenu")}><X size={16} /></button>
        <ProductVisual product={product} />
        <div className="toast-copy"><span><Check size={16} /> {t(language, "addedTitle")}</span><h3>{display.name}</h3><p>{display.name} {t(language, "addedCopy")}</p><strong>{formatPrice(product.priceJod)}</strong></div>
        <div className="toast-actions"><button className="secondary-button" onClick={dismissToast}>{t(language, "continueShopping")}</button><Link className="primary-button" to="/cart" onClick={dismissToast}>{t(language, "viewCart")}</Link></div>
      </aside>
  );
}

function PageTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <section className="page-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></section>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  const { language } = useStore();
  return <div className="glass empty-state"><Sparkles size={28} /><h2>{title}</h2><p>{copy}</p><Link to="/shop" className="primary-button">{t(language, "shopFragrances")}</Link></div>;
}

function SectionHead({ eyebrow, title, link, linkLabel }: { eyebrow: string; title: string; link?: string; linkLabel?: string }) {
  return <section className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{link && linkLabel && <Link to={link} className="text-link">{linkLabel} <ChevronRight size={16} /></Link>}</section>;
}

function Testimonials({ language, productId }: { language: Language; productId?: string }) {
  const items = productId ? reviews.filter((review) => review.productId === productId) : reviews;
  return (
    <section className="testimonial-band">
      {items.map((review) => <blockquote key={review.id}><div>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={15} fill="currentColor" />)}</div><p>"{reviewBody(language, review.id, review.body)}"</p><cite>{review.name} · {review.location}</cite></blockquote>)}
    </section>
  );
}

function Footer() {
  const { language } = useStore();
  return (
    <footer className="site-footer">
      <Logo />
      <div><p>{t(language, "footerLine")} · {BRAND.domain}</p><p>{t(language, "officialContact")}: <a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a></p></div>
      <div className="footer-links">
        <Link to="/privacy">{t(language, "privacyShort")}</Link>
        <Link to="/terms">{t(language, "termsShort")}</Link>
        <Link to="/faq">{t(language, "faq")}</Link>
        <a href={BRAND.instagram} target="_blank" rel="noreferrer" aria-label={t(language, "instagram")}><Instagram size={18} /></a>
        <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" aria-label={t(language, "whatsapp")}><MessageCircle size={18} /></a>
      </div>
    </footer>
  );
}

function collectionLine(language: Language, name: string) {
  const en: Record<string, string> = {
    "Obsidian Reserve": "Dark extrait compositions with oud, incense, and architectural woods.",
    "Royal Levant": "Amber, rose, and spice signatures inspired by ceremonial luxury.",
    "Silk Rituals": "Polished musks, luminous florals, and modern skin fragrances."
  };
  const ar: Record<string, string> = {
    "Obsidian Reserve": "تركيبات إكستريت داكنة بالعود والبخور والأخشاب المعمارية.",
    "Royal Levant": "توقيعات من العنبر والورد والتوابل مستوحاة من الفخامة الاحتفالية.",
    "Silk Rituals": "مسك مصقول وزهور مضيئة وعطور بشرة عصرية."
  };
  return (language === "ar" ? ar : en)[name];
}

function orderStatus(language: Language, status: string) {
  if (language === "en") return status;
  return ({ Preparing: "قيد التحضير", "In transit": "قيد التوصيل", Delivered: "تم التسليم" } as Record<string, string>)[status] ?? status;
}

function reviewBody(language: Language, id: string, fallback: string) {
  if (language === "en") return fallback;
  return ({
    r1: "يشبه عطر عود الزعفران الأسود صالونا خاصا في المساء. عميق وأنيق ولا ينسى.",
    r2: "الورد غني لكنه حديث. الزجاجة والرائحة والأثر كلها تبدو فاخرة.",
    r3: "أصبح عنبر عمّان توقيعي الخاص. دافئ وناعم وراق للغاية."
  } as Record<string, string>)[id] ?? fallback;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Shakra storefront render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page error-page">
          <Logo />
          <div className="glass empty-state">
            <Sparkles size={28} />
            <h1>Shakra Perfume</h1>
            <p>Something interrupted the experience. Refresh the page or return home.</p>
            <a className="primary-button" href="/">Return home</a>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { language } = useStore();
  return (
    <div className={language === "ar" ? "app rtl" : "app"}>
      <AppLoader />
      <AppErrorBoundary>
        <Header />
        <CartToast />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/faq" element={<Policy type="faq" />} />
          <Route path="/privacy" element={<Policy type="privacy" />} />
          <Route path="/terms" element={<Policy type="terms" />} />
        </Routes>
        <Footer />
      </AppErrorBoundary>
    </div>
  );
}




