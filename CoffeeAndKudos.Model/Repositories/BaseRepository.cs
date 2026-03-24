namespace CoffeeAndKudos.Model.Repositories;
using Npgsql;
using Microsoft.Extensions.Configuration;
using System;

public class BaseRepository
{
    protected string ConnectionString { get; } = string.Empty;

    public BaseRepository(IConfiguration configuration)
    {
        string rawConnectionString = configuration.GetConnectionString("AppProgDb") ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawConnectionString))
        {
            throw new InvalidOperationException(
                "Missing connection string 'ConnectionStrings:AppProgDb'.");
        }

        var builder = new NpgsqlConnectionStringBuilder(rawConnectionString);

        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            string? password =
                configuration["ConnectionStrings:AppProgDbPassword"] ??
                configuration["SUPABASE_DB_PASSWORD"] ??
                configuration["DB_PASSWORD"];

            if (!string.IsNullOrWhiteSpace(password))
            {
                builder.Password = password;
            }
        }

        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            throw new InvalidOperationException(
                "Database password missing. Configure 'ConnectionStrings:AppProgDbPassword' via User Secrets or environment variable.");
        }

        ConnectionString = builder.ConnectionString;
    }

    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        return cmd.ExecuteReader();
    }

    protected bool InsertData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        cmd.ExecuteNonQuery();
        return true;
    }

    protected bool UpdateData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        cmd.ExecuteNonQuery();
        return true;
    }

    protected bool DeleteData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        cmd.ExecuteNonQuery();
        return true;
    }
}
