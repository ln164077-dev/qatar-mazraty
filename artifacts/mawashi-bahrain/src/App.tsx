import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Route, Switch, Link, Redirect, Router as WouterRouter, useLocation, useParams } from 'wouter';
import {
  useGetStorefront,
  getGetStorefrontQueryKey,
  useListProducts,
  getListProductsQueryKey,
  useCreateOrder,
  useListAdminOrders,
  getListAdminOrdersQueryKey,
  useGetAdminSummary,
  getGetAdminSummaryQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useUpdateSiteContent,
  useListPresence,
  getListPresenceQueryKey,
  useUpdatePresence,
} from '@workspace/api-client-react';
import type {
  OrderInput,
  Product,
  ProductInput,
  ProductUpdate,
  SiteContentUpdate,
  PresenceInput,
  Order,
} from '@workspace/api-client-react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  FileText,
  Flame,
  HeartHandshake,
  Home,
  Image as ImageIcon,
  Leaf,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  Minus,
  MonitorSmartphone,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = import.meta.env.VITE_DISABLE_CLERK === 'true' ? '' : publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const demoHero = 'https://images.unsplash.com/photo-1572046750111-2c4f7a38f0b4?auto=format&fit=crop&w=1400&q=85';
const fallbackSheep = 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=82';
const money = (value: number | string) => `${Number(value || 0).toFixed(3)} ر.ق`;
const today = () => new Date().toISOString().slice(0, 10);

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', compact && 'gap-2')} data-testid="brand-mark">
      <div className="relative grid size-11 shrink-0 place-items-center rounded-[15px] bg-accent text-secondary shadow-sm">
        <span className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="text-2xl font-bold leading-none">م</span>
      </div>
      <div className="leading-tight">
        <div className={cn('text-[17px] font-bold tracking-[-.04em]', compact && 'text-[15px]')}>مزرعتي قطر</div>
        {!compact && <div className="mt-1 font-mono-bahrain text-[8px] uppercase text-muted-foreground" dir="ltr">MAZARTY / QA</div>}
      </div>
    </div>
  );
}

function IconButton({ label, children, onClick, className }: { label: string; children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button type="button" aria-label={label} data-testid={`button-${label}`} onClick={onClick} className={cn('grid size-10 place-items-center rounded-full transition hover:bg-secondary/10', className)}>{children}</button>;
}

function Shell({ children, showSidebar = true }: { children: React.ReactNode; showSidebar?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setLocation] = useLocation();
  const nav = [
    { href: '/', label: 'المتجر', icon: Store },
    { href: '/order', label: 'الطلب', icon: ClipboardList },
  ];
  return (
    <div className="app-shell grain">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <Link href="/" data-testid="link-brand-home"><BrandMark /></Link>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex" data-testid="text-delivery-promise">
            <span className="size-2 rounded-full bg-accent pulse-dot" />
            التوصيل متاح داخل دولة قطر
          </div>
          <div className="flex items-center gap-1">
            <Link href="/admin" data-testid="link-admin-access" className="hidden rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:block">لوحة الإدارة</Link>
            <IconButton label="فتح القائمة" onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</IconButton>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[76px] z-30 border-b border-border bg-card p-4 shadow-card md:hidden">
          {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${label}`} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-muted"><Icon size={18} />{label}</Link>)}
          <Link href="/admin" onClick={() => setMobileOpen(false)} data-testid="link-mobile-admin" className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-muted"><Settings2 size={18} />الإدارة</Link>
        </div>
      )}
      <div className="mx-auto flex max-w-[1480px] pt-[76px]">
        {showSidebar && <aside className="sticky top-[76px] hidden h-[calc(100dvh-76px)] w-[216px] shrink-0 flex-col border-l border-border/80 px-5 py-10 md:flex">
          <div className="mb-8 px-3 font-mono-bahrain text-[9px] uppercase tracking-[.18em] text-muted-foreground" dir="ltr">A GOOD CUT, DELIVERED</div>
          <nav className="space-y-1.5">
            {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label}`} className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"><Icon size={17} strokeWidth={1.7} /><span>{label}</span><ChevronLeft className="mr-auto opacity-0 transition group-hover:opacity-50" size={14} /></Link>)}
          </nav>
          <div className="mt-auto rounded-[24px] bg-secondary p-5 text-secondary-foreground">
            <div className="mb-3 grid size-9 place-items-center rounded-full bg-accent/90 text-secondary"><Truck size={17} /></div>
            <div className="text-sm font-bold leading-7">من المزرعة<br />إلى بابكم</div>
            <p className="mt-2 text-[10px] leading-5 text-secondary-foreground/70">اختيار طازج، وزن واضح، وموعد يصل كما وعدنا.</p>
          </div>
        </aside>}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <footer className="border-t border-border/70 px-5 py-10 md:hidden">
        <BrandMark compact />
      </footer>
    </div>
  );
}

function LoadingBlock({ label = 'جارٍ تجهيز الصفحة' }: { label?: string }) {
  return <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-muted-foreground" data-testid="state-loading"><div className="size-12 animate-pulse rounded-2xl bg-muted" /><div className="h-3 w-32 animate-pulse rounded bg-muted" /><span className="text-xs">{label}</span></div>;
}

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center p-8 text-center" data-testid="state-error"><div className="mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><RefreshCw size={24} /></div><h2 className="text-lg font-bold">تعذّر تحميل الصفحة</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">هناك مشكلة مؤقتة في الاتصال. حاول مرة أخرى.</p><Button onClick={onRetry} data-testid="button-retry" className="mt-6 rounded-xl">إعادة المحاولة</Button></div>;
}

function EmptyProducts() {
  return <div className="col-span-full rounded-[30px] border border-dashed border-border bg-card p-14 text-center" data-testid="state-empty-products"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-primary"><Leaf size={24} /></div><h3 className="font-bold">الموسم يتجهّز</h3><p className="mt-2 text-sm text-muted-foreground">لا توجد منتجات متاحة الآن. عودوا إلينا قريباً.</p></div>;
}

function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  return <article className="group flex min-w-0 flex-col" data-testid={`card-product-${product.id}`}>
    <button type="button" onClick={() => onSelect(product)} data-testid={`button-select-product-${product.id}`} className="relative aspect-[1.08] overflow-hidden rounded-[25px] bg-muted text-right">
      <img src={product.imageUrl || fallbackSheep} alt={product.name} className="size-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
        <span className="rounded-full bg-card/90 px-3 py-1.5 text-[9px] font-bold text-secondary backdrop-blur">طازج اليوم</span>
        <span className="grid size-8 place-items-center rounded-full bg-card/85 text-primary opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100"><ArrowLeft size={14} /></span>
      </div>
    </button>
    <div className="flex items-start justify-between gap-3 px-1 pt-4">
      <div className="min-w-0"><h3 className="truncate text-sm font-bold" data-testid={`text-product-name-${product.id}`}>{product.name}</h3><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground" data-testid={`text-product-description-${product.id}`}>{product.description}</p></div>
      <div className="shrink-0 text-left"><div className="font-mono-bahrain text-sm font-medium text-primary" dir="ltr" data-testid={`text-product-price-${product.id}`}>{money(product.price)}</div><div className="mt-1 text-[9px] text-muted-foreground">للطلب</div></div>
    </div>
  </article>;
}

function HomePage() {
  const { data, isLoading, isError, refetch } = useGetStorefront();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [search, setSearch] = useState('');
  const storefront = data;
  const products = useMemo(() => (storefront?.products ?? []).filter(p => p.active && (activeCategory === 'الكل' || p.name.includes(activeCategory)) && p.name.toLowerCase().includes(search.toLowerCase())), [storefront?.products, activeCategory, search]);
  usePresence('storefront', 'يتصفح المنتجات');
  if (isLoading) return <Shell><LoadingBlock /></Shell>;
  if (isError || !storefront) return <Shell><ErrorBlock onRetry={() => void refetch()} /></Shell>;
  const content = storefront.content ?? {
    brandName: 'مزرعتي قطر',
    heroTitle: 'من المزرعة إلى بابكم',
    heroText: 'منتجات مختارة بعناية تصل إليكم داخل قطر.',
    heroImageUrl: '',
    navLinks: ['الكل', 'الذبائح', 'المقطّعات'],
  };
  const hero = content.heroImageUrl || demoHero;
  const navLinks = content.navLinks?.length ? content.navLinks : ['الكل', 'الذبائح', 'المقطّعات'];
  return <Shell><div className="page-enter px-5 pb-20 pt-8 lg:px-10 lg:pt-14">
    <section className="relative overflow-hidden rounded-[34px] bg-secondary text-secondary-foreground shadow-warm">
      <div className="absolute -left-20 -top-20 size-64 rounded-full border-[1px] border-accent/20" /><div className="absolute bottom-[-150px] right-[35%] size-72 rounded-full border-[1px] border-accent/15" />
      <div className="grid min-h-[400px] md:min-h-[470px] md:grid-cols-[1fr_43%]">
        <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="rise-in mb-8 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-accent"><span className="size-1.5 rounded-full bg-accent" /> من مزارع قطر إلى سفرتكم</div>
          <h1 className="rise-in delay-1 max-w-xl text-balance text-3xl font-bold leading-[1.8] tracking-[-.05em] sm:text-5xl lg:text-[54px]" data-testid="text-hero-title">{content.heroTitle}</h1>
          <p className="rise-in delay-2 mt-5 max-w-md text-sm leading-8 text-secondary-foreground/72 sm:text-[15px]" data-testid="text-hero-text">{content.heroText}</p>
          <div className="rise-in delay-3 mt-8 flex flex-wrap items-center gap-3">
            <a href="#products" data-testid="link-browse-products" className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-accent px-6 text-xs font-bold text-secondary transition hover:translate-y-[-2px]"><ShoppingBag size={16} /> تصفّح الطلبات <ArrowLeft size={15} /></a>
            <span className="text-[10px] text-secondary-foreground/50">يصل طازجاً في موعدكم</span>
          </div>
        </div>
        <div className="relative min-h-[270px] overflow-hidden md:order-last md:min-h-0">
          <img src={hero} alt="مزرعة مزرعتي قطر" className="absolute inset-0 size-full object-cover" data-testid="img-hero" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-secondary/85 md:bg-gradient-to-l md:from-transparent md:via-secondary/15 md:to-secondary" />
          <div className="absolute bottom-5 left-5 rounded-2xl border border-card/20 bg-secondary/70 px-4 py-3 backdrop-blur-md" data-testid="badge-hero-quality"><div className="flex items-center gap-2 text-[10px] font-bold"><BadgeCheck className="text-accent" size={14} /> جودة نعرفها بالاسم</div></div>
        </div>
      </div>
    </section>
    <section id="products" className="mt-14 scroll-mt-28">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-primary"><span className="h-px w-6 bg-primary" /> اختياراتنا</div><h2 className="text-2xl font-bold tracking-[-.05em] sm:text-3xl" data-testid="text-products-heading">طلبكم يبدأ من هنا</h2></div>
        <div className="flex items-center gap-2"><div className="relative hidden sm:block"><Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج" data-testid="input-product-search" className="h-10 w-44 rounded-xl border-border/80 bg-card pr-9 text-xs" /></div><div className="flex items-center rounded-xl bg-muted p-1">{navLinks.map(link => <button key={link} type="button" onClick={() => setActiveCategory(link)} data-testid={`button-category-${link}`} className={cn('rounded-lg px-3 py-2 text-[10px] font-bold transition', activeCategory === link ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')}>{link}</button>)}</div></div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6" data-testid="grid-products">
        {products.length ? products.map(product => <ProductCard key={product.id} product={product} onSelect={() => setLocation(`/order?product=${product.id}`)} />) : <EmptyProducts />}
      </div>
    </section>
    <section className="mt-20 grid gap-4 md:grid-cols-3">
      {[
        { icon: ShieldCheck, title: 'وزن واضح', text: 'السعر عندنا على الكيلو، بلا مفاجآت عند التسليم.' },
        { icon: Truck, title: 'نوصّل بموعدكم', text: 'اختاروا اليوم المناسب، ونرتّب الباقي معكم.' },
        { icon: HeartHandshake, title: 'نخدم أهل الدار', text: 'خدمة عائلية من ناس يعرفون معنى الضيافة.' },
      ].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-4 rounded-[22px] border border-border/70 bg-card p-5"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/25 text-primary"><Icon size={19} /></div><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-[11px] leading-6 text-muted-foreground">{text}</p></div></div>)}
    </section>
  </div></Shell>;
}

function usePresence(page: string, label: string, customerName?: string) {
  const update = useUpdatePresence();
  useEffect(() => {
    const sessionIdKey = 'mawashi-session-id';
    const existing = sessionStorage.getItem(sessionIdKey);
    const sessionId = existing || `session-${Math.random().toString(36).slice(2)}`;
    if (!existing) sessionStorage.setItem(sessionIdKey, sessionId);
    const data: PresenceInput = { sessionId, page, label, customerName: customerName || null };
    update.mutate({ data });
    const interval = window.setInterval(() => update.mutate({ data }), 30000);
    return () => window.clearInterval(interval);
  }, [page, label, customerName]);
}

function OrderPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get('product') || '0');
  const { data: products, isLoading, isError, refetch } = useListProducts();
  const product = products?.find(p => p.id === productId) || products?.find(p => p.active);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(today());
  const [error, setError] = useState('');
  usePresence('order', product?.name ? `يطلب ${product.name}` : 'يجهّز طلباً');
  if (isLoading) return <Shell><LoadingBlock label="نجهّز لكم الاختيارات" /></Shell>;
  if (isError) return <Shell><ErrorBlock onRetry={() => void refetch()} /></Shell>;
  if (!product) return <Shell><div className="p-8"><EmptyProducts /></div></Shell>;
  const goNext = () => {
    if (!customerName.trim() || phone.trim().length < 5 || address.trim().length < 3) { setError('يرجى تعبئة الاسم ورقم التواصل والعنوان.'); return; }
    const payload = { productId: product.id, productName: product.name, quantity, customerName, phone, address, pickupDate, paymentMethod: 'cash_on_delivery' as const };
    sessionStorage.setItem('mawashi-order-draft', JSON.stringify(payload));
    setLocation('/summary');
  };
  return <Shell><div className="page-enter mx-auto max-w-5xl px-5 py-10 lg:px-12 lg:py-16">
    <Link href="/" data-testid="link-back-store" className="mb-9 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition hover:text-primary"><ArrowRight size={15} /> رجوع للمتجر</Link>
    <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
      <div className="overflow-hidden rounded-[30px] bg-muted lg:order-last"><img src={product.imageUrl || fallbackSheep} alt={product.name} className="aspect-square size-full object-cover lg:aspect-auto lg:h-full" data-testid={`img-order-product-${product.id}`} /></div>
      <div className="flex flex-col justify-center">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold text-primary"><span className="size-1.5 rounded-full bg-primary" /> تفاصيل الطلب</div>
        <h1 className="text-3xl font-bold tracking-[-.06em] sm:text-4xl" data-testid="text-order-title">{product.name}</h1>
        <p className="mt-4 text-sm leading-8 text-muted-foreground" data-testid="text-order-description">{product.description}</p>
        <div className="mt-8 flex items-end justify-between border-b border-border pb-6"><div><div className="text-[10px] text-muted-foreground">السعر التقريبي</div><div className="mt-1 font-mono-bahrain text-2xl text-primary" dir="ltr" data-testid="text-order-price">{money(product.price * quantity)}</div></div><div className="text-left text-[10px] text-muted-foreground">للكيلو الواحد<br /><span className="font-bold text-foreground">{money(product.price)}</span></div></div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="customer-name" className="text-xs font-bold">الاسم الكريم</Label><Input id="customer-name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="مثال: محمد أحمد" data-testid="input-customer-name" className="mt-2 h-12 rounded-xl bg-card" /></div>
          <div><Label htmlFor="customer-phone" className="text-xs font-bold">رقم التواصل</Label><Input id="customer-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="36 000 000" dir="ltr" data-testid="input-customer-phone" className="mt-2 h-12 rounded-xl bg-card text-right" /></div>
          <div className="sm:col-span-2"><Label htmlFor="customer-address" className="text-xs font-bold">عنوان التوصيل</Label><Textarea id="customer-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="المنطقة، الطريق، رقم المبنى..." data-testid="input-customer-address" className="mt-2 min-h-[86px] resize-none rounded-xl bg-card" /></div>
          <div><Label htmlFor="pickup-date" className="text-xs font-bold">موعد التوصيل المفضل</Label><div className="relative mt-2"><CalendarDays size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" /><Input id="pickup-date" type="date" min={today()} value={pickupDate} onChange={e => setPickupDate(e.target.value)} data-testid="input-pickup-date" className="h-12 rounded-xl bg-card pr-10" /></div></div>
          <div><Label className="text-xs font-bold">الكمية</Label><div className="mt-2 flex h-12 items-center justify-between rounded-xl border border-input bg-card px-3"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} data-testid="button-decrease-quantity" className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Minus size={15} /></button><span className="font-mono-bahrain text-sm" dir="ltr" data-testid="text-order-quantity">{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(product.maxQuantity, quantity + 1))} data-testid="button-increase-quantity" className="grid size-8 place-items-center rounded-lg bg-accent text-secondary"><Plus size={15} /></button></div></div>
        </div>
        {error && <p className="mt-4 text-xs font-semibold text-destructive" data-testid="status-order-error">{error}</p>}
        <Button onClick={goNext} data-testid="button-continue-order" className="mt-8 h-12 rounded-xl text-xs font-bold">متابعة الطلب <ArrowLeft size={16} /></Button>
      </div>
    </div>
  </div></Shell>;
}

type OrderDraft = { productId: number; productName: string; quantity: number; customerName: string; phone: string; address: string; pickupDate: string; paymentMethod: 'cash_on_delivery' | 'pay_now' };

function SummaryPage() {
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'pay_now'>('cash_on_delivery');
  useEffect(() => { const raw = sessionStorage.getItem('mawashi-order-draft'); if (raw) setDraft(JSON.parse(raw)); }, []);
  if (!draft) return <Shell><div className="mx-auto max-w-xl p-10 text-center"><ClipboardList className="mx-auto text-muted-foreground" size={36} /><h1 className="mt-5 text-xl font-bold">ابدأوا بطلب جديد</h1><Link href="/" data-testid="link-summary-empty-store" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">العودة للمتجر</Link></div></Shell>;
  const submit = () => {
    const payload: OrderInput = { productId: draft.productId, quantity: draft.quantity, customerName: draft.customerName, phone: draft.phone, address: draft.address, pickupDate: draft.pickupDate, paymentMethod, paymentStatus: paymentMethod === 'pay_now' ? 'pending' : 'not_required' };
    createOrder.mutate({ data: payload }, { onSuccess: order => { sessionStorage.setItem('mawashi-last-order', JSON.stringify({ ...draft, ...order, paymentMethod })); setLocation(paymentMethod === 'pay_now' ? '/payment-verification' : '/thank-you'); } });
  };
  return <Shell><div className="page-enter mx-auto max-w-3xl px-5 py-10 lg:py-16"><Link href="/order" data-testid="link-back-order" className="mb-9 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground"><ArrowRight size={15} /> تعديل الطلب</Link><div className="grid gap-7 lg:grid-cols-[1fr_.78fr]"><section><div className="mb-3 text-[10px] font-bold text-primary">الخطوة الأخيرة</div><h1 className="text-3xl font-bold tracking-[-.06em]">تأكيد الطلب</h1><div className="mt-8 divide-y divide-border overflow-hidden rounded-[24px] border border-border bg-card"><div className="flex items-center justify-between p-5"><div><div className="text-sm font-bold" data-testid="text-summary-product">{draft.productName}</div><div className="mt-1 text-xs text-muted-foreground">الكمية: {draft.quantity}</div></div><Package className="text-primary" size={20} /></div><div className="space-y-3 p-5 text-xs"><div className="flex justify-between gap-4"><span className="text-muted-foreground">الاسم</span><b data-testid="text-summary-customer">{draft.customerName}</b></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">التوصيل</span><b data-testid="text-summary-address">{draft.address}</b></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">الموعد</span><b dir="ltr" data-testid="text-summary-date">{draft.pickupDate}</b></div></div></div></section><aside><div className="rounded-[24px] bg-secondary p-6 text-secondary-foreground"><h2 className="text-sm font-bold">طريقة الدفع</h2><div className="mt-5 space-y-3"><button type="button" onClick={() => setPaymentMethod('cash_on_delivery')} data-testid="button-payment-cash" className={cn('flex w-full items-center gap-3 rounded-2xl border p-4 text-right transition', paymentMethod === 'cash_on_delivery' ? 'border-accent bg-accent/10' : 'border-secondary-foreground/15')}><WalletCards size={19} className="text-accent" /><span className="flex-1 text-xs font-bold">الدفع عند الاستلام</span>{paymentMethod === 'cash_on_delivery' && <Check size={16} className="text-accent" />}</button><button type="button" onClick={() => setPaymentMethod('pay_now')} data-testid="button-payment-online" className={cn('flex w-full items-center gap-3 rounded-2xl border p-4 text-right transition', paymentMethod === 'pay_now' ? 'border-accent bg-accent/10' : 'border-secondary-foreground/15')}><CreditCard size={19} className="text-accent" /><span className="flex-1 text-xs font-bold">الدفع الإلكتروني</span>{paymentMethod === 'pay_now' && <Check size={16} className="text-accent" />}</button></div><div className="my-6 border-t border-secondary-foreground/15" /><p className="text-[10px] leading-6 text-secondary-foreground/60">سيتم التواصل معكم لتأكيد الوزن النهائي وموعد الوصول قبل التجهيز.</p><Button onClick={submit} disabled={createOrder.isPending} data-testid="button-confirm-order" className="mt-5 h-12 w-full rounded-xl bg-accent text-secondary hover:bg-accent/90">{createOrder.isPending ? <Loader2 className="animate-spin" size={17} /> : <>تأكيد الطلب <ArrowLeft size={16} /></>}</Button>{createOrder.isError && <p className="mt-3 text-center text-xs text-red-200" data-testid="status-order-submit-error">تعذّر إرسال الطلب، حاولوا مجدداً.</p>}</div></aside></div></div></Shell>;
}

function PaymentVerificationPage() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const verify = () => { if (code.trim().length >= 4) { setSent(true); setTimeout(() => setLocation('/thank-you'), 700); } };
  return <Shell showSidebar={false}><div className="page-enter mx-auto flex min-h-[calc(100dvh-76px)] max-w-2xl items-center px-5 py-12"><div className="w-full rounded-[32px] border border-border bg-card p-7 text-center shadow-card sm:p-12"><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/25 text-primary"><LockKeyhole size={27} /></div><div className="mt-7 text-[10px] font-bold text-primary">تحقق آمن للدفع</div><h1 className="mt-3 text-2xl font-bold tracking-[-.05em] sm:text-3xl" data-testid="text-payment-title">أدخل رمز التحقق</h1><p className="mx-auto mt-3 max-w-sm text-xs leading-7 text-muted-foreground">أرسلنا رمزاً مؤقتاً إلى رقم التواصل المسجل. هذه شاشة تجريبية جاهزة للربط مع بوابة الدفع.</p><div className="mx-auto mt-8 max-w-xs"><Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="٠ ٠ ٠ ٠ ٠ ٠" dir="ltr" data-testid="input-payment-code" className="h-14 rounded-xl text-center text-xl tracking-[.5em]" /></div>{sent ? <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-secondary" data-testid="status-payment-verified"><Check size={16} /> تم التحقق، نجهّز تأكيدكم</div> : <Button onClick={verify} data-testid="button-verify-payment" className="mt-6 h-12 w-full max-w-xs rounded-xl">تأكيد الرمز <ArrowLeft size={15} /></Button>}<button type="button" onClick={() => setCode('123456')} data-testid="button-fill-demo-code" className="mt-5 text-[10px] font-semibold text-muted-foreground underline underline-offset-4">استخدام رمز تجريبي</button></div></div></Shell>;
}

function ThankYouPage() {
  const [order, setOrder] = useState<Partial<Order> | null>(null);
  useEffect(() => { const raw = sessionStorage.getItem('mawashi-last-order'); if (raw) setOrder(JSON.parse(raw)); }, []);
  return <Shell showSidebar={false}><div className="page-enter mx-auto flex min-h-[calc(100dvh-76px)] max-w-2xl items-center px-5 py-12"><div className="w-full text-center"><div className="mx-auto grid size-20 place-items-center rounded-[26px] bg-accent text-secondary shadow-warm"><Check size={37} strokeWidth={2.5} /></div><div className="mt-9 text-[10px] font-bold text-primary">تم الاستلام بنجاح</div><h1 className="mt-3 text-3xl font-bold tracking-[-.07em] sm:text-5xl" data-testid="text-thank-you-title">حياكم الله، طلبكم عندنا</h1><p className="mx-auto mt-5 max-w-md text-sm leading-8 text-muted-foreground">شكراً لثقتكم في مزرعتي قطر. سيتواصل معكم فريقنا قريباً لتأكيد الوزن والموعد.</p>{order && <div className="mx-auto mt-8 max-w-sm rounded-[22px] border border-border bg-card p-5 text-right shadow-card" data-testid="card-order-confirmation"><div className="mb-4 flex items-center justify-between border-b border-border pb-4"><span className="text-[10px] text-muted-foreground">رقم الطلب</span><span className="font-mono-bahrain text-sm font-bold text-primary" dir="ltr" data-testid="text-order-id">#{order.id || '—'}</span></div><div className="space-y-3 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">المنتج</span><b>{order.productName}</b></div><div className="flex justify-between"><span className="text-muted-foreground">موعد التوصيل</span><b dir="ltr">{order.pickupDate}</b></div></div></div>}<Link href="/" data-testid="link-thank-you-home" className="mt-9 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-xs font-bold text-primary-foreground">العودة للمتجر <ArrowRight size={16} /></Link></div></div></Shell>;
}

function ClerkQueryCache() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  useEffect(() => addListener((event: { user?: unknown }) => { if (event.user) client.clear(); }), [addListener, client]);
  return null;
}

function AuthPages() {
  return <Switch><Route path="/sign-in/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>} /><Route path="/sign-up/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>} /></Switch>;
}

function AdminGate() {
  return <Show when="signed-in"><AdminPage /></Show>;
}

type AdminTab = 'overview' | 'products' | 'content' | 'orders' | 'presence';

function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  return <div className="min-h-[100dvh] bg-background" dir="rtl">
    <aside className={cn('fixed inset-y-0 right-0 z-40 w-[260px] border-l border-sidebar-border bg-sidebar px-5 py-7 text-sidebar-foreground transition-transform md:translate-x-0', mobileNav ? 'translate-x-0' : 'translate-x-full')}><div className="mb-12 flex items-center justify-between"><BrandMark compact /><button type="button" onClick={() => setMobileNav(false)} data-testid="button-close-admin-menu" className="md:hidden"><X size={18} /></button></div><div className="mb-4 px-3 font-mono-bahrain text-[9px] uppercase tracking-[.16em] text-sidebar-foreground/45" dir="ltr">CONTROL ROOM</div><nav className="space-y-1">{[{ id: 'overview', label: 'نظرة عامة', icon: BarChart3 }, { id: 'products', label: 'المنتجات', icon: Package }, { id: 'content', label: 'محتوى المتجر', icon: FileText }, { id: 'orders', label: 'الطلبات', icon: ClipboardList }, { id: 'presence', label: 'الحضور المباشر', icon: UsersRound }].map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { setTab(id as AdminTab); setMobileNav(false); }} data-testid={`button-admin-tab-${id}`} className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-xs font-semibold transition', tab === id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground')}><Icon size={17} />{label}{tab === id && <ChevronLeft className="mr-auto" size={14} />}</button>)}</nav><div className="absolute inset-x-5 bottom-6 border-t border-sidebar-border pt-5"><div className="mb-4 flex items-center gap-3 px-2"><div className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-xs font-bold">{(user?.firstName || 'م').slice(0, 1)}</div><div className="min-w-0"><div className="truncate text-[11px] font-bold">{user?.firstName || 'مدير المتجر'}</div><div className="truncate text-[9px] text-sidebar-foreground/50">{user?.primaryEmailAddress?.emailAddress || 'حساب موثّق'}</div></div></div><button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-admin-signout" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent"><LogOut size={15} /> تسجيل الخروج</button></div></aside>
    <div className="md:mr-[260px]"><header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl md:px-9"><button type="button" onClick={() => setMobileNav(true)} data-testid="button-open-admin-menu" className="grid size-10 place-items-center rounded-xl bg-muted md:hidden"><Menu size={19} /></button><div><div className="font-mono-bahrain text-[9px] uppercase tracking-[.15em] text-muted-foreground" dir="ltr">MAWASHI / ADMIN</div><h1 className="mt-1 text-base font-bold">{tab === 'overview' ? 'صباح الخير، يا مدير' : ({ products: 'المنتجات', content: 'محتوى المتجر', orders: 'الطلبات', presence: 'الحضور المباشر' } as Record<string, string>)[tab]}</h1></div><Link href="/" target="_blank" data-testid="link-admin-view-store" className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-bold"><ExternalLink size={14} /> المتجر</Link></header><div className="p-5 md:p-9"><AdminContent tab={tab} /></div></div>
  </div>;
}

function AdminContent({ tab }: { tab: AdminTab }) {
  if (tab === 'products') return <ProductsAdmin />;
  if (tab === 'content') return <ContentAdmin />;
  if (tab === 'orders') return <OrdersAdmin />;
  if (tab === 'presence') return <PresenceAdmin />;
  return <OverviewAdmin />;
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof BarChart3; label: string; value?: number; accent?: boolean }) {
  return <div className={cn('rounded-[22px] border border-border bg-card p-5 shadow-card', accent && 'border-primary/20 bg-primary/[.04]')} data-testid={`card-stat-${label}`}><div className="flex items-start justify-between"><div className={cn('grid size-10 place-items-center rounded-xl', accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary')}><Icon size={18} /></div><span className="rounded-full bg-secondary/10 px-2 py-1 text-[9px] font-bold text-secondary">اليوم</span></div><div className="mt-6 font-mono-bahrain text-3xl font-medium" dir="ltr" data-testid={`text-stat-${label}`}>{value ?? '—'}</div><div className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</div></div>;
}

function OverviewAdmin() {
  const summary = useGetAdminSummary();
  const orders = useListAdminOrders();
  const presence = useListPresence();
  const latest = (orders.data ?? []).slice(0, 5);
  return <div className="page-enter"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={ClipboardList} label="إجمالي الطلبات" value={summary.data?.totalOrders} /><StatCard icon={Bell} label="طلبات جديدة" value={summary.data?.newOrders} accent /><StatCard icon={CalendarDays} label="طلبات اليوم" value={summary.data?.todayOrders} /><StatCard icon={UsersRound} label="الزوار الآن" value={summary.data?.activeVisitors ?? presence.data?.filter(p => p.active).length} /></div><div className="mt-7 grid gap-7 xl:grid-cols-[1.25fr_.75fr]"><section className="rounded-[24px] border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-sm font-bold">آخر الطلبات</h2><p className="mt-1 text-[10px] text-muted-foreground">متابعة الطلبات الجديدة أولاً بأول</p></div><Link href="/admin" data-testid="link-dashboard-orders" className="text-[10px] font-bold text-primary">عرض الكل</Link></div>{orders.isLoading ? <div className="space-y-3"><div className="h-12 animate-pulse rounded-xl bg-muted" /><div className="h-12 animate-pulse rounded-xl bg-muted" /></div> : latest.length ? <div className="space-y-2">{latest.map(order => <OrderRow key={order.id} order={order} />)}</div> : <div className="py-10 text-center text-xs text-muted-foreground" data-testid="state-empty-admin-orders">لا توجد طلبات بعد</div>}</section><section className="rounded-[24px] bg-secondary p-6 text-secondary-foreground"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">الحضور المباشر</h2><p className="mt-1 text-[10px] text-secondary-foreground/60">من يتصفح المتجر الآن</p></div><span className="flex items-center gap-1.5 text-[10px] text-accent"><span className="size-1.5 rounded-full bg-accent pulse-dot" /> مباشر</span></div><div className="mt-6 space-y-3">{(presence.data ?? []).filter(p => p.active).slice(0, 4).map(p => <div key={p.sessionId} className="flex items-center gap-3 rounded-xl bg-secondary-foreground/[.08] p-3" data-testid={`row-presence-dashboard-${p.sessionId}`}><div className="grid size-8 place-items-center rounded-full bg-accent text-secondary"><MonitorSmartphone size={15} /></div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold">{p.customerName || 'زائر جديد'}</div><div className="mt-0.5 truncate text-[9px] text-secondary-foreground/55">{p.label}</div></div><div className="text-[9px] text-accent">الآن</div></div>)}{!(presence.data ?? []).filter(p => p.active).length && <div className="py-8 text-center text-xs text-secondary-foreground/60" data-testid="state-empty-presence">لا يوجد زوار الآن</div>}</div></section></div></div>;
}

function OrderRow({ order }: { order: Order }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-3" data-testid={`row-admin-order-${order.id}`}><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-primary"><Package size={16} /></div><div className="min-w-[110px] flex-1"><div className="text-xs font-bold">{order.customerName}</div><div className="mt-1 text-[10px] text-muted-foreground">{order.productName} · {order.quantity} رأس</div></div><div className="hidden text-left sm:block"><div className="font-mono-bahrain text-xs" dir="ltr">#{order.id}</div><div className={cn('mt-1 text-[9px] font-bold', order.status === 'new' ? 'text-primary' : 'text-muted-foreground')}>{order.status === 'new' ? 'جديد' : order.status}</div></div></div>;
}

function ProductEditor({ product, onDone }: { product?: Product; onDone: () => void }) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const client = useQueryClient();
  const [form, setForm] = useState<ProductInput>({ name: product?.name || '', description: product?.description || '', imageUrl: product?.imageUrl || '', maxQuantity: product?.maxQuantity || 10, price: product?.price || 0, active: product?.active ?? true });
  const change = (key: keyof ProductInput, value: string | number | boolean) => setForm(prev => ({ ...prev, [key]: value }));
  const save = () => { if (product) update.mutate({ id: product.id, data: form as ProductUpdate }, { onSuccess: () => { void client.invalidateQueries({ queryKey: getListProductsQueryKey() }); onDone(); } }); else create.mutate({ data: form }, { onSuccess: () => { void client.invalidateQueries({ queryKey: getListProductsQueryKey() }); void client.invalidateQueries({ queryKey: getGetStorefrontQueryKey() }); onDone(); } }); };
  const busy = create.isPending || update.isPending;
  return <div className="rounded-[24px] border border-border bg-card p-5 md:p-7" data-testid="panel-product-editor"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-sm font-bold">{product ? 'تعديل المنتج' : 'إضافة منتج'}</h2><p className="mt-1 text-[10px] text-muted-foreground">كل التفاصيل التي يراها أهل قطر</p></div><IconButton label="إغلاق محرر المنتج" onClick={onDone}><X size={18} /></IconButton></div><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label className="text-xs">اسم المنتج</Label><Input value={form.name} onChange={e => change('name', e.target.value)} data-testid="input-admin-product-name" className="mt-2 h-11 rounded-xl" /></div><div className="sm:col-span-2"><Label className="text-xs">الوصف</Label><Textarea value={form.description} onChange={e => change('description', e.target.value)} data-testid="input-admin-product-description" className="mt-2 rounded-xl" /></div><div className="sm:col-span-2"><Label className="text-xs">رابط الصورة</Label><Input value={form.imageUrl} onChange={e => change('imageUrl', e.target.value)} placeholder="https://..." dir="ltr" data-testid="input-admin-product-image" className="mt-2 h-11 rounded-xl text-left" /></div><div><Label className="text-xs">السعر بالدينار</Label><Input type="number" min="0" step=".001" value={form.price} onChange={e => change('price', Number(e.target.value))} data-testid="input-admin-product-price" className="mt-2 h-11 rounded-xl" /></div><div><Label className="text-xs">أقصى كمية</Label><Input type="number" min="1" value={form.maxQuantity} onChange={e => change('maxQuantity', Number(e.target.value))} data-testid="input-admin-product-quantity" className="mt-2 h-11 rounded-xl" /></div></div><div className="mt-5 flex items-center justify-between rounded-xl bg-muted p-3"><span className="text-xs font-semibold">ظاهر في المتجر</span><button type="button" onClick={() => change('active', !form.active)} data-testid="button-toggle-product-active" className={cn('relative h-6 w-11 rounded-full transition', form.active ? 'bg-secondary' : 'bg-border')}><span className={cn('absolute top-1 size-4 rounded-full bg-accent transition', form.active ? 'right-1' : 'right-6')} /></button></div><Button onClick={save} disabled={busy || !form.name} data-testid="button-save-product" className="mt-6 h-11 w-full rounded-xl">{busy ? <Loader2 className="animate-spin" size={17} /> : <><Save size={16} /> حفظ المنتج</>}</Button></div>;
}

function ProductsAdmin() {
  const { data, isLoading, isError, refetch } = useListProducts();
  const update = useUpdateProduct();
  const client = useQueryClient();
  const [editing, setEditing] = useState<Product | undefined>();
  const [showEditor, setShowEditor] = useState(false);
  const products = data ?? [];
  const toggle = (product: Product) => update.mutate({ id: product.id, data: { active: !product.active } }, { onSuccess: () => void client.invalidateQueries({ queryKey: getListProductsQueryKey() }) });
  return <div className="page-enter">{showEditor && <div className="mb-7 max-w-2xl"><ProductEditor product={editing} onDone={() => { setShowEditor(false); setEditing(undefined); }} /></div>}<div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">كتالوج المنتجات</h2><p className="mt-1 text-[11px] text-muted-foreground">تحكموا بالاختيارات الظاهرة للعائلات</p></div><Button onClick={() => { setEditing(undefined); setShowEditor(true); }} data-testid="button-add-product" className="rounded-xl text-xs"><Plus size={16} /> إضافة منتج</Button></div>{isError ? <ErrorBlock onRetry={() => void refetch()} /> : isLoading ? <LoadingBlock /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map(product => <div key={product.id} className="overflow-hidden rounded-[22px] border border-border bg-card shadow-card" data-testid={`card-admin-product-${product.id}`}><div className="relative aspect-[1.6] bg-muted"><img src={product.imageUrl || fallbackSheep} alt={product.name} className="size-full object-cover" /><span className={cn('absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold', product.active ? 'bg-accent text-secondary' : 'bg-card/90 text-muted-foreground')}>{product.active ? 'ظاهر' : 'مخفي'}</span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{product.name}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-5 text-muted-foreground">{product.description}</p></div><span className="font-mono-bahrain text-xs text-primary" dir="ltr">{money(product.price)}</span></div><div className="mt-4 flex items-center gap-2 border-t border-border pt-3"><button type="button" onClick={() => toggle(product)} data-testid={`button-toggle-product-${product.id}`} className="flex-1 rounded-lg bg-muted py-2 text-[10px] font-bold">{product.active ? 'إخفاء' : 'إظهار'}</button><button type="button" onClick={() => { setEditing(product); setShowEditor(true); }} data-testid={`button-edit-product-${product.id}`} className="grid size-8 place-items-center rounded-lg bg-muted text-primary"><Pencil size={14} /></button></div></div></div>)}</div>}</div>;
}

function ContentAdmin() {
  const { data } = useGetStorefront();
  const update = useUpdateSiteContent();
  const client = useQueryClient();
  const [form, setForm] = useState<SiteContentUpdate | null>(null);
  useEffect(() => { if (data?.content && !form) setForm({ ...data.content }); }, [data?.content, form]);
  if (!form) return <LoadingBlock />;
  const change = (key: keyof SiteContentUpdate, value: string | string[]) => setForm(prev => prev ? ({ ...prev, [key]: value }) : prev);
  const save = () => update.mutate({ data: form }, { onSuccess: result => { client.setQueryData(getGetStorefrontQueryKey(), (old: typeof data) => old ? { ...old, content: result } : old); } });
  return <div className="page-enter max-w-3xl"><div className="mb-6"><h2 className="text-lg font-bold">صوت المتجر</h2><p className="mt-1 text-[11px] text-muted-foreground">عدّلوا الكلمات التي تستقبل أهل البيت.</p></div><div className="rounded-[24px] border border-border bg-card p-5 md:p-7"><div className="grid gap-5"><div><Label className="text-xs">اسم العلامة</Label><Input value={form.brandName} onChange={e => change('brandName', e.target.value)} data-testid="input-content-brand-name" className="mt-2 h-11 rounded-xl" /></div><div><Label className="text-xs">عنوان البطل</Label><Input value={form.heroTitle} onChange={e => change('heroTitle', e.target.value)} data-testid="input-content-hero-title" className="mt-2 h-11 rounded-xl" /></div><div><Label className="text-xs">نص البطل</Label><Textarea value={form.heroText} onChange={e => change('heroText', e.target.value)} data-testid="input-content-hero-text" className="mt-2 min-h-[110px] rounded-xl" /></div><div><Label className="text-xs">رابط صورة البطل</Label><Input value={form.heroImageUrl} onChange={e => change('heroImageUrl', e.target.value)} dir="ltr" data-testid="input-content-hero-image" className="mt-2 h-11 rounded-xl text-left" /></div><div><Label className="text-xs">أقسام المتجر، مفصولة بفاصلة</Label><Input value={form.navLinks.join('، ')} onChange={e => change('navLinks', e.target.value.split(/[،,]/).map(x => x.trim()).filter(Boolean))} data-testid="input-content-nav-links" className="mt-2 h-11 rounded-xl" /></div></div><Button onClick={save} disabled={update.isPending} data-testid="button-save-content" className="mt-7 h-11 w-full rounded-xl">{update.isPending ? <Loader2 className="animate-spin" size={17} /> : <><Save size={16} /> حفظ التغييرات</>}</Button>{update.isSuccess && <p className="mt-3 text-center text-xs font-bold text-secondary" data-testid="status-content-saved">تم تحديث المتجر</p>}</div></div>;
}

function OrdersAdmin() {
  const { data, isLoading, isError, refetch } = useListAdminOrders();
  const [search, setSearch] = useState('');
  const orders = (data ?? []).filter(order => `${order.customerName} ${order.productName} ${order.phone}`.includes(search));
  return <div className="page-enter"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-bold">سجل الطلبات</h2><p className="mt-1 text-[11px] text-muted-foreground">كل طلبات العائلات في مكان واحد.</p></div><div className="relative"><Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو المنتج" data-testid="input-orders-search" className="h-10 w-52 rounded-xl pr-9 text-xs" /></div></div><div className="overflow-x-auto rounded-[24px] border border-border bg-card">{isLoading ? <LoadingBlock /> : isError ? <ErrorBlock onRetry={() => void refetch()} /> : orders.length ? <table className="w-full min-w-[700px] text-right text-xs"><thead className="bg-muted text-[10px] text-muted-foreground"><tr><th className="p-4">الطلب</th><th className="p-4">العميل</th><th className="p-4">المنتج</th><th className="p-4">الموعد</th><th className="p-4">الحالة</th></tr></thead><tbody className="divide-y divide-border">{orders.map(order => <tr key={order.id} data-testid={`row-order-detail-${order.id}`}><td className="p-4 font-mono-bahrain text-primary" dir="ltr">#{order.id}</td><td className="p-4"><b>{order.customerName}</b><div className="mt-1 text-[10px] text-muted-foreground" dir="ltr">{order.phone}</div></td><td className="p-4">{order.productName}<div className="mt-1 text-[10px] text-muted-foreground">{order.quantity} رأس</div></td><td className="p-4" dir="ltr">{order.pickupDate}</td><td className="p-4"><span className="rounded-full bg-accent/30 px-3 py-1 text-[10px] font-bold text-secondary">{order.status === 'new' ? 'جديد' : order.status}</span></td></tr>)}</tbody></table> : <div className="p-16 text-center text-xs text-muted-foreground" data-testid="state-empty-orders">لا توجد طلبات تطابق البحث</div>}</div></div>;
}

function PresenceAdmin() {
  const { data, isLoading, refetch } = useListPresence();
  const rows = data ?? [];
  return <div className="page-enter"><div className="mb-6 flex items-end justify-between"><div><h2 className="text-lg font-bold">الحضور المباشر</h2><p className="mt-1 text-[11px] text-muted-foreground">راقبوا رحلة العميل داخل المتجر.</p></div><button type="button" onClick={() => void refetch()} data-testid="button-refresh-presence" className="grid size-10 place-items-center rounded-xl border border-border bg-card text-primary"><RefreshCw size={16} /></button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{isLoading ? <LoadingBlock /> : rows.length ? rows.map(p => <div key={p.sessionId} className="rounded-[22px] border border-border bg-card p-5 shadow-card" data-testid={`card-presence-${p.sessionId}`}><div className="flex items-center justify-between"><div className={cn('flex items-center gap-2 text-[10px] font-bold', p.active ? 'text-secondary' : 'text-muted-foreground')}><span className={cn('size-2 rounded-full', p.active ? 'bg-accent pulse-dot' : 'bg-border')} />{p.active ? 'نشط الآن' : 'غادر'}</div><MonitorSmartphone size={17} className="text-primary" /></div><h3 className="mt-6 text-sm font-bold">{p.customerName || 'زائر جديد'}</h3><p className="mt-1 text-xs text-muted-foreground">{p.label}</p><div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground"><span>{p.page}</span><span dir="ltr">{new Date(p.lastSeenAt).toLocaleTimeString('ar-QA', { hour: '2-digit', minute: '2-digit' })}</span></div></div>) : <div className="col-span-full rounded-[22px] border border-dashed border-border p-16 text-center text-xs text-muted-foreground" data-testid="state-empty-presence-page">لا يوجد حضور مسجل</div>}</div></div>;
}

function ClerkRouter() {
  return <Switch>
    <Route path="/sign-in/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>} />
    <Route path="/sign-up/*?" component={() => <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>} />
    <Route path="/admin" component={AdminGate} />
    <Route path="/" component={HomePage} />
    <Route path="/order" component={OrderPage} />
    <Route path="/summary" component={SummaryPage} />
    <Route path="/payment-verification" component={PaymentVerificationPage} />
    <Route path="/thank-you" component={ThankYouPage} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  if (!clerkPubKey) return <WouterRouter base={basePath}><HomePage /></WouterRouter>;
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: shadcn, cssLayerName: 'clerk', options: { logoPlacement: 'inside', logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: '#a54b2b', colorForeground: '#27443c', colorMutedForeground: '#6d776e', colorBackground: '#fffdf8', colorInput: '#f5f0e7', colorInputForeground: '#27443c', colorDanger: '#a33e34', colorNeutral: '#ded5c6', fontFamily: 'Noto Kufi Arabic', borderRadius: '1rem' } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}>
    <QueryClientProvider client={queryClient}><ClerkQueryCache /><WouterRouter base={basePath}><ClerkRouter /></WouterRouter><div /></QueryClientProvider>
  </ClerkProvider>;
}

export default App;
