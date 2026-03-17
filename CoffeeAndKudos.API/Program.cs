using CoffeeAndKudos.Model.Repositories;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


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
