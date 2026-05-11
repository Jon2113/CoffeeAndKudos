using CoffeeAndKudos.API.Controllers;
using CoffeeAndKudos.Model.Entities;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace CoffeeAndKudos.Tests;

// ─────────────────────────────────────────────────────────────────────────────
// UserController tests
// ─────────────────────────────────────────────────────────────────────────────

public class UserControllerTests
{
    private readonly Mock<UserRepository> _mockRepo;
    private readonly UserController _controller;

    public UserControllerTests()
    {
        _mockRepo = new Mock<UserRepository>();
        _controller = new UserController(_mockRepo.Object);
    }

    // ── GetUser ───────────────────────────────────────────────────────────────

    [Fact]
    public void GetUser_ReturnsOk_WhenUserExists()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User(userId) { Username = "Alice", Email = "alice@example.com" };
        _mockRepo.Setup(r => r.GetUserById(userId)).Returns(user);

        // Act
        var result = _controller.GetUser(userId);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(user, ok.Value);
    }

    [Fact]
    public void GetUser_ReturnsNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetUserById(userId)).Returns((User?)null);

        // Act
        var result = _controller.GetUser(userId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── GetUsers ──────────────────────────────────────────────────────────────

    [Fact]
    public void GetUsers_ReturnsOk_WithAllUsers()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Username = "Alice", Email = "alice@example.com" },
            new User { Username = "Bob",   Email = "bob@example.com"   },
        };
        _mockRepo.Setup(r => r.GetUsers()).Returns(users);

        // Act
        var result = _controller.GetUsers();

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(users, ok.Value);
    }

    // ── Post ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Post_ReturnsOk_WhenInsertSucceeds()
    {
        // Arrange
        var user = new User { Username = "Alice", Email = "alice@example.com" };
        _mockRepo.Setup(r => r.InsertUser(user)).Returns(true);

        // Act
        var result = _controller.Post(user);

        // Assert
        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public void Post_ReturnsBadRequest_WhenInsertFails()
    {
        // Arrange
        var user = new User { Username = "Alice", Email = "alice@example.com" };
        _mockRepo.Setup(r => r.InsertUser(user)).Returns(false);

        // Act
        var result = _controller.Post(user);

        // Assert
        Assert.IsType<BadRequestResult>(result);
    }

    // ── UpdateUser ────────────────────────────────────────────────────────────

    [Fact]
    public void UpdateUser_ReturnsNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var user = new User { Username = "Alice", Email = "alice@example.com" };
        _mockRepo.Setup(r => r.GetUserById(user.UserId)).Returns((User?)null);

        // Act
        var result = _controller.UpdateUser(user);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void UpdateUser_ReturnsOk_WhenUpdateSucceeds()
    {
        // Arrange
        var user = new User { Username = "Alice", Email = "alice@example.com" };
        _mockRepo.Setup(r => r.GetUserById(user.UserId)).Returns(user);
        _mockRepo.Setup(r => r.UpdateUser(user)).Returns(true);

        // Act
        var result = _controller.UpdateUser(user);

        // Assert
        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public void UpdateUser_ReturnsBadRequest_WhenUpdateFails()
    {
        // Arrange
        var user = new User { Username = "Alice", Email = "alice@example.com" };
        _mockRepo.Setup(r => r.GetUserById(user.UserId)).Returns(user);
        _mockRepo.Setup(r => r.UpdateUser(user)).Returns(false);

        // Act
        var result = _controller.UpdateUser(user);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── DeleteUser ────────────────────────────────────────────────────────────

    [Fact]
    public void DeleteUser_ReturnsNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetUserById(userId)).Returns((User?)null);

        // Act
        var result = _controller.DeleteUser(userId);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void DeleteUser_ReturnsNoContent_WhenDeleteSucceeds()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User(userId) { Username = "Alice" };
        _mockRepo.Setup(r => r.GetUserById(userId)).Returns(user);
        _mockRepo.Setup(r => r.DeleteUser(userId)).Returns(true);

        // Act
        var result = _controller.DeleteUser(userId);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public void DeleteUser_ReturnsBadRequest_WhenDeleteFails()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User(userId) { Username = "Alice" };
        _mockRepo.Setup(r => r.GetUserById(userId)).Returns(user);
        _mockRepo.Setup(r => r.DeleteUser(userId)).Returns(false);

        // Act
        var result = _controller.DeleteUser(userId);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BorrowsController tests
// ─────────────────────────────────────────────────────────────────────────────

public class BorrowsControllerTests
{
    private readonly Mock<BorrowsRepository> _mockRepo;
    private readonly BorrowsController _controller;

    public BorrowsControllerTests()
    {
        _mockRepo = new Mock<BorrowsRepository>();
        _controller = new BorrowsController(_mockRepo.Object);
    }

    // ── GetBorrow ─────────────────────────────────────────────────────────────

    [Fact]
    public void GetBorrow_ReturnsOk_WhenBorrowExists()
    {
        // Arrange
        var borrowId = Guid.NewGuid();
        var borrow = new Borrow(borrowId) { ItemName = "Charger", LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetBorrowById(borrowId)).Returns(borrow);

        // Act
        var result = _controller.GetBorrow(borrowId);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(borrow, ok.Value);
    }

    [Fact]
    public void GetBorrow_ReturnsNotFound_WhenBorrowDoesNotExist()
    {
        // Arrange
        var borrowId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetBorrowById(borrowId)).Returns((Borrow?)null);

        // Act
        var result = _controller.GetBorrow(borrowId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── GetBorrows ────────────────────────────────────────────────────────────

    [Fact]
    public void GetBorrows_ReturnsOk_WithAllBorrows()
    {
        // Arrange
        var borrows = new List<Borrow>
        {
            new Borrow { ItemName = "Book",    LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() },
            new Borrow { ItemName = "Charger", LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() },
        };
        _mockRepo.Setup(r => r.GetBorrows()).Returns(borrows);

        // Act
        var result = _controller.GetBorrows();

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(borrows, ok.Value);
    }

    // ── Post ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Post_ReturnsOk_WhenInsertSucceeds()
    {
        // Arrange
        var borrow = new Borrow { ItemName = "Charger", LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.InsertBorrow(borrow)).Returns(true);

        // Act
        var result = _controller.Post(borrow);

        // Assert
        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public void Post_ReturnsBadRequest_WhenInsertFails()
    {
        // Arrange
        var borrow = new Borrow { ItemName = "Charger", LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.InsertBorrow(borrow)).Returns(false);

        // Act
        var result = _controller.Post(borrow);

        // Assert
        Assert.IsType<BadRequestResult>(result);
    }

    // ── UpdateBorrow ──────────────────────────────────────────────────────────

    [Fact]
    public void UpdateBorrow_ReturnsNotFound_WhenBorrowDoesNotExist()
    {
        // Arrange
        var borrow = new Borrow { ItemName = "Charger", LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetBorrowById(borrow.BorrowId)).Returns((Borrow?)null);

        // Act
        var result = _controller.UpdateBorrow(borrow);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void UpdateBorrow_ReturnsOk_WhenUpdateSucceeds()
    {
        // Arrange
        var borrow = new Borrow { ItemName = "Charger", LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetBorrowById(borrow.BorrowId)).Returns(borrow);
        _mockRepo.Setup(r => r.UpdateBorrow(borrow)).Returns(true);

        // Act
        var result = _controller.UpdateBorrow(borrow);

        // Assert
        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public void UpdateBorrow_ReturnsBadRequest_WhenUpdateFails()
    {
        // Arrange
        var borrow = new Borrow { ItemName = "Charger", LenderId = Guid.NewGuid(), BorrowerId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetBorrowById(borrow.BorrowId)).Returns(borrow);
        _mockRepo.Setup(r => r.UpdateBorrow(borrow)).Returns(false);

        // Act
        var result = _controller.UpdateBorrow(borrow);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── DeleteBorrow ──────────────────────────────────────────────────────────

    [Fact]
    public void DeleteBorrow_ReturnsNotFound_WhenBorrowDoesNotExist()
    {
        // Arrange
        var borrowId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetBorrowById(borrowId)).Returns((Borrow?)null);

        // Act
        var result = _controller.DeleteBorrow(borrowId);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void DeleteBorrow_ReturnsNoContent_WhenDeleteSucceeds()
    {
        // Arrange
        var borrowId = Guid.NewGuid();
        var borrow = new Borrow(borrowId) { ItemName = "Book" };
        _mockRepo.Setup(r => r.GetBorrowById(borrowId)).Returns(borrow);
        _mockRepo.Setup(r => r.DeleteBorrow(borrowId)).Returns(true);

        // Act
        var result = _controller.DeleteBorrow(borrowId);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public void DeleteBorrow_ReturnsBadRequest_WhenDeleteFails()
    {
        // Arrange
        var borrowId = Guid.NewGuid();
        var borrow = new Borrow(borrowId) { ItemName = "Book" };
        _mockRepo.Setup(r => r.GetBorrowById(borrowId)).Returns(borrow);
        _mockRepo.Setup(r => r.DeleteBorrow(borrowId)).Returns(false);

        // Act
        var result = _controller.DeleteBorrow(borrowId);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FavorsController tests
// ─────────────────────────────────────────────────────────────────────────────

public class FavorsControllerTests
{
    private readonly Mock<FavorsRepository> _mockRepo;
    private readonly FavorsController _controller;

    public FavorsControllerTests()
    {
        _mockRepo = new Mock<FavorsRepository>();
        _controller = new FavorsController(_mockRepo.Object);
    }

    // ── GetFavor ──────────────────────────────────────────────────────────────

    [Fact]
    public void GetFavor_ReturnsOk_WhenFavorExists()
    {
        // Arrange
        var favorId = Guid.NewGuid();
        var favor = new Favor(favorId) { Description = "Helped me move", DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetFavorById(favorId)).Returns(favor);

        // Act
        var result = _controller.GetFavor(favorId);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(favor, ok.Value);
    }

    [Fact]
    public void GetFavor_ReturnsNotFound_WhenFavorDoesNotExist()
    {
        // Arrange
        var favorId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetFavorById(favorId)).Returns((Favor?)null);

        // Act
        var result = _controller.GetFavor(favorId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── GetFavors ─────────────────────────────────────────────────────────────

    [Fact]
    public void GetFavors_ReturnsOk_WithAllFavors()
    {
        // Arrange
        var favors = new List<Favor>
        {
            new Favor { Description = "Helped me move",   DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() },
            new Favor { Description = "Covered my lunch", DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() },
        };
        _mockRepo.Setup(r => r.GetFavors()).Returns(favors);

        // Act
        var result = _controller.GetFavors();

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(favors, ok.Value);
    }

    // ── Post ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Post_ReturnsOk_WhenInsertSucceeds()
    {
        // Arrange
        var favor = new Favor { Description = "Helped me move", DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.InsertFavor(favor)).Returns(true);

        // Act
        var result = _controller.Post(favor);

        // Assert
        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public void Post_ReturnsBadRequest_WhenInsertFails()
    {
        // Arrange
        var favor = new Favor { Description = "Helped me move", DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.InsertFavor(favor)).Returns(false);

        // Act
        var result = _controller.Post(favor);

        // Assert
        Assert.IsType<BadRequestResult>(result);
    }

    // ── UpdateFavor ───────────────────────────────────────────────────────────

    [Fact]
    public void UpdateFavor_ReturnsNotFound_WhenFavorDoesNotExist()
    {
        // Arrange
        var favor = new Favor { Description = "Helped me move", DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetFavorById(favor.FavorId)).Returns((Favor?)null);

        // Act
        var result = _controller.UpdateFavor(favor);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void UpdateFavor_ReturnsOk_WhenUpdateSucceeds()
    {
        // Arrange
        var favor = new Favor { Description = "Helped me move", DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetFavorById(favor.FavorId)).Returns(favor);
        _mockRepo.Setup(r => r.UpdateFavor(favor)).Returns(true);

        // Act
        var result = _controller.UpdateFavor(favor);

        // Assert
        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public void UpdateFavor_ReturnsBadRequest_WhenUpdateFails()
    {
        // Arrange
        var favor = new Favor { Description = "Helped me move", DebtorId = Guid.NewGuid(), CreditorId = Guid.NewGuid() };
        _mockRepo.Setup(r => r.GetFavorById(favor.FavorId)).Returns(favor);
        _mockRepo.Setup(r => r.UpdateFavor(favor)).Returns(false);

        // Act
        var result = _controller.UpdateFavor(favor);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── DeleteFavor ───────────────────────────────────────────────────────────

    [Fact]
    public void DeleteFavor_ReturnsNotFound_WhenFavorDoesNotExist()
    {
        // Arrange
        var favorId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetFavorById(favorId)).Returns((Favor?)null);

        // Act
        var result = _controller.DeleteFavor(favorId);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void DeleteFavor_ReturnsNoContent_WhenDeleteSucceeds()
    {
        // Arrange
        var favorId = Guid.NewGuid();
        var favor = new Favor(favorId) { Description = "Covered lunch" };
        _mockRepo.Setup(r => r.GetFavorById(favorId)).Returns(favor);
        _mockRepo.Setup(r => r.DeleteFavor(favorId)).Returns(true);

        // Act
        var result = _controller.DeleteFavor(favorId);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public void DeleteFavor_ReturnsBadRequest_WhenDeleteFails()
    {
        // Arrange
        var favorId = Guid.NewGuid();
        var favor = new Favor(favorId) { Description = "Covered lunch" };
        _mockRepo.Setup(r => r.GetFavorById(favorId)).Returns(favor);
        _mockRepo.Setup(r => r.DeleteFavor(favorId)).Returns(false);

        // Act
        var result = _controller.DeleteFavor(favorId);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
}
