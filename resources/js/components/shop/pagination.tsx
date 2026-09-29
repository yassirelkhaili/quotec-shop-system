import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { readablePaginationLabel } from '@/lib/shop';
import type { Paginated, Product } from '@/types/shop';

export default function Pagination({
    products,
}: {
    products: Paginated<Product>;
}) {
    if (products.last_page <= 1) {
        return null;
    }

    return (
        <nav
            className="flex flex-wrap items-center justify-between gap-3"
            aria-label="Seiten"
        >
            <p className="text-sm text-muted-foreground">
                {products.from}–{products.to} von {products.total} Produkten
            </p>

            <div className="flex flex-wrap gap-1">
                {products.links.map((link, index) =>
                    link.url ? (
                        <Button
                            key={index}
                            size="sm"
                            variant={link.active ? 'default' : 'outline'}
                            asChild
                        >
                            <Link href={link.url} preserveScroll preserveState>
                                {readablePaginationLabel(link.label)}
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            disabled
                        >
                            {readablePaginationLabel(link.label)}
                        </Button>
                    ),
                )}
            </div>
        </nav>
    );
}
