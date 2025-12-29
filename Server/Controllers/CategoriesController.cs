using Microsoft.AspNetCore.Mvc;
using Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetCategories()
        {
            var categories = Enum.GetValues(typeof(IngredientCategory))
                .Cast<IngredientCategory>()
                .Select(e => new { value = (int)e, name = e.ToString() })
                .ToList();
            return Ok(categories);
        }
    }
}
