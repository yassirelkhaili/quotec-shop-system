import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { home, login, register } from '@/routes';
import type { User } from '@/types';

/**
 * Layout for the shop and the settings pages:
 * header with logo (left) and profile menu (right), no dashboard sidebar.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const getInitials = useInitials();

    return (
        <div className="min-h-svh bg-background">
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

            <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        </div>
    );
}
