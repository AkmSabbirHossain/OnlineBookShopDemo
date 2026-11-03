import { useState } from "react";
import { Link } from "react-router-dom";
import "./creator.css";

export type CreatorKind = "author" | "publisher";

interface Props {
    kind: CreatorKind;
    id: number;
    name: string;
    imageUrl?: string;
    bio?: string;
    bookCount: number;
    variant?: "grid" | "strip";
}

export function getInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export default function CreatorCard({
    kind,
    id,
    name,
    imageUrl,
    bio,
    bookCount,
    variant = "grid",
}: Props) {
    const [imageBroken, setImageBroken] = useState(false);
    const href = kind === "author" ? `/authors/${id}` : `/publishers/${id}`;
    const roleLabel = kind === "author" ? "Writer" : "Publisher";

    return (
        <Link
            to={href}
            className={`cr-card${variant === "strip" ? " cr-card--strip" : ""}`}
            aria-label={`${roleLabel} ${name}, ${bookCount} book${bookCount === 1 ? "" : "s"}`}
        >
            <span className="cr-card-arrow" aria-hidden="true">
                <i className="bi bi-arrow-up-right" />
            </span>

            <div className="cr-card-avatar">
                {imageUrl && !imageBroken ? (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        onError={() => setImageBroken(true)}
                    />
                ) : (
                    <span aria-hidden="true">{getInitials(name)}</span>
                )}
            </div>

            <div className="cr-card-name">{name}</div>
            {bio && <p className="cr-card-bio">{bio}</p>}
            <span className="cr-card-count">
                <i className="bi bi-journal-bookmark" aria-hidden="true" />
                {bookCount} {bookCount === 1 ? "book" : "books"}
            </span>
        </Link>
    );
}
