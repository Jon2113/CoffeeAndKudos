using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CoffeeAndKudos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavorsController : ControllerBase
{
    protected FavorsRepository Repository { get; }

    public FavorsController(FavorsRepository repository)
    {
        Repository = repository;
    }

    // GET /api/Favors/{id}
    [HttpGet("{id}")]
    public ActionResult<Favor> GetFavor([FromRoute] Guid id)
    {
        Favor? favor = Repository.GetFavorById(id);
        if (favor == null)
        {
            return NotFound();
        }
        return Ok(favor);
    }

    // GET /api/Favors
    [HttpGet]
    public ActionResult<IEnumerable<Favor>> GetFavors()
    {
        return Ok(Repository.GetFavors());
    }

    // POST /api/Favors
    [HttpPost]
    public ActionResult Post([FromBody] Favor favor)
    {
        if (favor == null)
        {
            return BadRequest("Favor info not correct");
        }

        bool status = Repository.InsertFavor(favor);
        if (status)
        {
            return Ok();
        }
        return BadRequest();
    }

    // PUT /api/Favors
    [HttpPut]
    public ActionResult UpdateFavor([FromBody] Favor favor)
    {
        if (favor == null)
        {
            return BadRequest("Favor info not correct");
        }

        Favor? existingFavor = Repository.GetFavorById(favor.FavorId);
        if (existingFavor == null)
        {
            return NotFound($"Favor with id {favor.FavorId} not found");
        }

        bool status = Repository.UpdateFavor(favor);
        if (status)
        {
            return Ok();
        }
        return BadRequest("Something went wrong");
    }

    // DELETE /api/Favors/{id}
    [HttpDelete("{id}")]
    public ActionResult DeleteFavor([FromRoute] Guid id)
    {
        Favor? existingFavor = Repository.GetFavorById(id);
        if (existingFavor == null)
        {
            return NotFound($"Favor with id {id} not found");
        }

        bool status = Repository.DeleteFavor(id);
        if (status)
        {
            return NoContent(); // 204 — request succeeded, no body to return
        }
        return BadRequest($"Unable to delete favor with id {id}");
    }
}
