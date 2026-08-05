using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineBookShop.Server.Migrations
{
    /// <inheritdoc />
    public partial class FixVendorPayoutRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VendorEarnings_VendorPayout_VendorPayoutId",
                table: "VendorEarnings");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorPayout_Vendors_VendorId",
                table: "VendorPayout");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorPayout_Vendors_VendorId1",
                table: "VendorPayout");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VendorPayout",
                table: "VendorPayout");

            migrationBuilder.DropIndex(
                name: "IX_VendorPayout_VendorId1",
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
                name: "FK_VendorEarnings_VendorPayouts_VendorPayoutId",
                table: "VendorEarnings",
                column: "VendorPayoutId",
                principalTable: "VendorPayouts",
                principalColumn: "VendorPayoutId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_VendorPayouts_Vendors_VendorId",
                table: "VendorPayouts",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "VendorId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VendorEarnings_VendorPayouts_VendorPayoutId",
                table: "VendorEarnings");

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

            migrationBuilder.AddColumn<int>(
                name: "VendorId1",
                table: "VendorPayout",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_VendorPayout",
                table: "VendorPayout",
                column: "VendorPayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayout_VendorId1",
                table: "VendorPayout",
                column: "VendorId1");

            migrationBuilder.AddForeignKey(
                name: "FK_VendorEarnings_VendorPayout_VendorPayoutId",
                table: "VendorEarnings",
                column: "VendorPayoutId",
                principalTable: "VendorPayout",
                principalColumn: "VendorPayoutId",
                onDelete: ReferentialAction.SetNull);

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
    }
}
