import { Head, Link, router, usePage } from '@inertiajs/react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import CategoryTree from '@/components/shop/category-tree';
import Pagination from '@/components/shop/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    buildCategoryTree,
    calculateCartTotals,
    categoryPath,
    collectItemErrors,
    formatCents,
    groupProductsByCategory,
    indexCategoriesById,
    limitToStock,
    lineTotalCents,
    loadStoredCart,
    orderConfirmationMessage,
    quantityInCart,
    stockLimitNotice,
    storeCart,
    toOrderItems,
    updateCartQuantity,
} from '@/lib/shop';
import { cn } from '@/lib/utils';
import { home, login, register } from '@/routes';
import { store } from '@/routes/orders';
import type { CartItem, Customer, FormErrors, HomeProps, Product } from '@/types/shop';

export default function Home({ categories, products, selectedCategory, taxRate, lastOrder }: HomeProps) {
    const customer = usePage<{ auth: { user: Customer | null } }>().props.auth.user;

    const [cart, setCart] = useState<CartItem[]>(loadStoredCart);
    const [customerNo, setCustomerNo] = useState(customer?.customer_no ?? '');
    const [notice, setNotice] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        storeCart(cart);
    }, [cart]);

    useEffect(() => {
        if (lastOrder) {
            setCart([]);
            toast.success(orderConfirmationMessage(lastOrder), { id: `order-${lastOrder.id}` });
        }
    }, [lastOrder]);

    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
    const categoriesById = useMemo(() => indexCategoriesById(categories), [categories]);
    const productGroups = groupProductsByCategory(products.data);
    const totals = calculateCartTotals(cart, taxRate);
    const itemErrors = collectItemErrors(errors);
    const isCartEmpty = cart.length === 0;

    function pathOf(categoryId: number): string {
        return categoryPath(categoryId, categoriesById);
    }

    function showCategory(categoryId: number | null): void {
        router.get(home.url(), categoryId ? { category: categoryId } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function quantityOf(product: Product): number {
        return quantityInCart(cart, product.id);
    }

    function changeQuantity(product: Product, requested: number): void {
        const { quantity, wasLimited } = limitToStock(product, requested);

        setNotice(wasLimited ? stockLimitNotice(product) : null);
        setCart((current) => updateCartQuantity(current, product, quantity));
    }

    function addToCart(product: Product): void {
        changeQuantity(product, quantityOf(product) + 1);
    }

    function resetAfterOrder(): void {
        setErrors({});
        setNotice(null);
    }

    function submitOrder(): void {
        router.post(
            store.url(),
            { customer_no: customerNo.trim(), items: toOrderItems(cart) },
            {
                preserveScroll: true,
                preserveState: 'errors',
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: (validationErrors) => setErrors(validationErrors),
                onSuccess: resetAfterOrder,
            },
        );
    }

    return (
        <>
            <Head title="Shop" />

            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
                <aside className="grid content-start gap-3">
                    <h2 className="text-sm font-medium">Kategorien</h2>
                    <button
                        type="button"
                        onClick={() => showCategory(null)}
                        className={cn(
                            'w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                            selectedCategory === null && 'bg-accent font-medium',
                        )}
                    >
                        Alle Produkte
                    </button>
                    <CategoryTree nodes={categoryTree} selectedCategory={selectedCategory} onSelect={showCategory} />
                </aside>

                <section className="grid content-start gap-6">
                    <div className="space-y-1">
                        <h1 className="text-xl font-medium">
                            {selectedCategory ? pathOf(selectedCategory) : 'Alle Produkte'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Produkte auswählen und die Menge im Warenkorb anpassen.
                        </p>
                    </div>

                    {productGroups.length === 0 && (
                        <p className="text-sm text-muted-foreground">In dieser Kategorie gibt es keine Produkte.</p>
                    )}

                    {productGroups.map((group) => (
                        <div key={`${group.categoryId}-${group.products[0].id}`} className="grid gap-3">
                            <h2 className="text-sm font-medium text-muted-foreground">{pathOf(group.categoryId)}</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {group.products.map((product) => (
                                    <Card key={product.id} className="gap-4 py-4">
                                        <CardHeader className="px-4">
                                            <CardTitle className="text-base">{product.name}</CardTitle>
                                            <CardDescription>Art.-Nr. {product.product_no}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex items-end justify-between gap-3 px-4">
                                            <div>
                                                <p className="font-semibold tabular-nums">
                                                    {formatCents(product.price_cents)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {product.stock > 0 ? `${product.stock} verfügbar` : 'Nicht verfügbar'}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                disabled={quantityOf(product) >= product.stock}
                                                onClick={() => addToCart(product)}
                                            >
                                                <ShoppingCart />
                                                {quantityOf(product) > 0
                                                    ? `Im Warenkorb (${quantityOf(product)})`
                                                    : 'In den Warenkorb'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
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
                                {isCartEmpty ? 'Noch keine Produkte ausgewählt' : `${cart.length} Position(en)`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {cart.map((item) => (
                                <div key={item.product.id} className="grid gap-2">
                                    <div className="flex items-start justify-between gap-2 text-sm">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{item.product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.product.product_no} · {formatCents(item.product.price_cents)} / Stück
                                            </p>
                                        </div>
                                        <p className="font-medium tabular-nums">{formatCents(lineTotalCents(item))}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="size-8"
                                            aria-label="Menge verringern"
                                            onClick={() => changeQuantity(item.product, item.quantity - 1)}
                                        >
                                            <Minus />
                                        </Button>
                                        <Input
                                            id={`qty-${item.product.id}`}
                                            type="number"
                                            min={1}
                                            max={item.product.stock}
                                            value={item.quantity}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                changeQuantity(item.product, parseInt(event.target.value, 10))
                                            }
                                            className="h-8 w-16 text-center tabular-nums"
                                            aria-label={`Menge ${item.product.name}`}
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="size-8"
                                            aria-label="Menge erhöhen"
                                            disabled={item.quantity >= item.product.stock}
                                            onClick={() => changeQuantity(item.product, item.quantity + 1)}
                                        >
                                            <Plus />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="ml-auto size-8"
                                            aria-label="Entfernen"
                                            onClick={() => changeQuantity(item.product, 0)}
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
                                    <dd>{formatCents(totals.net)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">MwSt. ({taxRate} %)</dt>
                                    <dd>{formatCents(totals.tax)}</dd>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <dt>Brutto</dt>
                                    <dd>{formatCents(totals.gross)}</dd>
                                </div>
                            </dl>

                            <Separator />

                            {customer ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="customer_no">Kundennummer</Label>
                                        <Input
                                            id="customer_no"
                                            name="customer_no"
                                            value={customerNo}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                setCustomerNo(event.target.value)
                                            }
                                            placeholder="z. B. K-10001"
                                            autoComplete="off"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Ihre Kundennummer ist vorausgefüllt und steht auch oben neben Ihrem Profil.
                                        </p>
                                        <InputError message={errors.customer_no} />
                                    </div>
                                    {itemErrors.map((message) => (
                                        <InputError key={message} message={message} />
                                    ))}
                                    <Button className="w-full" disabled={isCartEmpty || processing} onClick={submitOrder}>
                                        {processing && <Spinner />}
                                        Bestellung absenden
                                    </Button>
                                </>
                            ) : (
                                <div className="grid gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Zum Bestellen bitte anmelden. Neue Kunden erhalten bei der Registrierung
                                        automatisch eine Kundennummer. Der Warenkorb bleibt erhalten.
                                    </p>
                                    <Button className="w-full" asChild>
                                        <Link href={login()}>Anmelden und bestellen</Link>
                                    </Button>
                                    <Button className="w-full" variant="outline" asChild>
                                        <Link href={register()}>Registrieren</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </>
    );
}