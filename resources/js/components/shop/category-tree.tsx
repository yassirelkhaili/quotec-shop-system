import { cn } from '@/lib/utils';
import type { CategoryNode } from '@/types/shop';

type CategoryTreeProps = {
    nodes: CategoryNode[];
    selectedCategory: number | null;
    onSelect: (categoryId: number) => void;
    depth?: number;
};

export default function CategoryTree({
    nodes,
    selectedCategory,
    onSelect,
    depth = 0,
}: CategoryTreeProps) {
    return (
        <ul className={cn('grid gap-0.5', depth > 0 && 'ml-3 border-l pl-2')}>
            {nodes.map((node) => (
                <li key={node.id} className="grid gap-0.5">
                    <button
                        type="button"
                        onClick={() => onSelect(node.id)}
                        className={cn(
                            'w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                            selectedCategory === node.id &&
                                'bg-accent font-medium text-accent-foreground',
                        )}
                    >
                        {node.name}
                    </button>

                    {node.children.length > 0 && (
                        <CategoryTree
                            nodes={node.children}
                            selectedCategory={selectedCategory}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}
