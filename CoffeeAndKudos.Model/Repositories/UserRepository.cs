using CoffeeAndKudos.Model.Entities;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

namespace CoffeeAndKudos.Model.Repositories;

public class UserRepository : BaseRepository
{
    public UserRepository(IConfiguration configuration) : base(configuration)
    {
    }

    public User? GetUserById(Guid userId)
    {
        NpgsqlConnection? dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "select * from public.users where user_id = @user_id";
            cmd.Parameters.Add("@user_id", NpgsqlDbType.Uuid).Value = userId;

            var data = GetData(dbConn, cmd);
            if (data.Read())
            {
                return MapUser(data);
            }

            return null;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    public List<User> GetUsers()
    {
        NpgsqlConnection? dbConn = null;
        var users = new List<User>();

        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "select * from public.users order by created_at desc";

            var data = GetData(dbConn, cmd);
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

    public bool InsertUser(User user)
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

    public bool UpdateUser(User user)
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
            cmd.Parameters.AddWithValue("@user_id", NpgsqlDbType.Uuid, user.UserId);

            return UpdateData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    public bool DeleteUser(Guid userId)
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

    private static User MapUser(NpgsqlDataReader data)
    {
        return new User((Guid)data["user_id"])
        {
            Username = data["username"].ToString() ?? string.Empty,
            Email = data["email"].ToString() ?? string.Empty,
            CreatedAt = (DateTime)data["created_at"],
            CountLent = (int)data["count_lent"],
            CountBorrowed = (int)data["count_borrowed"],
            FavorsGiven = (int)data["favors_given"],
            FavorsTaken = (int)data["favors_taken"]
        };
    }
}
