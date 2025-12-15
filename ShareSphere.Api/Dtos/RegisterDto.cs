
// File: Dtos/RegisterDto.cs
using System.ComponentModel.DataAnnotations;

public record RegisterDto(
    [Required, MinLength(3)] string UserName,
    [Required, MinLength(3), MaxLength(64)] string DisplayName,
    [Required, MinLength(6)] string Password,
    string[]? Roles // optional: ["shareholder", "admin"]
);