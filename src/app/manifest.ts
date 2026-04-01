import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Noru POS',
        short_name: 'Noru POS',
        description: 'Sistem Point of Sale terbaik untuk UMKM',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f5f7',
        theme_color: '#6d28d9',
        orientation: "any",
        categories: ["business", "finance", "productivity"],
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/icons/icon-512-maskable.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
        screenshots: [
            {
                src: "/icons/screenshot-desktop.png",
                sizes: "1280x720",
                type: "image/png",
                form_factor: "wide",
            },
            {
                src: "/icons/screenshot-mobile.png",
                sizes: "750x1334",
                type: "image/png",
            },
        ],
    }
}
