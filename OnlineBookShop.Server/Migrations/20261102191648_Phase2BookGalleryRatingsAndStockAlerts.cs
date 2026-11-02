using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineBookShop.Server.Migrations
{
    /// <inheritdoc />
    public partial class Phase2BookGalleryRatingsAndStockAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVerifiedPurchase",
                table: "Reviews",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "AverageRating",
                table: "Books",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "LowStockThreshold",
                table: "Books",
                type: "int",
                nullable: false,
                defaultValue: 5);

            migrationBuilder.AddColumn<int>(
                name: "ReviewCount",
                table: "Books",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "BookImages",
                columns: table => new
                {
                    BookImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookImages", x => x.BookImageId);
                    table.ForeignKey(
                        name: "FK_BookImages_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "BookId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Books_AverageRating",
                table: "Books",
                column: "AverageRating");

            migrationBuilder.CreateIndex(
                name: "IX_Books_ReviewCount",
                table: "Books",
                column: "ReviewCount");

            migrationBuilder.CreateIndex(
                name: "IX_BookImages_BookId_DisplayOrder",
                table: "BookImages",
                columns: new[] { "BookId", "DisplayOrder" });

            // Backfill denormalized rating aggregates from existing reviews.
            migrationBuilder.Sql(@"
                UPDATE b
                SET ReviewCount = r.Cnt,
                    AverageRating = r.Avg
                FROM Books b
                INNER JOIN (
                    SELECT BookId,
                           COUNT(*) AS Cnt,
                           CAST(AVG(CAST(Rating AS decimal(18,2))) AS decimal(18,2)) AS Avg
                    FROM Reviews
                    GROUP BY BookId
                ) r ON r.BookId = b.BookId;
            ");

            // Backfill verified-purchase flags for reviews whose author received the book.
            migrationBuilder.Sql(@"
                UPDATE rv
                SET IsVerifiedPurchase = 1
                FROM Reviews rv
                WHERE EXISTS (
                    SELECT 1
                    FROM OrderItems oi
                    INNER JOIN Orders o ON o.OrderId = oi.OrderId
                    WHERE oi.BookId = rv.BookId
                      AND o.UserId = rv.UserId
                      AND o.Status = 3
                );
            ");

            // Seed the gallery from the legacy cover URL so existing books keep their image.
            migrationBuilder.Sql(@"
                INSERT INTO BookImages (BookId, ImageUrl, IsPrimary, DisplayOrder, CreatedAt)
                SELECT BookId, ImageUrl, 1, 0, GETUTCDATE()
                FROM Books
                WHERE ImageUrl IS NOT NULL AND LTRIM(RTRIM(ImageUrl)) <> '';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookImages");

            migrationBuilder.DropIndex(
                name: "IX_Books_AverageRating",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_ReviewCount",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "IsVerifiedPurchase",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "AverageRating",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "LowStockThreshold",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "ReviewCount",
                table: "Books");
        }
    }
}
