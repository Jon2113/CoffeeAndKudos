// We need these three lines to get access to:
// - Our Favor model (the data structure)
// - The FavorsRepository (the class that talks to the database)
// - MVC tools like Ok(), NotFound(), BadRequest() etc.
using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CoffeeAndKudos.API.Controllers;

// Marks this class as an API Controller - this unlocks features like
// automatic error handling when someone sends bad data
[ApiController]
// Sets the URL for this controller to: /api/Favors
// [controller] is a placeholder that automatically becomes "Favors" (taken from "FavorsController")
[Route("api/[controller]")]
public class FavorsController : ControllerBase
{
    // This holds our "database helper" - we store it here so every method in this class can use it
    protected FavorsRepository Repository { get; }

    // This runs once when the app starts up.
    // ASP.NET automatically hands us a ready-made FavorsRepository - we just store it for later use
    public FavorsController(FavorsRepository repository)
    {
        Repository = repository;
    }

    // Handles GET requests to: /api/Favors/some-id-here
    // Used when you want to fetch ONE specific favor record
    [HttpGet("{id}")]
    public ActionResult<Favor> GetFavor([FromRoute] Guid id)
    {
        // Go to the database and try to find a favor record with this ID
        // The "?" after Favor means the result could be null (if nothing was found)
        Favor? favor = Repository.GetFavorById(id);
        
        // If the database found nothing, tell the client "that record doesn't exist" (HTTP 404)
        if (favor == null)
        {
            return NotFound();
        }

        // Record was found - send it back to the client with a success response (HTTP 200)
        return Ok(favor);
    }

    // Handles GET requests to: /api/Favors
    // Used when you want to fetch ALL favor records at once
    [HttpGet]
    public ActionResult<IEnumerable<Favor>> GetFavors()
    {
        // Grab every favor record from the database and send them all back (HTTP 200)
        // Even if the list is empty, that's still a valid response - no null check needed
        return Ok(Repository.GetFavors());
    }

    // Handles POST requests to: /api/Favors
    // Used when you want to CREATE a new favor record
    // The new favor data is sent inside the request body as JSON
    [HttpPost]
    public ActionResult Post([FromBody] Favor favor)
    {
        // If the client sent us nothing (empty body), reject the request immediately (HTTP 400)
        if (favor == null)
        {
            return BadRequest("Favor info not correct");
        }

        // Try to save the new record to the database
        // "status" will be true if it worked, false if something went wrong
        bool status = Repository.InsertFavor(favor);
        if (status)
        {
            return Ok(); // Saved successfully (HTTP 200)
        }

        return BadRequest(); // Something failed during the save (HTTP 400)
    }

    // Handles PUT requests to: /api/Favors
    // Used when you want to UPDATE an existing favor record
    // The updated data is sent inside the request body as JSON
    [HttpPut]
    public ActionResult UpdateFavor([FromBody] Favor favor)
    {
        // If the client sent us nothing (empty body), reject the request immediately (HTTP 400)
        if (favor == null)
        {
            return BadRequest("Favor info not correct");
        }

        // Before updating, double-check the record actually exists in the database
        // There's no point updating something that isn't there
        Favor? existingFavor = Repository.GetFavorById(favor.FavorId);
        if (existingFavor == null)
        {
            return NotFound($"Favor with id {favor.FavorId} not found");
        }

        // Record exists - go ahead and overwrite it with the new data
        bool status = Repository.UpdateFavor(favor);
        if (status)
        {
            return Ok(); // Updated successfully (HTTP 200)
        }

        return BadRequest("Something went wrong"); // Update failed for some reason (HTTP 400)
    }

    // Handles DELETE requests to: /api/Favors/some-id-here
    // Used when you want to permanently REMOVE a favor record
    [HttpDelete("{id}")]
    public ActionResult DeleteFavor([FromRoute] Guid id)
    {
        // Before deleting, check the record actually exists
        // If it's already gone, we should tell the client rather than silently doing nothing
        Favor? existingFavor = Repository.GetFavorById(id);
        if (existingFavor == null)
        {
            return NotFound($"Favor with id {id} not found");
        }

        // Record exists - go ahead and delete it
        bool status = Repository.DeleteFavor(id);
        if (status)
        {
            // Deleted successfully - HTTP 204 means "it worked, but there's nothing to send back"
            // This is the standard way to respond to a successful delete
            return NoContent();
        }

        return BadRequest($"Unable to delete favor with id {id}"); // Delete failed (HTTP 400)
    }
}