using CoffeeAndKudos.Model.Entities;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

namespace CoffeeAndKudos.Model.Repositories;

// Repository handling all database operations for the favors table
public class FavorsRepository : BaseRepository
{
    // Parameterless constructor used by Moq when creating test mocks.
    protected FavorsRepository() { }

    // Passes the app configuration up to the base class to initialize the connection string
    public FavorsRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Fetches a single favor by its ID, returns null if not found
    public virtual Favor? GetFavorById(Guid favorId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            // Only select the row matching the given favor ID
            cmd.CommandText = "select * from public.favors where favor_id = @favor_id";
            cmd.Parameters.Add("@favor_id", NpgsqlDbType.Uuid).Value = favorId;

            var data = GetData(dbConn, cmd);

            // If a row was found, map it to a Favor object and return it
            if (data.Read())
            {
                return MapFavor(data);
            }

            return null;
        }
        finally
        {
            // Always close the connection, even if an exception was thrown
            dbConn?.Close();
        }
    }

    // Returns all favors from the database, newest first
    public virtual List<Favor> GetFavors()
    {
        NpgsqlConnection? dbConn = null;
        var favors = new List<Favor>();

        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            // Order by created_at descending so the most recent favors come first
            cmd.CommandText = "select * from public.favors order by created_at desc";

            var data = GetData(dbConn, cmd);

            // Loop through every returned row and map it to a Favor object
            while (data.Read())
            {
                favors.Add(MapFavor(data));
            }

            return favors;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Inserts a new favor into the database, returns true if successful
    public virtual bool InsertFavor(Favor favor)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            cmd.CommandText = @"
insert into public.favors
(favor_id, debtor_id, creditor_id, description, is_settled, created_at)
values
(@favor_id, @debtor_id, @creditor_id, @description, @is_settled, @created_at)";

            // Explicit Npgsql types are used to avoid type mismatch errors
            cmd.Parameters.AddWithValue("@favor_id", NpgsqlDbType.Uuid, favor.FavorId);
            cmd.Parameters.AddWithValue("@debtor_id", NpgsqlDbType.Uuid, favor.DebtorId);
            cmd.Parameters.AddWithValue("@creditor_id", NpgsqlDbType.Uuid, favor.CreditorId);
            cmd.Parameters.AddWithValue("@description", NpgsqlDbType.Text, favor.Description);
            cmd.Parameters.AddWithValue("@is_settled", NpgsqlDbType.Boolean, favor.IsSettled);
            cmd.Parameters.AddWithValue("@created_at", NpgsqlDbType.TimestampTz, favor.CreatedAt);

            return InsertData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Updates all fields of an existing favor matched by favor_id, returns true if a row was affected
    public virtual bool UpdateFavor(Favor favor)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            cmd.CommandText = @"
update public.favors set
debtor_id = @debtor_id,
creditor_id = @creditor_id,
description = @description,
is_settled = @is_settled,
created_at = @created_at
where favor_id = @favor_id";

            cmd.Parameters.AddWithValue("@debtor_id", NpgsqlDbType.Uuid, favor.DebtorId);
            cmd.Parameters.AddWithValue("@creditor_id", NpgsqlDbType.Uuid, favor.CreditorId);
            cmd.Parameters.AddWithValue("@description", NpgsqlDbType.Text, favor.Description);
            cmd.Parameters.AddWithValue("@is_settled", NpgsqlDbType.Boolean, favor.IsSettled);
            cmd.Parameters.AddWithValue("@created_at", NpgsqlDbType.TimestampTz, favor.CreatedAt);

            // favor_id is only used in the WHERE clause to target the correct row
            cmd.Parameters.AddWithValue("@favor_id", NpgsqlDbType.Uuid, favor.FavorId);

            return UpdateData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Deletes a favor by ID, returns true if a row was removed
    public virtual bool DeleteFavor(Guid favorId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            cmd.CommandText = "delete from public.favors where favor_id = @favor_id";
            cmd.Parameters.AddWithValue("@favor_id", NpgsqlDbType.Uuid, favorId);

            return DeleteData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Maps a database row to a Favor entity — assumes the reader is already on a valid row
    private static Favor MapFavor(NpgsqlDataReader data)
    {
        return new Favor((Guid)data["favor_id"])
        {
            DebtorId = (Guid)data["debtor_id"],
            CreditorId = (Guid)data["creditor_id"],
            Description = data["description"].ToString() ?? string.Empty, // falls back to empty string if null
            IsSettled = (bool)data["is_settled"],
            CreatedAt = (DateTime)data["created_at"]
        };
    }
}