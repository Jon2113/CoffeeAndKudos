using CoffeeAndKudos.Model.Repositories;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    //dein Modell enthält DateOnly? DueDate, und genau dieser Typ ist in Swashbuckle mehrfach als Swagger-Problem dokumentiert. Ich ergänze deshalb die Swagger-Konfiguration so, dass DateOnly explizit als string mit date-Format beschrieben wird.
    options.MapType<DateOnly>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "date"
    });
});


//added from the lecture
builder.Services.AddScoped<UserRepository, UserRepository>();
builder.Services.AddScoped<BorrowsRepository, BorrowsRepository>();
builder.Services.AddScoped<FavorsRepository, FavorsRepository>();
var app = builder.Build();

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI();
//}

// SEE LECTURE EXCLUDE: app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
