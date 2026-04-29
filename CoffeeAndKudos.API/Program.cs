// We need these two lines to get access to:
// - Our three repositories 
// - OpenApiSchema, to tell Swagger how to display certain data types
using CoffeeAndKudos.Model.Repositories;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Named CORS policy — allows the Angular dev server origin to call the API directly.
// The Angular proxy (proxy.conf.json) handles this in dev, but the policy is needed
// for any direct API consumer (Swagger UI, tests, production builds).
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();

// Allows the app to automatically discover and document all our API endpoints
// This is what feeds information into Swagger
builder.Services.AddEndpointsApiExplorer();

// Sets up Swagger - the tool that generates the interactive API documentation page
// where you can test your endpoints in the browser
builder.Services.AddSwaggerGen(options =>
{
    // By default, Swagger doesn't know how to display a "DateOnly" type
    // This tells Swagger: "treat DateOnly as a plain text date in the format YYYY-MM-DD"
    options.MapType<DateOnly>(() => new OpenApiSchema
    {
        Type = "string",  // Display it as text
        Format = "date"   // But specifically a date (YYYY-MM-DD), not just any random string
    });
});

// Registers our three repositories so ASP.NET can automatically inject them into our controllers
// "AddScoped" means a fresh copy of each repository is created per request, then thrown away when the request is done
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<BorrowsRepository>();
builder.Services.AddScoped<FavorsRepository>();

// We're done configuring - this line actually BUILDS the app and gets it ready to run
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAngularDev");

app.UseAuthorization();

// Tells the app to look at our controllers and wire up all the routes
// (e.g. GET /api/User, POST /api/Borrows etc.) so incoming requests reach the right method
app.MapControllers();

// Starts the app and keeps it running, listening for incoming requests
app.Run();