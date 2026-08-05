using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineBookShop.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorEarningAndPayout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VendorPayouts_Vendors_VendorId",
                table: "VendorPayouts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VendorPayouts",
                table: "VendorPayouts");

            migrationBuilder.RenameTable(
                name: "VendorPayouts",
                newName: "VendorPayout");

            migrationBuilder.RenameIndex(
                name: "IX_VendorPayouts_VendorId",
                table: "VendorPayout",
                newName: "IX_VendorPayout_VendorId");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "VendorPayout",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "VendorPayout",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TransactionReference",
                table: "VendorPayout",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VendorId1",
                table: "VendorPayout",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_VendorPayout",
                table: "VendorPayout",
                column: "VendorPayoutId");

            migrationBuilder.CreateTable(
                name: "VendorEarnings",
                columns: table => new
                {
                    VendorEarningId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<int>(type: "int", nullable: false),
                    OrderItemId = table.Column<int>(type: "int", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    NetAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsPaidOut = table.Column<bool>(type: "bit", nullable: false),
                    VendorPayoutId = table.Column<int>(type: "int", nullable: true),
                    EarnedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorEarnings", x => x.VendorEarningId);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_OrderItems_OrderItemId",
                        column: x => x.OrderItemId,
                        principalTable: "OrderItems",
                        principalColumn: "OrderItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_VendorPayout_VendorPayoutId",
                        column: x => x.VendorPayoutId,
                        principalTable: "VendorPayout",
                        principalColumn: "VendorPayoutId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "VendorId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayout_VendorId1",
                table: "VendorPayout",
                column: "VendorId1");

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_OrderItemId",
                table: "VendorEarnings",
                column: "OrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_VendorId",
                table: "VendorEarnings",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_VendorPayoutId",
                table: "VendorEarnings",
                column: "VendorPayoutId");

            migrationBuilder.AddForeignKey(
                name: "FK_VendorPayout_Vendors_VendorId",
                table: "VendorPayout",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "VendorId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_VendorPayout_Vendors_VendorId1",
                table: "VendorPayout",
                column: "VendorId1",
                principalTable: "Vendors",
                principalColumn: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VendorPayout_Vendors_VendorId",
                table: "VendorPayout");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorPayout_Vendors_VendorId1",
                table: "VendorPayout");

            migrationBuilder.DropTable(
                name: "VendorEarnings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VendorPayout",
                table: "VendorPayout");

            migrationBuilder.DropIndex(
                name: "IX_VendorPayout_VendorId1",
                table: "VendorPayout");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "VendorPayout");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "VendorPayout");

            migrationBuilder.DropColumn(
                name: "TransactionReference",
                table: "VendorPayout");

            migrationBuilder.DropColumn(
                name: "VendorId1",
                table: "VendorPayout");

            migrationBuilder.RenameTable(
                name: "VendorPayout",
                newName: "VendorPayouts");

            migrationBuilder.RenameIndex(
                name: "IX_VendorPayout_VendorId",
                table: "VendorPayouts",
                newName: "IX_VendorPayouts_VendorId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VendorPayouts",
                table: "VendorPayouts",
                column: "VendorPayoutId");

            migrationBuilder.AddForeignKey(
                name: "FK_VendorPayouts_Vendors_VendorId",
                table: "VendorPayouts",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "VendorId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
