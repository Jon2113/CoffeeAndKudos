// We need these three lines to get access to:
// - Our Borrow model (the data structure)
// - The BorrowsRepository (the class that talks to the database)
// - MVC tools like Ok(), NotFound(), BadRequest() etc.
using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CoffeeAndKudos.API.Controllers;

// Marks this class as an API Controller - this unlocks features like
// automatic error handling when someone sends bad data
[ApiController]
// Sets the URL for this controller to: /api/Borrows
// [controller] is a placeholder that automatically becomes "Borrows" (taken from "BorrowsController")
[Route("api/[controller]")]
public class BorrowsController : ControllerBase
{
    // This holds our "database helper" - we store it here so every method in this class can use it
    protected BorrowsRepository Repository { get; }

    // This runs once when the app starts up.
    // ASP.NET automatically hands us a ready-made BorrowsRepository - we just store it for later use
    public BorrowsController(BorrowsRepository repository)
    {
        Repository = repository;
    }

    // Handles GET requests to: /api/Borrows/some-id-here
    // Used when you want to fetch ONE specific borrow record
    [HttpGet("{id}")]
    public ActionResult<Borrow> GetBorrow([FromRoute] Guid id)
    {
        // Go to the database and try to find a borrow record with this ID
        // The "?" after Borrow means the result could be null (if nothing was found)
        Borrow? borrow = Repository.GetBorrowById(id);
        
        // If the database found nothing, tell the client "that record doesn't exist" (HTTP 404)
        if (borrow == null)
        {
            return NotFound();
        }

        // Record was found - send it back to the client with a success response (HTTP 200)
        return Ok(borrow);
    }

    // Handles GET requests to: /api/Borrows
    // Used when you want to fetch ALL borrow records at once
    [HttpGet]
    public ActionResult<IEnumerable<Borrow>> GetBorrows()
    {
        // Grab every borrow record from the database and send them all back (HTTP 200)
        // Even if the list is empty, that's still a valid response - no null check needed
        return Ok(Repository.GetBorrows());
    }

    // Handles POST requests to: /api/Borrows
    // Used when you want to CREATE a new borrow record
    // The new borrow data is sent inside the request body as JSON
    [HttpPost]
    public ActionResult Post([FromBody] Borrow borrow)
    {
        // If the client sent us nothing (empty body), reject the request immediately (HTTP 400)
        if (borrow == null)
        {
            return BadRequest("Borrow info not correct");
        }

        // Try to save the new record to the database
        // "status" will be true if it worked, false if something went wrong
        bool status = Repository.InsertBorrow(borrow);
        if (status)
        {
            return Ok(); // Saved successfully (HTTP 200)
        }

        return BadRequest(); // Something failed during the save (HTTP 400)
    }

    // Handles PUT requests to: /api/Borrows
    // Used when you want to UPDATE an existing borrow record
    // The updated data is sent inside the request body as JSON
    [HttpPut]
    public ActionResult UpdateBorrow([FromBody] Borrow borrow)
    {
        // If the client sent us nothing (empty body), reject the request immediately (HTTP 400)
        if (borrow == null)
        {
            return BadRequest("Borrow info not correct");
        }

        // Before updating, double-check the record actually exists in the database
        // There's no point updating something that isn't there
        Borrow? existingBorrow = Repository.GetBorrowById(borrow.BorrowId);
        if (existingBorrow == null)
        {
            return NotFound($"Borrow with id {borrow.BorrowId} not found");
        }

        // Record exists - go ahead and overwrite it with the new data
        bool status = Repository.UpdateBorrow(borrow);
        if (status)
        {
            return Ok(); // Updated successfully (HTTP 200)
        }

        return BadRequest("Something went wrong"); // Update failed for some reason (HTTP 400)
    }

    // Handles DELETE requests to: /api/Borrows/some-id-here
    // Used when you want to permanently REMOVE a borrow record
    [HttpDelete("{id}")]
    public ActionResult DeleteBorrow([FromRoute] Guid id)
    {
        // Before deleting, check the record actually exists
        // If it's already gone, we should tell the client rather than silently doing nothing
        Borrow? existingBorrow = Repository.GetBorrowById(id);
        if (existingBorrow == null)
        {
            return NotFound($"Borrow with id {id} not found");
        }

        // Record exists - go ahead and delete it
        bool status = Repository.DeleteBorrow(id);
        if (status)
        {
            // Deleted successfully - HTTP 204 means "it worked, but there's nothing to send back"
            // This is the standard way to respond to a successful delete
            return NoContent();
        }

        return BadRequest($"Unable to delete borrow with id {id}"); // Delete failed (HTTP 400)
    }
}