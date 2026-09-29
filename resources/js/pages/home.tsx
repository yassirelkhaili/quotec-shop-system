import { Head, Link, router, usePage } from '@inertiajs/react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import AppLogo from '@/components/app-logo';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { home, login, register } from '@/routes';
import { store } from '@/routes/orders';
import type { User } from '@/types';

type Category = { id: number; parent_id: number | null; name: string };
type CategoryNode = Category & { children: CategoryNode[] };

type Product = {
    id: number;
    product_no: string;
    name: string;
    price_cents: number;
    stock: number; // max. available amount, comes from the server
    category_id: number;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type CartItem = { product: Product; quantity: number };

type Props = {
    categories: Category[];
    products: Paginated<Product>;
    selectedCategory: number | null;
    taxRate: number;
    lastOrder: { id: number; customer_no: string; total_gross: string } | null;
};

const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const money = (cents: number) => eur.format(cents / 100);

function buildTree(categories: Category[]): CategoryNode[] {
    const nodes = new Map<number, CategoryNode>();
    categories.forEach((c) => nodes.set(c.id, { ...c, children: [] }));
    const roots: CategoryNode[] = [];
    nodes.forEach((node) => {
        const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
        if (parent) parent.children.push(node);
        else roots.push(node);
    });
    return roots;
}

function categoryPath(id: number, byId: Map<number, Category>): string {
    const names: string[] = [];
    let current = byId.get(id);
    while (current) {
        names.unshift(current.name);
        current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    return names.join(' › ');
}

function CategoryTree({
    nodes,
    selected,
    onSelect,
    depth = 0,
}: {
    nodes: CategoryNode[];
    selected: number | null;
    onSelect: (id: number) => void;
    depth?: number;
}) {
    return (
        <ul className={cn('grid gap-0.5', depth > 0 && 'ml-3 border-l pl-2')}>
            {nodes.map((node) => (
                <li key={node.id} className="grid gap-0.5">
                    <button
                        type="button"
                        onClick={() => onSelect(node.id)}
                        className={cn(
                            'w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                            selected === node.id && 'bg-accent font-medium text-accent-foreground',
                        )}
                    >
                        {node.name}
                    </button>
                    {node.children.length > 0 && (
                        <CategoryTree
                            nodes={node.children}
                            selected={selected}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}

function Header() {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const getInitials = useInitials();

    return (
        <header className="border-b border-sidebar-border/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                <Link href={home()} className="flex items-center">
                    <AppLogo />
                </Link>

                {auth.user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-10 rounded-full p-1">
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                            <Link href={login()}>Log in</Link>
                        </Button>
                        <Button asChild>
                            <Link href={register()}>Register</Link>
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}

function Pagination({ products }: { products: Paginated<Product> }) {
    if (products.last_page <= 1) return null;

    return (
        <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Seiten">
            <p className="text-sm text-muted-foreground">
                {products.from}–{products.to} von {products.total} Produkten
            </p>
            <div className="flex flex-wrap gap-1">
                {products.links.map((link, i) => {
                    const label = link.label
                        .replace('&laquo;', '«')
                        .replace('&raquo;', '»')
                        .replace('Previous', '')
                        .replace('Next', '')
                        .trim();
                    return link.url ? (
                        <Button
                            key={i}
                            size="sm"
                            variant={link.active ? 'default' : 'outline'}
                            asChild
                        >
                            <Link href={link.url} preserveScroll preserveState>
                                {label}
                            </Link>
                        </Button>
                    ) : (
                        <Button key={i} size="sm" variant="outline" disabled>
                            {label}
                        </Button>
                    );
                })}
            </div>
        </nav>
    );
}

export default function Home({ categories, products, selectedCategory, taxRate, lastOrder }: Props) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [notice, setNotice] = useState<string | null>(null);
    const [customerNo, setCustomerNo] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const tree = useMemo(() => buildTree(categories), [categories]);
    const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

    // Products arrive sorted by category from the server; group consecutive ones.
    const groups = useMemo(() => {
        const result: { categoryId: number; items: Product[] }[] = [];
        products.data.forEach((product) => {
            const last = result[result.length - 1];
            if (last && last.categoryId === product.category_id) last.items.push(product);
            else result.push({ categoryId: product.category_id, items: [product] });
        });
        return result;
    }, [products.data]);

    const selectCategory = (id: number | null) =>
        router.get(home.url(), id ? { category: id } : {}, {
            preserveState: true,
            preserveScroll: true,
        });

    // Aufgabe 1 + 3: add / change amount, limited to the max amount from the server.
    const setQuantity = (product: Product, quantity: number) => {
        setNotice(null);
        let qty = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
        if (qty > product.stock) {
            qty = product.stock;
            setNotice(`Von „${product.name}“ sind nur ${product.stock} Stück verfügbar.`);
        }
        setCart((items) => {
            if (qty <= 0) return items.filter((i) => i.product.id !== product.id);
            const exists = items.some((i) => i.product.id === product.id);
            return exists
                ? items.map((i) => (i.product.id === product.id ? { ...i, quantity: qty } : i))
                : [...items, { product, quantity: qty }];
        });
    };
    const quantityOf = (id: number) => cart.find((i) => i.product.id === id)?.quantity ?? 0;

    // Aufgabe 2: net, tax, gross (in cents, no float rounding errors).
    const net = cart.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0);
    const tax = Math.round((net * taxRate) / 100);
    const gross = net + tax;

    // Aufgabe 4 + 6: send order with customer number to the server.
    const submitOrder = () => {
        router.post(
            store.url(),
            {
                customer_no: customerNo,
                items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
            },
            {
                preserveScroll: true,
                preserveState: 'errors', // keep the cart when validation fails
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: (e) => setErrors(e),
                onSuccess: () => {
                    setErrors({});
                    setCart([]);
                    setNotice(null);
                },
            },
        );
    };
    const itemErrors = Object.entries(errors)
        .filter(([key]) => key.startsWith('items'))
        .map(([, message]) => message);

    return (
        <>
            <Head title="Shop" />
            <div className="min-h-svh bg-background">
                <Header />

                <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
                    {/* Aufgabe 7: category hierarchy for navigation */}
                    <aside className="grid content-start gap-3">
                        <h2 className="text-sm font-medium">Kategorien</h2>
                        <button
                            type="button"
                            onClick={() => selectCategory(null)}
                            className={cn(
                                'w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                                selectedCategory === null && 'bg-accent font-medium',
                            )}
                        >
                            Alle Produkte
                        </button>
                        <CategoryTree nodes={tree} selected={selectedCategory} onSelect={selectCategory} />
                    </aside>

                    <section className="grid content-start gap-6">
                        <div className="space-y-1">
                            <h1 className="text-xl font-medium">
                                {selectedCategory ? categoryPath(selectedCategory, byId) : 'Alle Produkte'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Produkte auswählen und die Menge im Warenkorb anpassen.
                            </p>
                        </div>

                        {groups.length === 0 && (
                            <p className="text-sm text-muted-foreground">In dieser Kategorie gibt es keine Produkte.</p>
                        )}

                        {groups.map((group) => (
                            <div key={`${group.categoryId}-${group.items[0].id}`} className="grid gap-3">
                                <h2 className="text-sm font-medium text-muted-foreground">
                                    {categoryPath(group.categoryId, byId)}
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {group.items.map((product) => {
                                        const inCart = quantityOf(product.id);
                                        return (
                                            <Card key={product.id} className="gap-4 py-4">
                                                <CardHeader className="px-4">
                                                    <CardTitle className="text-base">{product.name}</CardTitle>
                                                    <CardDescription>Art.-Nr. {product.product_no}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex items-end justify-between gap-3 px-4">
                                                    <div>
                                                        <p className="font-semibold tabular-nums">{money(product.price_cents)}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {product.stock > 0 ? `${product.stock} verfügbar` : 'Nicht verfügbar'}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        disabled={inCart >= product.stock}
                                                        onClick={() => setQuantity(product, inCart + 1)}
                                                    >
                                                        <ShoppingCart />
                                                        {inCart > 0 ? `Im Warenkorb (${inCart})` : 'In den Warenkorb'}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <Pagination products={products} />
                    </section>

                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <Card className="gap-4">
                            <CardHeader>
                                <CardTitle>Warenkorb</CardTitle>
                                <CardDescription>
                                    {cart.length === 0 ? 'Noch keine Produkte ausgewählt' : `${cart.length} Position(en)`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {lastOrder && cart.length === 0 && (
                                    <div className="text-sm font-medium text-green-600">
                                        Bestellung Nr. {lastOrder.id} für Kunde {lastOrder.customer_no} gespeichert
                                        ({eur.format(Number(lastOrder.total_gross))}).
                                    </div>
                                )}

                                {cart.map(({ product, quantity }) => (
                                    <div key={product.id} className="grid gap-2">
                                        <div className="flex items-start justify-between gap-2 text-sm">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {product.product_no} · {money(product.price_cents)} / Stück
                                                </p>
                                            </div>
                                            <p className="font-medium tabular-nums">{money(product.price_cents * quantity)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="size-8"
                                                aria-label="Menge verringern"
                                                onClick={() => setQuantity(product, quantity - 1)}
                                            >
                                                <Minus />
                                            </Button>
                                            <Input
                                                id={`qty-${product.id}`}
                                                type="number"
                                                min={1}
                                                max={product.stock}
                                                value={quantity}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(product, parseInt(e.target.value, 10))}
                                                className="h-8 w-16 text-center tabular-nums"
                                                aria-label={`Menge ${product.name}`}
                                            />
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="size-8"
                                                aria-label="Menge erhöhen"
                                                disabled={quantity >= product.stock}
                                                onClick={() => setQuantity(product, quantity + 1)}
                                            >
                                                <Plus />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="ml-auto size-8"
                                                aria-label="Entfernen"
                                                onClick={() => setQuantity(product, 0)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

                                <Separator />

                                <dl className="grid gap-1 text-sm tabular-nums">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Netto</dt>
                                        <dd>{money(net)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">MwSt. ({taxRate} %)</dt>
                                        <dd>{money(tax)}</dd>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                        <dt>Brutto</dt>
                                        <dd>{money(gross)}</dd>
                                    </div>
                                </dl>

                                <Separator />

                                <div className="grid gap-2">
                                    <Label htmlFor="customer_no">Kundennummer</Label>
                                    <Input
                                        id="customer_no"
                                        name="customer_no"
                                        value={customerNo}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerNo(e.target.value)}
                                        placeholder="z. B. K-10001"
                                    />
                                    <InputError message={errors.customer_no} />
                                    {itemErrors.map((message) => (
                                        <InputError key={message} message={message} />
                                    ))}
                                </div>

                                <Button
                                    className="w-full"
                                    disabled={cart.length === 0 || processing}
                                    onClick={submitOrder}
                                >
                                    {processing && <Spinner />}
                                    Bestellung absenden
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>
                </main>
            </div>
        </>
    );
}
