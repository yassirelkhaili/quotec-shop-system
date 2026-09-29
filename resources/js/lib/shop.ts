import type {
    CartItem,
    CartTotals,
    Category,
    CategoryNode,
    FormErrors,
    OrderItemPayload,
    Product,
    ProductGroup,
} from '@/types/shop.ts';

const CART_STORAGE_KEY = 'shop-cart';
const CATEGORY_PATH_SEPARATOR = ' › ';
const euro = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
});

export function formatCents(cents: number): string {
    return euro.format(cents / 100);
}

export function formatEuros(amount: number | string): string {
    return euro.format(Number(amount));
}

export function loadStoredCart(): CartItem[] {
    try {
        const saved = window.localStorage.getItem(CART_STORAGE_KEY);

        return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
        return [];
    }
}

export function storeCart(items: CartItem[]): boolean {
    try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

        return true;
    } catch {
        return false;
    }
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
    const nodesById = new Map<number, CategoryNode>(
        categories.map((category) => [
            category.id,
            { ...category, children: [] },
        ]),
    );
    const roots: CategoryNode[] = [];

    nodesById.forEach((node) => {
        const parent = node.parent_id
            ? nodesById.get(node.parent_id)
            : undefined;

        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

export function indexCategoriesById(
    categories: Category[],
): Map<number, Category> {
    return new Map(categories.map((category) => [category.id, category]));
}

export function categoryPath(
    categoryId: number,
    categoriesById: Map<number, Category>,
): string {
    const names: string[] = [];
    let current = categoriesById.get(categoryId);

    while (current) {
        names.unshift(current.name);
        current = current.parent_id
            ? categoriesById.get(current.parent_id)
            : undefined;
    }

    return names.join(CATEGORY_PATH_SEPARATOR);
}

export function groupProductsByCategory(products: Product[]): ProductGroup[] {
    const groups: ProductGroup[] = [];

    for (const product of products) {
        const currentGroup = groups.at(-1);

        if (currentGroup?.categoryId === product.category_id) {
            currentGroup.products.push(product);
        } else {
            groups.push({
                categoryId: product.category_id,
                products: [product],
            });
        }
    }

    return groups;
}

export function limitToStock(
    product: Product,
    requested: number,
): { quantity: number; wasLimited: boolean } {
    const quantity = Number.isFinite(requested)
        ? Math.max(0, Math.floor(requested))
        : 0;

    return quantity > product.stock
        ? { quantity: product.stock, wasLimited: true }
        : { quantity, wasLimited: false };
}

export function stockLimitNotice(product: Product): string {
    return `Von „${product.name}“ sind nur ${product.stock} Stück verfügbar.`;
}

export function quantityInCart(items: CartItem[], productId: number): number {
    return items.find((item) => item.product.id === productId)?.quantity ?? 0;
}

export function updateCartQuantity(
    items: CartItem[],
    product: Product,
    quantity: number,
): CartItem[] {
    if (quantity <= 0) {
        return items.filter((item) => item.product.id !== product.id);
    }

    const isInCart = items.some((item) => item.product.id === product.id);

    return isInCart
        ? items.map((item) =>
              item.product.id === product.id ? { ...item, quantity } : item,
          )
        : [...items, { product, quantity }];
}

export function lineTotalCents(item: CartItem): number {
    return item.product.price_cents * item.quantity;
}

export function calculateCartTotals(
    items: CartItem[],
    taxRatePercent: number,
): CartTotals {
    const net = items.reduce((sum, item) => sum + lineTotalCents(item), 0);
    const tax = Math.round((net * taxRatePercent) / 100);

    return { net, tax, gross: net + tax };
}

export function toOrderItems(items: CartItem[]): OrderItemPayload[] {
    return items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
    }));
}

export function collectItemErrors(errors: FormErrors): string[] {
    return Object.entries(errors)
        .filter(([field]) => field.startsWith('items'))
        .map(([, message]) => message);
}

export function readablePaginationLabel(label: string): string {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace('Previous', '')
        .replace('Next', '')
        .trim();
}
