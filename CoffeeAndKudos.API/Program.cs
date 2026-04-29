using CoffeeAndKudos.Model.Repositories;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Named CORS policy allowing the Angular dev server at localhost:4200 to call the API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    // DateOnly has no native OpenAPI representation — mapped to a date-formatted string.
    options.MapType<DateOnly>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "date"
    });
});

// Scoped lifetime: one instance per HTTP request, disposed when the request ends.
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<BorrowsRepository>();
builder.Services.AddScoped<FavorsRepository>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAngularDev");
app.UseAuthorization();
app.MapControllers();

app.Run();
