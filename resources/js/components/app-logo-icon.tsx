import type { SVGAttributes } from 'react';

// Shopping-bag mark. Uses currentColor, so it is white on the black tile
// in light mode and black on the white tile in dark mode (see app-logo.tsx).
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 13H32a2 2 0 0 1 1.99 1.8l2.2 22.9A3 3 0 0 1 33.2 41H6.8a3 3 0 0 1-2.99-3.3l2.2-22.9A2 2 0 0 1 8 13Z M13 21a7 7 0 0 0 14 0h-3a4 4 0 0 1-8 0Z"
            />
            <path d="M13 13v-2.5a7 7 0 0 1 14 0V13h-3v-2.5a4 4 0 0 0-8 0V13Z" />
        </svg>
    );
}
