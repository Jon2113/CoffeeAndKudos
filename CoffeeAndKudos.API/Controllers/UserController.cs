// We need these three lines to get access to:
// - Our User model (the data structure)
// - The UserRepository (the class that talks to the database)
// - MVC tools like Ok(), NotFound(), BadRequest() etc.
using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CoffeeAndKudos.API.Controllers;

// Marks this class as an API Controller - this unlocks features like
// automatic error handling when someone sends bad data
[ApiController]
// Sets the URL for this controller to: /api/User
// [controller] is a placeholder that automatically becomes "User" (taken from "UserController")
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    // This holds our "database helper" - we store it here so every method in this class can use it
    protected UserRepository Repository { get; }

    // This runs once when the app starts up.
    // ASP.NET automatically hands us a ready-made UserRepository - we just store it for later use
    public UserController(UserRepository repository)
    {
        Repository = repository;
    }

    // Handles GET requests to: /api/User/some-id-here
    // Used when you want to fetch ONE specific user
    [HttpGet("{id}")]
    public ActionResult<User> GetUser([FromRoute] Guid id)
    {
        // Go to the database and try to find a user with this ID
        // The "?" after User means the result could be null (if nothing was found)
        User? user = Repository.GetUserById(id);
        
        // If the database found nothing, tell the client "that user doesn't exist" (HTTP 404)
        if (user == null)
        {
            return NotFound();
        }

        // User was found - send it back to the client with a success response (HTTP 200)
        return Ok(user);
    }

    // Handles GET requests to: /api/User
    // Used when you want to fetch ALL users at once
    [HttpGet]
    public ActionResult<IEnumerable<User>> GetUsers()
    {
        // Grab every user from the database and send them all back (HTTP 200)
        // Even if the list is empty, that's still a valid response - no null check needed
        return Ok(Repository.GetUsers());
    }

    // Handles POST requests to: /api/User
    // Used when you want to CREATE a new user
    // The new user data is sent inside the request body as JSON
    [HttpPost]
    public ActionResult Post([FromBody] User user)
    {
        // If the client sent us nothing (empty body), reject the request immediately (HTTP 400)
        if (user == null)
        {
            return BadRequest("User info not correct");
        }

        // Try to save the new user to the database
        // "status" will be true if it worked, false if something went wrong
        bool status = Repository.InsertUser(user);
        if (status)
        {
            return Ok(); // Saved successfully (HTTP 200)
        }

        return BadRequest(); // Something failed during the save (HTTP 400)
    }

    // Handles PUT requests to: /api/User
    // Used when you want to UPDATE an existing user's information
    // The updated data is sent inside the request body as JSON
    [HttpPut]
    public ActionResult UpdateUser([FromBody] User user)
    {
        // If the client sent us nothing (empty body), reject the request immediately (HTTP 400)
        if (user == null)
        {
            return BadRequest("User info not correct");
        }

        // Before updating, double-check the user actually exists in the database
        // There's no point updating someone who isn't there
        User? existingUser = Repository.GetUserById(user.UserId);
        if (existingUser == null)
        {
            return NotFound($"User with id {user.UserId} not found");
        }

        // User exists - go ahead and overwrite their data with the new information
        bool status = Repository.UpdateUser(user);
        if (status)
        {
            return Ok(); // Updated successfully (HTTP 200)
        }

        return BadRequest("Something went wrong"); // Update failed for some reason (HTTP 400)
    }

    // Handles DELETE requests to: /api/User/some-id-here
    // Used when you want to permanently REMOVE a user
    [HttpDelete("{id}")]
    public ActionResult DeleteUser([FromRoute] Guid id)
    {
        // Before deleting, check the user actually exists
        // If they're already gone, we should tell the client rather than silently doing nothing
        User? existingUser = Repository.GetUserById(id);
        if (existingUser == null)
        {
            return NotFound($"User with id {id} not found");
        }

        // User exists - go ahead and delete them
        bool status = Repository.DeleteUser(id);
        if (status)
        {
            // Deleted successfully - HTTP 204 means "it worked, but there's nothing to send back"
            // This is the standard way to respond to a successful delete
            return NoContent();
        }

        return BadRequest($"Unable to delete user with id {id}"); // Delete failed (HTTP 400)
    }
}