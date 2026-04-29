using CoffeeAndKudos.Model.Entities;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

namespace CoffeeAndKudos.Model.Repositories;

// Handles all database operations for the favors table.
public class FavorsRepository : BaseRepository
{
    // Parameterless constructor for Moq — allows the repository to be mocked in tests.
    protected FavorsRepository() { }

    public FavorsRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Returns the favor record with the given ID, or null if no matching row exists.
    public virtual Favor? GetFavorById(Guid favorId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "select * from public.favors where favor_id = @favor_id";
            cmd.Parameters.Add("@favor_id", NpgsqlDbType.Uuid).Value = favorId;

            var data = GetData(dbConn, cmd);
            if (data.Read())
            {
                return MapFavor(data);
            }
            return null;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Returns all favor records ordered by creation date, newest first.
    public virtual List<Favor> GetFavors()
    {
        NpgsqlConnection? dbConn = null;
        var favors = new List<Favor>();

        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "select * from public.favors order by created_at desc";

            var data = GetData(dbConn, cmd);
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

    // Inserts a new favor record and returns true on success.
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

            // Explicit NpgsqlDbType values prevent implicit type conversion errors.
            cmd.Parameters.AddWithValue("@favor_id",    NpgsqlDbType.Uuid,        favor.FavorId);
            cmd.Parameters.AddWithValue("@debtor_id",   NpgsqlDbType.Uuid,        favor.DebtorId);
            cmd.Parameters.AddWithValue("@creditor_id", NpgsqlDbType.Uuid,        favor.CreditorId);
            cmd.Parameters.AddWithValue("@description", NpgsqlDbType.Text,        favor.Description);
            cmd.Parameters.AddWithValue("@is_settled",  NpgsqlDbType.Boolean,     favor.IsSettled);
            cmd.Parameters.AddWithValue("@created_at",  NpgsqlDbType.TimestampTz, favor.CreatedAt);

            return InsertData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Updates all mutable fields of an existing favor record and returns true on success.
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

            cmd.Parameters.AddWithValue("@debtor_id",   NpgsqlDbType.Uuid,        favor.DebtorId);
            cmd.Parameters.AddWithValue("@creditor_id", NpgsqlDbType.Uuid,        favor.CreditorId);
            cmd.Parameters.AddWithValue("@description", NpgsqlDbType.Text,        favor.Description);
            cmd.Parameters.AddWithValue("@is_settled",  NpgsqlDbType.Boolean,     favor.IsSettled);
            cmd.Parameters.AddWithValue("@created_at",  NpgsqlDbType.TimestampTz, favor.CreatedAt);
            cmd.Parameters.AddWithValue("@favor_id",    NpgsqlDbType.Uuid,        favor.FavorId);

            return UpdateData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Deletes the favor record with the given ID and returns true on success.
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

    // Maps a single data reader row to a Favor entity.
    private static Favor MapFavor(NpgsqlDataReader data)
    {
        return new Favor((Guid)data["favor_id"])
        {
            DebtorId    = (Guid)data["debtor_id"],
            CreditorId  = (Guid)data["creditor_id"],
            Description = data["description"].ToString() ?? string.Empty,
            IsSettled   = (bool)data["is_settled"],
            CreatedAt   = (DateTime)data["created_at"]
        };
    }
}
