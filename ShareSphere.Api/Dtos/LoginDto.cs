
// File: Dtos/LoginDto.cs
using System.ComponentModel.DataAnnotations;

public record LoginDto(
    [Required] string UserName,
    [Required] string Password
);
