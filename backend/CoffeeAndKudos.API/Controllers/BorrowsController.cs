using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CoffeeAndKudos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BorrowsController : ControllerBase
{
    protected BorrowsRepository Repository { get; }

    public BorrowsController(BorrowsRepository repository)
    {
        Repository = repository;
    }

    // GET /api/Borrows/{id}
    [HttpGet("{id}")]
    public ActionResult<Borrow> GetBorrow([FromRoute] Guid id)
    {
        Borrow? borrow = Repository.GetBorrowById(id);
        if (borrow == null)
        {
            return NotFound();
        }
        return Ok(borrow);
    }

    // GET /api/Borrows
    [HttpGet]
    public ActionResult<IEnumerable<Borrow>> GetBorrows()
    {
        return Ok(Repository.GetBorrows());
    }

    // POST /api/Borrows
    [HttpPost]
    public ActionResult Post([FromBody] Borrow borrow)
    {
        if (borrow == null)
        {
            return BadRequest("Borrow info not correct");
        }

        bool status = Repository.InsertBorrow(borrow);
        if (status)
        {
            return Ok();
        }
        return BadRequest();
    }

    // PUT /api/Borrows
    [HttpPut]
    public ActionResult UpdateBorrow([FromBody] Borrow borrow)
    {
        if (borrow == null)
        {
            return BadRequest("Borrow info not correct");
        }

        Borrow? existingBorrow = Repository.GetBorrowById(borrow.BorrowId);
        if (existingBorrow == null)
        {
            return NotFound($"Borrow with id {borrow.BorrowId} not found");
        }

        bool status = Repository.UpdateBorrow(borrow);
        if (status)
        {
            return Ok();
        }
        return BadRequest("Something went wrong");
    }

    // DELETE /api/Borrows/{id}
    [HttpDelete("{id}")]
    public ActionResult DeleteBorrow([FromRoute] Guid id)
    {
        Borrow? existingBorrow = Repository.GetBorrowById(id);
        if (existingBorrow == null)
        {
            return NotFound($"Borrow with id {id} not found");
        }

        bool status = Repository.DeleteBorrow(id);
        if (status)
        {
            return NoContent(); // 204 — request succeeded, no body to return
        }
        return BadRequest($"Unable to delete borrow with id {id}");
    }
}
