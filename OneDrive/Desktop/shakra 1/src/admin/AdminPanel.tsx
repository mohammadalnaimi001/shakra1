import {
  Ban,
  BarChart3,
  CheckCheck,
  Globe,
  ImagePlus,
  Languages,
  LoaderCircle,
  LogOut,
  Package,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  UserCog
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BRAND } from "../data";
import { useStore } from "../store";

type AdminBootstrap = {
  metrics: {
    products: number;
    orders: number;
    customers: number;
    pendingOrders: number;
    processingOrders: number;
    deliveredOrders: number;
    totalRevenueJod: number;
  };
  products: ProductRow[];
  orders: OrderRow[];
  customers: CustomerRow[];
  settings: Record<string, unknown>;
  content: Record<string, unknown>;
  translations: TranslationRow[];
};

type ProductRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  category_en: string;
  category_ar: string;
  collection_en: string;
  collection_ar: string;
  price_jod: number | string;
  discount_price_jod: number | string | null;
  stock_quantity: number;
  concentration: string;
  gender: "Feminine" | "Masculine" | "Unisex";
  featured: boolean;
  published: boolean;
  image_urls: string[] | string;
  image_gradient: string;
  notes: { top: string[]; heart: string[]; base: string[] } | string;
};

type OrderRow = {
  id: string;
  status: "pending" | "processing" | "delivered" | "cancelled";
  payment_method: "card" | "cod";
  total_jod: number | string;
  subtotal_jod: number | string;
  delivery_jod: number | string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
};

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_banned: boolean;
  order_count: number | string;
  created_at: string;
};

type TranslationRow = { key: string; en: string; ar: string };

type ProductForm = {
  slug: string;
  nameEn: string;
  nameAr: string;
  collectionEn: string;
  collectionAr: string;
  categoryEn: string;
  categoryAr: string;
  concentration: string;
  gender: "Feminine" | "Masculine" | "Unisex";
  priceJod: number;
  discountPriceJod: number | null;
  stockQuantity: number;
  featured: boolean;
  published: boolean;
  auraEn: string;
  auraAr: string;
  descriptionEn: string;
  descriptionAr: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  tags: string[];
  mood: string[];
  rating: number;
  reviewCount: number;
  imageGradient: string;
  imageUrls: string[];
};

const emptyProduct: ProductForm = {
  slug: "",
  nameEn: "",
  nameAr: "",
  collectionEn: "",
  collectionAr: "",
  categoryEn: "",
  categoryAr: "",
  concentration: "Eau de Parfum",
  gender: "Unisex",
  priceJod: 0,
  discountPriceJod: null,
  stockQuantity: 0,
  featured: false,
  published: true,
  auraEn: "",
  auraAr: "",
  descriptionEn: "",
  descriptionAr: "",
  notes: { top: [], heart: [], base: [] },
  tags: [],
  mood: [],
  rating: 4.8,
  reviewCount: 0,
  imageGradient: "linear-gradient(145deg,#0b0b0a,#322313 48%,#c9a258)",
  imageUrls: []
};

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: CheckCheck },
  { id: "customers", label: "Customers", icon: UserCog },
  { id: "content", label: "Content", icon: Globe },
  { id: "branding", label: "Branding", icon: ImagePlus },
  { id: "translations", label: "Translations", icon: Languages },
  { id: "security", label: "Security", icon: Shield }
] as const;

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (value == null) return fallback;
  return value as T;
}

function toProductForm(row: ProductRow): ProductForm {
  const notes = parseJsonField(row.notes, { top: [], heart: [], base: [] });
  const imageUrls = parseJsonField<string[]>(row.image_urls, []);
  return {
    slug: row.slug,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    collectionEn: row.collection_en,
    collectionAr: row.collection_ar,
    categoryEn: row.category_en,
    categoryAr: row.category_ar,
    concentration: row.concentration,
    gender: row.gender,
    priceJod: Number(row.price_jod),
    discountPriceJod: row.discount_price_jod == null ? null : Number(row.discount_price_jod),
    stockQuantity: Number(row.stock_quantity),
    featured: row.featured,
    published: row.published,
    auraEn: (row as unknown as Record<string, string>).aura_en ?? "",
    auraAr: (row as unknown as Record<string, string>).aura_ar ?? "",
    descriptionEn: (row as unknown as Record<string, string>).description_en ?? "",
    descriptionAr: (row as unknown as Record<string, string>).description_ar ?? "",
    notes,
    tags: parseJsonField<string[]>((row as unknown as Record<string, unknown>).tags ?? [], []),
    mood: parseJsonField<string[]>((row as unknown as Record<string, unknown>).mood ?? [], []),
    rating: Number((row as unknown as Record<string, unknown>).rating ?? 4.8),
    reviewCount: Number((row as unknown as Record<string, unknown>).review_count ?? 0),
    imageGradient: row.image_gradient,
    imageUrls
  };
}

export default function AdminPanel() {
  const { setLogoAssets } = useStore();
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("shakra-admin-token");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [bootstrap, setBootstrap] = useState<AdminBootstrap | null>(null);
  const [email, setEmail] = useState(adminEmailGuess());
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [contentDraft, setContentDraft] = useState<Record<string, unknown>>({});
  const [settingsDraft, setSettingsDraft] = useState<Record<string, unknown>>({});
  const [translationDraft, setTranslationDraft] = useState<TranslationRow[]>([]);

  const api = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {})
      }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Request failed");
    return payload as T;
  }, [token]);

  const loadBootstrap = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = await api<AdminBootstrap>("/api/admin/bootstrap");
      setBootstrap(payload);
      setContentDraft(payload.content ?? {});
      setSettingsDraft(payload.settings ?? {});
      setTranslationDraft(payload.translations ?? []);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = await api<{ token: string }>("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(payload.token);
      localStorage.setItem("shakra-admin-token", payload.token);
      setToast("Welcome back. Admin dashboard unlocked.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setBootstrap(null);
    localStorage.removeItem("shakra-admin-token");
  }

  async function saveProduct() {
    const method = activeProductId ? "PUT" : "POST";
    const path = activeProductId ? `/api/admin/products/${activeProductId}` : "/api/admin/products";
    setLoading(true);
    try {
      await api(path, { method, body: JSON.stringify(productForm) });
      setToast(activeProductId ? "Product updated." : "Product created.");
      setProductForm(emptyProduct);
      setActiveProductId(null);
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    setLoading(true);
    try {
      await api(`/api/admin/products/${id}`, { method: "DELETE" });
      setToast("Product deleted.");
      if (activeProductId === id) {
        setActiveProductId(null);
        setProductForm(emptyProduct);
      }
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete product.");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderRow["status"]) {
    setLoading(true);
    try {
      await api(`/api/admin/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setToast(`Order ${orderId} moved to ${status}.`);
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not update order.");
    } finally {
      setLoading(false);
    }
  }

  async function setCustomerBan(id: string, isBanned: boolean) {
    setLoading(true);
    try {
      await api(`/api/admin/customers/${id}/ban`, { method: "PATCH", body: JSON.stringify({ isBanned }) });
      setToast(isBanned ? "Customer access restricted." : "Customer access restored.");
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not update customer.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Delete this customer record?")) return;
    setLoading(true);
    try {
      await api(`/api/admin/customers/${id}`, { method: "DELETE" });
      setToast("Customer deleted.");
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete customer.");
    } finally {
      setLoading(false);
    }
  }

  async function saveContent() {
    setLoading(true);
    try {
      await api("/api/admin/content", { method: "PUT", body: JSON.stringify(contentDraft) });
      setToast("Website content updated.");
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save content.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setLoading(true);
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(settingsDraft) });
      const full = String(settingsDraft.logoFullUrl ?? "");
      const mark = String(settingsDraft.logoMarkUrl ?? full);
      if (full) setLogoAssets(full, mark);
      setToast("Brand settings applied.");
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTranslations() {
    setLoading(true);
    try {
      await api("/api/admin/translations", { method: "PUT", body: JSON.stringify(translationDraft) });
      setToast("Translations saved.");
      await loadBootstrap();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save translations.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="page page-enter">
        <section className="admin-shell admin-login-shell glass">
          <h1>Shakra Admin</h1>
          <p>Simple control center for products, orders, customers, content, branding, and translations.</p>
          <form className="admin-form-grid" onSubmit={login}>
            <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
            <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? <LoaderCircle size={16} className="spin" /> : "Sign in"}
            </button>
            <p className="admin-note">Default seed account can be changed with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.</p>
          </form>
          {toast && <p className="admin-toast">{toast}</p>}
        </section>
      </main>
    );
  }

  const products = (bootstrap?.products ?? []).filter((row) => {
    const hay = [row.name_en, row.name_ar, row.slug, row.category_en].join(" ").toLowerCase();
    return !search || hay.includes(search.toLowerCase());
  });
  const orders = (bootstrap?.orders ?? []).filter((row) => {
    const hay = [row.id, row.customer_name, row.customer_email, row.payment_method].join(" ").toLowerCase();
    const statusOk = orderFilter === "all" || row.status === orderFilter;
    return statusOk && (!orderSearch || hay.includes(orderSearch.toLowerCase()));
  });
  const customers = (bootstrap?.customers ?? []).filter((row) => {
    const hay = [row.name, row.email, row.phone].join(" ").toLowerCase();
    return !customerSearch || hay.includes(customerSearch.toLowerCase());
  });

  const metrics = bootstrap?.metrics;

  return (
    <main className="page page-enter">
      <section className="admin-shell">
        <aside className="glass admin-sidebar">
          <h2>Shakra Admin</h2>
          {tabs.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                className={tab === entry.id ? "admin-tab active" : "admin-tab"}
                onClick={() => setTab(entry.id)}
              >
                <Icon size={16} />
                {entry.label}
              </button>
            );
          })}
          <button className="admin-tab" onClick={() => void loadBootstrap()}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button className="admin-tab" onClick={logout}>
            <LogOut size={16} />
            Sign out
          </button>
        </aside>

        <section className="glass admin-content">
          {loading && <p className="admin-inline-state"><LoaderCircle size={15} className="spin" /> Saving...</p>}
          {toast && <p className="admin-toast">{toast}</p>}

          {tab === "overview" && (
            <div className="admin-grid">
              <article className="admin-card"><h3>Total Revenue</h3><strong>{(metrics?.totalRevenueJod ?? 0).toLocaleString()} JOD</strong></article>
              <article className="admin-card"><h3>Products</h3><strong>{metrics?.products ?? 0}</strong></article>
              <article className="admin-card"><h3>Orders</h3><strong>{metrics?.orders ?? 0}</strong></article>
              <article className="admin-card"><h3>Customers</h3><strong>{metrics?.customers ?? 0}</strong></article>
              <article className="admin-card"><h3>Pending</h3><strong>{metrics?.pendingOrders ?? 0}</strong></article>
              <article className="admin-card"><h3>Processing</h3><strong>{metrics?.processingOrders ?? 0}</strong></article>
            </div>
          )}

          {tab === "products" && (
            <div className="admin-stack">
              <div className="admin-toolbar">
                <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." /></label>
                <button className="secondary-button" onClick={() => { setActiveProductId(null); setProductForm(emptyProduct); }}>New Product</button>
              </div>

              <div className="admin-table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th /></tr></thead>
                  <tbody>
                    {products.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name_en}</td>
                        <td>{row.category_en}</td>
                        <td>{Number(row.price_jod)} JOD</td>
                        <td>{row.stock_quantity}</td>
                        <td>{row.featured ? "Yes" : "No"}</td>
                        <td className="admin-row-actions">
                          <button onClick={() => { setActiveProductId(row.id); setProductForm(toProductForm(row)); }}>Edit</button>
                          <button className="danger" onClick={() => void deleteProduct(row.id)}><Trash2 size={14} /> Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <section className="admin-editor">
                <h3>{activeProductId ? "Edit Product" : "Add Product"}</h3>
                <div className="admin-form-grid two">
                  <label>Slug<input value={productForm.slug} onChange={(event) => setProductForm((draft) => ({ ...draft, slug: event.target.value }))} /></label>
                  <label>Concentration<input value={productForm.concentration} onChange={(event) => setProductForm((draft) => ({ ...draft, concentration: event.target.value }))} /></label>
                  <label>Name EN<input value={productForm.nameEn} onChange={(event) => setProductForm((draft) => ({ ...draft, nameEn: event.target.value }))} /></label>
                  <label>Name AR<input value={productForm.nameAr} onChange={(event) => setProductForm((draft) => ({ ...draft, nameAr: event.target.value }))} /></label>
                  <label>Collection EN<input value={productForm.collectionEn} onChange={(event) => setProductForm((draft) => ({ ...draft, collectionEn: event.target.value }))} /></label>
                  <label>Collection AR<input value={productForm.collectionAr} onChange={(event) => setProductForm((draft) => ({ ...draft, collectionAr: event.target.value }))} /></label>
                  <label>Category EN<input value={productForm.categoryEn} onChange={(event) => setProductForm((draft) => ({ ...draft, categoryEn: event.target.value }))} /></label>
                  <label>Category AR<input value={productForm.categoryAr} onChange={(event) => setProductForm((draft) => ({ ...draft, categoryAr: event.target.value }))} /></label>
                  <label>Price JOD<input type="number" value={productForm.priceJod} onChange={(event) => setProductForm((draft) => ({ ...draft, priceJod: Number(event.target.value) }))} /></label>
                  <label>Discount Price<input type="number" value={productForm.discountPriceJod ?? ""} onChange={(event) => setProductForm((draft) => ({ ...draft, discountPriceJod: event.target.value ? Number(event.target.value) : null }))} /></label>
                  <label>Stock Quantity<input type="number" value={productForm.stockQuantity} onChange={(event) => setProductForm((draft) => ({ ...draft, stockQuantity: Number(event.target.value) }))} /></label>
                  <label>Gender<select value={productForm.gender} onChange={(event) => setProductForm((draft) => ({ ...draft, gender: event.target.value as ProductForm["gender"] }))}><option>Unisex</option><option>Feminine</option><option>Masculine</option></select></label>
                  <label>Aura EN<textarea value={productForm.auraEn} onChange={(event) => setProductForm((draft) => ({ ...draft, auraEn: event.target.value }))} /></label>
                  <label>Aura AR<textarea value={productForm.auraAr} onChange={(event) => setProductForm((draft) => ({ ...draft, auraAr: event.target.value }))} /></label>
                  <label>Description EN<textarea value={productForm.descriptionEn} onChange={(event) => setProductForm((draft) => ({ ...draft, descriptionEn: event.target.value }))} /></label>
                  <label>Description AR<textarea value={productForm.descriptionAr} onChange={(event) => setProductForm((draft) => ({ ...draft, descriptionAr: event.target.value }))} /></label>
                  <label>Top Notes (comma)<input value={productForm.notes.top.join(", ")} onChange={(event) => setProductForm((draft) => ({ ...draft, notes: { ...draft.notes, top: csv(event.target.value) } }))} /></label>
                  <label>Heart Notes (comma)<input value={productForm.notes.heart.join(", ")} onChange={(event) => setProductForm((draft) => ({ ...draft, notes: { ...draft.notes, heart: csv(event.target.value) } }))} /></label>
                  <label>Base Notes (comma)<input value={productForm.notes.base.join(", ")} onChange={(event) => setProductForm((draft) => ({ ...draft, notes: { ...draft.notes, base: csv(event.target.value) } }))} /></label>
                  <label>Tags (comma)<input value={productForm.tags.join(", ")} onChange={(event) => setProductForm((draft) => ({ ...draft, tags: csv(event.target.value) }))} /></label>
                  <label>Mood Keywords (comma)<input value={productForm.mood.join(", ")} onChange={(event) => setProductForm((draft) => ({ ...draft, mood: csv(event.target.value) }))} /></label>
                  <label>Image URLs (comma)<textarea value={productForm.imageUrls.join(", ")} onChange={(event) => setProductForm((draft) => ({ ...draft, imageUrls: csv(event.target.value) }))} /></label>
                  <label>Gradient Background<input value={productForm.imageGradient} onChange={(event) => setProductForm((draft) => ({ ...draft, imageGradient: event.target.value }))} /></label>
                  <label className="inline-check"><input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm((draft) => ({ ...draft, featured: event.target.checked }))} /> Featured</label>
                  <label className="inline-check"><input type="checkbox" checked={productForm.published} onChange={(event) => setProductForm((draft) => ({ ...draft, published: event.target.checked }))} /> Published</label>
                </div>
                <div className="admin-actions">
                  <button className="primary-button" onClick={() => void saveProduct()}><Save size={14} /> {activeProductId ? "Update Product" : "Create Product"}</button>
                  <button className="secondary-button" onClick={() => setProductForm(emptyProduct)}>Reset</button>
                </div>
              </section>
            </div>
          )}

          {tab === "orders" && (
            <div className="admin-stack">
              <div className="admin-toolbar">
                <label className="search-box"><Search size={16} /><input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search orders..." /></label>
                <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-table-wrap">
                <table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td><strong>{row.customer_name ?? "Guest"}</strong><small>{row.customer_email ?? "-"}</small></td>
                        <td>{row.payment_method.toUpperCase()}</td>
                        <td>{Number(row.total_jod).toFixed(2)} JOD</td>
                        <td>
                          <select value={row.status} onChange={(event) => void updateOrderStatus(row.id, event.target.value as OrderRow["status"])}>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "customers" && (
            <div className="admin-stack">
              <div className="admin-toolbar">
                <label className="search-box"><Search size={16} /><input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Search customers..." /></label>
              </div>
              <div className="admin-table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Phone</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {customers.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.email}</td>
                        <td>{Number(row.order_count)}</td>
                        <td>{row.phone ?? "-"}</td>
                        <td>{row.is_banned ? "Banned" : "Active"}</td>
                        <td className="admin-row-actions">
                          <button onClick={() => void setCustomerBan(row.id, !row.is_banned)}><Ban size={14} /> {row.is_banned ? "Unban" : "Ban"}</button>
                          <button className="danger" onClick={() => void deleteCustomer(row.id)}><Trash2 size={14} /> Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "content" && (
            <section className="admin-editor">
              <h3>Homepage + Contact Content</h3>
              <div className="admin-form-grid two">
                <label>Hero Title<input value={String(contentDraft.heroTitle ?? "")} onChange={(event) => setContentDraft((draft) => ({ ...draft, heroTitle: event.target.value }))} /></label>
                <label>Hero Subtitle<textarea value={String(contentDraft.heroSubtitle ?? "")} onChange={(event) => setContentDraft((draft) => ({ ...draft, heroSubtitle: event.target.value }))} /></label>
                <label>Banner Text<input value={String(contentDraft.bannerText ?? "")} onChange={(event) => setContentDraft((draft) => ({ ...draft, bannerText: event.target.value }))} /></label>
                <label>Collections Headline<input value={String(contentDraft.collectionsHeadline ?? "")} onChange={(event) => setContentDraft((draft) => ({ ...draft, collectionsHeadline: event.target.value }))} /></label>
                <label>Testimonial One<textarea value={String(contentDraft.testimonialOne ?? "")} onChange={(event) => setContentDraft((draft) => ({ ...draft, testimonialOne: event.target.value }))} /></label>
                <label>Contact Email<input value={String(contentDraft.contactEmail ?? "")} onChange={(event) => setContentDraft((draft) => ({ ...draft, contactEmail: event.target.value }))} /></label>
                <label>Instagram URL<input value={String(contentDraft.instagramUrl ?? BRAND.instagram)} onChange={(event) => setContentDraft((draft) => ({ ...draft, instagramUrl: event.target.value }))} /></label>
              </div>
              <div className="admin-actions"><button className="primary-button" onClick={() => void saveContent()}><Save size={14} /> Save Content</button></div>
            </section>
          )}

          {tab === "branding" && (
            <section className="admin-editor">
              <h3>Logo + Brand Settings</h3>
              <div className="admin-form-grid two">
                <label>Logo Full URL<input value={String(settingsDraft.logoFullUrl ?? "")} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, logoFullUrl: event.target.value }))} /></label>
                <label>Logo Mark URL<input value={String(settingsDraft.logoMarkUrl ?? "")} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, logoMarkUrl: event.target.value }))} /></label>
                <label>Contact Number<input value={String(settingsDraft.contactNumber ?? BRAND.phone)} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, contactNumber: event.target.value }))} /></label>
                <label>WhatsApp URL<input value={String(settingsDraft.whatsappUrl ?? BRAND.whatsapp)} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, whatsappUrl: event.target.value }))} /></label>
                <label>Instagram URL<input value={String(settingsDraft.instagramUrl ?? BRAND.instagram)} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, instagramUrl: event.target.value }))} /></label>
              </div>
              <div className="admin-actions"><button className="primary-button" onClick={() => void saveSettings()}><Save size={14} /> Save Branding</button></div>
            </section>
          )}

          {tab === "translations" && (
            <section className="admin-editor">
              <h3>Arabic + English Translations</h3>
              <div className="admin-table-wrap">
                <table>
                  <thead><tr><th>Key</th><th>English</th><th>Arabic</th></tr></thead>
                  <tbody>
                    {translationDraft.map((row, index) => (
                      <tr key={row.key}>
                        <td>{row.key}</td>
                        <td><input value={row.en} onChange={(event) => setTranslationDraft((draft) => draft.map((entry, i) => (i === index ? { ...entry, en: event.target.value } : entry)))} /></td>
                        <td><input dir="rtl" value={row.ar} onChange={(event) => setTranslationDraft((draft) => draft.map((entry, i) => (i === index ? { ...entry, ar: event.target.value } : entry)))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-actions"><button className="primary-button" onClick={() => void saveTranslations()}><Save size={14} /> Save Translations</button></div>
            </section>
          )}

          {tab === "security" && (
            <section className="admin-editor">
              <h3>Security + Roles</h3>
              <p className="admin-note">JWT auth is active for all admin endpoints. Role validation runs server-side. Password hashing uses bcrypt.</p>
              <p className="admin-note">Rotate `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in production environment variables.</p>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function adminEmailGuess() {
  return "admin@shakraperfume.com";
}
