// =============================================
// slug.ts — canonical, human-readable URL slugs
// =============================================

export function slugify(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "");
}

export function bookPath(book: { bookId: number; title: string }): string {
    const slug = slugify(book.title);
    return slug ? `/books/${book.bookId}/${slug}` : `/books/${book.bookId}`;
}

export function creatorPath(
    kind: "author" | "publisher",
    id: number,
    name: string
): string {
    const base = kind === "author" ? "authors" : "publishers";
    const slug = slugify(name);
    return slug ? `/${base}/${id}/${slug}` : `/${base}/${id}`;
}

export function categoryPath(name: string): string {
    const slug = slugify(name);
    return slug ? `/category/${slug}` : "/books";
}
