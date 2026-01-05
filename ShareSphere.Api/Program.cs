
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShareSphere.Api.Data;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// ---- 0) CORS: allowed origins from configuration, fallback for local dev servers ----
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

// ---- 1) Database ----
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ---- 2) Identity ----
builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Lockout.MaxFailedAccessAttempts = 5;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

// ---- 3) JWT ----
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
    RoleClaimType = ClaimTypes.Role,  // <-- CHANGE FROM "role" TO ClaimTypes.Role
    NameClaimType = ClaimTypes.Name,  // <-- CHANGE FROM "unique_name" TO ClaimTypes.Name
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ---- 4) Controllers ----
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler. IgnoreCycles;
    });

// ---- 5) Swagger with JWT ----
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opt =>
{
    opt.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ShareSphere API",
        Version = "v1",
        Description = "WebAPI with Identity + JWT"
    });

    // Bearer-JWT Schema
    var securitySchema = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT in format: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    opt.AddSecurityDefinition("Bearer", securitySchema);

    var securityRequirement = new OpenApiSecurityRequirement
    {
        { securitySchema, Array.Empty<string>() }
    };
    opt.AddSecurityRequirement(securityRequirement);
});

// ---- 6) CORS policy for React frontend ----
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
        // .AllowCredentials(); // only needed if you use cookies (e.g. for Auth)
    });
});

// ---- 7) Register services ----
builder.Services.AddScoped<ShareSphere.Api.Services.IAuthService, ShareSphere.Api.Services.AuthService>();
builder.Services.AddScoped<IStockExchangeService, StockExchangeService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IBrokerService, BrokerService>();
builder.Services.AddScoped<IShareService, ShareService>();
builder.Services.AddScoped<IShareholderService, ShareholderService>();
builder.Services.AddScoped<ITradeService, TradeService>();
builder.Services.AddScoped<ISharePurchaseService, SharePurchaseService>();
var app = builder.Build();

Console.WriteLine($"API is running on: {string.Join(", ", app.Urls)}");
// ---- 8) Seed roles ----
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var dbContext = services.GetRequiredService<AppDbContext>();
        
        await DbInitializer.SeedAdminUser(userManager, roleManager);
        await DbInitializer.SeedStockExchanges(dbContext);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}




// ---- 9) Middleware order ----

// When operating behind a proxy (e.g. later in Azure/AppService) correct redirects
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// **Important**: CORS before Auth/Authorization, so that preflight requests go through cleanly
app.UseCors("ClientCors");

app.UseAuthentication();
app.UseAuthorization();

// API endpoints
app.MapControllers();

// Optional: SPA hosting for production (if you copy the React build to wwwroot)
if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");
}

app.Run();