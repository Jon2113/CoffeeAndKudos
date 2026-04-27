// These 'using' statements import necessary namespaces to access models, database logic, and Web API tools
using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CoffeeAndKudos.API.Controllers;

// This attribute tells ASP.NET that this class serves as an API endpoint and enables automatic validation
[ApiController]
// This defines the URL path. [controller] automatically maps to "Borrows" (from BorrowsController)
[Route("api/[controller]")]
public class BorrowsController : ControllerBase
{
    // A property to hold the repository, which contains the logic to talk to the database
    protected BorrowsRepository Repository { get; }

    // Constructor: When the API starts, it "injects" the repository so the controller can use it
    public BorrowsController(BorrowsRepository repository)
    {
        Repository = repository;
    }

    // GET: api/Borrows/{id} - Used to retrieve a single record by its unique ID
    [HttpGet("{id}")]
    public ActionResult<Borrow> GetBorrow([FromRoute] Guid id)
    {
        // Asks the repository to find the record in the database
        Borrow? borrow = Repository.GetBorrowById(id);
        
        // If no record is found, return a 404 Not Found response
        if (borrow == null)
        {
            return NotFound();
        }

        // Return the record with a 200 OK status
        return Ok(borrow);
    }

    // GET: api/Borrows - Used to retrieve all borrow records
    [HttpGet]
    public ActionResult<IEnumerable<Borrow>> GetBorrows()
    {
        // Returns the full list from the repository with a 200 OK status
        return Ok(Repository.GetBorrows());
    }

    // POST: api/Borrows - Used to create a new borrow record
    [HttpPost]
    public ActionResult Post([FromBody] Borrow borrow)
    {
        // Safety check: if the data sent in the request body is empty, return 400 Bad Request
        if (borrow == null)
        {
            return BadRequest("Borrow info not correct");
        }

        // Tries to insert the new record into the database
        bool status = Repository.InsertBorrow(borrow);
        if (status)
        {
            return Ok(); // Success
        }

        return BadRequest(); // Something went wrong during save
    }

    // PUT: api/Borrows - Used to update an existing record
    [HttpPut]
    public ActionResult UpdateBorrow([FromBody] Borrow borrow)
    {
        if (borrow == null)
        {
            return BadRequest("Borrow info not correct");
        }

        // First, check if the record actually exists before trying to update it
        Borrow? existingBorrow = Repository.GetBorrowById(borrow.BorrowId);
        if (existingBorrow == null)
        {
            return NotFound($"Borrow with id {borrow.BorrowId} not found");
        }

        // Update the database with the new data
        bool status = Repository.UpdateBorrow(borrow);
        if (status)
        {
            return Ok();
        }

        return BadRequest("Something went wrong");
    }

    // DELETE: api/Borrows/{id} - Used to remove a record from the database
    [HttpDelete("{id}")]
    public ActionResult DeleteBorrow([FromRoute] Guid id)
    {
        // Check if the record exists so we don't try to delete nothing
        Borrow? existingBorrow = Repository.GetBorrowById(id);
        if (existingBorrow == null)
        {
            return NotFound($"Borrow with id {id} not found");
        }

        // Execute the deletion
        bool status = Repository.DeleteBorrow(id);
        if (status)
        {
            // 204 No Content is the standard response for a successful deletion
            return NoContent();
        }

        return BadRequest($"Unable to delete borrow with id {id}");
    }
}