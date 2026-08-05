using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace OnlineBookShop.Server.Models
{
    // =====================================
    // ENUMS
    // =====================================
    public enum AppUserRole
    {
        Admin,
        Vendor,
        Customer
    }
    public enum OrderStatus
    { 
        Pending, 
        Paid, 
        Shipped, 
        Delivered, 
        Cancelled 
    }

    // =====================================
    // APP USER (Identity + custom fields)
    // =====================================
    public class AppUser : IdentityUser<int>
    {
        public string Name { get; set; } = null!;
        public AppUserRole Role { get; set; } = AppUserRole.Customer;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Vendor? Vendor { get; set; }
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();
        public ICollection<Cart> Carts { get; set; } = new List<Cart>();
    }

    // =====================================
    // REFRESH TOKEN
    // =====================================
    public class RefreshToken
    {
        public int RefreshTokenId { get; set; }
        public int UserId { get; set; }          
        public string Token { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }
        public AppUser AppUser { get; set; } = null!;
    }

    // =====================================
    // VENDOR
    // =====================================
    public class Vendor
    {
        [Key]
        public int VendorId { get; set; }

        public int UserId { get; set; }

        [Required]
        [MaxLength(150)]
        public string ShopName { get; set; } = null!;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Url]
        [MaxLength(500)]
        public string? LogoUrl { get; set; }

        [Url]
        [MaxLength(500)]
        public string? BannerUrl { get; set; }

        public bool IsApproved { get; set; } = false;
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Contact Info
        [Phone]
        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; } = "Bangladesh";

        // Business & Payment Info
        [MaxLength(50)]
        public string? BusinessRegistrationNumber { get; set; }

        [MaxLength(100)]
        public string? BankAccountName { get; set; }

        [MaxLength(50)]
        public string? BankAccountNumber { get; set; }

        [MaxLength(100)]
        public string? BankName { get; set; }

        // Statistics
        public decimal TotalSales { get; set; } = 0;
        public double AverageRating { get; set; } = 0;
        public int TotalReviews { get; set; } = 0;

        // Admin Use
        [MaxLength(300)]
        public string? AdminNote { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public AppUser AppUser { get; set; } = null!;

        public ICollection<Book> Books { get; set; } = new List<Book>();
        public ICollection<VendorPayout> VendorPayouts { get; set; } = new List<VendorPayout>();
    }



    // =====================================
    // CATEGORY
    // =====================================
    public class Category
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        public ICollection<Book> Books { get; set; } = new List<Book>();
    }

    // =====================================
    // BOOK
    // =====================================
    public class Book
    {
        public int BookId { get; set; }
        public int VendorId { get; set; }
        public int CategoryId { get; set; }

        public string Title { get; set; } = null!;
        public string? Subtitle { get; set; }
        public string Author { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int Stock { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;

        public string? Publisher { get; set; }
        public string? Edition { get; set; }
        public int? PublishedYear { get; set; }
        public int? PageCount { get; set; }
        public string? Language { get; set; } = "Bangla";
        public string? ISBN { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        public Vendor Vendor { get; set; } = null!;
        public Category Category { get; set; } = null!;

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<StockHistory> StockHistories { get; set; } = new List<StockHistory>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
        public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
        public BookStock? BookStock { get; set; }
    }

    // =====================================
    // ORDER & PAYMENT
    // =====================================
    public class Order
    {
        public int OrderId { get; set; }
        public int UserId { get; set; }          
        public int AddressId { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public AppUser AppUser { get; set; } = null!;
        public Address Address { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<OrderStatusHistory> StatusHistories { get; set; } = new List<OrderStatusHistory>();
        public Payment? Payment { get; set; }
    }

    public class OrderItem
    {
        public int OrderItemId { get; set; }
        public int OrderId { get; set; }
        public int BookId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public Order Order { get; set; } = null!;
        public Book Book { get; set; } = null!;
    }

    public class Payment
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = "COD";
        public string Status { get; set; } = "Pending";
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public Order Order { get; set; } = null!;
    }

    // =====================================
    // CART
    // =====================================
    public class Cart
    {
        public int CartId { get; set; }
        public int UserId { get; set; }        
        public AppUser AppUser { get; set; } = null!;
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    }

    public class CartItem
    {
        public int CartItemId { get; set; }
        public int CartId { get; set; }
        public int BookId { get; set; }
        public int Quantity { get; set; }
        public Cart Cart { get; set; } = null!;
        public Book Book { get; set; } = null!;
    }

    // =====================================
    // REVIEW & WISHLIST
    // =====================================
    public class Review
    {
        public int ReviewId { get; set; }
        public int BookId { get; set; }
        public int UserId { get; set; }         
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Book Book { get; set; } = null!;
        public AppUser AppUser { get; set; } = null!;
    }

    public class Wishlist
    {
        public int WishlistId { get; set; }
        public int UserId { get; set; }
        public AppUser AppUser { get; set; } = null!;
        public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
    }

    public class WishlistItem
    {
        public int WishlistItemId { get; set; }
        public int WishlistId { get; set; }
        public int BookId { get; set; }
        public Wishlist Wishlist { get; set; } = null!;
        public Book Book { get; set; } = null!;
    }

    // =====================================
    // SUPPORTING TABLES
    // =====================================
    public class Address
    {
        public int AddressId { get; set; }
        public int UserId { get; set; }
        public string Street { get; set; } = null!;
        public string City { get; set; } = null!;
        public string Country { get; set; } = null!;
        public AppUser AppUser { get; set; } = null!;
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
    //======
    public class StockHistory
    {
        public int StockHistoryId { get; set; }

        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public int OldStock { get; set; }
        public int NewStock { get; set; }
        public int ChangeQuantity => NewStock - OldStock;   
        public string Reason { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public string ChangedBy { get; set; } = string.Empty;
        public string? ChangedByName { get; set; }
        public string? IpAddress { get; set; }
        public string? Notes { get; set; }

        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }

        public StockChangeReason ChangeReason { get; set; } = StockChangeReason.ManualAdjustment;
    }
    public class BookStock
    {
        public int BookStockId { get; set; }
        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public int CurrentStock { get; set; } = 0;
        public int ReservedStock { get; set; } = 0;

        public int ReorderLevel { get; set; } = 5;
        public int ReorderQuantity { get; set; } = 20;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public string LastUpdatedBy { get; set; } = string.Empty;

        public decimal? AverageCostPrice { get; set; }
    }

    public enum StockChangeReason
    {
        ManualAdjustment = 0,
        InitialStock = 1,
        NewPurchase = 2,
        Sale = 3,
        CustomerReturn = 4,
        SupplierReturn = 5,
        Damage = 6,
        Theft = 7,
        Expired = 8,
        Correction = 9,
        Other = 99
    }

    public class OrderStatusHistory
    {
        public int OrderStatusHistoryId { get; set; }
        public int OrderId { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public Order Order { get; set; } = null!;
    }

    //public class VendorPayout
    //{
    //    public int VendorPayoutId { get; set; }
    //    public int VendorId { get; set; }
    //    public decimal Amount { get; set; }
    //    public DateTime PaidAt { get; set; }
    //    public Vendor Vendor { get; set; } = null!;
    //}
    // Models/VendorEarning.cs
    public class VendorEarning
    {
        public int VendorEarningId { get; set; }
        public int VendorId { get; set; }
        public int OrderItemId { get; set; }
        public decimal GrossAmount { get; set; }      
        public decimal CommissionAmount { get; set; }  
        public decimal NetAmount { get; set; }         
        public bool IsPaidOut { get; set; } = false;
        public int? VendorPayoutId { get; set; }
        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

        public Vendor Vendor { get; set; } = null!;
        public OrderItem OrderItem { get; set; } = null!;
        public VendorPayout? VendorPayout { get; set; }
    }

  
    public class VendorPayout
    {
        public int VendorPayoutId { get; set; }
        public int VendorId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;
        public PayoutStatus Status { get; set; } = PayoutStatus.Pending;
        public string? TransactionReference { get; set; }
        public string? Notes { get; set; }

        public Vendor Vendor { get; set; } = null!;
        public ICollection<VendorEarning> Earnings { get; set; } = new List<VendorEarning>();
    }

    public enum PayoutStatus
    {
        Pending,
        Processing,
        Completed,
        Failed
    }
    public class Notification
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public AppUser AppUser { get; set; } = null!;
    }

    public class AuditLog
    {
        public int AuditLogId { get; set; }
        public string EntityName { get; set; } = null!;
        public string Action { get; set; } = null!;
        public int PerformedBy { get; set; }
        public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
    }
//    public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int>
//    {
//        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
//        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
//        public DbSet<Vendor> Vendors { get; set; } = null!;
//        public DbSet<Category> Categories { get; set; } = null!;
//        public DbSet<Book> Books { get; set; } = null!;
//        public DbSet<Order> Orders { get; set; } = null!;
//        public DbSet<OrderItem> OrderItems { get; set; } = null!;
//        public DbSet<Payment> Payments { get; set; } = null!;
//        public DbSet<Cart> Carts { get; set; } = null!;
//        public DbSet<CartItem> CartItems { get; set; } = null!;
//        public DbSet<Wishlist> Wishlists { get; set; } = null!;
//        public DbSet<WishlistItem> WishlistItems { get; set; } = null!;
//        public DbSet<Address> Addresses { get; set; } = null!;
//        public DbSet<Review> Reviews { get; set; } = null!;
//        public DbSet<StockHistory> StockHistories { get; set; } = null!;
//        public DbSet<BookStock> BookStocks { get; set; } = null!;
//        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; } = null!;
//        public DbSet<VendorPayout> VendorPayouts { get; set; } = null!;
//        public DbSet<Notification> Notifications { get; set; } = null!;
//        public DbSet<AuditLog> AuditLogs { get; set; } = null!;

//        protected override void OnModelCreating(ModelBuilder modelBuilder)
//        {
//            base.OnModelCreating(modelBuilder);

//            // ============================
//            // AppUser configuration
//            // ============================
//            modelBuilder.Entity<AppUser>(entity =>
//            {
//                entity.Property(u => u.Name).HasMaxLength(100).IsRequired();

//                entity.HasOne(u => u.Vendor)
//                      .WithOne(v => v.AppUser)
//                      .HasForeignKey<Vendor>(v => v.UserId)
//                      .OnDelete(DeleteBehavior.Restrict);

//                entity.HasMany(u => u.Orders)
//                      .WithOne(o => o.AppUser)
//                      .HasForeignKey(o => o.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasMany(u => u.Reviews)
//                      .WithOne(r => r.AppUser)
//                      .HasForeignKey(r => r.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasMany(u => u.Carts)
//                      .WithOne(c => c.AppUser)
//                      .HasForeignKey(c => c.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasMany(u => u.Wishlists)
//                      .WithOne(w => w.AppUser)
//                      .HasForeignKey(w => w.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasMany(u => u.Addresses)
//                      .WithOne(a => a.AppUser)
//                      .HasForeignKey(a => a.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasMany(u => u.Notifications)
//                      .WithOne(n => n.AppUser)
//                      .HasForeignKey(n => n.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasMany(u => u.RefreshTokens)
//                      .WithOne(rt => rt.AppUser)
//                      .HasForeignKey(rt => rt.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);
//            });

//            // ============================
//            // RefreshToken
//            // ============================
//            modelBuilder.Entity<RefreshToken>(entity =>
//            {
//                entity.HasKey(rt => rt.RefreshTokenId);
//                entity.HasIndex(rt => rt.Token).IsUnique();
//                entity.Property(rt => rt.Token).HasMaxLength(512);
//            });

   
//            // ============================
//            // CATEGORY
//            // ============================
//            modelBuilder.Entity<Category>(entity =>
//            {
//                entity.HasKey(c => c.CategoryId);

//                entity.Property(c => c.Name)
//                      .HasMaxLength(100)
//                      .IsRequired();

//                entity.Property(c => c.Description)
//                      .HasMaxLength(300);

//                entity.Property(c => c.ImageUrl)
//                      .HasMaxLength(500);

//                entity.Property(c => c.DisplayOrder)
//                      .HasDefaultValue(0);

//                entity.Property(c => c.IsActive)
//                      .HasDefaultValue(true);
//            });

//            // ============================
//            // BOOK
//            // ============================
//            modelBuilder.Entity<Book>(entity =>
//            {
//                entity.HasKey(b => b.BookId);

//                entity.Property(b => b.Title)
//                      .HasMaxLength(300)
//                      .IsRequired();

//                entity.Property(b => b.Subtitle)
//                      .HasMaxLength(200);

//                entity.Property(b => b.Author)
//                      .HasMaxLength(150)
//                      .IsRequired();

//                entity.Property(b => b.Publisher)
//                      .HasMaxLength(100);

//                entity.Property(b => b.Edition)
//                      .HasMaxLength(50);

//                entity.Property(b => b.Language)
//                      .HasMaxLength(50);

//                entity.Property(b => b.ISBN)
//                      .HasMaxLength(20);

//                entity.Property(b => b.Description)
//                      .HasMaxLength(2000);

//                entity.Property(b => b.ImageUrl)
//                      .HasMaxLength(500);

//                entity.Property(b => b.Price)
//                      .HasPrecision(18, 2);

//                entity.Property(b => b.DiscountPrice)
//                      .HasPrecision(18, 2);

//                // Boolean fields with default values
//                entity.Property(b => b.IsActive)
//                      .HasDefaultValue(true);

//                entity.Property(b => b.IsFeatured)
//                      .HasDefaultValue(false);

//                // Date fields
//                entity.Property(b => b.CreatedAt)
//                      .HasDefaultValueSql("GETUTCDATE()");

//                // Relationships
//                entity.HasOne(b => b.Vendor)
//                      .WithMany(v => v.Books)
//                      .HasForeignKey(b => b.VendorId)
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasOne(b => b.Category)
//                      .WithMany(c => c.Books)
//                      .HasForeignKey(b => b.CategoryId)
//                      .OnDelete(DeleteBehavior.Restrict);
//            });
//            // Orders table configuration
//            modelBuilder.Entity<Order>(entity =>
//            {
//                entity.HasKey(o => o.OrderId);

//                entity.HasOne(o => o.AppUser)
//                      .WithMany(u => u.Orders)
//                      .HasForeignKey(o => o.UserId)
//                      .OnDelete(DeleteBehavior.Restrict); 

//                entity.HasOne(o => o.Address)
//                      .WithMany(a => a.Orders)
//                      .HasForeignKey(o => o.AddressId)
//                      .OnDelete(DeleteBehavior.Restrict); 
//            });


//            // ============================
//            // Order & OrderItem
//            // ============================
//            modelBuilder.Entity<OrderItem>(entity =>
//            {
//                entity.HasKey(oi => oi.OrderItemId);
//                entity.HasOne(oi => oi.Order)
//                      .WithMany(o => o.OrderItems)
//                      .HasForeignKey(oi => oi.OrderId)
//                      .OnDelete(DeleteBehavior.Cascade);
//                entity.HasOne(oi => oi.Book)
//                      .WithMany(b => b.OrderItems)
//                      .HasForeignKey(oi => oi.BookId)
//                      .OnDelete(DeleteBehavior.Restrict);
//            });

//            // ============================
//            // Payment
//            // ============================
//            modelBuilder.Entity<Payment>(entity =>
//            {
//                entity.HasKey(p => p.PaymentId);
//                entity.HasOne(p => p.Order)
//                      .WithOne(o => o.Payment)
//                      .HasForeignKey<Payment>(p => p.OrderId)
//                      .OnDelete(DeleteBehavior.Cascade);
//            });

//            // ============================
//            // Cart & CartItem
//            // ============================
//            modelBuilder.Entity<CartItem>(entity =>
//            {
//                entity.HasKey(ci => ci.CartItemId);
//                entity.HasOne(ci => ci.Cart)
//                      .WithMany(c => c.CartItems)
//                      .HasForeignKey(ci => ci.CartId)
//                      .OnDelete(DeleteBehavior.Cascade);
//                entity.HasOne(ci => ci.Book)
//                      .WithMany(b => b.CartItems)
//                      .HasForeignKey(ci => ci.BookId)
//                      .OnDelete(DeleteBehavior.Restrict);
//            });

//            // ============================
//            // Wishlist & WishlistItem
//            // ============================
//            modelBuilder.Entity<WishlistItem>(entity =>
//            {
//                entity.HasKey(wi => wi.WishlistItemId);
//                entity.HasOne(wi => wi.Wishlist)
//                      .WithMany(w => w.WishlistItems)
//                      .HasForeignKey(wi => wi.WishlistId)
//                      .OnDelete(DeleteBehavior.Cascade);
//                entity.HasOne(wi => wi.Book)
//                      .WithMany(b => b.WishlistItems)
//                      .HasForeignKey(wi => wi.BookId)
//                      .OnDelete(DeleteBehavior.Restrict);
//            });

//            // ============================
//            // Address
//            // ============================
//            modelBuilder.Entity<Address>(entity =>
//            {
//                entity.HasKey(a => a.AddressId);
//                entity.Property(a => a.Street).HasMaxLength(300).IsRequired();
//                entity.Property(a => a.City).HasMaxLength(100).IsRequired();
//                entity.Property(a => a.Country).HasMaxLength(100).HasDefaultValue("Bangladesh");
//                entity.HasOne(a => a.AppUser)
//                      .WithMany(u => u.Addresses)
//                      .HasForeignKey(a => a.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);
//            });

//            // ============================
//            // Review
//            // ============================
//            modelBuilder.Entity<Review>(entity =>
//            {
//                entity.HasKey(r => r.ReviewId);
//                entity.HasIndex(r => new { r.BookId, r.UserId }).IsUnique();
//                entity.ToTable(tb => tb.HasCheckConstraint(
//                    "CK_Review_Rating",
//                    "[Rating] BETWEEN 1 AND 5"
//                ));
//            });

//            // ============================
//            // StockHistory
//            modelBuilder.Entity<StockHistory>(entity =>
//            {
//                entity.HasKey(e => e.StockHistoryId);

//                entity.Property(e => e.Reason)
//                      .IsRequired()
//                      .HasMaxLength(500);

//                entity.Property(e => e.ChangedBy)
//                      .IsRequired()
//                      .HasMaxLength(100);

//                entity.Property(e => e.ChangedByName)
//                      .HasMaxLength(150);

//                entity.Property(e => e.IpAddress)
//                      .HasMaxLength(50);

//                entity.Property(e => e.Notes)
//                      .HasMaxLength(1000);

//                entity.Property(e => e.ReferenceType)
//                      .HasMaxLength(50);

//                entity.Property(e => e.ChangedAt)
//                      .HasDefaultValueSql("GETUTCDATE()");
//                entity.HasOne(e => e.Book)
//                      .WithMany(b => b.StockHistories)   
//                      .HasForeignKey(e => e.BookId)
//                      .OnDelete(DeleteBehavior.Cascade);
//            });

//            modelBuilder.Entity<BookStock>(entity =>
//            {
//                entity.HasKey(e => e.BookStockId);

//                entity.Property(e => e.CurrentStock).IsRequired();
//                entity.Property(e => e.LastUpdatedBy)
//                      .IsRequired()
//                      .HasMaxLength(100);

//                entity.HasOne(e => e.Book)
//                      .WithOne(b => b.BookStock)
//                      .HasForeignKey<BookStock>(e => e.BookId)   
//                      .OnDelete(DeleteBehavior.Cascade);

//                entity.HasIndex(e => e.BookId).IsUnique();
//            });

//            // ============================
//            // OrderStatusHistory
//            // ============================
//            modelBuilder.Entity<OrderStatusHistory>(entity =>
//            {
//                entity.HasKey(osh => osh.OrderStatusHistoryId);
//                entity.HasOne(osh => osh.Order)
//                      .WithMany(o => o.StatusHistories)
//                      .HasForeignKey(osh => osh.OrderId)
//                      .OnDelete(DeleteBehavior.Cascade);
//            });

//            // ============================
//            // VendorPayout
//            // ============================
//            modelBuilder.Entity<VendorPayout>(entity =>
//            {
//                entity.HasKey(vp => vp.VendorPayoutId);
//                entity.HasOne(vp => vp.Vendor)
//                      .WithMany(v => v.VendorPayouts)
//                      .HasForeignKey(vp => vp.VendorId)
//                      .OnDelete(DeleteBehavior.Cascade);
//            });

//            // ============================
//            // Notification
//            // ============================
//            modelBuilder.Entity<Notification>(entity =>
//            {
//                entity.HasKey(n => n.NotificationId);
//                entity.HasOne(n => n.AppUser)
//                      .WithMany(u => u.Notifications)
//                      .HasForeignKey(n => n.UserId)
//                      .OnDelete(DeleteBehavior.Cascade);
//            });

//            // ============================
//            // AuditLog
//            // ============================
//            modelBuilder.Entity<AuditLog>(entity =>
//            {
//                entity.HasKey(al => al.AuditLogId);
//            });

//            // ============================
//            // Global decimal precision
//            // ============================
//            foreach (var property in modelBuilder.Model.GetEntityTypes()
//                .SelectMany(t => t.GetProperties())
//                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
//            {
//                property.SetPrecision(18);
//                property.SetScale(2);
//            }
//        }
//    }
}