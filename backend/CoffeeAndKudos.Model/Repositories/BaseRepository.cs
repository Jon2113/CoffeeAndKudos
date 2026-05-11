namespace CoffeeAndKudos.Model.Repositories;
using Npgsql;
using Microsoft.Extensions.Configuration;
using System;

// Base class for all repositories. Handles connection string setup and provides
// shared query execution methods used by every repository.
public class BaseRepository
{
    protected string ConnectionString { get; } = string.Empty;

    // Parameterless constructor for Moq — skips DB setup so repositories can be mocked in tests.
    protected BaseRepository() { }

    public BaseRepository(IConfiguration configuration)
    {
        string rawConnectionString = configuration.GetConnectionString("AppProgDb") ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawConnectionString))
        {
            throw new InvalidOperationException(
                "Missing connection string 'ConnectionStrings:AppProgDb'.");
        }

        var builder = new NpgsqlConnectionStringBuilder(rawConnectionString);

        // The password is intentionally absent from the connection string in appsettings
        // to avoid committing credentials to source control.
        // It is resolved from the first available source in order of preference.
        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            string? password =
                configuration["ConnectionStrings:AppProgDbPassword"] ?? // .NET User Secrets
                configuration["SUPABASE_DB_PASSWORD"] ??               // Supabase-hosted deployments
                configuration["DB_PASSWORD"];                           // generic environment variable

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

    // Opens the connection and executes the command as a query. The caller is responsible for closing the connection.
    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        return cmd.ExecuteReader();
    }

    // Opens the connection and executes a non-query command. Returns true unconditionally;
    // row count and error details are not surfaced at this level.
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
