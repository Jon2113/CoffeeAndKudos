namespace CoffeeAndKudos.Model.Repositories;
using Npgsql;
using Microsoft.Extensions.Configuration;
using System;

// Every repository inherits from this. It handles the DB connection setup
// so we don't repeat that logic everywhere.
public class BaseRepository
{
    protected string ConnectionString { get; } = string.Empty;

    public BaseRepository(IConfiguration configuration)
    {
        // Grab the connection string from appsettings / user secrets / env vars
        string rawConnectionString = configuration.GetConnectionString("AppProgDb") ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawConnectionString))
        {
            throw new InvalidOperationException(
                "Missing connection string 'ConnectionStrings:AppProgDb'.");
        }

        // Parse it so we can inspect (and potentially inject) individual fields
        var builder = new NpgsqlConnectionStringBuilder(rawConnectionString);

        // The password probably isn't in the connection string itself — that would
        // mean committing it to source control, which we obviously don't want.
        // So if it's missing, we try a few fallback locations in order of preference.
        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            string? password =
                configuration["ConnectionStrings:AppProgDbPassword"] ?? // user secrets
                configuration["SUPABASE_DB_PASSWORD"] ??               // Supabase hosted env
                configuration["DB_PASSWORD"];                           // generic fallback

            if (!string.IsNullOrWhiteSpace(password))
            {
                builder.Password = password;
            }
        }

        // If we still don't have a password after all that, something is misconfigured —
        // better to blow up here with a clear message than get a cryptic Postgres error later.
        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            throw new InvalidOperationException(
                "Database password missing. Configure 'ConnectionStrings:AppProgDbPassword' via User Secrets or environment variable.");
        }

        // Rebuild the final connection string with the password baked in
        ConnectionString = builder.ConnectionString;
    }

    // Opens the connection and returns a reader — caller is responsible for disposing both
    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        return cmd.ExecuteReader();
    }

    // These three are basically the same pattern: open, execute, done.
    // They always return true — the idea is just to give callers a consistent
    // bool they can check if they want, even though right now we don't surface failures here.
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