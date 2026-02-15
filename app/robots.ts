import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://la-cassonnaise.vercel.app";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/account/"],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
