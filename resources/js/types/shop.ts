import type { User } from '@/types';

export type Customer = User & { customer_no?: string | null };

export type Category = {
    id: number;
    parent_id: number | null;
    name: string;
};

export type CategoryNode = Category & { children: CategoryNode[] };

export type Product = {
    id: number;
    product_no: string;
    name: string;
    price_cents: number;
    stock: number;
    category_id: number;
};

export type ProductGroup = {
    categoryId: number;
    products: Product[];
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

export type CartItem = {
    product: Product;
    quantity: number;
};

export type CartTotals = {
    net: number;
    tax: number;
    gross: number;
};

export type OrderItemPayload = {
    product_id: number;
    quantity: number;
};

export type LastOrder = {
    id: number;
    customer_no: string;
    total_gross: string;
};

export type FormErrors = Record<string, string>;

export type HomeProps = {
    categories: Category[];
    products: Paginated<Product>;
    selectedCategory: number | null;
    taxRate: number;
    lastOrder: LastOrder | null;
};
