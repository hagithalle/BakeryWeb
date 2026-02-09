using Microsoft.AspNetCore.Mvc;

namespace Server.Models
{
    [Bind("Order, Description")]
    public class RecipeStep
    {
        public int Id { get; set; }

        public int RecipeId { get; set; }
        public Recipe? Recipe { get; set; }

        // מספר שלב – כדי שנוכל להציג לפי סדר
        public int Order { get; set; }

        // תיאור השלב
        public string Description { get; set; } = string.Empty;

        // אופציונלי: זמן משוער לדקה/שתיים/15 וכו'
        public int? EstimatedMinutes { get; set; }
    }
}
