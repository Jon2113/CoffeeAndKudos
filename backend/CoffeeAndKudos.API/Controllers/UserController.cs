using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CoffeeAndKudos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    protected UserRepository Repository { get; }

    public UserController(UserRepository repository)
    {
        Repository = repository;
    }

    // GET /api/User/{id}
    [HttpGet("{id}")]
    public ActionResult<User> GetUser([FromRoute] Guid id)
    {
        User? user = Repository.GetUserById(id);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(user);
    }

    // GET /api/User
    [HttpGet]
    public ActionResult<IEnumerable<User>> GetUsers()
    {
        return Ok(Repository.GetUsers());
    }

    // POST /api/User
    [HttpPost]
    public ActionResult Post([FromBody] User user)
    {
        if (user == null)
        {
            return BadRequest("User info not correct");
        }

        bool status = Repository.InsertUser(user);
        if (status)
        {
            return Ok();
        }
        return BadRequest();
    }

    // PUT /api/User
    [HttpPut]
    public ActionResult UpdateUser([FromBody] User user)
    {
        if (user == null)
        {
            return BadRequest("User info not correct");
        }

        User? existingUser = Repository.GetUserById(user.UserId);
        if (existingUser == null)
        {
            return NotFound($"User with id {user.UserId} not found");
        }

        bool status = Repository.UpdateUser(user);
        if (status)
        {
            return Ok();
        }
        return BadRequest("Something went wrong");
    }

    // DELETE /api/User/{id}
    [HttpDelete("{id}")]
    public ActionResult DeleteUser([FromRoute] Guid id)
    {
        User? existingUser = Repository.GetUserById(id);
        if (existingUser == null)
        {
            return NotFound($"User with id {id} not found");
        }

        bool status = Repository.DeleteUser(id);
        if (status)
        {
            return NoContent(); // 204 — request succeeded, no body to return
        }
        return BadRequest($"Unable to delete user with id {id}");
    }
}
