namespace CoffeeAndKudos.Model.Repositories;
using Npgsql;
using Microsoft.Extensions.Configuration;

public class BaseRepository
{
    protected string ConnectionString { get; } = string.Empty;

    public BaseRepository(IConfiguration configuration)
    {
        ConnectionString = configuration.GetConnectionString("AppProgDb") ?? string.Empty;
    }

    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        return cmd.ExecuteReader();
    }
}