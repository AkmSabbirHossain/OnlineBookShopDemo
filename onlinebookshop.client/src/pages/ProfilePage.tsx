// =============================================
// ProfilePage.tsx — Full profile page
// =============================================
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import ProfileInfo from "../components/profile/ProfileInfo";
import AddressManager from "../components/profile/AddressManager";
import ChangePassword from "../components/profile/ChangePassword";
import ProfileService from "../services/profile.service";
import AddressService from "../services/address.service";
import AuthService from "../services/auth.service";
import type { UserProfileDto } from "../types/profile.types";
import type { AddressResponseDto } from "../types/address.types";

type Tab = "profile" | "addresses" | "password";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [addresses, setAddresses] = useState<AddressResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = AuthService.getCurrentUser();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError("");
            try {
                const [profileData, addressData] = await Promise.all([
                    ProfileService.getProfile(),
                    AddressService.getMyAddresses(),
                ]);
                setProfile(profileData);
                setAddresses(addressData);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || "Failed to load profile.");
                } else {
                    setError("Something went wrong.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: "profile", label: "Profile", icon: "bi-person-circle" },
        { key: "addresses", label: "My Addresses", icon: "bi-geo-alt" },
        { key: "password", label: "Change Password", icon: "bi-shield-lock" },
    ];

    return (
        <>
            <Navbar />
            <div className="bg-light min-vh-100 py-4">
                <div className="container" style={{ maxWidth: "900px" }}>
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                        <div>
                            <h4 className="fw-bold mb-0">
                                <i className="bi bi-person me-2 text-primary"></i>
                                My Account
                            </h4>
                            <p className="text-muted small mb-0">
                                Manage your profile, addresses and security
                            </p>
                        </div>

                        {/* Header Quick Buttons - Wishlist first, then Orders */}
                        <div className="d-flex gap-2">
                            {user?.role === "Customer" && (
                                <Link to="/wishlist" className="btn btn-outline-danger btn-sm">
                                    <i className="bi bi-heart me-1"></i>My Wishlist
                                </Link>
                            )}
                            {user?.role === "Customer" && (
                                <Link to="/orders" className="btn btn-outline-primary btn-sm">
                                    <i className="bi bi-bag me-1"></i>My Orders
                                </Link>
                            )}
                            {user?.role === "Vendor" && (
                                <Link to="/vendor/dashboard" className="btn btn-outline-success btn-sm">
                                    <i className="bi bi-shop me-1"></i>Vendor Dashboard
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
                            <p className="text-muted mt-3">Loading profile...</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="alert alert-danger d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            {error}
                        </div>
                    )}

                    {!loading && profile && (
                        <div className="row g-4">
                            {/* Sidebar */}
                            <div className="col-md-3">
                                <div className="card border-0 shadow-sm rounded-3">
                                    <div className="card-body p-3">
                                        {/* Avatar */}
                                        <div className="text-center mb-3">
                                            <div
                                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold mx-auto mb-2"
                                                style={{ width: "64px", height: "64px", fontSize: "26px" }}
                                            >
                                                {profile.name.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="fw-semibold mb-0 small">{profile.name}</p>
                                            <small className="text-muted">{profile.email}</small>
                                        </div>
                                        <hr className="my-2" />

                                        {/* Nav */}
                                        <nav className="d-flex flex-column gap-1">
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    className={`btn text-start btn-sm d-flex align-items-center gap-2 ${activeTab === tab.key
                                                        ? "btn-primary"
                                                        : "btn-outline-secondary border-0"
                                                        }`}
                                                    onClick={() => setActiveTab(tab.key)}
                                                >
                                                    <i className={`bi ${tab.icon}`}></i>
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </nav>

                                        <hr className="my-2" />

                                        {/* Quick Links - Wishlist first, then Orders */}
                                        {user?.role === "Customer" && (
                                            <Link to="/wishlist" className="btn btn-outline-secondary border-0 btn-sm text-start w-100 d-flex align-items-center gap-2 mb-1">
                                                <i className="bi bi-heart"></i>My Wishlist
                                            </Link>
                                        )}
                                        {user?.role === "Customer" && (
                                            <Link to="/orders" className="btn btn-outline-secondary border-0 btn-sm text-start w-100 d-flex align-items-center gap-2 mb-1">
                                                <i className="bi bi-bag"></i>My Orders
                                            </Link>
                                        )}

                                        <Link to="/" className="btn btn-outline-secondary border-0 btn-sm text-start w-100 d-flex align-items-center gap-2">
                                            <i className="bi bi-house"></i>Home
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="col-md-9">
                                {activeTab === "profile" && (
                                    <ProfileInfo
                                        profile={profile}
                                        onUpdated={(updated) => setProfile(updated)}
                                    />
                                )}
                                {activeTab === "addresses" && (
                                    <AddressManager
                                        addresses={addresses}
                                        onAddressesChanged={setAddresses}
                                    />
                                )}
                                {activeTab === "password" && <ChangePassword />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}