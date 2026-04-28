using CoffeeAndKudos.Model.Entities;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

namespace CoffeeAndKudos.Model.Repositories;

// Repository handling all database operations for the users table
public class UserRepository : BaseRepository
{
    // Parameterless constructor used by Moq when creating test mocks.
    protected UserRepository() { }

    // Passes the app configuration up to the base class to initialize the connection string
    public UserRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Fetches a single user by their ID, returns null if not found
    public virtual User? GetUserById(Guid userId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            // Only select the row matching the given user ID
            cmd.CommandText = "select * from public.users where user_id = @user_id";
            cmd.Parameters.Add("@user_id", NpgsqlDbType.Uuid).Value = userId;

            var data = GetData(dbConn, cmd);

            // If a row was found, map it to a User object and return it
            if (data.Read())
            {
                return MapUser(data);
            }

            return null;
        }
        finally
        {
            // Always close the connection, even if an exception was thrown
            dbConn?.Close();
        }
    }

    // Returns all users from the database, newest first
    public virtual List<User> GetUsers()
    {
        NpgsqlConnection? dbConn = null;
        var users = new List<User>();

        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            // Order by created_at descending so the most recent users come first
            cmd.CommandText = "select * from public.users order by created_at desc";

            var data = GetData(dbConn, cmd);

            // Loop through every returned row and map it to a User object
            while (data.Read())
            {
                users.Add(MapUser(data));
            }

            return users;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Inserts a new user into the database, returns true if successful
    public virtual bool InsertUser(User user)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            cmd.CommandText = @"
insert into public.users
(user_id, username, email, created_at, count_lent, count_borrowed, favors_given, favors_taken)
values
(@user_id, @username, @email, @created_at, @count_lent, @count_borrowed, @favors_given, @favors_taken)";

            // Explicit Npgsql types are used to avoid type mismatch errors
            cmd.Parameters.AddWithValue("@user_id", NpgsqlDbType.Uuid, user.UserId);
            cmd.Parameters.AddWithValue("@username", NpgsqlDbType.Varchar, user.Username);
            cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, user.Email);
            cmd.Parameters.AddWithValue("@created_at", NpgsqlDbType.TimestampTz, user.CreatedAt);
            cmd.Parameters.AddWithValue("@count_lent", NpgsqlDbType.Integer, user.CountLent);
            cmd.Parameters.AddWithValue("@count_borrowed", NpgsqlDbType.Integer, user.CountBorrowed);
            cmd.Parameters.AddWithValue("@favors_given", NpgsqlDbType.Integer, user.FavorsGiven);
            cmd.Parameters.AddWithValue("@favors_taken", NpgsqlDbType.Integer, user.FavorsTaken);

            return InsertData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Updates all fields of an existing user matched by user_id, returns true if a row was affected
    public virtual bool UpdateUser(User user)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            cmd.CommandText = @"
update public.users set
username = @username,
email = @email,
count_lent = @count_lent,
count_borrowed = @count_borrowed,
favors_given = @favors_given,
favors_taken = @favors_taken
where user_id = @user_id";

            cmd.Parameters.AddWithValue("@username", NpgsqlDbType.Varchar, user.Username);
            cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, user.Email);
            cmd.Parameters.AddWithValue("@count_lent", NpgsqlDbType.Integer, user.CountLent);
            cmd.Parameters.AddWithValue("@count_borrowed", NpgsqlDbType.Integer, user.CountBorrowed);
            cmd.Parameters.AddWithValue("@favors_given", NpgsqlDbType.Integer, user.FavorsGiven);
            cmd.Parameters.AddWithValue("@favors_taken", NpgsqlDbType.Integer, user.FavorsTaken);

            // user_id is added last as it is only used in the WHERE clause, not the SET clause
            cmd.Parameters.AddWithValue("@user_id", NpgsqlDbType.Uuid, user.UserId);

            return UpdateData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Deletes a user by ID, returns true if a row was removed
    public virtual bool DeleteUser(Guid userId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();

            cmd.CommandText = "delete from public.users where user_id = @user_id";
            cmd.Parameters.AddWithValue("@user_id", NpgsqlDbType.Uuid, userId);

            return DeleteData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Maps a database row to a User entity — assumes the reader is already on a valid row
    private static User MapUser(NpgsqlDataReader data)
    {
        return new User((Guid)data["user_id"])
        {
            Username = data["username"].ToString() ?? string.Empty, // falls back to empty string if null
            Email = data["email"].ToString() ?? string.Empty,       // falls back to empty string if null
            CreatedAt = data["created_at"] == DBNull.Value          // falls back to current UTC time if null
                ? DateTime.UtcNow
                : (DateTime)data["created_at"],
            CountLent = data["count_lent"] == DBNull.Value          // falls back to 0 if null
                ? 0
                : (int)data["count_lent"],
            CountBorrowed = data["count_borrowed"] == DBNull.Value  // falls back to 0 if null
                ? 0
                : (int)data["count_borrowed"],
            FavorsGiven = data["favors_given"] == DBNull.Value      // falls back to 0 if null
                ? 0
                : (int)data["favors_given"],
            FavorsTaken = data["favors_taken"] == DBNull.Value      // falls back to 0 if null
                ? 0
                : (int)data["favors_taken"]
        };
    }
}