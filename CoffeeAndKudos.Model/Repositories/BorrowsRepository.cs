using CoffeeAndKudos.Model.Entities;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

namespace CoffeeAndKudos.Model.Repositories;

// Handles all DB operations for the borrows table.
// Follows the same pattern as the other repositories — build the command, pass it to the base, done.
public class BorrowsRepository : BaseRepository
{
    public BorrowsRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Fetch a single borrow by its ID — returns null if nothing matches
    public Borrow? GetBorrowById(Guid borrowId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "select * from public.borrows where borrow_id = @borrow_id";
            cmd.Parameters.Add("@borrow_id", NpgsqlDbType.Uuid).Value = borrowId;

            var data = GetData(dbConn, cmd);
            // Only expecting one row max, so a single Read() is enough
            if (data.Read())
            {
                return MapBorrow(data);
            }

            return null;
        }
        finally
        {
            // Always close — whether we got data, hit an exception, whatever
            dbConn?.Close();
        }
    }

    // Pull all borrows, newest first
    public List<Borrow> GetBorrows()
    {
        NpgsqlConnection? dbConn = null;
        var borrows = new List<Borrow>();

        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "select * from public.borrows order by created_at desc";

            var data = GetData(dbConn, cmd);
            while (data.Read())
            {
                borrows.Add(MapBorrow(data));
            }

            return borrows;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    public bool InsertBorrow(Borrow borrow)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = @"
insert into public.borrows
(borrow_id, lender_id, borrower_id, item_name, due_date, returned_at, created_at)
values
(@borrow_id, @lender_id, @borrower_id, @item_name, @due_date, @returned_at, @created_at)";

            cmd.Parameters.AddWithValue("@borrow_id", NpgsqlDbType.Uuid, borrow.BorrowId);
            cmd.Parameters.AddWithValue("@lender_id", NpgsqlDbType.Uuid, borrow.LenderId);
            cmd.Parameters.AddWithValue("@borrower_id", NpgsqlDbType.Uuid, borrow.BorrowerId);
            cmd.Parameters.AddWithValue("@item_name", NpgsqlDbType.Varchar, borrow.ItemName);
            // due_date and returned_at are nullable — Npgsql needs DBNull.Value explicitly, not just null
            cmd.Parameters.Add("@due_date", NpgsqlDbType.Date).Value =
                borrow.DueDate.HasValue ? borrow.DueDate.Value : DBNull.Value;
            cmd.Parameters.Add("@returned_at", NpgsqlDbType.TimestampTz).Value =
                borrow.ReturnedAt.HasValue ? borrow.ReturnedAt.Value : DBNull.Value;
            cmd.Parameters.AddWithValue("@created_at", NpgsqlDbType.TimestampTz, borrow.CreatedAt);

            return InsertData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    public bool UpdateBorrow(Borrow borrow)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            // Update everything except the ID — that's our key for finding the row
            cmd.CommandText = @"
update public.borrows set
lender_id = @lender_id,
borrower_id = @borrower_id,
item_name = @item_name,
due_date = @due_date,
returned_at = @returned_at,
created_at = @created_at
where borrow_id = @borrow_id";

            cmd.Parameters.AddWithValue("@lender_id", NpgsqlDbType.Uuid, borrow.LenderId);
            cmd.Parameters.AddWithValue("@borrower_id", NpgsqlDbType.Uuid, borrow.BorrowerId);
            cmd.Parameters.AddWithValue("@item_name", NpgsqlDbType.Varchar, borrow.ItemName);
            // Same nullable handling as in Insert
            cmd.Parameters.Add("@due_date", NpgsqlDbType.Date).Value =
                borrow.DueDate.HasValue ? borrow.DueDate.Value : DBNull.Value;
            cmd.Parameters.Add("@returned_at", NpgsqlDbType.TimestampTz).Value =
                borrow.ReturnedAt.HasValue ? borrow.ReturnedAt.Value : DBNull.Value;
            cmd.Parameters.AddWithValue("@created_at", NpgsqlDbType.TimestampTz, borrow.CreatedAt);
            cmd.Parameters.AddWithValue("@borrow_id", NpgsqlDbType.Uuid, borrow.BorrowId);

            return UpdateData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Takes just the ID — no need to fetch the full object just to delete it
    public bool DeleteBorrow(Guid borrowId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "delete from public.borrows where borrow_id = @borrow_id";
            cmd.Parameters.AddWithValue("@borrow_id", NpgsqlDbType.Uuid, borrowId);

            return DeleteData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Converts a raw DB row into a Borrow object.
    // The nullable columns need an explicit DBNull check — casting DBNull directly would throw.
    private static Borrow MapBorrow(NpgsqlDataReader data)
    {
        return new Borrow((Guid)data["borrow_id"])
        {
            LenderId = (Guid)data["lender_id"],
            BorrowerId = (Guid)data["borrower_id"],
            ItemName = data["item_name"].ToString() ?? string.Empty,
            DueDate = data["due_date"] == DBNull.Value ? null : (DateOnly)data["due_date"],
            ReturnedAt = data["returned_at"] == DBNull.Value ? null : (DateTime?)data["returned_at"],
            CreatedAt = (DateTime)data["created_at"]
        };
    }
}