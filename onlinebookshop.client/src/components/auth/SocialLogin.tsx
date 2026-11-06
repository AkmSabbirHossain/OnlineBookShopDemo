// =============================================
// SocialLogin.tsx — Google / Facebook sign-in
// =============================================

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import AuthService from "../../services/auth.service";
import type { ExternalLoginProvider } from "../../types/auth.types";
import "./social-login.css";

interface Props {
    onSuccess: (userName: string, role: string) => void;
}

interface GoogleCredentialResponse {
    credential: string;
}

interface GoogleIdentityServices {
    initialize(config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
    }): void;
    renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

interface FacebookAuthResponse {
    accessToken: string;
}

interface FacebookLoginResponse {
    status: string;
    authResponse?: FacebookAuthResponse | null;
}

interface FacebookSdk {
    init(options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
    }): void;
    login(
        callback: (response: FacebookLoginResponse) => void,
        options?: { scope: string }
    ): void;
}

declare global {
    interface Window {
        google?: { accounts: { id: GoogleIdentityServices } };
        FB?: FacebookSdk;
    }
}

const loadedScripts = new Set<string>();

function loadScript(src: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(id)) {
            resolve();
            return;
        }

        const existing = document.getElementById(id) as HTMLScriptElement | null;
        const script = existing ?? document.createElement("script");

        script.addEventListener(
            "load",
            () => {
                script.dataset.loaded = "true";
                loadedScripts.add(id);
                resolve();
            },
            { once: true }
        );
        script.addEventListener(
            "error",
            () => reject(new Error(`Failed to load ${src}`)),
            { once: true }
        );

        if (existing) {
            if (existing.dataset.loaded === "true") {
                loadedScripts.add(id);
                resolve();
            }
            return;
        }

        script.id = id;
        script.src = src;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    });
}

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? "";
const facebookAppId = (import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined)?.trim() ?? "";

export default function SocialLogin({ onSuccess }: Props) {
    const [busy, setBusy] = useState<ExternalLoginProvider | null>(null);
    const [error, setError] = useState("");
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const onSuccessRef = useRef(onSuccess);

    useEffect(() => {
        onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    const signIn = useCallback(async (provider: ExternalLoginProvider, token: string) => {
        setBusy(provider);
        setError("");

        try {
            const data = await AuthService.externalLogin({ provider, token });
            AuthService.saveSession(data);
            onSuccessRef.current(data.user.name, data.user.role);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const payload = err.response?.data as
                    | { Error?: string; error?: string; message?: string }
                    | undefined;
                setError(
                    payload?.Error ||
                        payload?.error ||
                        payload?.message ||
                        "Sign-in failed. Please try again."
                );
            } else {
                setError("Something went wrong. Please try again.");
            }
            setBusy(null);
        }
    }, []);

    useEffect(() => {
        if (!googleClientId) return;

        let cancelled = false;
        const target = googleButtonRef.current;

        loadScript("https://accounts.google.com/gsi/client", "google-gsi-client")
            .then(() => {
                if (cancelled || !target || !window.google) return;

                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: (response) => {
                        if (response.credential) {
                            void signIn("Google", response.credential);
                        }
                    },
                });

                window.google.accounts.id.renderButton(target, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    logo_alignment: "left",
                    width: Math.min(400, Math.max(200, target.clientWidth || 320)),
                });
            })
            .catch(() => {
                if (!cancelled) setError("Google sign-in could not be loaded.");
            });

        return () => {
            cancelled = true;
        };
    }, [signIn]);

    useEffect(() => {
        if (!facebookAppId) return;

        let cancelled = false;

        loadScript("https://connect.facebook.net/en_US/sdk.js", "facebook-jssdk")
            .then(() => {
                if (cancelled || !window.FB) return;

                window.FB.init({
                    appId: facebookAppId,
                    cookie: true,
                    xfbml: false,
                    version: "v23.0",
                });
            })
            .catch(() => {
                if (!cancelled) setError("Facebook sign-in could not be loaded.");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleFacebookClick = () => {
        if (!window.FB || busy) return;

        setError("");
        setBusy("Facebook");

        window.FB.login(
            (response) => {
                const token = response.authResponse?.accessToken;
                if (!token) {
                    setBusy(null);
                    return;
                }
                void signIn("Facebook", token);
            },
            { scope: "public_profile,email" }
        );
    };

    if (!googleClientId && !facebookAppId) return null;

    return (
        <div className="social-login">
            {googleClientId && <div ref={googleButtonRef} className="social-login__google" />}

            {facebookAppId && (
                <button
                    type="button"
                    className="social-login__btn social-login__btn--facebook"
                    onClick={handleFacebookClick}
                    disabled={busy !== null}
                >
                    {busy === "Facebook" ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                        <i className="bi bi-facebook" aria-hidden="true" />
                    )}
                    Continue with Facebook
                </button>
            )}

            {error && (
                <div className="social-login__error" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                    {error}
                </div>
            )}
        </div>
    );
}
