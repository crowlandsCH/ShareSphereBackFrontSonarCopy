using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareSphere.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShareholderIdToApplicationUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShareholderId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_ShareholderId",
                table: "AspNetUsers",
                column: "ShareholderId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Shareholders_ShareholderId",
                table: "AspNetUsers",
                column: "ShareholderId",
                principalTable: "Shareholders",
                principalColumn: "ShareholderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Shareholders_ShareholderId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_ShareholderId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ShareholderId",
                table: "AspNetUsers");
        }
    }
}
