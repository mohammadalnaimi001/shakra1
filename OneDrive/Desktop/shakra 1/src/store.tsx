import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BRAND, products } from "./data";
import type { CartItem, Currency, Language, Product } from "./types";

type User = {
  name: string;
  email: string;
  tier: "Private Client" | "Collector";
};

type Store = {
  cart: CartItem[];
  wishlist: string[];
  user: User | null;
  currency: Currency;
  language: Language;
  logoUrl: string;
  logoMarkUrl: string;
  toast: { productId: string; quantity: number } | null;
  addToCart: (productId: string, quantity?: number) => void;
  dismissToast: () => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  login: (email: string, name?: string) => void;
  logout: () => void;
  setCurrency: (currency: Currency) => void;
  setLogoUrl: (url: string) => void;
  setLogoAssets: (url: string, markUrl?: string) => void;
  toggleLanguage: () => void;
  totals: {
    subtotalJod: number;
    deliveryJod: number;
    totalJod: number;
  };
  formatPrice: (jod: number) => string;
  getRecommendations: (product?: Product) => Product[];
};

const StoreContext = createContext<Store | undefined>(undefined);

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable on Safari private mode or locked-down mobile browsers.
  }
}

function updateDocumentMeta(language: Language, iconUrl: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (link) link.href = iconUrl;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => readStored("shakra-cart", []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStored("shakra-wishlist", ["sp-001"]));
  const [user, setUser] = useState<User | null>(() => readStored("shakra-user", {
    name: "Shakra Private Client",
    email: "client@shakraperfume.com",
    tier: "Private Client"
  }));
  const [currency, setCurrency] = useState<Currency>(() => readStored("shakra-currency", "JOD"));
  const [language, setLanguage] = useState<Language>(() => readStored("shakra-language", "en"));
  const [logoUrl, setLogoUrlState] = useState<string>(() => {
    const stored = readStored<string>("shakra-logo-url", "/brand/shakra-logo-full.png");
    return stored === "/brand/logo.svg" ? "/brand/shakra-logo-full.png" : stored;
  });
  const [logoMarkUrl, setLogoMarkUrl] = useState<string>(() => {
    const stored = readStored<string>("shakra-logo-mark-url", "/brand/shakra-logo-icon.png");
    return stored === "/brand/logo.svg" ? "/brand/shakra-logo-icon.png" : stored;
  });
  const [toast, setToast] = useState<{ productId: string; quantity: number } | null>(null);

  useEffect(() => {
    writeStored("shakra-cart", cart);
  }, [cart]);

  useEffect(() => {
    writeStored("shakra-wishlist", wishlist);
  }, [wishlist]);

  useEffect(() => {
    writeStored("shakra-user", user);
  }, [user]);

  useEffect(() => {
    writeStored("shakra-currency", currency);
  }, [currency]);

  useEffect(() => {
    writeStored("shakra-language", language);
    updateDocumentMeta(language, logoMarkUrl);
  }, [language, logoMarkUrl]);

  useEffect(() => {
    writeStored("shakra-logo-url", logoUrl);
    updateDocumentMeta(language, logoMarkUrl);
  }, [language, logoUrl, logoMarkUrl]);

  useEffect(() => {
    writeStored("shakra-logo-mark-url", logoMarkUrl);
  }, [logoMarkUrl]);

  const subtotalJod = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + (product?.priceJod ?? 0) * item.quantity;
  }, 0);

  const totals = useMemo(() => ({
    subtotalJod,
    deliveryJod: cart.length ? BRAND.deliveryFeeJod : 0,
    totalJod: subtotalJod + (cart.length ? BRAND.deliveryFeeJod : 0)
  }), [cart.length, subtotalJod]);

  const value = useMemo<Store>(
    () => ({
      cart,
      wishlist,
      user,
      currency,
      language,
      logoUrl,
      logoMarkUrl,
      toast,
      totals,
      addToCart: (productId, quantity = 1) => {
        setCart((items) => {
          const existing = items.find((item) => item.productId === productId);
          if (existing) {
            return items.map((item) =>
              item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
            );
          }
          return [...items, { productId, quantity }];
        });
        setToast({ productId, quantity });
      },
      dismissToast: () => setToast(null),
      removeFromCart: (productId) => setCart((items) => items.filter((item) => item.productId !== productId)),
      updateQuantity: (productId, quantity) =>
        setCart((items) =>
          quantity <= 0
            ? items.filter((item) => item.productId !== productId)
            : items.map((item) => (item.productId === productId ? { ...item, quantity } : item))
        ),
      toggleWishlist: (productId) =>
        setWishlist((items) => (items.includes(productId) ? items.filter((id) => id !== productId) : [...items, productId])),
      login: (email, name = "Shakra Client") => setUser({ email, name, tier: "Collector" }),
      logout: () => setUser(null),
      setCurrency,
      setLogoUrl: (url) => {
        setLogoUrlState(url);
        setLogoMarkUrl(url);
      },
      setLogoAssets: (url, markUrl = url) => {
        setLogoUrlState(url);
        setLogoMarkUrl(markUrl);
      },
      toggleLanguage: () => setLanguage((current) => (current === "en" ? "ar" : "en")),
      formatPrice: (jod) => {
        if (currency === "USD") {
          return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(jod * BRAND.usdRate);
        }
        return `${jod.toFixed(0)} JOD`;
      },
      getRecommendations: (product) => {
        const basis = product ?? products.find((entry) => wishlist.includes(entry.id)) ?? products[0];
        return products
          .filter((entry) => entry.id !== basis.id)
          .map((entry) => ({
            entry,
            score:
              Number(entry.collection === basis.collection) * 3 +
              entry.mood.filter((mood) => basis.mood.includes(mood)).length * 2 +
              entry.tags.filter((tag) => basis.tags.includes(tag)).length
          }))
          .sort((a, b) => b.score - a.score || b.entry.rating - a.entry.rating)
          .slice(0, 3)
          .map(({ entry }) => entry);
      }
    }),
    [cart, currency, language, logoMarkUrl, logoUrl, toast, totals, user, wishlist]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return context;
}
