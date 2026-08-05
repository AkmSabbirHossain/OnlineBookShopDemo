using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace OnlineBookShop.Server.Models.DbContext
{
    public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<Vendor> Vendors { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<Book> Books { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<Cart> Carts { get; set; } = null!;
        public DbSet<CartItem> CartItems { get; set; } = null!;
        public DbSet<Wishlist> Wishlists { get; set; } = null!;
        public DbSet<WishlistItem> WishlistItems { get; set; } = null!;
        public DbSet<Address> Addresses { get; set; } = null!;
        public DbSet<Review> Reviews { get; set; } = null!;
        public DbSet<StockHistory> StockHistories { get; set; } = null!;
        public DbSet<BookStock> BookStocks { get; set; } = null!;
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; } = null!;
        public DbSet<VendorPayout> VendorPayouts { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<VendorEarning> VendorEarnings { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================
            // AppUser configuration
            // ============================
            modelBuilder.Entity<AppUser>(entity =>
            {
                entity.Property(u => u.Name).HasMaxLength(100).IsRequired();

                entity.HasOne(u => u.Vendor)
                      .WithOne(v => v.AppUser)
                      .HasForeignKey<Vendor>(v => v.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(u => u.Orders)
                      .WithOne(o => o.AppUser)
                      .HasForeignKey(o => o.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Reviews)
                      .WithOne(r => r.AppUser)
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Carts)
                      .WithOne(c => c.AppUser)
                      .HasForeignKey(c => c.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Wishlists)
                      .WithOne(w => w.AppUser)
                      .HasForeignKey(w => w.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Addresses)
                      .WithOne(a => a.AppUser)
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Notifications)
                      .WithOne(n => n.AppUser)
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.RefreshTokens)
                      .WithOne(rt => rt.AppUser)
                      .HasForeignKey(rt => rt.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================
            // RefreshToken
            // ============================
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.RefreshTokenId);
                entity.HasIndex(rt => rt.Token).IsUnique();
                entity.Property(rt => rt.Token).HasMaxLength(512);
            });


            // ============================
            // CATEGORY
            // ============================
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(c => c.CategoryId);

                entity.Property(c => c.Name)
                      .HasMaxLength(100)
                      .IsRequired();

                entity.Property(c => c.Description)
                      .HasMaxLength(300);

                entity.Property(c => c.ImageUrl)
                      .HasMaxLength(500);

                entity.Property(c => c.DisplayOrder)
                      .HasDefaultValue(0);

                entity.Property(c => c.IsActive)
                      .HasDefaultValue(true);
            });

            // ============================
            // BOOK
            // ============================
            modelBuilder.Entity<Book>(entity =>
            {
                entity.HasKey(b => b.BookId);

                entity.Property(b => b.Title)
                      .HasMaxLength(300)
                      .IsRequired();

                entity.Property(b => b.Subtitle)
                      .HasMaxLength(200);

                entity.Property(b => b.Author)
                      .HasMaxLength(150)
                      .IsRequired();

                entity.Property(b => b.Publisher)
                      .HasMaxLength(100);

                entity.Property(b => b.Edition)
                      .HasMaxLength(50);

                entity.Property(b => b.Language)
                      .HasMaxLength(50);

                entity.Property(b => b.ISBN)
                      .HasMaxLength(20);

                entity.Property(b => b.Description)
                      .HasMaxLength(2000);

                entity.Property(b => b.ImageUrl)
                      .HasMaxLength(500);

                entity.Property(b => b.Price)
                      .HasPrecision(18, 2);

                entity.Property(b => b.DiscountPrice)
                      .HasPrecision(18, 2);

                // Boolean fields with default values
                entity.Property(b => b.IsActive)
                      .HasDefaultValue(true);

                entity.Property(b => b.IsFeatured)
                      .HasDefaultValue(false);

                // Date fields
                entity.Property(b => b.CreatedAt)
                      .HasDefaultValueSql("GETUTCDATE()");

                // Relationships
                entity.HasOne(b => b.Vendor)
                      .WithMany(v => v.Books)
                      .HasForeignKey(b => b.VendorId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(b => b.Category)
                      .WithMany(c => c.Books)
                      .HasForeignKey(b => b.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
            // Orders table configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.OrderId);

                entity.HasOne(o => o.AppUser)
                      .WithMany(u => u.Orders)
                      .HasForeignKey(o => o.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(o => o.Address)
                      .WithMany(a => a.Orders)
                      .HasForeignKey(o => o.AddressId)
                      .OnDelete(DeleteBehavior.Restrict);
            });


            // ============================
            // Order & OrderItem
            // ============================
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(oi => oi.OrderItemId);
                entity.HasOne(oi => oi.Order)
                      .WithMany(o => o.OrderItems)
                      .HasForeignKey(oi => oi.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(oi => oi.Book)
                      .WithMany(b => b.OrderItems)
                      .HasForeignKey(oi => oi.BookId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============================
            // Payment
            // ============================
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(p => p.PaymentId);
                entity.HasOne(p => p.Order)
                      .WithOne(o => o.Payment)
                      .HasForeignKey<Payment>(p => p.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================
            // Cart & CartItem
            // ============================
            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.HasKey(ci => ci.CartItemId);
                entity.HasOne(ci => ci.Cart)
                      .WithMany(c => c.CartItems)
                      .HasForeignKey(ci => ci.CartId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(ci => ci.Book)
                      .WithMany(b => b.CartItems)
                      .HasForeignKey(ci => ci.BookId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============================
            // Wishlist & WishlistItem
            // ============================
            modelBuilder.Entity<WishlistItem>(entity =>
            {
                entity.HasKey(wi => wi.WishlistItemId);
                entity.HasOne(wi => wi.Wishlist)
                      .WithMany(w => w.WishlistItems)
                      .HasForeignKey(wi => wi.WishlistId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(wi => wi.Book)
                      .WithMany(b => b.WishlistItems)
                      .HasForeignKey(wi => wi.BookId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============================
            // Address
            // ============================
            modelBuilder.Entity<Address>(entity =>
            {
                entity.HasKey(a => a.AddressId);
                entity.Property(a => a.Street).HasMaxLength(300).IsRequired();
                entity.Property(a => a.City).HasMaxLength(100).IsRequired();
                entity.Property(a => a.Country).HasMaxLength(100).HasDefaultValue("Bangladesh");
                entity.HasOne(a => a.AppUser)
                      .WithMany(u => u.Addresses)
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================
            // Review
            // ============================
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(r => r.ReviewId);
                entity.HasIndex(r => new { r.BookId, r.UserId }).IsUnique();
                entity.ToTable(tb => tb.HasCheckConstraint(
                    "CK_Review_Rating",
                    "[Rating] BETWEEN 1 AND 5"
                ));
            });

            // ============================
            // StockHistory
            modelBuilder.Entity<StockHistory>(entity =>
            {
                entity.HasKey(e => e.StockHistoryId);

                entity.Property(e => e.Reason)
                      .IsRequired()
                      .HasMaxLength(500);

                entity.Property(e => e.ChangedBy)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(e => e.ChangedByName)
                      .HasMaxLength(150);

                entity.Property(e => e.IpAddress)
                      .HasMaxLength(50);

                entity.Property(e => e.Notes)
                      .HasMaxLength(1000);

                entity.Property(e => e.ReferenceType)
                      .HasMaxLength(50);

                entity.Property(e => e.ChangedAt)
                      .HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.Book)
                      .WithMany(b => b.StockHistories)
                      .HasForeignKey(e => e.BookId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<BookStock>(entity =>
            {
                entity.HasKey(e => e.BookStockId);

                entity.Property(e => e.CurrentStock).IsRequired();
                entity.Property(e => e.LastUpdatedBy)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.HasOne(e => e.Book)
                      .WithOne(b => b.BookStock)
                      .HasForeignKey<BookStock>(e => e.BookId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.BookId).IsUnique();
            });

            // ============================
            // OrderStatusHistory
            // ============================
            modelBuilder.Entity<OrderStatusHistory>(entity =>
            {
                entity.HasKey(osh => osh.OrderStatusHistoryId);
                entity.HasOne(osh => osh.Order)
                      .WithMany(o => o.StatusHistories)
                      .HasForeignKey(osh => osh.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================
            // VendorEarning configuration
            // ============================
            modelBuilder.Entity<VendorEarning>(entity =>
            {
                entity.Property(e => e.GrossAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CommissionAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.NetAmount).HasColumnType("decimal(18,2)");

                entity.HasOne(e => e.Vendor)
                      .WithMany()
                      .HasForeignKey(e => e.VendorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.OrderItem)
                      .WithMany()
                      .HasForeignKey(e => e.OrderItemId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.VendorPayout)
                      .WithMany(p => p.Earnings)
                      .HasForeignKey(e => e.VendorPayoutId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ============================
            // VendorPayout configuration
            // ============================
            //modelBuilder.Entity<VendorPayout>(entity =>
            //{
            //    entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");
            //    entity.Property(p => p.Status).HasConversion<string>();

            //    entity.HasOne(p => p.Vendor)
            //          .WithMany()
            //          .HasForeignKey(p => p.VendorId)
            //          .OnDelete(DeleteBehavior.Restrict);
            //});

            modelBuilder.Entity<VendorPayout>(entity =>
            {
                entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");
                entity.Property(p => p.Status).HasConversion<string>();

                entity.HasOne(p => p.Vendor)
                      .WithMany(v => v.VendorPayouts)
                      .HasForeignKey(p => p.VendorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ============================
            // Notification
            // ============================
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.NotificationId);
                entity.HasOne(n => n.AppUser)
                      .WithMany(u => u.Notifications)
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================
            // AuditLog
            // ============================
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(al => al.AuditLogId);
            });

            // ============================
            // Global decimal precision
            // ============================
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }

        }
    }
}